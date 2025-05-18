//MenuLaporanMasterUser-Master.jsx

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMasterUser } from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function MenuLaporanPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Token Redux (jika dibutuhkan)
  const token = useSelector((state) => state.auth.token);

  // Filter Status
  const [statusFilter, setStatusFilter] = useState("");
  // Filter Nama Role
  const [roleFilter, setRoleFilter] = useState("");
  // Filter Kode Toko
  const [kodeTokoFilter, setKodeTokoFilter] = useState("");

  // Search Term (mencari di beberapa kolom)
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
   * Ambil data dari getMasterUser() saat komponen pertama kali dimuat
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Panggil API
        const result = await getMasterUser(token);
        // console.log("Data Master User:", result);
        setData(result);
        setFilteredData(result);
      } catch (err) {
        console.error("Error mengambil data master user:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  /**
   * Ambil nilai unik dari nama_role & kode_toko
   * (untuk mengisi <option> pada dropdown filter)
   */
  const uniqueRoles = [...new Set(data.map((item) => item.nama_role || ""))];
  const uniqueKodeToko = [...new Set(data.map((item) => item.kode_toko || ""))];

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
   * Filtering berdasarkan:
   * - statusFilter
   * - roleFilter
   * - kodeTokoFilter
   * - searchTerm
   */
  useEffect(() => {
    let filtered = [...data];

    // Filter by status
    if (statusFilter !== "") {
      filtered = filtered.filter(
        (item) => String(item.status) === String(statusFilter)
      );
    }

    // Filter by nama_role
    if (roleFilter) {
      filtered = filtered.filter((item) => item.nama_role === roleFilter);
    }

    // Filter by kode_toko
    if (kodeTokoFilter) {
      filtered = filtered.filter((item) => item.kode_toko === kodeTokoFilter);
    }

    // Filter by searchTerm di beberapa kolom:
    // id_user, id_role, kode_toko, nama_toko, kode_user,
    // nama_user, no_hp, alamat, nama_role
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const {
          id_user,
          id_role,
          kode_toko,
          nama_toko,
          kode_user,
          nama_user,
          password,
          no_hp,
          alamat,
          status,
          nama_role,
        } = item;

        // Gabung data ke satu string untuk memudahkan pencarian
        const combinedString = `
          ${id_user ?? ""} 
          ${id_role ?? ""} 
          ${kode_toko ?? ""} 
          ${nama_toko ?? ""} 
          ${kode_user ?? ""} 
          ${nama_user ?? ""} 
          ${password ?? ""} 
          ${no_hp ?? ""} 
          ${alamat ?? ""} 
          ${status ?? ""} 
          ${nama_role ?? ""}
        `.toLowerCase();

        return combinedString.includes(lowerSearchTerm);
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, kodeTokoFilter, data]);

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

        // Pastikan jika null/undefined, di-handle sebagai string kosong
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

    // Buat nama file dengan format sederhana (bisa dimodifikasi sesuai kebutuhan)
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const filename = `Data-MasterUser-${formattedDate}-${randomNumber}.xlsx`;

    // Siapkan data yang akan diekspor
    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      id_user: item.id_user ?? "",
      id_role: item.id_role ?? "",
      nama_role: item.nama_role ?? "",
      kode_toko: item.kode_toko ?? "",
      nama_toko: item.nama_toko ?? "",
      kode_user: item.kode_user ?? "",
      nama_user: item.nama_user ?? "",
      password: item.password ?? "",
      no_hp: item.no_hp ?? "",
      alamat: item.alamat ?? "",
      status: item.status ?? "",
    }));

    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Buat workbook dan append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MasterUser");

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
   * Render Komponen
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
            Laporan User
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

      {/* Filter */}
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-1.5 justify-start items-center border border-gray-200 mb-2 gap-4">
        {/* Filter Status */}
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Status
          </label>
          <select
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua</option>
            <option value="0">Aktif</option>
            <option value="1">Non-Aktif</option>
          </select>
        </div>

        {/* Filter Nama Role */}
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Nama Role
          </label>
          <select
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Semua</option>
            {uniqueRoles.map((role, index) => (
              <option key={index} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Kode Toko */}
        <div className="flex flex-col text-xs">
          <label className="block mb-1 text-blue-900 font-semibold">
            Filter Kode Toko
          </label>
          <select
            className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
            value={kodeTokoFilter}
            onChange={(e) => setKodeTokoFilter(e.target.value)}
          >
            <option value="">Semua</option>
            {uniqueKodeToko.map((kode, index) => (
              <option key={index} value={kode}>
                {kode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
      <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 left-1 absolute">
          Laporan User
        </p>
          {/* Search Bar */}
          <div className="w-2/6 sm:w-1/2 md:w-1/3">
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

          {/* Tombol Export */}
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExport}
          >
            <button className="h-9 w-8 cetakexcel rounded-md flex items-center justify-center font-xs text-gray-100">
              <img src={LogoExcel} className="w-8 h-8" alt="Save" />
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
                  className="px-2 py-1 w-8  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  No
                </th>
                {/* id_user */}
                {/* <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("id_user")}
                >
                  ID User
                  {sortConfig.key === "id_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th> */}
                {/* id_role
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("id_role")}
                >
                  ID Role
                  {sortConfig.key === "id_role" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th> */}
                {/* nama_role */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("nama_role")}
                >
                  Role
                  {sortConfig.key === "nama_role" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* kode_toko */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("kode_toko")}
                >
                  Kode Toko
                  {sortConfig.key === "kode_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* nama_toko */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("nama_toko")}
                >
                  Nama Toko
                  {sortConfig.key === "nama_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* kode_user */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("kode_user")}
                >
                  Kode User
                  {sortConfig.key === "kode_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* nama_user */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("nama_user")}
                >
                  Nama User
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* password */}
                <th
                  className="px-2 py-1 w-32  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("password")}
                >
                  Password
                  {sortConfig.key === "password" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* no_hp */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("no_hp")}
                >
                  No HP
                  {sortConfig.key === "no_hp" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* alamat */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("alamat")}
                >
                  Alamat
                  {sortConfig.key === "alamat" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* status */}
                <th
                  className="px-2 py-1  sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
<tr
  key={item.id_user || index}
  className={`border-b hover:bg-opacity-75 cursor-pointer text-gray-800 ${
    item.status === 0 ? "bg-lime-500" : item.status === 1 ? "bg-red-500" : "bg-white"
  }`}
>

                    <td className="px-1 py-0.5 border border-gray-700">
                      {indexOfFirstItem + index + 1}
                    </td>
                    {/* <td className="px-1 py-0.5 border border-gray-700">
                      {item.id_user ?? ""}
                    </td> */}
                    {/* <td className="px-1 py-0.5 border border-gray-700">
                      {item.id_role ?? ""}
                    </td> */}
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_role ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.kode_toko ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_toko ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.kode_user ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_user ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.password
                        ? "*************************"
                        : "No Password"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.no_hp ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.alamat ?? ""}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.status === 0 ? (
                        <p className="text-green-600">Aktif</p>
                      ) : (
                        <p className="text-red-700">Non-Aktif</p>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={12}
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
