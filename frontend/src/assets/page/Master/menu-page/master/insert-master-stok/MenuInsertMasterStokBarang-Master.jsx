// FILE: MenuInsertMasterStokBarang-Basetroli.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  insertMasterStokBarang,
  getMasterTokoOnlyMaster, // API baru untuk mendapatkan data toko tanpa filter id_toko
  getLaporanMasterDataBarang,
} from "../../../../../services/apiService";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

// Komponen FilterSelect (menggunakan lebar penuh)
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = React.useRef(null);

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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block mb-1 text-blue-900 font-semibold text-sm">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-sm rounded-md p-2.5 w-full"
        placeholder="Pilih atau ketik..."
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute top-9 right-4 text-red-500 text-sm"
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
              className="px-2 py-2 hover:bg-gray-200 cursor-pointer text-sm"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {showOptions && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-sm text-gray-500">
          Tidak ada opsi
        </div>
      )}
    </div>
  );
}

export default function MenuInsertMasterStokBarangBasetroli() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);
  const navigate = useNavigate();

  // Ubah id_toko ke number jika diperlukan (tetap tersedia, meski tidak digunakan untuk filter)
  const authToko = parseInt(id_toko, 10);

  // State untuk dropdown Nama Toko & Kode Barang
  const [tokoOptions, setTokoOptions] = useState([]);
  const [barangOptions, setBarangOptions] = useState([]);

  // Field form
  const [selectedToko, setSelectedToko] = useState("");
  const [selectedBarang, setSelectedBarang] = useState("");
  const [stokBarang, setStokBarang] = useState("");
  const [statusBarang, setStatusBarang] = useState("Aktif"); // default = aktif

  // State untuk loading, error, dan alert
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Ambil data untuk dropdown nama toko tanpa filter berdasarkan id_toko
  useEffect(() => {
    const fetchToko = async () => {
      try {
        const tokoData = await getMasterTokoOnlyMaster(token);
        const tokoArray = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        // Filter opsi: hanya tampilkan toko yang id_tokonya tidak sama dengan id_toko dari auth
        const filteredToko = tokoArray.filter(
          (item) => parseInt(item.id_toko, 10) !== id_toko
        );
        // Mapping opsi dengan format "kode_toko - nama_toko"
        const options = filteredToko.map(
          (item) => `${item.kode_toko} - ${item.nama_toko}`
        );
        setTokoOptions(options);
      } catch (err) {
        console.error("Error fetching toko data:", err);
        setError("Gagal memuat data toko.");
      }
    };
    fetchToko();
  }, [token, id_toko]);
  

  // Ambil data untuk dropdown kode barang tanpa filter berdasarkan id_toko
  useEffect(() => {
    const fetchBarang = async () => {
      try {
        const barangData = await getLaporanMasterDataBarang(token);
        const barangArray = Array.isArray(barangData)
          ? barangData
          : Object.values(barangData);
        // Mapping opsi dengan format "kode_barang - namabarang" tanpa filter id_toko
        const options = barangArray.map(
          (item) => `${item.kode_barang} - ${item.namabarang}`
        );
        setBarangOptions(options);
      } catch (err) {
        console.error("Error fetching barang data:", err);
        setError("Gagal memuat data barang.");
      }
    };
    fetchBarang();
  }, [token]);

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Handler submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: semua field harus terisi
    if (!selectedToko || !selectedBarang || stokBarang === "") {
      setAlert({
        message: "Semua field harus diisi.",
        type: "error",
        visible: true,
      });
      return;
    }

    // Ambil kode_toko dari string yang dipilih (hanya bagian pertama sebelum " - ")
    const kodeToko = selectedToko.split(" - ")[0];
    const kodeBarang = selectedBarang.split(" - ")[0];
    // Konversi status: "Aktif" => 1, "Non-Aktif" => 0
    const numericStatus = statusBarang === "Aktif" ? 1 : 0;

    // Siapkan payload dengan kode_toko saja (bukan nama_toko)
    const payload = {
      kode_toko: kodeToko,
      kode_barang: kodeBarang,
      stok_barang: parseInt(stokBarang, 10),
      status_barang: numericStatus,
    };

    setLoading(true);
    try {
      const result = await insertMasterStokBarang(payload, token);
      setAlert({
        message: result.message || "Data berhasil disimpan.",
        type: "success",
        visible: true,
      });
      // Setelah sukses, redirect ke halaman master stok barang
      setTimeout(() => {
        navigate("/dashboard/master/menu/masterstokbarang");
      }, 2000);
    } catch (err) {
      console.error("Error inserting master stok barang:", err);
      setAlert({
        message: err.message || "Gagal menyimpan data.",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Master
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <Link to="/dashboard/master/menu/masterstokbarang" className="text-xs font-semibold text-blue-900">
              Master Stok Barang
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <Link to="/dashboard/master/menu/masterstokbarang/insert" className="text-xs font-semibold text-gray-400">
              Tambah Stok
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>
      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Stok Barang</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/masterstokbarang">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>
      {/* Form Insert Master Data Barang */}
      <div className="p-4 max-w-4xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-2">Detail Stok Barang</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            {/* Dropdown Nama Toko */}
            <div className="w-full md:w-1/2">
              <FilterSelect
                label="Nama Toko"
                options={tokoOptions}
                value={selectedToko}
                onChange={setSelectedToko}
              />
            </div>
            {/* Dropdown Kode Barang */}
            <div className="w-full md:w-1/2">
              <FilterSelect
                label="Nama Barang"
                options={barangOptions}
                value={selectedBarang}
                onChange={setSelectedBarang}
              />
            </div>
          </div>
          <div className="mb-4 flex gap-4">
            {/* Input Stok Barang */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Stok Barang
              </label>
              <input
                type="text"
                value={stokBarang}
                onChange={(e) => setStokBarang(e.target.value)}
                className="border border-gray-300 text-sm rounded-md p-2.5 w-full"
                placeholder="Masukkan stok barang"
              />
            </div>
            {/* Dropdown Status Barang */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Status Barang
              </label>
              <select
                value={statusBarang}
                onChange={(e) => setStatusBarang(e.target.value)}
                className="border border-gray-300 text-sm rounded-md p-2.5 w-full"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-blue-800 text-white p-2 text-sm rounded-md hover:bg-blue-950 transition duration-300"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
