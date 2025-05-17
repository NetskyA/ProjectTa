// FILE: MenuInsertMasterStokBarang-Basetroli.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { insertMasterDepo } from "../../../../../services/apiService";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterSupplier() {
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);
  const navigate = useNavigate();

  // Field form
  const [nama_depo, setNamaDepo] = useState("");
  const [alamat_depo, setAlamatDepo] = useState("");

  // State untuk loading, error, dan alert
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

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
    if (!nama_depo || !alamat_depo) {
      setAlert({
        message: "Semua field harus diisi.",
        type: "error",
        visible: true,
      });
      return;
    }

    // Siapkan payload, kode_depo dibiarkan kosong karena backend yang menangani generate
    const payload = {
      kode_depo: "", // akan di-generate oleh backend dengan format DP-XXXX
      nama_depo,
      alamat_depo,
      id_toko, // passing id_toko dari auth
      id_user, // passing id_user sebagai p_createBy
    };

    setLoading(true);
    try {
      const result = await insertMasterDepo(payload, token);
      setAlert({
        message: result.message || "Data berhasil disimpan.",
        type: "success",
        visible: true,
      });
      // Setelah sukses, redirect ke halaman master supplier
      setTimeout(() => {
        navigate("/dashboard/master/menu/master/depo");
      }, 2000);
    } catch (err) {
      console.error("Error inserting master supplier:", err);
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
          <Link to="/dashboard/master/menu/master/depo" className="text-xs font-semibold text-blue-900">
            Master Supplier
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
          <Link to="/dashboard/master/menu/master/depo/insert" className="text-xs font-semibold text-gray-400">
            Tambah Supplier
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
        <p className="text-xl font-semibold text-blue-900">Master Supplier</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/master/depo">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>
      {/* Form Insert Master Supplier */}
      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-2">Detail Supplier</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            {/* Input Kode Supplier - dibiarkan kosong dan auto-generate oleh backend */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Kode Supplier
              </label>
              <input
                type="text"
                value={""}
                disabled
                className="border border-gray-300 text-sm rounded-md p-2.5 w-full bg-gray-100"
                placeholder="Auto Generate"
              />
            </div>
            {/* Input Nama Supplier */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Supplier
              </label>
              <input
                type="text"
                value={nama_depo}
                onChange={(e) => setNamaDepo(e.target.value)}
                className="border border-gray-300 text-sm rounded-md p-2.5 w-full"
                placeholder="Masukkan nama supplier"
              />
            </div>
          </div>
          <div className="mb-4">
            {/* Input Alamat Supplier */}
            <label className="block text-sm font-semibold text-blue-800 mb-1">
              Alamat Supplier
            </label>
            <input
              type="text"
              value={alamat_depo}
              onChange={(e) => setAlamatDepo(e.target.value)}
              className="border border-gray-300 text-sm rounded-md p-2.5 w-full"
              placeholder="Masukkan alamat supplier"
            />
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
