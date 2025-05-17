// FILE: MenuInsertMasterSatuan-Basetroli.jsx

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  insertMasterSatuan,
  getInsertMasterBahanBakuProduk,
  getMasterLokasiKitchen,
  getMasterKategoriBahanBaku,
  getLaporanMasterSatuan,
} from "../../../../../services/apiService"; // Pastikan fungsi API ini benar
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterSatuan() {
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko); // Jika memang dibutuhkan di backend
  const navigate = useNavigate();

  // Field form
  const [nama_satuan, setNamaSatuan] = useState("");
  const [id_satuan_kategori, setIdSatuanKategori] = useState(""); // state untuk menyimpan id kategori

  // State untuk dropdown kategori
  const [kategoriOptions, setKategoriOptions] = useState([]);

  // State untuk loading, error, dan alert
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [satuanOptions, setSatuanOptions] = useState([]);

  const [id_lokasi, setIdLokasi] = useState("");
  const [id_kategori_bahan_baku, setIdKategoriBahanBaku] = useState("");
  const [id_satuan, setIdSatuan] = useState("");

useEffect(() => {
  const fetchData = async () => {
    try {
      const lokasiData = await getMasterLokasiKitchen();
      const kategoriData = await getMasterKategoriBahanBaku();
      const satuanData = await getLaporanMasterSatuan();

      // Pastikan semua data adalah array
      setLokasiOptions(Array.isArray(lokasiData) ? lokasiData : Object.values(lokasiData || {}));
      setKategoriOptions(Array.isArray(kategoriData) ? kategoriData : Object.values(kategoriData || {}));
      setSatuanOptions(Array.isArray(satuanData) ? satuanData : Object.values(satuanData || {}));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Gagal memuat data dropdown. Pastikan API merespons dengan benar.");
    }
  };

  fetchData();
}, []);


  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validasi input
  if (!id_lokasi || !id_kategori_bahan_baku || !id_satuan || !nama_satuan) {
    setAlert({
      message: "Semua field wajib diisi.",
      type: "warning",
      visible: true,
    });
    setTimeout(() => {
      setAlert({ ...alert, visible: false });
    }, 2000);
    return;
  }

  const payload = {
    id_user,
    id_lokasi,
    id_kategori_bahan_baku,
    nama_bahan_baku: nama_satuan,
    stok_bahan_baku: 0, // default
    id_satuan,
    harga_beli_barang: 0, // default
  };

  setLoading(true);
  try {
    const result = await getInsertMasterBahanBakuProduk(token, payload);
    setAlert({
      message: result.message || "Data berhasil disimpan.",
      type: "success",
      visible: true,
    });
    setTimeout(() => {
      navigate("/dashboard/master/menu/masterbahanbaku");
    }, 2000);
  } catch (err) {
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
          <Link
            to="/dashboard/master/menu/masterbahanbaku"
            className="text-xs font-semibold text-blue-900"
          >
            Master Bahan Baku
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
          <Link
            to="/dashboard/master/menu/masterbahanbaku/insert"
            className="text-xs font-semibold text-gray-400"
          >
            Tambah Bahan Baku
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
        <p className="text-xl font-semibold text-blue-900">Master Bahan Baku</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/masterbahanbaku">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>
      {/* Form Insert Master Bahan Baku */}
      <div className="p-2 bg-white rounded-md shadow-md border border-gray-300 overflow-x-auto w-fit">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-1.5">
            <fieldset className="w-fit border border-blue-400 rounded-md p-2 shadow-sm">
              <legend className="text-sm font-bold text-blue-900">
                Info Bahan Baku
              </legend>

              <div className="flex text-xs gap-2">
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Kode Bahan Baku:
                  </label>
                  <input
                    type="text"
                    id="kodebarang"
                    name="kodebarang"
                    disabled
                    className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 bg-gray-200"
                    placeholder="Auto Generate"
                  />
                </div>
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Lokasi Bahan Baku:
                  </label>
                  <select
                    value={id_lokasi}
                    onChange={(e) => setIdLokasi(e.target.value)}
                    className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 bg-gray-50"
                  >
                    <option value="">Pilih Lokasi</option>
                    {lokasiOptions.map((lokasi) => (
                      <option key={lokasi.id_lokasi} value={lokasi.id_lokasi}>
                        {lokasi.nama_lokasi}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Kategori Bahan Baku:
                  </label>
                  <select
                    value={id_kategori_bahan_baku}
                    onChange={(e) => setIdKategoriBahanBaku(e.target.value)}
                    className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 bg-gray-50"
                  >
                    <option value="">Pilih Kategori</option>
                    {kategoriOptions.map((kategori) => (
                      <option
                        key={kategori.id_kategori_bahan_baku}
                        value={kategori.id_kategori_bahan_baku}
                      >
                        {kategori.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex text-xs gap-2 mt-2">
                
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Nama Bahan Baku:
                  </label>
<input
  type="text"
  id="namabarang"
  name="namabarang"
  className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 bg-gray-50"
  placeholder="Nama Bahan Baku"
  value={nama_satuan}
  onChange={(e) => setNamaSatuan(e.target.value)}
/>

                </div>
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Satuan Bahan Baku:
                  </label>
                  <select
                    value={id_satuan}
                    onChange={(e) => setIdSatuan(e.target.value)}
                    className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 bg-gray-50"
                  >
                    <option value="">Pilih Satuan</option>
                    {satuanOptions.map((satuan) => (
                      <option key={satuan.id_satuan} value={satuan.id_satuan}>
                        {satuan.nama_satuan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
                <div className="mt-1" style={{ fontSize: "9px" }}>
                  <p className="block italic text-red-500">
                    *Gunakan satuan Gr untuk setiap bahan baku yang berbentuk
                  </p>
                </div>
            </fieldset>
          </div>
          <div className="flex justify-end text-xs mt-4">
            <button
              type="submit"
              className="bg-blue-800 text-white h-8 w-20 p-2 rounded-md hover:bg-blue-950 transition duration-300"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
