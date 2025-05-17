// FILE: MenuUpdateMasterRole-Master.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getLaporanMasterRole,
  updateMasterRole,
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterRole() {
  const { id_role } = useParams();
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko); // Jika dibutuhkan
  const navigate = useNavigate();

  // State form untuk update master role
  const [formData, setFormData] = useState({
    id_role: "",
    kode_role: "",
    nama_role: "",
    status: 0, // 0 = Aktif, 1 = Non-Aktif
  });

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data role berdasarkan id_role saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Ambil semua data role
        const data = await getLaporanMasterRole(token);
        const roleArray = Array.isArray(data) ? data : Object.values(data);

        // Cari data role berdasarkan id_role
        const role = roleArray.find(
          (item) => parseInt(item.id_role, 10) === parseInt(id_role, 10)
        );

        if (!role) {
          throw new Error("Data role tidak ditemukan.");
        }

        // Set state formData sesuai data yang didapat
        setFormData({
          id_role: role.id_role,
          kode_role: role.kode_role,
          nama_role: role.nama_role,
          status: role.status, // 0 = Aktif, 1 = Non-Aktif
        });
      } catch (err) {
        setError(err.message || "Gagal memuat data role.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_role, token]);

  // Handler perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? parseInt(value, 10) : value,
    }));
  };

  // Handler submit form update
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: pastikan field terisi
    if (
      !formData.kode_role ||
      !formData.nama_role ||
      formData.status === null
    ) {
      setAlert({
        message: "Semua field (kode_role, nama_role, status) harus diisi.",
        type: "error",
        visible: true,
      });
      return;
    }

    setSubmitLoading(true);
    try {
      // Siapkan payload
      const payload = {
        id_role: formData.id_role,
        kode_role: formData.kode_role,
        nama_role: formData.nama_role,
        status: formData.status,
        id_user, // passing id_user
        id_toko, // passing id_toko jika dibutuhkan
      };

      const response = await updateMasterRole(payload, token);
      if (response.success) {
        setAlert({
          message: "Master Role berhasil diupdate.",
          type: "success",
          visible: true,
        });
        // Setelah sukses, redirect ke halaman master role
        setTimeout(() => {
          navigate("/dashboard/master/menu/master/role");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui data role.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui data role.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handler untuk refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
            Master
          </Link>
          <div className="mx-2">
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
          <Link to="/dashboard/master/menu/master/role" className="text-xs font-semibold text-blue-900">
            Master Akses
          </Link>
          <div className="mx-2">
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
            to={`/dashboard/master/menu/master/role/update/${id_role}`}
            className="text-xs font-semibold text-gray-400"
          >
            Update Akses
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-sm rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Update Master Akses</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/master/role">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Akses</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label
                htmlFor="kode_role"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Kode Akses
              </label>
              <input
                type="text"
                id="kode_role"
                name="kode_role"
                value={formData.kode_role}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="nama_role"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Nama Akses
              </label>
              <input
                type="text"
                id="nama_role"
                name="nama_role"
                value={formData.nama_role}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
          </div>
          <div className="mb-4 flex gap-4">
            {/* Tidak ada 'alamat' di Master Role, jadi boleh dihapus atau diganti field lain jika diperlukan */}
            <div className="w-1/2">
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              >
                <option value="">Pilih Status</option>
                <option value={0}>Aktif</option>
                <option value={1}>Non-Aktif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 text-sm rounded-md hover:bg-blue-950 transition duration-300 ${
                submitLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitLoading}
            >
              {submitLoading ? "Loading..." : "Update Akses"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
