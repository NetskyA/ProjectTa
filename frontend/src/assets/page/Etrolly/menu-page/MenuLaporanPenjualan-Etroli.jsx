import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getLaporanPenjualanEtroli } from "../../../services/apiService";
import { useSelector } from "react-redux";
import LogoExcel from "../../../image/icon/excel-document.svg";
import Loading from "../../component/Loading";
import Error from "../../component/Error";
import Alert from "../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function MenuLaporanPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Existing Filters
  const [kodeBarang, setKodeBarang] = useState("");
  const [kodePemesanan, setKodePemesanan] = useState("");
  const [status, setStatus] = useState("");

  // New Filters for createAt
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Default ke 25
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getLaporanPenjualanEtroli();
        // console.log("laporanData:", laporanData);

        const dataRows = laporanData
          .flatMap((item) => Object.values(item))
          .filter((row) => typeof row === "object");

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

  // Fungsi untuk format Rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Fungsi untuk menampilkan Tanggal dalam format dd/MM/yyyy (id-ID)
  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const uniqueKodeBarang = [...new Set(data.map((item) => item.kode_barang))];
  const uniqueKodePemesanan = [
    ...new Set(data.map((item) => item.kode_pemesanan)),
  ];
  const uniqueStatus = [...new Set(data.map((item) => item.status))];

  useEffect(() => {
    let filtered = data;

    // Filter berdasarkan kodeBarang
    if (kodeBarang) {
      filtered = filtered.filter((item) => item.kode_barang === kodeBarang);
    }

    // Filter berdasarkan kodePemesanan
    if (kodePemesanan) {
      filtered = filtered.filter(
        (item) => item.kode_pemesanan === kodePemesanan
      );
    }

    // Filter berdasarkan status
    if (status) {
      filtered = filtered.filter((item) => String(item.status) === status);
    }

    // ---- Tambahkan Filter Berdasarkan Rentang Tanggal ----
    // Pastikan dibandingkan dengan `item.createAt`, bukan dengan hasil dari `formatDate`.
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        // Mengambil rentang inclusive [startDate <= createAt <= endDate]
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
    // ------------------------------------------------------

    // Filter pencarian umum (searchTerm) di beberapa kolom
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_barang &&
            item.kode_barang.toLowerCase().includes(lowercasedFilter)) ||
          (item.namabarang &&
            item.namabarang.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_toko &&
            item.nama_toko.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [kodeBarang, kodePemesanan, status, startDate, endDate, searchTerm, data]);

  // Memoized sorting logic
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];

        // Handle undefined or null values
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

    // Extract unique nama_toko from sortedData
    const uniqueNamaToko = [
      ...new Set(sortedData.map((item) => item.nama_toko)),
    ];
    let namaToko;
    if (uniqueNamaToko.length === 1) {
      namaToko = uniqueNamaToko[0] || "Unknown";
    } else if (uniqueNamaToko.length > 1) {
      namaToko = "Multiple_Toko";
    } else {
      namaToko = "No_Toko";
    }

    // Sanitize namaToko to remove invalid filename characters
    const sanitizeFilename = (name) => {
      return name.replace(/[\/\\:*?"<>|]/g, "_");
    };
    namaToko = sanitizeFilename(namaToko);

    // Format current date as ddmmyyyy
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;

    // Generate random number between 1 and 100
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const filename = `Laporan-Penjualan-${namaToko}-${formattedDate}-${randomNumber}.xlsx`;
    console.log(filename);

    // Prepare export data
    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      "Nama Toko": item.nama_toko || "Data tidak ditemukan",
      "Nota Penjualan": item.kode_pemesanan || "Data tidak ditemukan",
      "No Pemesanan": item.no_pemesanan || "Data tidak ditemukan",
      "Market Place": item.nama_marketplace || "Data tidak ditemukan",
      "Kode Barang": item.kode_barang || "Data tidak ditemukan",
      "Nama Barang": item.namabarang || "Data tidak ditemukan",
      "Total Quantity": item.total_quantity || "Data tidak ditemukan",
      Besar: item.besar ? `${item.besar} ` : `0 `,
      Sedang: item.sedang ? `${item.sedang}` : `0`,
      Kecil: item.kecil ? `${item.kecil}` : `0`,
      "Harga Barang": item.harga_barang,
      "Total Harga": item.total_harga,
      "Biaya Admin": item.biaya_admin
        ? `${item.biaya_admin}`
        : "Data tidak tersedia",
      "Biaya Ongkir": item.biaya_ongkir
        ? `${item.biaya_ongkir}`
        : "Data tidak tersedia",
      Biaya: item.biaya || formatRupiah(0),
      Netto: item.netto || formatRupiah(0),
      Tanggal: item.createAt
        ? formatDate(item.createAt)
        : "Data tidak tersedia",
      Status: item.status === 1 ? "Dicetak" : "Menunggu",
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

    // Generate a buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create a Blob from the buffer
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    // Trigger the download with the custom filename
    saveAs(dataBlob, filename);

    // Optionally, show a success alert
    setAlert({
      message: "Export berhasil!",
      type: "success",
      visible: true,
    });

    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 2000);
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
            Laporan Penjualan
          </span>
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
          <span className="text-xs font-semibold text-gray-400">Etroli</span>
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
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          {/* Filter Kode Barang */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Kode Barang
            </label>
            <select
              className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
              value={kodeBarang}
              onChange={(e) => setKodeBarang(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueKodeBarang.map((kode, index) => (
                <option key={index} value={kode}>
                  {kode}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kode Pemesanan */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Kode Pemesanan
            </label>
            <select
              className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
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

          {/* Filter Status */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Status
            </label>
            <select
              className="border border-gray-300 w-44 h-8 px-4 rounded-md text-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueStatus.map((statusValue, index) => (
                <option key={index} value={String(statusValue)}>
                  {statusValue === 1 ? "Dicetak" : "Menunggu"}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal (CreateAt) */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              {/* Start Date */}
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
              {/* End Date */}
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

      {/* Tabel Data */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 space-y-4 md:space-y-0">
          {/* Search Bar */}
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-72 pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tombol Export */}
          <div
            className="w-fit flex items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
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
                  className="px-2 py-3 w-8 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No{" "}
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-28 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_toko")}
                >
                  Toko{" "}
                  {sortConfig.key === "nama_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-32 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_marketplace")}
                >
                  Market Place{" "}
                  {sortConfig.key === "nama_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-40 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_pemesanan")}
                >
                  Nota Penjualan{" "}
                  {sortConfig.key === "kode_pemesanan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-40 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("no_pemesanan")}
                >
                  No Pemesanan{" "}
                  {sortConfig.key === "no_pemesanan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-28 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_barang")}
                >
                  Kode Barang{" "}
                  {sortConfig.key === "kode_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-56 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang{" "}
                  {sortConfig.key === "namabarang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("total_quantity")}
                >
                  Total Quantity{" "}
                  {sortConfig.key === "total_quantity" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("besar")}
                >
                  Besar{" "}
                  {sortConfig.key === "besar" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("sedang")}
                >
                  Sedang{" "}
                  {sortConfig.key === "sedang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("kecil")}
                >
                  Kecil{" "}
                  {sortConfig.key === "kecil" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-32 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("harga_barang")}
                >
                  Harga Barang{" "}
                  {sortConfig.key === "harga_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("total_harga")}
                >
                  Total Harga{" "}
                  {sortConfig.key === "total_harga" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-28 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("biaya_admin")}
                >
                  Biaya Admin{" "}
                  {sortConfig.key === "biaya_admin" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-28 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("biaya_ongkir")}
                >
                  Biaya Ongkir{" "}
                  {sortConfig.key === "biaya_ongkir" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("biaya")}
                >
                  Biaya{" "}
                  {sortConfig.key === "biaya" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("netto")}
                >
                  Netto{" "}
                  {sortConfig.key === "netto" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-fit cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  Tanggal{" "}
                  {sortConfig.key === "createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 w-fit cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("status")}
                >
                  Status{" "}
                  {sortConfig.key === "status" &&
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
                    <td className="px-2 py-3 border border-gray-300">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.nama_toko || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.nama_marketplace || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.kode_pemesanan || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.no_pemesanan || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.kode_barang || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.namabarang || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.total_quantity || "Data tidak ditemukan"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.besar
                        ? `${item.besar} ${item.satuanbesar}`
                        : `0 ${item.satuanbesar}`}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.sedang
                        ? `${item.sedang} ${item.satuansedang}`
                        : `0 ${item.satuansedang}`}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.kecil
                        ? `${item.kecil} ${item.satuankecil}`
                        : `0 ${item.satuankecil}`}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {formatRupiah(item.harga_barang) || "Data tidak tersedia"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {formatRupiah(item.total_harga) || "Data tidak tersedia"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.biaya_admin
                        ? `${item.biaya_admin} %`
                        : "Data tidak tersedia"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.biaya_ongkir
                        ? `${item.biaya_ongkir} %`
                        : "Data tidak tersedia"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {formatRupiah(item.biaya) || formatRupiah(0)}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {formatRupiah(item.netto) || formatRupiah(0)}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.createAt
                        ? formatDate(item.createAt)
                        : "Data tidak tersedia"}
                    </td>
                    <td className="px-2 py-3 border border-gray-300">
                      {item.status === 1 ? "Dicetak" : "Menunggu"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={17}
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
