// src/assets/page/component/MenuLaporanMasterStokBarangRetur-Basetroli.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { getLaporanStokBarangRetur } from "../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import LogoExcel from "../../../../image/icon/excel-document.svg";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";
import Alert from "../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Komponen FilterSelect sesuai contoh
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (option) => {
    onChange(option);
    setInputValue(option);
    setShowOptions(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowOptions(true);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setShowOptions(false);
  };

  return (
    <div className="relative w-full md:w-44" ref={wrapperRef}>
      <label className="block mb-1 text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
        placeholder="Pilih atau ketik..."
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute top-6 right-2 text-red-500 text-sm"
          title="Clear"
        >
          &times;
        </button>
      )}
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {showOptions && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
          Tidak ada opsi
        </div>
      )}
    </div>
  );
}

export default function MenuLaporanMasterStokBarangReturBasetroli() {
  const [data, setData] = useState([]); // Data asli dari API
  const [filteredData, setFilteredData] = useState([]); // Data setelah difilter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Filter state: hanya menggunakan filter untuk kode_barang (filter nama barang dihapus)
  const [kodeBarang, setKodeBarang] = useState("");

  // Filter tanggal (opsional) jika properti createAt tersedia
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user); // Pastikan ini mengambil dari Redux state
  const id_toko = useSelector((state) => state.auth.id_toko); // Tetap diambil dari Redux state
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getLaporanStokBarangRetur();
        // console.log("laporanData:", laporanData);

        // Pastikan data yang diterima berupa array objek
        const dataRows = Array.isArray(laporanData)
          ? laporanData
              .reduce((acc, item) => acc.concat(Object.values(item)), [])
              .filter((row) => typeof row === "object")
          : Object.values(laporanData);

        // Filter data berdasarkan id_toko (konversi id_toko dari Redux ke int)
        const idTokoInt = parseInt(id_toko, 10);
        const filteredDataRows = dataRows.filter(
          (row) => parseInt(row.id_toko, 10) === idTokoInt
        );

        setData(filteredDataRows);
        setFilteredData(filteredDataRows);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id_toko]);

  // Fungsi format Rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Fungsi format Tanggal (dd/MM/yyyy, HH:mm:ss)
  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    const hours = padZero(date.getUTCHours());
    const minutes = padZero(date.getUTCMinutes());
    const seconds = padZero(date.getUTCSeconds());
    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getUTCDate());
    const month = padZero(date.getUTCMonth() + 1);
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}, ${time}`;
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Nilai unik untuk filter dari data
  const uniqueKodeBarang = [...new Set(data.map((item) => item.kode_barang))];

  // Filter berdasarkan kode_barang, tanggal, dan search
  useEffect(() => {
    let filtered = data;

    if (kodeBarang) {
      filtered = filtered.filter((item) => item.kode_barang === kodeBarang);
    }

    // Filter berdasarkan tanggal jika properti createAt tersedia
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate >= start && itemDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate <= end;
      });
    }

    // Apply search filter pada kode_barang
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_barang &&
            item.kode_barang.toLowerCase().includes(lowercasedFilter)) ||
          (item.namabarang &&
            item.namabarang.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [kodeBarang, startDate, endDate, searchTerm, data]);

  // Sorting data
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        aKey =
          aKey !== undefined && aKey !== null ? aKey.toString().toLowerCase() : "";
        bKey =
          bKey !== undefined && bKey !== null ? bKey.toString().toLowerCase() : "";
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (sortedData.length === 0) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }

    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const filename = `Laporan-Master-Stok-Barang-${dd}${mm}${yyyy}-${randomNumber}.xlsx`;
    console.log("Export filename:", filename);

    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      "Nama Toko": item.nama_toko || "Data tidak ditemukan",
      "Kode Barang": item.kode_barang || "Data tidak ditemukan",
      "Nama Barang": item.namabarang || "Data tidak ditemukan",
      "Stok Barang": item.stok_barang !== undefined ? item.stok_barang : "Data tidak ditemukan",
      "Nama Gudang Tujuan": item.nama_gudang_tujuan || "Data tidak ditemukan",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok Barang");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
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
            to="/dashboard/basetroli"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500 mx-auto items-center stroke-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Laporan Stok Barang
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

      {/* Bagian Filter */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-3/4">
          <FilterSelect
            label="Filter Kode Barang"
            options={uniqueKodeBarang.map(String)}
            value={kodeBarang}
            onChange={setKodeBarang}
          />
          {/* Filter Tanggal (opsional) */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-8 px-2 rounded-md text-xs"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate("");
                  }
                }}
                max={endDate || ""}
                placeholder="Start Date"
              />
              <input
                type="date"
                className="border border-gray-300 w-44 h-8 px-2 rounded-md text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || ""}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Tabel */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Retur Jual
          </p>
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
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-1 w-8 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No {sortConfig.key === "no" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("id_stokretur ")}
                >
                  ID retur {sortConfig.key === "id_stokretur " && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_barang")}
                >
                  Kode Barang {sortConfig.key === "kode_barang" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang {sortConfig.key === "namabarang" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_toko")}
                >
                  Nama Toko {sortConfig.key === "nama_toko" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("stok_barang")}
                >
                  Stok Barang {sortConfig.key === "stok_barang" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_gudang_tujuan")}
                >
                  Gudang Tujuan {sortConfig.key === "nama_gudang_tujuan" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  const stok = Number(item.stok_barang);
                  // Contoh: jika stok kurang dari 50, baris akan diberi background merah, dst.
                  const rowClass =
                    stok < 50
                      ? "bg-orange-500"
                      : stok < 100
                      ? "bg-yellow-500"
                      : stok >= 100
                      ? "bg-lime-500"
                      : "";
                  return (
                    <tr
                      key={`${item.kode_barang}-${index}`}
                      className={`border-b text-gray-900 ${rowClass}`}
                    >
                      <td className="px-2 py-1 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.id_stokretur || "Data tidak ditemukan"}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.kode_barang || "Data tidak ditemukan"}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.nama_barang || "Data tidak ditemukan"}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.nama_toko || "Data tidak ditemukan"}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.stok_barang !== undefined
                          ? item.stok_barang + " PCS"
                          : "Data tidak ditemukan"}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {item.nama_gudang_tujuan || "Data tidak ditemukan"}
                      </td>
                    </tr>
                  );
                })
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

        {/* Tabel Subtotal (Contoh: Total Stok Barang) */}
        <div className="mt-1">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <colgroup>
              <col style={{ width: "90%" }} />
            </colgroup>
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={11}
                  className="px-2 py-1 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Total Stok
                </td>
                <td className="px-2 py-1 border border-gray-700 font-semibold bg-lime-400">
                  {typeof filteredData.reduce === "function"
                    ? filteredData.reduce(
                        (sum, item) =>
                          sum + Number(item.stok_barang || 0),
                        0
                      ) + " PCS"
                    : 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4"
          aria-label="Table navigation"
        >
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
                  currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
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
