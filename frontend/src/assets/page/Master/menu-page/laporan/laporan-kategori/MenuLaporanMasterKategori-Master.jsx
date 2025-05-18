// MenuLaporanMasterKategori-Master.jsx

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getLaporanMasterKategori } from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Helper: ubah string "dd-mm-yyyy" => "yyyy-mm-dd"
 */
function formatToYYYYMMDD(dateStr) {
  if (!dateStr) return "";
  // Misal dateStr = "18-01-2025"
  const [dd, mm, yyyy] = dateStr.split("-");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MenuLaporanMasterMarketPlace() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Token Redux (if needed)
  const token = useSelector((state) => state.auth.token);

  // FILTERS
  const [namaMarketplaceFilter, setNamaMarketplaceFilter] = useState("");
  const [namaKategoriFilter, setNamaKategoriFilter] = useState("");
  const [periodeMulaiFilter, setPeriodeMulaiFilter] = useState(""); // "yyyy-mm-dd"
  const [periodeAkhirFilter, setPeriodeAkhirFilter] = useState(""); // "yyyy-mm-dd"

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
   * Fetch data dari getLaporanMasterKategori()
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Panggil API
        const result = await getLaporanMasterKategori(token);
        // console.log("Data Laporan Master Kategori (original):", result);

        let flattenData = [];
        if (Array.isArray(result)) {
          result.forEach((obj) => {
            flattenData.push(...Object.values(obj));
          });
        } else {
          flattenData = Object.values(result);
        }

        // console.log("Data Laporan Master Kategori (flattened):", flattenData);

        setData(flattenData);
        setFilteredData(flattenData);
      } catch (err) {
        console.error("Error fetching master kategori data:", err);
        setError(err.message || "Failed to fetch master kategori data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  /**
   * Dapatkan unique values untuk filter
   */
  const uniqueNamaMarketplace = [
    ...new Set(data.map((item) => item.nama_marketplace || "")),
  ];
  const uniqueNamaKategori = [
    ...new Set(data.map((item) => item.nama_kategori || "")),
  ];

  // Apabila data dari API masih "yyyy-mm-dd", 
  // tapi Anda mau dropdown unik justru "dd-mm-yyyy",
  // maka bisa di-map lagi. Namun seringkali filter tanggal 
  // lebih fleksibel pakai date-picker, tidak perlu unique values.

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
   * Filtering data berdasarkan:
   * - namaMarketplaceFilter
   * - namaKategoriFilter
   * - periodeMulaiFilter (bernilai "yyyy-mm-dd" dari <input type="date" />)
   * - periodeAkhirFilter (bernilai "yyyy-mm-dd" dari <input type="date" />)
   * - searchTerm (pencarian di banyak kolom)
   */
  useEffect(() => {
    let filtered = [...data];

    // Filter by nama_marketplace
    if (namaMarketplaceFilter) {
      filtered = filtered.filter(
        (item) => item.nama_marketplace === namaMarketplaceFilter
      );
    }

    // Filter by nama_kategori
    if (namaKategoriFilter) {
      filtered = filtered.filter(
        (item) => item.nama_kategori === namaKategoriFilter
      );
    }

    // Misal data API: item.periode_mulai = "yyyy-mm-dd"
    // HTML date input: periodeMulaiFilter = "yyyy-mm-dd"
    // => Kita cocokkan string secara langsung (equal)
    // Jika API Anda mengembalikan "dd-mm-yyyy", 
    // maka di sini kita perlu mengubah item.periode_mulai 
    // ke "yyyy-mm-dd" agar bisa dicocokkan.
    
    if (periodeMulaiFilter) {
      filtered = filtered.filter((item) => {
        // Jika data dari API = "dd-mm-yyyy"
        // maka perlu di-convert ke "yyyy-mm-dd" sebelum dibandingkan:
        const itemPeriodeMulai = formatToYYYYMMDD(item.periode_mulai);
        return itemPeriodeMulai === periodeMulaiFilter;
      });
    }

    if (periodeAkhirFilter) {
      filtered = filtered.filter((item) => {
        // Jika data dari API = "dd-mm-yyyy"
        // maka perlu di-convert ke "yyyy-mm-dd" sebelum dibandingkan:
        const itemPeriodeAkhir = formatToYYYYMMDD(item.periode_akhir);
        return itemPeriodeAkhir === periodeAkhirFilter;
      });
    }

    // Filter by searchTerm (di banyak kolom)
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const {
          id_kategori,
          id_marketplace,
          nama_marketplace,
          nama_kategori,
          biaya_admin,
          biaya_ongkir,
          periode_mulai,
          periode_akhir,
        } = item;

        // Gabungkan jadi satu string
        const combinedString = `
          ${id_kategori ?? ""} 
          ${id_marketplace ?? ""} 
          ${nama_marketplace ?? ""} 
          ${nama_kategori ?? ""} 
          ${biaya_admin ?? ""} 
          ${biaya_ongkir ?? ""} 
          ${periode_mulai ?? ""} 
          ${periode_akhir ?? ""}
        `.toLowerCase();

        return combinedString.includes(lowerSearchTerm);
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    namaMarketplaceFilter,
    namaKategoriFilter,
    periodeMulaiFilter,
    periodeAkhirFilter,
    data,
  ]);

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

        // Tangani null/undefined sebagai string kosong
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

    // Format nama file
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;
    const filename = `Master-Kategori-${formattedDate}.xlsx`;

    // Siapkan data untuk diekspor
    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      ID_Kategori: item.id_kategori ?? "",
      ID_Marketplace: item.id_marketplace ?? "",
      Nama_Marketplace: item.nama_marketplace ?? "",
      Nama_Kategori: item.nama_kategori ?? "",
      Biaya_Admin: item.biaya_admin ?? "",
      Biaya_Ongkir: item.biaya_ongkir ?? "",
      // Pastikan di Excel pun jadi dd-mm-yyyy
      Periode_Mulai: item.periode_mulai
        ? formatToYYYYMMDD(item.periode_mulai) // kalau aslinya dd-mm-yyyy
        : "",
      Periode_Akhir: item.periode_akhir
        ? formatToYYYYMMDD(item.periode_akhir) // kalau aslinya dd-mm-yyyy
        : "",
    }));

    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Buat workbook dan append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MasterKategori");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Buat Blob
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
            Master Kategori
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
        {/* Filter Nama Marketplace */}
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

        {/* Filter Nama Kategori */}
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Nama Kategori
          </label>
          <select
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={namaKategoriFilter}
            onChange={(e) => setNamaKategoriFilter(e.target.value)}
          >
            <option value="">Semua</option>
            {uniqueNamaKategori.map((kat, index) => (
              <option key={index} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Periode Mulai (date picker) */}
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Periode Mulai
          </label>
          <input
            type="date"
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={periodeMulaiFilter}
            onChange={(e) => setPeriodeMulaiFilter(e.target.value)}
          />
        </div>

        {/* Filter Periode Akhir (date picker) */}
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Periode Akhir
          </label>
          <input
            type="date"
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={periodeAkhirFilter}
            onChange={(e) => setPeriodeAkhirFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Kategori
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
                <th
                  scope="col"
                  className="px-2 py-1 w-8 sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  No
                </th>
                <th
                  onClick={() => handleSort("id_kategori")}
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  ID Kategori
                  {sortConfig.key === "id_kategori" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("id_marketplace")}
                  className="px-2 py-1 w-36 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  ID Marketplace
                  {sortConfig.key === "id_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("nama_marketplace")}
                  className="px-2 py-1 w-44 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Nama Marketplace
                  {sortConfig.key === "nama_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("nama_kategori")}
                  className="px-2 py-1 w-44 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Nama Kategori
                  {sortConfig.key === "nama_kategori" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("biaya_admin")}
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Biaya Admin Default
                  {sortConfig.key === "biaya_admin" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("biaya_admin_fleksibel")}
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Biaya Admin Fleksibel
                  {sortConfig.key === "biaya_admin_fleksibel" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("biaya_ongkir")}
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Biaya Ongkir Default
                  {sortConfig.key === "biaya_ongkir" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("biaya_ongkir_fleksibel")}
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Biaya Ongkir Fleksibel
                  {sortConfig.key === "biaya_ongkir_fleksibel" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("periode_mulai")}
                  className="px-2 py-1 w-36 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Periode Mulai
                  {sortConfig.key === "periode_mulai" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("periode_akhir")}
                  className="px-2 py-1 w-36 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Periode Akhir
                  {sortConfig.key === "periode_akhir" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-2 py-1 w-24 sticky top-0 border border-gray-700 bg-gray-200 z-10 cursor-pointer"
                >
                  Status
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>

              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  const rowBg = item.status === 0 
                  ? "bg-lime-500" 
                  : item.status === 1 
                  ? "bg-yellow-300" 
                  : "bg-white";
                  // Asumsikan data periode_* dari API = "dd-mm-yyyy"
                  // Kalau API Anda "yyyy-mm-dd", balikanlah dengan formatToDDMMYYYY.
                  return (
                    <tr
                      key={index}
                      className={`border-b text-gray-900 ${rowBg}`}
                    >
                      <td className="px-2 py-1 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.id_kategori ?? ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.id_marketplace ?? ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.nama_marketplace ?? ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.nama_kategori ?? ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.biaya_admin + " %" || ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.biaya_admin_fleksibel + " %" || ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.biaya_ongkir + " %" || ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.biaya_ongkir_fleksibel + " %" || ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.periode_mulai
                          ? item.periode_mulai // jika sudah dd-mm-yyyy
                          : ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.periode_akhir
                          ? item.periode_akhir // jika sudah dd-mm-yyyy
                          : ""}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.status === 0 ? "Aktif" : item.status === 1 ? "Non-Aktif" : ""}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-2 py-1 text-center">
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
