import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMasterAkun, updateMasterAkun, getMasterToko } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterAkun() {
  // Ambil id_master_akun dari URL
  const { id_master_akun } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  // Ambil id_toko dari Redux
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_tokoRedux = parseInt(id_tokoString, 10);

  // State form untuk master akun; tambahkan field id_toko
  const [formData, setFormData] = useState({
    id_master_akun: "",
    nama_akun: "",
    kode_akun: "",
    status: 0, // 0 = Aktif, 1 = Non-Aktif
    id_toko: "", // Field untuk menyimpan id_toko
    created_by: "",
    created_at: "",
  });

  const [masterTokoList, setMasterTokoList] = useState([]); // Data toko
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Ambil data master akun dan filter berdasarkan id_master_akun
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const masterAkunData = await getMasterAkun(token);
        const dataRows = Array.isArray(masterAkunData)
          ? masterAkunData
          : Object.values(masterAkunData);
        const selected = dataRows.find(
          (item) => parseInt(item.id_master_akun, 10) === parseInt(id_master_akun, 10)
        );
        if (!selected) {
          throw new Error("Data master akun tidak ditemukan.");
        }
        // Populasi formData dengan data yang diambil, termasuk id_toko
        setFormData({
          id_master_akun: selected.id_master_akun,
          nama_akun: selected.nama_akun || "",
          kode_akun: selected.kode_akun || "",
          status: selected.status, // diharapkan berupa number (0 atau 1)
          id_toko: selected.id_toko || "",
          created_by: selected.created_by_user || "",
          created_at: selected.created_at || "",
        });
      } catch (err) {
        console.error("Error fetching master akun:", err);
        setError(err.message || "Gagal mengambil data master akun.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id_master_akun, token]);

  // Ambil data master toko untuk dropdown dan filter hanya toko yang sesuai dengan id_toko dari Redux
  useEffect(() => {
    const fetchToko = async () => {
      try {
        const tokoData = await getMasterToko(token);
        // Filter toko sehingga hanya yang memiliki id_toko sama dengan id_tokoRedux
        const filtered = Array.isArray(tokoData)
          ? tokoData.filter(
              (toko) => parseInt(toko.id_toko, 10) === id_tokoRedux
            )
          : [];
        setMasterTokoList(filtered);
      } catch (error) {
        console.error("Error fetching master toko:", error);
      }
    };
    fetchToko();
  }, [token, id_tokoRedux]);

  // Handler untuk perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Untuk field status dan id_toko, simpan sebagai number
    if (name === "status" || name === "id_toko") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fungsi format date untuk tampilan read-only
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

  // Handler submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id_master_akun, nama_akun, kode_akun, status, id_toko } = formData;
    if (!nama_akun || !kode_akun || (status === "" && status !== 0) || !id_toko) {
      setAlert({
        message: "Semua field yang dapat diubah harus diisi, termasuk Toko.",
        type: "error",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
      }, 3000);
      return;
    }
    setSubmitLoading(true);
    setAlert({ message: "", type: "", visible: false });
    try {
      // Payload mencakup field yang akan diupdate, termasuk id_toko
      const payload = {
        id_master_akun,
        nama_akun,
        kode_akun,
        id_toko,
        status,
      };
      const response = await updateMasterAkun(payload, token);
      console.log("Update Response:", response);
      if (response.success) {
        setAlert({
          message: "Master Akun berhasil diperbarui.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/basetroli/menu/masterakun");
        }, 2000);
      } else {
        setAlert({
          message: response.message || "Gagal memperbarui Master Akun.",
          type: "error",
          visible: true,
        });
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui Master Akun.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
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
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/basetroli" className="text-xs font-semibold text-blue-900">
            Master
          </Link>
          <div className="mx-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/basetroli/menu/masterakun" className="text-xs font-semibold text-blue-900">
            Master Akun
          </Link>
          <div className="mx-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">Update Akun</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Update Master Akun</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/akun">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Form Update Master Akun */}
      <div className="p-4 max-w-xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Akun</h2>
        <form onSubmit={handleSubmit}>
          {/* Nama Akun & Kode Akun */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="nama_akun" className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Akun
              </label>
              <input
                type="text"
                id="nama_akun"
                name="nama_akun"
                value={formData.nama_akun}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan nama akun"
                required
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="kode_akun" className="block text-sm font-semibold text-blue-800 mb-1">
                Kode Akun
              </label>
              <input
                type="text"
                id="kode_akun"
                name="kode_akun"
                value={formData.kode_akun}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan kode akun"
                required
              />
            </div>
          </div>

          {/* Dropdown Toko */}
          <div className="mb-4">
            <label htmlFor="id_toko" className="block text-sm font-semibold text-blue-800 mb-1">
              Toko
            </label>
            <select
              id="id_toko"
              name="id_toko"
              value={formData.id_toko}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-1"
              required
            >
              <option value="">Pilih Toko</option>
              {masterTokoList.map((toko) => (
                <option key={toko.id_toko} value={toko.id_toko}>
                  {toko.nama_toko}
                </option>
              ))}
            </select>
          </div>

          {/* Read-only DI BUAT OLEH & DI BUAT TANGGAL */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="created_by" className="block text-sm font-semibold text-blue-800 mb-1">
                DI BUAT OLEH
              </label>
              <input
                type="text"
                id="created_by"
                name="created_by"
                value={formData.created_by}
                disabled
                className="w-full border border-gray-300 rounded-md p-1 bg-gray-100"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="created_at" className="block text-sm font-semibold text-blue-800 mb-1">
                DI BUAT TANGGAL
              </label>
              <input
                type="text"
                id="created_at"
                name="created_at"
                value={formatDate(formData.created_at)}
                disabled
                className="w-full border border-gray-300 rounded-md p-1 bg-gray-100"
              />
            </div>
          </div>

          {/* Editable Status */}
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-semibold text-blue-800 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-1"
              required
            >
              <option value="">Pilih Status</option>
              <option value={0}>Aktif</option>
              <option value={1}>Non-Aktif</option>
            </select>
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 rounded-md hover:bg-blue-950 transition duration-300 ${submitLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={submitLoading}
            >
              {submitLoading ? <Loading /> : "Update Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
