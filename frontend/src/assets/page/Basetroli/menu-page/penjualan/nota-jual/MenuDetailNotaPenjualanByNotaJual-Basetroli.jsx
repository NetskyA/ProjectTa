// MenuNotaDetailPenjualanBesttroli.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { getNotaPenjualanDetailAll } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import LogoExcel from "../../../../../image/icon/excel-document.svg"; // Pastikan path benar
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

// Komponen FilterSelect
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((option) => {
        if (typeof option !== "string") return false;
        return option.toLowerCase().includes(inputValue.toLowerCase());
      })
    );
  }, [inputValue, options]);

  // Menutup dropdown saat klik di luar
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

export default function MenuNotaDetailPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noCetak, setNoCetak] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user); // Pastikan ini mengambil dari Redux state
  const id_toko = useSelector((state) => state.auth.id_toko); // Tetap diambil dari Redux state
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);
  const { id_header_pemesanan } = useParams(); // Mengambil parameter dari URL

  // State untuk Search
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk Filter tambahan
  const [noPemesananFilter, setNoPemesananFilter] = useState("");
  const [namaMarketplaceFilter, setNamaMarketplaceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Default 25

  // State Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mengambil data dengan parameter id_header_pemesanan
        const laporanData = await getNotaPenjualanDetailAll(
          token,
          id_header_pemesanan
        );
        // console.log("laporanData:", laporanData);

        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];
        console.log("dataRows:", dataRows);

        // Pastikan tipe data konsisten
        const idHeaderNumber = Number(id_header_pemesanan);
        const filteredRows = dataRows.filter(
          (item) => item.id_header_pemesanan === idHeaderNumber
        );
        console.log("filteredRows:", filteredRows);

        if (filteredRows.length === 0) {
          setAlert({
            message: "Data tidak ditemukan untuk ID Header Pemesanan ini.",
            type: "warning",
            visible: true,
          });
        }

        setData(filteredRows);
        setFilteredData(filteredRows);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id_header_pemesanan]);

  // Fitur refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const generateNoCetak = () => {
    const now = new Date();
    return `DO${id_header_pemesanan}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  };
  // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Fungsi untuk ekspor data ke Excel
  const handleExportExcel = () => {
    try {
      if (filteredData.length === 0) {
        setAlert({
          message: "Tidak ada data untuk diekspor.",
          type: "warning",
          visible: true,
        });
        return;
      }
  
      // Ambil kode_pemesanan dari data pertama
      const kodePemesanan = filteredData[0]?.kode_pemesanan || "Unknown";
  
      // Tambahkan No ke setiap item
      const dataForExcel = filteredData.map((item, index) => ({
        No: index + 1,
        Kode_Pemesanan: item.kode_pemesanan || "Data tidak ditemukan",
        Kode_Barang: item.kode_barang || "Data tidak ditemukan",
        Nama_Barang: item.namabarang || "Data tidak ditemukan",
        Quantity: item.quantity || "Data tidak ditemukan",
      }));
  
      // Buat worksheet dan workbook
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Nota Jual");
  
      // Konversi workbook ke buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
  
      // Buat blob dari buffer
      const dataBlob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
  
      // Simpan file Excel dengan kode_pemesanan
      saveAs(dataBlob, `Detail_Nota_Jual_${kodePemesanan}.xlsx`);
    } catch (error) {
      console.error("Error saat mengekspor Excel:", error);
      setAlert({
        message: "Gagal melakukan proses ekspor Excel. Silakan coba lagi.",
        type: "warning",
        visible: true,
      });
    }
  };

  // Hitung opsi unik untuk FilterSelect dari data yang telah diambil

  const uniqueNoPemesanan = useMemo(() => {
    const unique = new Set(data.map((item) => item.no_pemesanan).filter(Boolean));
    return Array.from(unique);
  }, [data]);

  const uniqueNamaMarketplace = useMemo(() => {
    const unique = new Set(data.map((item) => item.nama_marketplace).filter(Boolean));
    return Array.from(unique);
  }, [data]);

  // Gunakan useEffect untuk menerapkan pencarian dan filter secara bersamaan
  useEffect(() => {
    let filtered = data;

    // Pencarian (search) berdasarkan kode barang, nama marketplace, atau nama barang
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.kode_barang &&
            item.kode_barang.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_marketplace &&
            item.nama_marketplace.toLowerCase().includes(lowercasedFilter)) ||
          (item.namabarang &&
            item.namabarang.toLowerCase().includes(lowercasedFilter))
      );
    }

    // Filter tambahan

    if (noPemesananFilter) {
      filtered = filtered.filter(
        (item) => item.no_pemesanan === noPemesananFilter
      );
    }
    if (namaMarketplaceFilter) {
      filtered = filtered.filter(
        (item) => item.nama_marketplace === namaMarketplaceFilter
      );
    }

    // Filter tanggal berdasarkan createAt
    if (startDate) {
      filtered = filtered.filter(
        (item) => new Date(item.createAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (item) => new Date(item.createAt) <= new Date(endDate)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    data,
    noPemesananFilter,
    namaMarketplaceFilter,
    startDate,
    endDate,
  ]);

  // Sorting data menggunakan useMemo
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];

        // Tangani nilai undefined atau null
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Format tanggal
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

  // Handler untuk sorting ketika mengklik header tabel
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
          onClose={() =>
            setAlert((prev) => ({ ...prev, visible: false }))
          }
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/basetroli/menu/notapenjualan"
            className="text-xs font-semibold text-blue-900"
          >
            Penjualan
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
          <Link
            to="/dashboard/basetroli/menu/notapenjualan"
            className="text-xs font-semibold text-blue-900"
          >
            Nota Penjualan
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
            Detail Nota Penjualan
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

      {/* Bagian judul dan tombol ekspor */}
      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-lg font-semibold text-blue-900">
          Detail Nota Jual{" "}
          {data.length > 0 && ` - ${data[0]?.kode_pemesanan || ""}`}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={handleExportExcel}
            className="cetakexcel h-8 w-8 rounded-md flex items-center justify-center font-xs text-gray-100 transition duration-300"
            title="Export Excel"
          >
            <img
              src={LogoExcel}
              className="w-8 h-8"
              alt="Export Excel"
            />
          </button>
        </div>
      </div>

      {/* Bagian Filter */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-3/4">
          <FilterSelect
            label="Filter No Pemesanan"
            options={uniqueNoPemesanan}
            value={noPemesananFilter}
            onChange={setNoPemesananFilter}
          />
          <FilterSelect
            label="Filter Nama Marketplace"
            options={uniqueNamaMarketplace}
            value={namaMarketplaceFilter}
            onChange={setNamaMarketplaceFilter}
          />
          {/* Filter Tanggal */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-8 px-1 rounded-md text-xs"
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
                className="border border-gray-300 w-44 h-8 px-1 rounded-md text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || ""}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        {/* Pencarian */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 space-y-4 md:space-y-0">
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-72 pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto" style={{ height: "57vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-5 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_pemesanan")}
                >
                  Kode Pemesanan
                  {sortConfig.key === "kode_pemesanan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_marketplace")}
                >
                  Marketplace
                  {sortConfig.key === "nama_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_barang")}
                >
                  No Pesanan
                  {sortConfig.key === "kode_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_barang")}
                >
                  Kode Barang
                  {sortConfig.key === "kode_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-72 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang
                  {sortConfig.key === "namabarang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("quantity")}
                >
                  Quantity
                  {sortConfig.key === "quantity" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("netto")}
                >
                  Total Harga
                  {sortConfig.key === "netto" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                >
                  DI BUAT TANGGAL
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                >
                  DI BUAT OLEH
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-44 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("status")}
                >
                  Status Pelunasan
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                  key={`${item.id_header_pemesanan}-${item.kode_barang}-${index}`}
                  className={`text-gray-900 ${
                    item.status_packinglist === 0
                      ? "bg-white"
                      : item.status_transaksi === "Lunas"
                      ? "bg-yellow-300"
                      : item.status_transaksi === "Belum Lunas"
                      ? "bg-lime-500"
                      : ""
                  }`}
                >
                    <td className="px-2 py-0.5 border border-gray-500">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.kode_pemesanan || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.nama_marketplace || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.no_pemesanan || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.kode_barang || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.namabarang || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {formatRupiah(item.netto)}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {formatDate(item.createAt) || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.nama_user || (
                        <p className="text-red-900 text-xs">
                          Data tidak ditemukan
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-0.5 border border-gray-500">
                      {item.status_transaksi === "Belum Lunas" ? "Belum Lunas" : "Lunas"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    className="px-2 py-0.5 text-center text-gray-500"
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
                className={`flex items-center justify-center py-0.5 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-0.5 px-2 text-gray-500 bg-white rounded-r-md border border-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
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
