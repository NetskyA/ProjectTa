import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getNotaPenjualanEtroli } from "../../../services/apiService";
import { useSelector } from "react-redux";
import LogoSave from "../../../image/icon/save-item.svg";

import Loading from "../../component/Loading"; // Komponen loading
import Error from "../../component/Error"; // Komponen error
import Alert from "../../component/Alert"; // Assuming you have an Alert component

export default function MenuNotaPenjualanBesttroli() {
  const [data, setData] = useState([]); // Data laporan
  const [filteredData, setFilteredData] = useState([]); // Data yang difilter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kodePemesanan, setKodePemesanan] = useState(""); // Filter berdasarkan kode_pemesanan
  const [toko, setToko] = useState(""); // Filter berdasarkan toko
  const [marketplace, setMarketplace] = useState(""); // Filter berdasarkan marketplace
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getNotaPenjualanEtroli(token);
        console.log("laporanData:", laporanData);

        // Akses data dari results[0]
        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];
        // console.log("dataRows:", dataRows);

        setData(dataRows);
        setFilteredData(dataRows);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const handleRefresh = () => {
    setLoading(true); // Tampilkan efek loading
    setTimeout(() => {
      window.location.reload();
    }, 500); // Tambahkan delay 0.5 detik
  };

  // Mengambil nilai unik untuk setiap filter
  const uniqueKodePemesanan = [
    ...new Set(data.map((item) => item.kode_pemesanan)),
  ];
  const uniqueToko = [...new Set(data.map((item) => item.nama_toko))];
  const uniqueMarketplace = [
    ...new Set(data.map((item) => item.nama_marketplace)),
  ];

  // Handle Filter
  useEffect(() => {
    let filtered = data;

    if (kodePemesanan) {
      filtered = filtered.filter(
        (item) => item.kode_pemesanan === kodePemesanan
      );
    }

    if (toko) {
      filtered = filtered.filter((item) => item.nama_toko === toko);
    }

    if (marketplace) {
      filtered = filtered.filter(
        (item) => item.nama_marketplace === marketplace
      );
    }

    // Apply Search
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_pemesanan &&
            item.kode_pemesanan.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_toko &&
            item.nama_toko.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_marketplace &&
            item.nama_marketplace.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [kodePemesanan, toko, marketplace, searchTerm, data]);

  // Apply Sorting
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];

        // Handle undefined or null
        aKey = aKey ? aKey.toString().toLowerCase() : "";
        bKey = bKey ? bKey.toString().toLowerCase() : "";

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

  // Calculate Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handler untuk Sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/etroli"
            className="text-xs font-semibold text-blue-900"
          >
            Penjualan
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
            Nota Penjualan
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

      {/* Filter Section */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          {/* Filter Kode Pemesanan */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Kode Pemesanan
            </label>
            <select
              className="border border-gray-300 w-64 h-8 px-4 rounded-md text-xs"
              value={kodePemesanan}
              onChange={(e) => setKodePemesanan(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueKodePemesanan.map((kode, index) => (
                <option key={index} value={kode}>
                  {kode}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toko */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Toko
            </label>
            <select
              className="border border-gray-300 w-64 h-8 px-4 rounded-md text-xs"
              value={toko}
              onChange={(e) => setToko(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueToko.map((tokoName, index) => (
                <option key={index} value={tokoName}>
                  {tokoName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Marketplace */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Marketplace
            </label>
            <select
              className="border border-gray-300 w-64 h-8 px-4 rounded-md text-xs"
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueMarketplace.map((marketplaceName, index) => (
                <option key={index} value={marketplaceName}>
                  {marketplaceName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tombol Simpan & Cetak */}
        <div className="">
          <Link to="/dashboard/bigtorlly/menu/notapenjualan/detail">
            <button className="h-8 w-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
              <img src={LogoSave} className="w-6 h-6 p-1" alt="Save" />
            </button>
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 space-y-4 md:space-y-0">
          {/* Search */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ height: "50vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("id_header_pemesanan")}
                >
                  ID Header
                  {sortConfig.key === "id_header_pemesanan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_pemesanan")}
                >
                  Kode Pemesanan
                  {sortConfig.key === "kode_pemesanan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_toko")}
                >
                  Nama Toko
                  {sortConfig.key === "nama_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_marketplace")}
                >
                  Nama Marketplace
                  {sortConfig.key === "nama_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th> */}
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  Tanggal
                  {sortConfig.key === "createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 border border-gray-300">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.id_header_pemesanan || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.kode_pemesanan || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.nama_toko || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    {/* <td className="px-4 py-3 border border-gray-300">
                      {item.nama_marketplace || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td> */}
                    <td className="px-4 py-3 border border-gray-300">
                      {item.createAt
                        ? formatDate(item.createAt)
                        : "Data tidak tersedia"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 px-4 text-center text-gray-500 border-b"
                  >
                    Tidak ada data yang tersedia
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
          <span className="text-xs font-normal text-gray-500">
            Showing
            <span className="font-semibold text-gray-900">
              {" "}
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, sortedData.length)}{" "}
            </span>
            of
            <span className="font-semibold text-gray-900">
              {" "}
              {sortedData.length}{" "}
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
                <span className="">Previous</span>
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
                <span className="">Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
