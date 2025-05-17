// FILE: MenuUpdateMasterSupplier-Master.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getLaporanMasterDepo,
  updateMasterDepo,
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterSupplierMaster() {
  const { id_depo } = useParams();
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  // State form untuk update master supplier (master_depo)
  const [formData, setFormData] = useState({
    id_depo: "",
    kode_depo: "",
    nama_depo: "",
    alamat_depo: "",
    status: 0, // 0: Aktif, 1: Non-Aktif
  });

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data master depo berdasarkan id_depo saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getLaporanMasterDepo(token);
        const depoArray = Array.isArray(data) ? data : Object.values(data);
        // Temukan data depo berdasarkan id_depo
        const depo = depoArray.find(
          (item) => parseInt(item.id_depo, 10) === parseInt(id_depo, 10)
        );
        if (!depo) {
          throw new Error("Data depo tidak ditemukan.");
        }
        setFormData({
          id_depo: depo.id_depo,
          kode_depo: depo.kode_depo,
          nama_depo: depo.nama_depo,
          alamat_depo: depo.alamat_depo,
          status: depo.status, // status: 0 = Aktif, 1 = Non-Aktif
        });
      } catch (err) {
        setError(err.message || "Gagal memuat data depo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_depo, token]);

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
      !formData.kode_depo ||
      !formData.nama_depo ||
      !formData.alamat_depo ||
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
        id_depo: formData.id_depo,
        kode_depo: formData.kode_depo,
        nama_depo: formData.nama_depo,
        alamat_depo: formData.alamat_depo,
        status: formData.status,
      };

      const response = await updateMasterDepo(payload, token);
      if (response.success) {
        setAlert({
          message: "Data depo berhasil diperbarui.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          navigate("/dashboard/master/menu/master/depo");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui data depo.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui data depo.",
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
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
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
          <Link
            to="/dashboard/master/menu/master/depo"
            className="text-xs font-semibold text-blue-900"
          >
            Master Supplier
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
            to={`/dashboard/master/menu/master/depo/update/${id_depo}`}
            className="text-xs font-semibold text-gray-400"
          >
            Update Supplier
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
          Update Master Supplier
        </p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/master/depo">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Supplier</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label
                htmlFor="kode_depo"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Kode Supplier
              </label>
              <input
                type="text"
                id="kode_depo"
                name="kode_depo"
                value={formData.kode_depo}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="nama_depo"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Nama Supplier
              </label>
              <input
                type="text"
                id="nama_depo"
                name="nama_depo"
                value={formData.nama_depo}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label
                htmlFor="alamat_depo"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Alamat Supplier
              </label>
              <input
                type="text"
                id="alamat_depo"
                name="alamat_depo"
                value={formData.alamat_depo}
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
              {submitLoading ? <Loading /> : "Update Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
