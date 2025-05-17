// MenuLaporanMasterMarketPlace-Master.jsx

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getLaporanMasterMarketPlace } from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function MenuLaporanMasterMarketPlace() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Token Redux (if needed)
  const token = useSelector((state) => state.auth.token);

  // Filters
  const [kodeMarketplaceFilter, setKodeMarketplaceFilter] = useState("");
  const [namaMarketplaceFilter, setNamaMarketplaceFilter] = useState("");

  // Search Term (searching in multiple columns)
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sort Config
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  /**
   * Fetch data from getLaporanMasterMarketPlace() when component mounts
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call API
        const result = await getLaporanMasterMarketPlace(token);
        console.log("Data Laporan Master MarketPlace (original):", result);

        let flattenData = [];
        if (Array.isArray(result)) {
          result.forEach((obj) => {
            flattenData.push(...Object.values(obj));
          });
        } else {
          flattenData = Object.values(result);
        }

        console.log("Data Laporan Master MarketPlace (flattened):", flattenData);

        setData(flattenData);
        setFilteredData(flattenData);
      } catch (err) {
        console.error("Error fetching master marketplace data:", err);
        setError(err.message || "Failed to fetch master marketplace data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  /**
   * Get unique values for kode_marketplace and nama_marketplace
   */
  const uniqueKodeMarketplace = [
    ...new Set(data.map((item) => item.kode_marketplace || "")),
  ];
  const uniqueNamaMarketplace = [
    ...new Set(data.map((item) => item.nama_marketplace || "")),
  ];

  /**
   * Handle Refresh
   */
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  /**
   * Filtering based on:
   * - kodeMarketplaceFilter
   * - namaMarketplaceFilter
   * - searchTerm
   */
  useEffect(() => {
    let filtered = [...data];

    // Filter by kode_marketplace
    if (kodeMarketplaceFilter) {
      filtered = filtered.filter(
        (item) => item.kode_marketplace === kodeMarketplaceFilter
      );
    }

    // Filter by nama_marketplace
    if (namaMarketplaceFilter) {
      filtered = filtered.filter(
        (item) => item.nama_marketplace === namaMarketplaceFilter
      );
    }

    // Filter by searchTerm in multiple columns
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const { id_marketplace, kode_marketplace, nama_marketplace, alamat } =
          item;

        // Combine data into a single string for easier searching
        const combinedString = `
          ${id_marketplace ?? ""} 
          ${kode_marketplace ?? ""} 
          ${nama_marketplace ?? ""} 
          ${alamat ?? ""}
        `.toLowerCase();

        return combinedString.includes(lowerSearchTerm);
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, kodeMarketplaceFilter, namaMarketplaceFilter, data]);

  /**
   * Sorting
   */
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];

        // Ensure null/undefined are handled as empty strings
        aKey =
          aKey !== undefined && aKey !== null
            ? aKey.toString().toLowerCase()
            : "";
        bKey =
          bKey !== undefined && bKey !== null
            ? bKey.toString().toLowerCase()
            : "";

        if (aKey < bKey) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  /**
   * Pagination
   */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /**
   * Export Excel
   */
  const handleExport = () => {
    if (sortedData.length === 0) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }

    // Create file name with simple format (can be modified as needed)
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;
    const filename = `Master-MarketPlace-${formattedDate}.xlsx`;

    // Prepare data to export
    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      ID_Marketplace: item.id_marketplace ?? "",
      Kode_Marketplace: item.kode_marketplace ?? "",
      Nama_Marketplace: item.nama_marketplace ?? "",
      Alamat: item.alamat ?? "",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MasterMarketPlace");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create Blob
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    // Trigger download
    saveAs(dataBlob, filename);

    setAlert({
      message: "Export berhasil!",
      type: "success",
      visible: true,
    });
    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 2000);
  };

  /**
   * Loading & Error
   */
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  /**
   * Render Component
   */
  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="head flex justify-between items-center mb-0.5">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Master Market Place
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white flex flex-wrap rounded-md shadow-md p-1.5 justify-start items-center border border-gray-200 mb-2 gap-4">
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Kode Marketplace
          </label>
          <select
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={kodeMarketplaceFilter}
            onChange={(e) => setKodeMarketplaceFilter(e.target.value)}
          >
            <option value="">Semua</option>
            {uniqueKodeMarketplace.map((kode, index) => (
              <option key={index} value={kode}>
                {kode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Nama Marketplace
          </label>
          <select
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={namaMarketplaceFilter}
            onChange={(e) => setNamaMarketplaceFilter(e.target.value)}
          >
            <option value="">Semua</option>
            {uniqueNamaMarketplace.map((nama, index) => (
              <option key={index} value={nama}>
                {nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 max-w-4xl">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
           Laporan Market Place
          </p>
          {/* Search Bar */}
          <div className="w-2/6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="simple-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-10 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Export Button */}
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExport}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200 w-full">
              <tr>
                <th scope="col" className="px-2 py-1 w-8 sticky top-0 border border-gray-300 bg-gray-200 z-10">
                  No
                </th>
                {/* <th onClick={() => handleSort("id_marketplace")} className="px-2 py-1 w-16 sticky top-0 border border-gray-300 bg-gray-200 z-10 cursor-pointer">
                  ID
                  {sortConfig.key === "id_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th> */}
                <th onClick={() => handleSort("kode_marketplace")} className="px-2 py-1 w-32 sticky top-0 border border-gray-300 bg-gray-200 z-10 cursor-pointer">
                  Kode Marketplace
                  {sortConfig.key === "kode_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("nama_marketplace")} className="px-2 py- w-44 sticky top-0 border border-gray-300 bg-gray-200 z-10 cursor-pointer">
                  Nama Marketplace
                  {sortConfig.key === "nama_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("alamat")} className="px-2 py-1 w-52 sticky top-0 border border-gray-300 bg-gray-200 z-10 cursor-pointer">
                  Alamat
                  {sortConfig.key === "alamat" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b text-gray-800 hover:bg-gray-50"
                  >
                    <td className="px-2 py-1 border">
                      {indexOfFirstItem + index + 1}
                    </td>
                    {/* <td className="px-2 py-1 border">
                      {item.id_marketplace ?? ""}
                    </td> */}
                    <td className="px-2 py-1 border">
                      {item.kode_marketplace ?? ""}
                    </td>
                    <td className="px-2 py-1 border">
                      {item.nama_marketplace ?? ""}
                    </td>
                    <td className="px-2 py-1 border">
                      {item.alamat ?? ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-2 py-1 text-center">
                    Tidak ada data tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4"
          aria-label="Table navigation"
        >
          {/* Items Per Page Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-xs text-gray-700">
              Tampilkan:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-xs p-1"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>

          {/* Show Pagination Info and Buttons */}
          <span className="text-xs font-normal text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, sortedData.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {sortedData.length}
            </span>
          </span>
          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center py-1 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span>Previous</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center text-xs py-1 px-2 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <span>Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
