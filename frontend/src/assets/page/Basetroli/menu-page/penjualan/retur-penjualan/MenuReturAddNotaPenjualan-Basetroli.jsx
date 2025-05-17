// MenuReturByDetailNotaPenjualan-Basetroli.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getReturAddNotaPenjualanAll, // API untuk ambil data no pemesanan
  getMasterGudang,
  returNotaPenjualan,
} from "../../../../../services/apiService.js";
import DialogRetur from "../../../../component/DialogTrueFalse.jsx"; // <-- Import DialogRetur
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Alert from "../../../../component/Alert.jsx";
import Loading from "../../../../component/Loading.jsx";
import Error from "../../../../component/Error.jsx";
import IconDelete from "../../../../../image/icon/logo-delete.svg";

// Komponen FilterSelect Kustom (digunakan untuk pilihan berbasis string)
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
          className="absolute top-6 right-2 text-red-600 text-sm"
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

export default function MenuReturNotaDetailPenjualanBesttroli() {
  // Data no pemesanan (seluruh data dari API)
  const [noPemesananOptions, setNoPemesananOptions] = useState([]);
  // List string no pemesanan untuk dropdown
  const [noPemesananList, setNoPemesananList] = useState([]);
  // Pilihan user untuk no pemesanan
  const [selectedNoPemesanan, setSelectedNoPemesanan] = useState("");

  // State untuk pilihan kode barang (berupa string gabungan kode - nama)
  const [barangOptions, setBarangOptions] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState("");

  // Baris data retur yang akan ditampilkan di tabel
  const [tableRows, setTableRows] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Untuk dropdown Gudang Tujuan
  const [masterGudang, setMasterGudang] = useState([]);
  const [gudangTujuan, setGudangTujuan] = useState("");

  // Form retur
  const [satuanRetur, setSatuanRetur] = useState("Satuan Besar");
  const [kodeRetur, setKodeRetur] = useState("");
  const [status, setStatus] = useState(0);
  const createBy = useSelector((state) => state.auth.username);

  // Dialog Retur
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  // Ambil id_user & id_toko dari Redux state
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko); 
  // Ubah ke integer
  const id_toko = parseInt(id_tokoString, 10);

  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);

  // Ambil data No Pemesanan dari API (filter sesuai id_toko)
  useEffect(() => {
    const fetchNoPemesananOptions = async () => {
      try {
        setLoading(true);
        const response = await getReturAddNotaPenjualanAll(token);
        console.log("Data no pemesanan:", response);

        // Filter data berdasarkan id_toko
        const allData = response[0] ? Object.values(response[0]) : [];
        const filteredData = allData.filter(
          (item) => parseInt(item.id_toko, 10) === id_toko
        );

        setNoPemesananOptions(filteredData);

        // Buat array string dari field no_pemesanan untuk FilterSelect
        const list = filteredData.map((opt) => opt.no_pemesanan);
        // Hilangkan duplikasi
        const uniqueList = [...new Set(list)];
        setNoPemesananList(uniqueList);
      } catch (err) {
        console.error("Error mengambil no pemesanan:", err);
        setError(err.message || "Gagal mengambil data no pemesanan.");
      } finally {
        setLoading(false);
      }
    };
    fetchNoPemesananOptions();
  }, [token, id_toko]);

  // Ambil data Master Gudang untuk dropdown Gudang Tujuan
  useEffect(() => {
    const fetchMasterGudang = async () => {
      try {
        const response = await getMasterGudang(token);
        const gudangArr = response ? Object.values(response) : [];
        setMasterGudang(gudangArr);
        if (gudangArr.length > 0) {
          setGudangTujuan(gudangArr[0].id_gudang);
        }
      } catch (err) {
        console.error("Error mengambil data gudang:", err);
        setError(err.message || "Gagal mengambil data gudang.");
      }
    };
    fetchMasterGudang();
  }, [token]);

  // Update barangOptions berdasarkan no pemesanan yang dipilih
  useEffect(() => {
    if (selectedNoPemesanan) {
      // Filter data no pemesanan yang sesuai dengan pilihan
      const filtered = noPemesananOptions.filter(
        (opt) => opt.no_pemesanan === selectedNoPemesanan
      );
      // Buat map unik berdasarkan kode_barang
      const uniqueBarang = {};
      filtered.forEach((item) => {
        // Format yang akan ditampilkan: "kode_barang - nama_barang"
        uniqueBarang[item.kode_barang] = item.nama_barang;
      });
      const barangList = Object.entries(uniqueBarang).map(
        ([kode, nama]) => `${kode} - ${nama}`
      );
      setBarangOptions(barangList);
      // Jika hanya ada 1 pilihan, otomatis pilih
      if (barangList.length === 1) {
        setSelectedBarang(barangList[0]);
      } else {
        setSelectedBarang("");
      }
    } else {
      setBarangOptions([]);
      setSelectedBarang("");
    }
  }, [selectedNoPemesanan, noPemesananOptions]);

  // Fungsi generate kode retur
  const generateKodeRetur = (id_toko = "0000") => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const fullYear = now.getFullYear();
    const year = String(fullYear).slice(-2);

    const storageKey = `counter_RTPJ_${id_toko}_${year}${month}${day}`;
    let counter = parseInt(localStorage.getItem(storageKey) || "0", 10);
    counter += 1;
    localStorage.setItem(storageKey, counter.toString());

    const counterStr = String(counter).padStart(4, "0");
    return `RJ-${year}${month}${day}${counterStr}`;
  };

  // Set kode retur default (sama untuk semua baris retur)
  useEffect(() => {
    if (noPemesananOptions.length > 0) {
      const id_toko = noPemesananOptions[0].kode_toko || "0000";
      setKodeRetur(generateKodeRetur(id_toko));
    } else {
      setKodeRetur(generateKodeRetur("0000"));
    }
  }, [noPemesananOptions]);

  // Menambahkan baris baru ke table berdasarkan pilihan no pemesanan dan kode barang
  const handleAddRow = () => {
    if (!selectedNoPemesanan) {
      setAlert({
        message: "Pilih no pemesanan terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return;
    }
    // Jika terdapat lebih dari satu pilihan kode barang, pastikan user memilih salah satunya
    if (barangOptions.length > 1 && !selectedBarang) {
      setAlert({
        message: "Pilih kode barang / nama barang terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return;
    }
    // Cari data lengkap dari noPemesananOptions berdasarkan nilai yang terpilih
    // Jika barangOptions hanya 1, maka otomatis pilih yang tersebut,
    // Jika lebih dari 1, filter berdasarkan kombinasi "kode_barang - nama_barang"
    const selectedOption = noPemesananOptions.find((option) => {
      if (option.no_pemesanan !== selectedNoPemesanan) return false;
      const formattedBarang = `${option.kode_barang} - ${option.nama_barang}`;
      if (barangOptions.length > 1) {
        return formattedBarang === selectedBarang;
      }
      return true;
    });
    if (selectedOption) {
      // Tambahkan properti qtyRetur default ""
      const newRow = { ...selectedOption, qtyRetur: "" };
      setTableRows((prevRows) => [...prevRows, newRow]);
      // Reset pilihan setelah baris ditambahkan
      setSelectedNoPemesanan("");
      setBarangOptions([]);
      setSelectedBarang("");
    } else {
      setAlert({
        message: "Data no pemesanan atau kode barang tidak ditemukan.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
    }
  };

  // Fungsi untuk menghapus baris dari tableRows
  const handleDeleteRow = (indexToRemove) => {
    setTableRows((prevRows) =>
      prevRows.filter((_, index) => index !== indexToRemove)
    );
  };

  // Mengubah qtyRetur per baris (hanya digit, tidak NaN)
  const handleQtyChange = (index, rawValue) => {
    setTableRows((prevRows) =>
      prevRows.map((row, i) => {
        if (i === index) {
          // Jika input kosong, set qtyRetur menjadi ""
          if (rawValue === "") {
            return { ...row, qtyRetur: "" };
          }
          const newQty = parseInt(rawValue, 10);
          if (isNaN(newQty)) {
            return row; // Jika tidak valid, jangan ubah
          }
          if (newQty < 1) {
            setAlert({
              message: "Qty Retur harus lebih dari 0.",
              type: "warning",
              visible: true,
            });
            setTimeout(() => {
              setAlert((prev) => ({ ...prev, visible: false }));
            }, 3000);
            // Kembalikan nilai sebelumnya (tidak mengupdate)
            return row;
          }
          if (newQty > parseInt(row.total_quantity, 10)) {
            setAlert({
              message: `Qty Retur tidak boleh lebih dari ${row.total_quantity}.`,
              type: "warning",
              visible: true,
            });
            setTimeout(() => {
              setAlert((prev) => ({ ...prev, visible: false }));
            }, 3000);
            // Kembalikan nilai sebelumnya (tidak mengupdate)
            return row;
          }
          // Jika input valid, update qtyRetur
          return { ...row, qtyRetur: rawValue };
        }
        return row;
      })
    );
  };

  // Refresh halaman
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    window.location.reload();
  };

  // Fungsi untuk menampilkan Tanggal dalam format dd/MM/yyyy (id-ID)
  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());
    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}, ${time}`;
  };

  // Export PDF (tetap dipertahankan)
  const handleExportPDF = () => {
    try {
      if (tableRows.length === 0) {
        setAlert({
          message: "Tidak ada data untuk diekspor.",
          type: "warning",
          visible: true,
        });
        return;
      }
      const doc = new jsPDF("p", "mm", "a4");
      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      // Header PDF
      doc.setFontSize(10);
      doc.text("RETUR PENJUALAN", 105, 10, { align: "center" });
      doc.setFontSize(8);
      doc.text(`Kode Retur: ${kodeRetur}`, 10, 20);
      doc.text(`Tanggal: ${currentDate}`, 10, 26);
      // Data table
      const tableBody = tableRows.map((row) => [
        row.no_pemesanan || "-",
        row.kode_pemesanan || "-",
        row.kode_packinglist || "-",
        row.nama_toko || "-",
        row.nama_marketplace || "-",
        row.kode_barang || "-",
        row.nama_barang || "-",
        row.harga_barang !== undefined ? row.harga_barang : "-",
        row.besar !== undefined ? row.besar : "-",
        row.sedang !== undefined ? row.sedang : "-",
        row.kecil !== undefined ? row.kecil : "-",
        row.total_quantity !== undefined ? row.total_quantity : "-",
        row.qtyRetur !== undefined ? row.qtyRetur : "-",
        row.netto !== undefined ? row.netto : "-",
        row.nama_user || "-",
        row.createAt || "-",
      ]);
      doc.autoTable({
        head: [
          [
            "No Pemesanan",
            "Kode Pemesanan",
            "Kode Packinglist",
            "Nama Toko",
            "Marketplace",
            "Kode Barang",
            "Nama Barang",
            "Harga",
            "Besar",
            "Sedang",
            "Kecil",
            "total_quantity",
            "Qty Retur",
            "Total",
            "DI BUAT OLEH",
            "DI BUAT TANGGAL",
          ],
        ],
        body: tableBody,
        startY: 32,
        styles: { fontSize: 6 },
      });
      doc.save(`Retur_${kodeRetur}.pdf`);
    } catch (error) {
      console.error("Error saat mengekspor PDF:", error);
      setAlert({
        message: "Gagal melakukan proses ekspor PDF.",
        type: "warning",
        visible: true,
      });
    }
  };

  // Membuka dialog retur
  const handleOpenReturDialog = () => {
    if (tableRows.length === 0) {
      setAlert({
        message: "Wajib menambahkan data terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      return;
    }
    if (!gudangTujuan) {
      setAlert({
        message: "Gudang Tujuan harus dipilih.",
        type: "warning",
        visible: true,
      });
      return;
    }
    const invalidRow = tableRows.find((row) => row.qtyRetur <= 0);
    if (invalidRow) {
      setAlert({
        message: "Setiap baris harus memiliki Qty Retur lebih dari 0.",
        type: "warning",
        visible: true,
      });
      return;
    }
    setIsDialogOpen(true);
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

// Fungsi konfirmasi retur dengan penutupan dialog segera
const handleConfirmRetur = async () => {
  // Tutup dialog terlebih dahulu
  setIsDialogOpen(false);
  try {
    const fixedGudangAsal = "1";
    const itemsPayload = tableRows.map((row) => ({
      id_header_pemesanan: row.id_header_pemesanan, // Pastikan field ini ada
      no_pemesanan: row.no_pemesanan,
      kode_pemesanan: row.kode_pemesanan,
      kode_barang: row.kode_barang,
      // Passing id_marketplace dan id_toko dari row
      id_marketplace: row.id_marketplace,
      id_toko: row.id_toko,
      gudang_asal: parseInt(fixedGudangAsal, 10),
      gudang_tujuan: parseInt(gudangTujuan, 10),
      qtyretur: parseInt(row.qtyRetur, 10),
      kode_toko: row.kode_toko,
      netto: row.netto,
      total_quantity: parseFloat(row.total_quantity),
    }));
    const response = await returNotaPenjualan(
      kodeRetur,
      status,
      createBy,
      itemsPayload
    );
    if (response.success) {
      setAlert({
        message: "Retur penjualan berhasil disimpan.",
        type: "success",
        visible: true,
      });
      setTimeout(() => {
        navigate("/dashboard/basetroli/menu/notapenjualan/returpenjualan");
      }, 2000);
    } else {
      setAlert({
        message: response.message,
        type: "error",
        visible: true,
      });
    }
  } catch (error) {
    setAlert({
      message: error.message || "Gagal menyimpan retur penjualan.",
      type: "error",
      visible: true,
    });
  }
};


  // Fungsi batal retur
  const handleCancelRetur = () => {
    setIsDialogOpen(false);
    setAlert({
      message: "Proses retur dibatalkan.",
      type: "warning",
      visible: true,
    });
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {/* Alert Global */}
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert((prev) => ({ ...prev, visible: false }))
          }
        />
      )}

      {/* Dialog Retur */}
      <DialogRetur
        isOpen={isDialogOpen}
        title="Konfirmasi Retur"
        message="Apakah Anda yakin ingin melanjutkan proses retur ini?"
        onConfirm={handleConfirmRetur}
        onCancel={handleCancelRetur}
      />

      {/* Breadcrumb & Tombol Refresh */}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/basetroli/menu/notapenjualan/returpenjualan"
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
            to="/dashboard/basetroli/menu/notapenjualan/returpenjualan"
            className="text-xs font-semibold text-blue-900"
          >
            Retur Penjualan
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
            Tambah Retur Penjualan
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

      {/* Header Form */}
      <div className="bg-white rounded-md shadow-md p-2 mb-1 border border-gray-200">
        <h1 className="text-md font-bold text-blue-900 mb-1">
          Form Retur Penjualan
        </h1>
        <div className="flex w-fit gap-4 bg-gray-100 p-1 rounded-md shadow-md">
        <div className="flex flex-col md:flex-row gap-1">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-900 mb-1">
                Gudang Tujuan:
              </label>
              <select
                id="gudangTujuan"
                className="border border-gray-300 text-xs rounded p-1 w-32"
                value={gudangTujuan}
                onChange={(e) => setGudangTujuan(e.target.value)}
              >
                {masterGudang.map((gudang) => (
                  <option key={gudang.id_gudang} value={gudang.id_gudang}>
                    {gudang.nama_gudang}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-1">
            <FilterSelect
              label="No Pemesanan:"
              options={noPemesananList}
              value={selectedNoPemesanan}
              onChange={setSelectedNoPemesanan}
            />
            <FilterSelect
              label="Kode Barang / Nama Barang:"
              options={barangOptions}
              value={selectedBarang}
              onChange={setSelectedBarang}
            />
                        <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-900 mb-1">
                Satuan:
              </label>
              <select
                value="Satuan Kecil"
                className="border border-gray-300 text-xs rounded p-1 bg-gray-100"
                disabled
              >
                <option value="Satuan Besar">CRT</option>
                <option value="Satuan Sedang">LSN</option>
                <option value="Satuan Kecil">PCS</option>
              </select>
            </div>
            {/* Tombol Tambah */}
            <div className="flex items-end text-center">
              <button
                onClick={handleAddRow}
                className="w-16 h-7 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
              >
                Tambah
              </button>
            </div>
          </div>

        </div>
        <p className="italic text-red-600 pt-1" style={{ fontSize: "0.60rem" }}>
          *Pastikan retur yang dipilih untuk gudang yang sama
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleOpenReturDialog}
            className="w-16 h-7 text-xs rounded-md border-2 font-semibold text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-2 mb-4">
        <h2 className="text-md font-bold text-blue-900 mb-2">
          Data No Pemesanan Terpilih
        </h2>
        <div className="overflow-x-auto" style={{ maxHeight: "40vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200 sticky top-0">
              <tr>
                <th className="px-1 py-0.5 border border-gray-500">No</th>
                <th className="px-1 py-0.5 border border-gray-500">No Pemesanan</th>
                <th className="px-1 py-0.5 border border-gray-500">Kode Pemesanan</th>
                <th className="px-1 py-0.5 border border-gray-500">Kode Packinglist</th>
                <th className="px-1 py-0.5 border border-gray-500">Nama Toko</th>
                <th className="px-1 py-0.5 border border-gray-500">Marketplace</th>
                <th className="px-1 py-0.5 border border-gray-500">Kode Barang</th>
                <th className="px-1 py-0.5 border border-gray-500">Nama Barang</th>
                <th className="px-1 py-0.5 border border-gray-500">total_quantity</th>
                <th className="px-1 py-0.5 border border-gray-500">Harga Barang</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Total Harga</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Qty Retur</th>
                <th className="px-1 py-0.5 border border-gray-500">DI BUAT OLEH</th>
                <th className="px-1 py-0.5 border border-gray-500">DI BUAT TANGGAL</th>
                <th className="px-1 py-0.5 border border-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length > 0 ? (
                tableRows.map((row, index) => (
                  <tr key={`${row.no_pemesanan}-${index}`} className="text-gray-900">
                    <td className="px-1 py-0.5 border border-gray-500">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.no_pemesanan || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.kode_pemesanan || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.kode_packinglist || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.nama_toko || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.nama_marketplace || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.kode_barang || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.nama_barang || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.total_quantity !== undefined ? row.total_quantity : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {formatRupiah(row.harga_barang) !== undefined
                        ? formatRupiah(row.harga_barang)
                        : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {formatRupiah(row.netto) !== undefined
                        ? formatRupiah(row.netto)
                        : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500 rounded-sm">
                      <div className="item-center flex rounded bg-slate-200 ">

                      <input
                        type="text"
                        placeholder="0"
                        value={row.qtyRetur}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/[^\d]/g, "");
                          handleQtyChange(index, onlyDigits);
                        }}
                        className="text-xs border-none bg-slate-300 rounded p-1 w-full"
                        />
                      <p className="text-xs p-2">PCS</p>
                        </div>
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {row.nama_user || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {formatDate(row.createAt) || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          <img
                            src={IconDelete}
                            className="w-4 h-4"
                            alt="delete no pemesanan"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={18} className="py-2 text-center text-gray-500 border">
                    Tidak ada data yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
