//MenuPelunasanKeuanganPiutang.js

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { getPelunasanPenjualanAll } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
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
              className="px-1 py-0.5 hover:bg-gray-200 cursor-pointer text-xs"
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

export default function MenuPelunasanPenjualan() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Filter states baru
  const [kodePelunasanFilter, setKodePelunasanFilter] = useState("");
  const [noPemesananFilter, setNoPemesananFilter] = useState("");
  const [namaMarketplaceFilter, setNamaMarketplaceFilter] = useState("");
  // Filter tanggal berdasarkan createAt
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Untuk search bebas jika diperlukan
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination dan sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);

  console.log("id_user:", id_user);

  // Ambil data dari API tanpa filter berdasarkan id_toko
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pelunasanData = await getPelunasanPenjualanAll();
        // console.log("pelunasanData:", pelunasanData);

        // Simpan semua data tanpa filter id_toko
        setData(pelunasanData);
        setFilteredData(pelunasanData);
      } catch (err) {
        console.error("Error dalam mengambil data pelunasan:", err);
        setError(err.message || "Gagal mengambil data pelunasan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Fungsi untuk memformat tanggal menjadi dd/MM/yyyy, hh:mm:ss
  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";

    const date = new Date(dateString);

    // Format angka agar selalu dua digit
    const padZero = (num) => String(num).padStart(2, "0");

    // Ambil komponen waktu
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());

    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${day}/${month}/${year}, ${time}`;
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Ekstrak opsi unik untuk filter dari data yang diterima
  const uniqueKodePelunasan = [
    ...new Set(data.map((item) => item.kode_pelunasan)),
  ];
  const uniqueNoPemesanan = [...new Set(data.map((item) => item.no_pemesanan))];
  const uniqueNamaMarketplace = [
    ...new Set(data.map((item) => item.nama_marketplace)),
  ];

  // Filter data berdasarkan pilihan filter dan searchTerm
  useEffect(() => {
    let filtered = data;

    if (kodePelunasanFilter) {
      filtered = filtered.filter(
        (item) =>
          item.kode_pelunasan &&
          item.kode_pelunasan
            .toLowerCase()
            .includes(kodePelunasanFilter.toLowerCase())
      );
    }

    if (noPemesananFilter) {
      filtered = filtered.filter(
        (item) =>
          item.no_pemesanan &&
          item.no_pemesanan
            .toLowerCase()
            .includes(noPemesananFilter.toLowerCase())
      );
    }

    if (namaMarketplaceFilter) {
      filtered = filtered.filter(
        (item) =>
          item.nama_marketplace &&
          item.nama_marketplace
            .toLowerCase()
            .includes(namaMarketplaceFilter.toLowerCase())
      );
    }

    // Filter berdasarkan rentang tanggal pada field createAt
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

    // Jika ada searchTerm tambahan yang ingin diterapkan di semua field
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_pelunasan &&
            item.kode_pelunasan.toLowerCase().includes(lowercasedFilter)) ||
          (item.no_pemesanan &&
            item.no_pemesanan.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_marketplace &&
            item.nama_marketplace.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_toko &&
            item.nama_toko.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    kodePelunasanFilter,
    noPemesananFilter,
    namaMarketplaceFilter,
    startDate,
    endDate,
    searchTerm,
    data,
  ]);

  // Sorting data
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];

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

    // Gunakan nama toko atau marketplace untuk nama file (sesuaikan jika perlu)
    const uniqueNamaToko = [...new Set(sortedData.map((item) => item.nama_toko))];
    let namaFile = "";
    if (uniqueNamaToko.length === 1) {
      namaFile = uniqueNamaToko[0] || "Unknown";
    } else if (uniqueNamaToko.length > 1) {
      namaFile = "Multiple_Toko";
    } else {
      namaFile = "No_Toko";
    }

    // Sanitasi nama file
    const sanitizeFilename = (name) => name.replace(/[\/\\:*?"<>|]/g, "_");
    namaFile = sanitizeFilename(namaFile);

    // Format tanggal saat ini
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;

    // Generate nomor acak
    const randomNumber = Math.floor(Math.random() * 100) + 1;

    const filename = `Pelunasan-Penjualan-${namaFile}-${formattedDate}-${randomNumber}.xlsx`;
    console.log("Export filename:", filename);

    // Persiapkan data untuk export
    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      "Kode Pelunasan": item.kode_pelunasan || "Data tidak ditemukan",
      "ID Akun": item.id_akun || "Data tidak ditemukan",
      "Nama Akun": item.nama_akun || "Data tidak ditemukan",
      "Kode Akun Akuntansi": item.kode_akun_akuntansi || "Data tidak ditemukan",
      "Nama Akun Akuntansi": item.nama_akun_akuntansi || "Data tidak ditemukan",
      "No Pemesanan": item.no_pemesanan || "Data tidak ditemukan",
      "Pelunasan Terbayar":
        item.pelunasan_terbayar !== undefined
          ? formatRupiah(item.pelunasan_terbayar)
          : "Data tidak ditemukan",
      "Nama Toko": item.nama_toko || "Data tidak ditemukan",
      "Nama Marketplace": item.nama_marketplace || "Data tidak ditemukan",
      "DI BUAT OLEH": item.nama_user || "Data tidak ditemukan",
      "DI BUAT TANGGAL": item.createAt
        ? formatDate(item.createAt)
        : "Data tidak ditemukan",
      "Transaksi Terbayar":
        item.transaksi_terbayar !== undefined
          ? formatRupiah(item.transaksi_terbayar)
          : "Data tidak ditemukan",
      Total:
        item.total !== undefined
          ? formatRupiah(item.total)
          : "Data tidak ditemukan",
      Sisa:
        item.sisa !== undefined
          ? formatRupiah(item.sisa)
          : "Data tidak ditemukan",
      "Transaksi UpdateAt": item.transaksi_updateAt
        ? formatDate(item.transaksi_updateAt)
        : "Data tidak ditemukan",
    }));

    // Buat worksheet dan workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pelunasan Penjualan");

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

  // Fungsi untuk menentukan warna row berdasarkan kondisi pelunasan
  const getRowClass = (item) => {
    const terbayar = Number(item.pelunasan_terbayar) || 0;
    const total = Number(item.total) || 0;
    const sisa = Number(item.sisa) || 0;

    if (terbayar === total || sisa === 0) {
      return "bg-yellow-300";
    } else if (terbayar < total) {
      return "bg-yellow-300";
    } else if (terbayar > total || sisa !== 0) {
      return "bg-blue-400";
    }
    return "bg-white";
  };

  // Perhitungan subtotal untuk seluruh data yang difilter
  const subtotal = useMemo(() => {
    if (filteredData.length === 0) {
      return { pelunasan_terbayar: 0, total: 0, sisa: 0 };
    }
    return filteredData.reduce(
      (acc, item) => {
        acc.pelunasan_terbayar += Number(item.pelunasan_terbayar) || 0;
        acc.total += Number(item.total) || 0;
        acc.sisa += Number(item.sisa) || 0;
        return acc;
      },
      { pelunasan_terbayar: 0, total: 0, sisa: 0 }
    );
  }, [filteredData]);

  // Perhitungan kelebihan bayar
  const kelebihanBayar = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      const terbayar = Number(item.pelunasan_terbayar) || 0;
      const total = Number(item.total) || 0;
      if (terbayar > total) {
        return acc + (terbayar - total);
      }
      return acc;
    }, 0);
  }, [filteredData]);

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
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Keuangan
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
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Pelunasan Hutang
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
            label="Filter Kode Pelunasan"
            options={uniqueKodePelunasan}
            value={kodePelunasanFilter}
            onChange={setKodePelunasanFilter}
          />
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
          {/* Filter Tanggal berdasarkan CreateAt */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
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
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
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
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 space-y-4 md:space-y-0">
          {/* Search Bar */}
          <div className="w-full md:w-1/2">
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-72 pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className="w-fit flex items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
              onClick={handleExport}
            >
              <button className="h-8 w-8 cetakexcel rounded-md flex items-center justify-center font-xs text-gray-100">
                <img src={LogoExcel} className="w-8 h-8" alt="Save" />
              </button>
              <p className="text-sm p-1 font-semibold text-blue-900">Export</p>
            </div>
            {/* <div className="right-0 flex space-x-2">
              <Link to="/dashboard/master/menu/pelunasankeuangan/hutang/insert">
                <button className="cetakpdf h-7 w-16 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
                  <p className="p-2">Tambah</p>
                </button>
              </Link>
            </div> */}
          </div>
        </div>

        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-1 py-1 w-8 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No{" "}
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_pelunasan")}
                >
                  Kode Pelunasan{" "}
                  {sortConfig.key === "kode_pelunasan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("id_akun")}
                >
                  ID Akun{" "}
                  {sortConfig.key === "id_akun" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_akun")}
                >
                  Nama Akun{" "}
                  {sortConfig.key === "nama_akun" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_akun_akuntansi")}
                >
                  Kode Akuntansi{" "}
                  {sortConfig.key === "kode_akun_akuntansi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_akun_akuntansi")}
                >
                  Nama Akuntansi{" "}
                  {sortConfig.key === "nama_akun_akuntansi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no_pemesanan")}
                >
                  No Pemesanan{" "}
                  {sortConfig.key === "no_pemesanan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_marketplace")}
                >
                  Marketplace{" "}
                  {sortConfig.key === "nama_marketplace" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-24 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("transaksi_terbayar")}
                >
                  Terbayar{" "}
                  {sortConfig.key === "transaksi_terbayar" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-24 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("total")}
                >
                  Pembayaran{" "}
                  {sortConfig.key === "total" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("sisa")}
                >
                  Sisa{" "}
                  {sortConfig.key === "sisa" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-24 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  DI BUAT OLEH{" "}
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("pemesanan_createAt")}
                >
                  DI BUAT TANGGAL{" "}
                  {sortConfig.key === "pemesanan_createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("transaksi_updateAt")}
                >
                  UpdateAt{" "}
                  {sortConfig.key === "transaksi_updateAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("transaksi_terbayar")}
                >
                  Status Pelunasan{" "}
                  {sortConfig.key === "transaksi_terbayar" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  // Hitung nilai numerik dari pelunasan_terbayar, total, dan sisa
                  const terbayar = Number(item.pelunasan_terbayar) || 0;
                  const total = Number(item.total) || 0;
                  const sisa = Number(item.sisa) || 0;
                  // Tentukan status pembayaran untuk ditampilkan
                  let statusPembayaran = "";
                  if (terbayar === total || sisa === 0) {
                    statusPembayaran = "Lunas";
                  } else if (terbayar < total) {
                    statusPembayaran = "Belum lunas";
                  } else if (terbayar > total || sisa !== 0) {
                    statusPembayaran = "Kelebihan bayar";
                  }

                  return (
                    <tr
                      key={index}
                      className={`border-b text-gray-700 ${getRowClass(item)}`}
                    >
                      <td className="px-1 py-1 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.kode_pelunasan || "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.id_akun || "0"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.nama_akun || "0"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.kode_akun_akuntansi || "0"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.nama_akun_akuntansi || "0"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.no_pemesanan || "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.nama_marketplace || "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.pelunasan_terbayar !== undefined
                          ? formatRupiah(item.pelunasan_terbayar)
                          : "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.total !== undefined
                          ? formatRupiah(item.total)
                          : "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.sisa !== undefined
                          ? formatRupiah(item.sisa)
                          : "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.nama_user || "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.createAt
                          ? formatDate(item.createAt)
                          : "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {item.transaksi_updateAt
                          ? formatDate(item.transaksi_updateAt)
                          : "Data tidak ditemukan"}
                      </td>
                      <td className="px-1 py-1 border border-gray-700">
                        {statusPembayaran}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={14}
                    className="py-4 px-4 text-center text-gray-500 border-b"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tabel Subtotal */}
        <div className="mt-0.5">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={3}
                  className="px-1 py-1 border w-56 uppercase border-gray-700 text-right bg-gray-300"
                >
                  Sub total Pelunasan Terbayar
                </td>
                <td className="px-1 py-1 w-40 border border-gray-700 bg-lime-500">
                  {formatRupiah(subtotal.pelunasan_terbayar)}
                </td>
                <td
                  colSpan={4}
                  className="px-1 py-1 border w-28 uppercase border-gray-700 text-right bg-gray-300"
                >
                  Sub total pembayaran
                </td>
                <td className="px-1 py-1 w-40 border border-gray-700 bg-lime-500">
                  {formatRupiah(subtotal.total)}
                </td>
                <td
                  colSpan={2}
                  className="px-1 py-1 border w-28 uppercase border-gray-700 text-right bg-gray-300"
                >
                  Sub total Sisa
                </td>
                <td
                  className={`px-1 py-1 border w-40 border-gray-700 ${
                    subtotal.sisa !== undefined
                      ? parseFloat(subtotal.sisa) === 0
                        ? "bg-lime-500"
                        : "bg-yellow-300"
                      : "bg-red-600"
                  }`}
                >
                  {formatRupiah(subtotal.sisa)}
                </td>
                <td
                  colSpan={2}
                  className="px-1 py-1 border w-28 border-gray-700 uppercase text-right bg-gray-300"
                >
                  Sub total Kelebihan Bayar
                </td>
                <td className="px-1 py-1 w-40 border border-gray-700 bg-blue-400">
                  {formatRupiah(kelebihanBayar)}
                </td>
                <td colSpan={3}></td>
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
                className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-1 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
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
