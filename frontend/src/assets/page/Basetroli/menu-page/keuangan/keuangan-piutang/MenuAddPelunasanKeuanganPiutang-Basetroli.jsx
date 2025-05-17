import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Services
import {
  getMasterGudang,
  getLaporanMasterDataBarang,
  insertPembelianBarang,
} from "../../../../../services/apiService.js";

// Components
import Alert from "../../../../component/Alert.jsx";
import Loading from "../../../../component/Loading.jsx";
import Error from "../../../../component/Error.jsx";
import IconDelete from "../../../../../image/icon/logo-delete.svg";

/**
 * Komponen FilterSelect untuk mencari kode/nama barang.
 * Menampilkan data dari `allBarang`, lalu memfilter berdasarkan
 * kode_barang atau namabarang (case-insensitive).
 */
function FilterSelect({ label, options, value, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const filterText = inputValue.toLowerCase();
    const filtered = (options || []).filter((item) => {
      const kode = String(item.kode_barang || "").toLowerCase();
      const nama = String(item.namabarang || "").toLowerCase();
      return kode.includes(filterText) || nama.includes(filterText);
    });
    setFilteredOptions(filtered);
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
    setInputValue(option.kode_barang || "");
    setShowOptions(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowOptions(true);
  };

  const handleClear = () => {
    setInputValue("");
    onChange(null);
    setShowOptions(false);
  };

  return (
    <div className="relative w-full md:w-44" ref={wrapperRef}>
      {label && (
        <label className="block mb-1 text-blue-900 font-semibold text-xs">
          {label}
        </label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
        placeholder={placeholder || "Ketik atau pilih..."}
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
              {option.kode_barang} - {option.namabarang}
            </li>
          ))}
        </ul>
      )}
      {showOptions && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
          Tidak ada data.
        </div>
      )}
    </div>
  );
}

export default function MenuAddPembelianBarangBasetroli() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  // Ambil id_user & id_toko (string), lalu ubah ke integer
  const id_user = useSelector((state) => state.auth.id_user);
  const kode_toko = useSelector((state) => state.auth.kode_toko);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_tokoInt = parseInt(id_tokoString, 10);

  console.log("id_user:", id_user);
  console.log("kode_toko:", id_tokoInt);

  const [masterGudang, setMasterGudang] = useState([]);
  const [gudangTujuan, setGudangTujuan] = useState("");

  // Data hasil getLaporanMasterDataBarang
  const [allBarang, setAllBarang] = useState([]);

  // Table rows
  const [tableRows, setTableRows] = useState([]);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Barang terpilih dari FilterSelect
  const [selectedBarang, setSelectedBarang] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 1. Ambil data Gudang
        const gudangResponse = await getMasterGudang(token);
        const gudangArr = gudangResponse ? Object.values(gudangResponse) : [];
        setMasterGudang(gudangArr);
        if (gudangArr.length > 0) {
          setGudangTujuan(gudangArr[0].id_gudang);
        }
        // 2. Ambil data Barang (semua), lalu filter sesuai id_tokoInt
        const barangResponse = await getLaporanMasterDataBarang(token);
        const barangArr = barangResponse ? Object.values(barangResponse) : [];
        const filteredBarangArr = barangArr.filter(
          (item) => parseInt(item.id_toko, 10) === id_tokoInt
        );
        setAllBarang(filteredBarangArr);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [token, id_tokoInt]);

  // Menambahkan baris baru ke tabel
  const handleAddRow = () => {
    if (!selectedBarang) {
      setAlert({
        message: "Pilih atau ketik Kode / Nama Barang terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return;
    }
    // Cek duplikasi (apakah barang sudah ada di tabel)
    const exists = tableRows.some(
      (row) => row.kode_barang === selectedBarang.kode_barang
    );
    if (exists) {
      setAlert({
        message: "Barang sudah ada di tabel.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return;
    }
    // Menyusun list satuan berdasarkan data barang yang dipilih
    const availableSatuan = [];
    if (selectedBarang.satuanbesar) {
      availableSatuan.push(selectedBarang.satuanbesar);
    }
    if (selectedBarang.satuansedang) {
      availableSatuan.push(selectedBarang.satuansedang);
    }
    if (selectedBarang.satuankecil) {
      availableSatuan.push(selectedBarang.satuankecil);
    }
    // Sertakan juga conversion factor jika tersedia
    const newRow = {
      kode_barang: selectedBarang.kode_barang || "",
      namabarang: selectedBarang.namabarang || "",
      nama_kategori: selectedBarang.nama_kategori || "",
      nama_toko: selectedBarang.nama_toko || "",
      stok_barang: selectedBarang.stok_barang || 0,
      qtyBeli: "",
      availableSatuan,
      selectedSatuan: availableSatuan.length > 0 ? availableSatuan[0] : "",
      catatan: "",
      // Ambil conversion factor dari master data (default 1 jika tidak ada)
      konversi1: selectedBarang.konversi1 || 1,
      konversi2: selectedBarang.konversi2 || 1,
    };
    setTableRows((prev) => [...prev, newRow]);
    // Reset pilihan barang
    setSelectedBarang(null);
  };

  // Menghapus baris
  const handleDeleteRow = (index) => {
    setTableRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Mengubah nilai qtyBeli di tabel
  const handleQtyChange = (index, newValue) => {
    setTableRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          const onlyDigits = newValue.replace(/[^\d]/g, "");
          return { ...row, qtyBeli: onlyDigits };
        }
        return row;
      })
    );
  };

  // Mengubah satuan di tabel
  const handleSatuanChange = (index, newValue) => {
    setTableRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          return { ...row, selectedSatuan: newValue };
        }
        return row;
      })
    );
  };

  // Mengubah catatan di tabel
  const handleCatatanChange = (index, newValue) => {
    setTableRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          return { ...row, catatan: newValue };
        }
        return row;
      })
    );
  };

  // Fungsi untuk submit data pembelian ke backend
  const handleSimpan = async () => {
    if (tableRows.length === 0) {
      setAlert({
        message: "Tidak ada data barang untuk disimpan.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return;
    }
    // Siapkan payload data
    const payload = {
      platform: "WEB",
      id_user,
      id_toko: id_tokoString,
      kode_toko,
      gudang_tujuan: gudangTujuan,
      detailData: tableRows.map((row) => ({
        kode_barang: row.kode_barang,
        qtyBeli: row.qtyBeli, // jumlah sesuai input user
        satuan: row.selectedSatuan,
        // Kirim conversion factor supaya backend bisa menghitung konversi
        konversi1: row.konversi1,
        konversi2: row.konversi2,
        catatan: row.catatan.trim() === "" ? "-" : row.catatan.trim(),
      })),
    };
    try {
      const result = await insertPembelianBarang(payload);
      setAlert({
        message: result.message || "Data berhasil disimpan.",
        type: "success",
        visible: true,
      });
      // Reset state jika perlu
      setTableRows([]);
    } catch (err) {
      setAlert({
        message: err.message || "Terjadi kesalahan saat menyimpan data.",
        type: "error",
        visible: true,
      });
    }
  };

  // Refresh halaman
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {/* Alert Global */}
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      {/* Breadcrumb & Tombol Refresh */}
      <div className="head flex justify-between items-center mb-2">
        <div className="cover flex items-center">
          <Link to="/dashboard/basetroli" className="text-xs font-semibold text-blue-900">
            Keuangan
          </Link>
          <div className="mx-1 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/basetroli/menu/pelunasankeuangan/hutang" className="text-xs font-semibold text-blue-900">
          <span className="text-xs font-semibold text-blue-900">Pelunasan Hutang</span>
          </Link>
          <div className="mx-1 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">Tambah Pelunasan Hutang</span>
        </div>
        <div>
          <button onClick={handleRefresh} className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
            Refresh
          </button>
        </div>
      </div>
      {/* Form Input Pembelian */}
      <div className="bg-white rounded-md shadow-md p-2 mb-2 border border-gray-200">
        <h1 className="text-md font-bold text-blue-900 mb-2">Form Tambah Pelunasan Hutang</h1>
        <div className="flex flex-wrap gap-4 p-2">
          {/* FilterSelect Kode/Nama Barang */}
          <FilterSelect
            label="Kode / Nama Barang:"
            options={allBarang}
            value={selectedBarang ? selectedBarang.kode_barang : ""}
            onChange={(option) => setSelectedBarang(option)}
            placeholder="Ketik Kode atau Nama Barang..."
          />
          {/* Tombol Tambah */}
          <div className="flex items-end">
            <button onClick={handleAddRow} className="w-16 h-7 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
              Tambah
            </button>
          </div>
          {/* Gudang Tujuan */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-blue-900 mb-1">Gudang Tujuan:</label>
            <select className="border border-gray-300 text-xs rounded p-1 w-32" value={gudangTujuan} onChange={(e) => setGudangTujuan(e.target.value)}>
              {masterGudang.map((gudang) => (
                <option key={gudang.id_gudang} value={gudang.id_gudang}>
                  {gudang.nama_gudang}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Tombol Simpan */}
        <div className="flex justify-end mt-2">
          <button onClick={handleSimpan} className="w-16 h-7 text-xs rounded-md border-2 font-semibold text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
            Simpan
          </button>
        </div>
      </div>
      {/* Tabel Data Barang */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-2 w-3/5">
        <h2 className="text-md font-bold text-blue-900 mb-2">Data Barang</h2>
        <div className="overflow-x-auto" style={{ maxHeight: "50vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200 sticky top-0">
              <tr>
                <th className="px-1 py-0.5 w-10 border border-gray-500">No</th>
                <th className="px-1 py-0.5 w-24 border border-gray-500">Nama Toko</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Kode Barang</th>
                <th className="px-1 py-0.5 w-72 border border-gray-500">Nama Barang</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Kategori</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Qty Sisa</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Qty Beli</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500">Satuan</th>
                <th className="px-1 py-0.5 w-40 border border-gray-500">Catatan</th>
                <th className="px-1 py-0.5 w-10 border border-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length > 0 ? (
                tableRows.map((row, index) => (
                  <tr key={row.kode_barang + "_" + index} className="text-gray-900">
                    <td className="px-1 py-0.5 border border-gray-500">{index + 1}</td>
                    <td className="px-1 py-0.5 border border-gray-500">{row.nama_toko}</td>
                    <td className="px-1 py-0.5 border border-gray-500">{row.kode_barang}</td>
                    <td className="px-1 py-0.5 border border-gray-500">{row.namabarang}</td>
                    <td className="px-1 py-0.5 border border-gray-500">{row.nama_kategori}</td>
                    <td className="px-1 py-0.5 border border-gray-500">{row.stok_barang + " PCS"}</td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      <div className="flex justify-center">
                        <input
                          type="text"
                          placeholder="0"
                          min={1}
                          value={row.qtyBeli}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                          className="border w-full border-gray-700 bg-gray-200 text-sm rounded p-1"
                        />
                      </div>
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      <div className="flex flex-col">
                        <select
                          className="border w-full border-gray-700 bg-gray-200 text-sm rounded p-1"
                          value={row.selectedSatuan}
                          onChange={(e) => handleSatuanChange(index, e.target.value)}
                        >
                          {row.availableSatuan.map((sat, i) => (
                            <option key={i} value={sat}>
                              {sat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      <input
                        type="text"
                        placeholder="Catatan..."
                        value={row.catatan}
                        onChange={(e) => handleCatatanChange(index, e.target.value)}
                        className="border w-full border-gray-700 bg-gray-200 text-sm rounded p-1"
                      />
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      <div className="flex justify-center">
                        <button onClick={() => handleDeleteRow(index)} className="text-red-600 hover:text-red-800 text-xs font-bold">
                          <img src={IconDelete} className="w-4 h-4" alt="delete no pemesanan" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-2 text-center text-gray-500 border">
                    Belum ada data barang.
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
