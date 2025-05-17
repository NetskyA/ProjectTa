// FILE: MenuUpdateMasterGudang-Master.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMasterGudang, updateMasterGudang } from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterGudangMaster() {
  const { id_gudang } = useParams();
  const token = useSelector((state) => state.auth.token);
  const id_toko = useSelector((state) => state.auth.id_toko);
  const id_user = useSelector((state) => state.auth.id_user);
  const navigate = useNavigate();

  // State form untuk update master gudang
  const [formData, setFormData] = useState({
    id_gudang: "",
    kode_gudang: "",
    nama_gudang: "",
    alamat: "",
    status: 0, // 0: Aktif, 1: Non-Aktif
  });

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data master gudang berdasarkan id_gudang saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMasterGudang(token);
        const gudangArray = Array.isArray(data) ? data : Object.values(data);
        // Temukan data gudang berdasarkan id_gudang
        const gudang = gudangArray.find(
          (item) => parseInt(item.id_gudang, 10) === parseInt(id_gudang, 10)
        );
        if (!gudang) {
          throw new Error("Data gudang tidak ditemukan.");
        }
        setFormData({
          id_gudang: gudang.id_gudang,
          kode_gudang: gudang.kode_gudang,
          nama_gudang: gudang.nama_gudang,
          alamat: gudang.alamat,
          status: gudang.status, // 0 = Aktif, 1 = Non-Aktif
        });
      } catch (err) {
        setError(err.message || "Gagal memuat data gudang.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_gudang, token]);

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

    // Validasi: pastikan semua field terisi
    if (
      !formData.kode_gudang ||
      !formData.nama_gudang ||
      !formData.alamat ||
      formData.status === null
    ) {
      setAlert({
        message: "Semua field harus diisi.",
        type: "error",
        visible: true,
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        id_gudang: formData.id_gudang,
        kode_gudang: formData.kode_gudang,
        nama_gudang: formData.nama_gudang,
        alamat: formData.alamat,
        status: formData.status,
        id_toko, // passing id_toko
        id_user, // passing id_user
      };

      const response = await updateMasterGudang(payload, token);
      if (response.success) {
        setAlert({
          message: "Master Gudang berhasil diupdate.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          navigate("/dashboard/master/menu/master/gudang");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui data gudang.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui data gudang.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

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
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/master/menu/master/gudang" className="text-xs font-semibold text-blue-900">
            Master Gudang
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
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link
            to={`/dashboard/master/menu/master/gudang/update/${id_gudang}`}
            className="text-xs font-semibold text-gray-400"
          >
            Update Gudang
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
        <p className="text-xl font-semibold text-blue-900">
          Update Master Gudang
        </p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/master/gudang">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Gudang</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label
                htmlFor="kode_gudang"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Kode Gudang
              </label>
              <input
                type="text"
                id="kode_gudang"
                name="kode_gudang"
                value={formData.kode_gudang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="nama_gudang"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Nama Gudang
              </label>
              <input
                type="text"
                id="nama_gudang"
                name="nama_gudang"
                value={formData.nama_gudang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label
                htmlFor="alamat"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Alamat Gudang
              </label>
              <input
                type="text"
                id="alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
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
              {submitLoading ? <Loading /> : "Update Gudang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
