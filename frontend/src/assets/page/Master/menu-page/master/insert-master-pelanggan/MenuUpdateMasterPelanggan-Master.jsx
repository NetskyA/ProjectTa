// FILE: MenuInsertMasterRole-Basetroli.jsx

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link, useParams } from "react-router-dom";
import { insertMasterPelangganExternal,getMasterPelanggan,updateMasterPelangganExternal  } from "../../../../../services/apiService"; // Pastikan fungsi API ini benar
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterRole() {
const [kodePelanggan, setKodePelanggan] = useState("");
const [nama_pelanggan, setNamaPelanggan] = useState("");
const [alamat, setAlamat] = useState("");


    const { id_master_pelanggan_external } = useParams();
  console.log("id_master_pelanggan_external", id_master_pelanggan_external);
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko); // Jika memang dibutuhkan di backend
  const navigate = useNavigate();

  // Field form
  const [nama_role, setNamaRole] = useState("");

  useEffect(() => {
  const fetchPelanggan = async () => {
    if (!id_master_pelanggan_external) return;

    try {
      setLoading(true);
      const result = await getMasterPelanggan(token);
      const dataArray = Array.isArray(result) ? result : Object.values(result);

      const pelanggan = dataArray.find(
        (item) =>
          String(item.id_master_pelanggan_external) === id_master_pelanggan_external
      );

if (pelanggan) {
  setNamaPelanggan(pelanggan.nama_pelanggan_external || "");
  setAlamat(pelanggan.alamat || "");
  setKodePelanggan(pelanggan.kode_pelanggan_external || "");
} else {
  setAlert({
    message: "Pelanggan tidak ditemukan.",
    type: "error",
    visible: true,
  });
}

    } catch (err) {
      setError(err.message || "Gagal mengambil data pelanggan.");
    } finally {
      setLoading(false);
    }
  };

  fetchPelanggan();
}, [id_master_pelanggan_external, token]);


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

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validasi input
  if (!nama_pelanggan || !alamat) {
    setAlert({
      message: "Nama dan Alamat pelanggan wajib diisi.",
      type: "error",
      visible: true,
    });
    return;
  }

  // Buat payload umum
  const payload = {
    nama_pelanggan,
    alamat,
  };

  // Tambahkan id untuk insert atau update sesuai kebutuhan
  if (id_master_pelanggan_external) {
    payload.id_master_pelanggan_external = parseInt(id_master_pelanggan_external);
  } else {
    payload.id_user = id_user; // hanya dibutuhkan saat insert
  }

  setLoading(true);
  try {
    let result;

    // Tentukan API mana yang dipanggil berdasarkan mode
    if (id_master_pelanggan_external) {
      result = await updateMasterPelangganExternal(token, payload);
    } else {
      result = await insertMasterPelangganExternal(token, payload);
    }

    // Tampilkan alert sukses
    setAlert({
      message: result.message || "Data berhasil disimpan.",
      type: "success",
      visible: true,
    });

    // Redirect setelah delay
    setTimeout(() => {
      navigate("/dashboard/master/menu/masterpelanggan");
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
          <Link to="/dashboard/master/menu/masterpelanggan" className="text-xs font-semibold text-blue-900">
            Master Pelanggan
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
          <Link to="/dashboard/master/menu/masterpelanggan/insert" className="text-xs font-semibold text-gray-400">
            Update Master Pelanggan
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
        <p className="text-xl font-semibold text-blue-900">Master Pelanggan</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/masterpelanggan">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>
      {/* Form Insert Master Pelanggan */}
      <div className="p-4 w-fit mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-2">Detail Pelanggan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2 flex gap-4">
            {/* Input Kode Pelanggan - dibiarkan kosong dan auto-generate oleh backend */}
            <div className="w-52">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Kode Pelanggan
              </label>
<input
  type="text"
  disabled
  value={kodePelanggan}
  className="mt-1 w-52 h-7 border text-xs uppercase border-gray-300 rounded p-1 bg-gray-200"
  placeholder="Auto Generate"
/>

            </div>
            {/* Input Nama Pelanggan */}
            <div className="w-52">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={nama_pelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="mt-1 h-7 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
                placeholder="Masukkan nama pelanggan"
              />
            </div>
          </div>
          <div className="mb-4 flex gap-4">
            {/* Input Kode Pelanggan - dibiarkan kosong dan auto-generate oleh backend */}
            <div className="w-52">
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Alamat Pelanggan
              </label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="border border-gray-300 min-h-[8rem] text-sm rounded-md p-2.5 w-full"
              placeholder="Masukkan alamat pelanggan"
            />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="w-20 bg-blue-800 text-white p-2 text-sm rounded-md hover:bg-blue-950 transition duration-300"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
