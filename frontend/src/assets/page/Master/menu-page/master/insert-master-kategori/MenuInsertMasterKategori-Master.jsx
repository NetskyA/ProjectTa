import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  insertMasterKategori,
  getLaporanMasterToko,
  getLaporanMasterMarketPlace,
} from "../../../../../services/apiService"; // pastikan path dan endpoint-nya benar
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterKategori() {
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);

  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);
  const navigate = useNavigate();

  // Field form
  const [id_marketplace, setIdMarketplace] = useState("");
  const [nama_kategori, setNamaKategori] = useState("");
  const [biaya_admin, setBiayaAdmin] = useState("");
  const [biaya_ongkir, setBiayaOngkir] = useState("");
  const [biaya_admin_fleksibel, setBiayaAdminFleksibel] = useState("");
  const [biaya_ongkir_fleksibel, setBiayaOngkirFleksibel] = useState("");
  const [periode_mulai, setPeriodeMulai] = useState("");
  const [periode_akhir, setPeriodeAkhir] = useState("");

  // List dropdown
  const [listToko, setListToko] = useState([]);
  const [listMarketplace, setListMarketplace] = useState([]);

  // State untuk loading, error, dan alert
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Ambil data list toko
  useEffect(() => {
    const fetchToko = async () => {
      try {
        const result = await getLaporanMasterToko(token);
        const tokoArray = Array.isArray(result) ? result : Object.values(result);
        // Tampilkan semua list toko, kecuali yang memiliki id_toko = 1
        const filteredToko = tokoArray.filter((item) => item.id_toko !== 1);
        setListToko(filteredToko);
      } catch (err) {
        console.error("Error fetching master toko:", err);
      }
    };
    fetchToko();
  }, [token, id_toko]);

  // Ambil data list marketplace
  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const result = await getLaporanMasterMarketPlace(token);
        const marketArray = Array.isArray(result) ? result : Object.values(result);
        setListMarketplace(marketArray);
      } catch (err) {
        console.error("Error fetching basetroli marketplace:", err);
      }
    };
    fetchMarketplace();
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
    if (
      !id_marketplace ||
      !id_toko ||
      !nama_kategori ||
      biaya_admin === "" ||
      biaya_ongkir === "" ||
      biaya_admin_fleksibel === "" ||
      biaya_ongkir_fleksibel === "" ||
      !periode_mulai ||
      !periode_akhir
    ) {
      setAlert({
        message: "Semua field harus diisi.",
        type: "error",
        visible: true,
      });
      return;
    }

    // Siapkan payload; biaya_admin dan biaya_ongkir dikonversi ke float
    const payload = {
      id_marketplace: parseInt(id_marketplace, 10),
      id_toko: parseInt(id_toko, 10),
      nama_kategori,
      biaya_admin: parseFloat(biaya_admin),
      biaya_ongkir: parseFloat(biaya_ongkir),
      biaya_admin_fleksibel: parseFloat(biaya_admin_fleksibel),
      biaya_ongkir_fleksibel: parseFloat(biaya_ongkir_fleksibel),
      periode_mulai,
      periode_akhir,
      id_user, // p_createBy
    };

    setLoading(true);
    try {
      const result = await insertMasterKategori(payload, token);
      setAlert({
        message: result.message || "Data berhasil disimpan.",
        type: "success",
        visible: true,
      });
      // Setelah sukses, redirect ke halaman basetroli kategori
      setTimeout(() => {
        navigate("/dashboard/basetroli/menu/masterkategori");
      }, 2000);
    } catch (err) {
      console.error("Error inserting basetroli kategori:", err);
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
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
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
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link
            to="/dashboard/master/menu/master/kategori"
            className="text-xs font-semibold text-blue-900"
          >
            Master Kategori
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
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link
            to="/dashboard/master/menu/master/kategori/insert"
            className="text-xs font-semibold text-gray-400"
          >
            Tambah Kategori
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
        <p className="text-xl font-semibold text-blue-900">Master Kategori</p>
        <Link to="/dashboard/master/menu/master/kategori">
          <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
            <p className="p-2">Back</p>
          </button>
        </Link>
      </div>
      {/* Form Insert Master Kategori */}
      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Kategori</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropdown Marketplace */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">Marketplace</label>
              <select
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                value={id_marketplace}
                onChange={(e) => setIdMarketplace(e.target.value)}
                required
              >
                <option value="">Pilih Marketplace</option>
                {listMarketplace.map((item) => (
                  <option key={item.id_marketplace} value={item.id_marketplace}>
                    {item.nama_marketplace}
                  </option>
                ))}
              </select>
            </div>
            {/* Dropdown Toko */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">Toko</label>
              <select
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                value={id_toko}
                onChange={(e) => setIdMarketplace(e.target.value)}
                required
              >
                <option value="">Pilih Toko</option>
                {listToko.map((item) => (
                  <option key={item.id_toko} value={item.id_toko}>
                    {item.nama_toko}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            {/* Input Nama Kategori */}
            <label className="block text-sm font-semibold text-blue-800 mb-1">
              Nama Kategori
            </label>
            <input
              type="text"
              value={nama_kategori}
              onChange={(e) => setNamaKategori(e.target.value)}
              className="w-full border border-gray-300 text-sm rounded-md p-2"
              placeholder="Masukkan nama kategori"
              required
            />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Biaya Admin */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Biaya Admin Default
              </label>
              <input
                type="text"
                step="0.01"
                value={biaya_admin}
                onChange={(e) => setBiayaAdmin(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                placeholder="Masukkan biaya admin"
                required
              />
            </div>
            {/* Input Biaya Ongkir */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Biaya Ongkir Default
              </label>
              <input
                type="text"
                step="0.01"
                value={biaya_ongkir}
                onChange={(e) => setBiayaOngkir(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                placeholder="Masukkan biaya ongkir"
                required
              />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Biaya Admin Fleksibel */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Biaya Admin Fleksibel
              </label>
              <input
                type="text"
                step="0.01"
                value={biaya_admin_fleksibel}
                onChange={(e) => setBiayaAdminFleksibel(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                placeholder="Masukkan biaya admin fleksibel"
                required
              />
            </div>
            {/* Input Biaya Ongkir Fleksibel */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Biaya Ongkir Fleksibel
              </label>
              <input
                type="text"
                step="0.01"
                value={biaya_ongkir_fleksibel}
                onChange={(e) => setBiayaOngkirFleksibel(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                placeholder="Masukkan biaya ongkir fleksibel"
                required
              />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Periode Mulai */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Periode Mulai
              </label>
              <input
                type="datetime-local"
                value={periode_mulai}
                onChange={(e) => setPeriodeMulai(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
            {/* Input Periode Akhir */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Periode Akhir
              </label>
              <input
                type="datetime-local"
                value={periode_akhir}
                onChange={(e) => setPeriodeAkhir(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
                min={periode_mulai || ""}
              />
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
