import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { insertMasterAkun, getMasterToko } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterAkunMaster() {
  // State form, hanya field yang diperlukan untuk master akun
  const [formData, setFormData] = useState({
    nama_akun: "",
    kode_akun: "",
    status: 0, // 0 = Aktif, 1 = Non-Aktif
    id_toko: "", 
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const [masterTokoList, setMasterTokoList] = useState([]); // Daftar toko

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Ambil token, id_user, dan id_toko dari Redux
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);

  // Fungsi format date untuk tampilan read-only "DI BUAT TANGGAL"
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

  // Ambil data toko dari backend dan filter hanya yang sesuai dengan id_toko dari Redux
  useEffect(() => {
    const fetchMasterToko = async () => {
      try {
        const dataToko = await getMasterToko(token);
        console.log("Data Toko:", dataToko);

        // Filter dataToko sehingga hanya toko dengan id_toko sama dengan id_toko (dari Redux)
        const filtered = Array.isArray(dataToko)
          ? dataToko.filter((toko) => parseInt(toko.id_toko, 10) === id_toko)
          : [];
        setMasterTokoList(filtered);
      } catch (error) {
        console.error("Error fetching Master Toko:", error);
      }
    };
    fetchMasterToko();
  }, [token, id_toko]);

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Untuk field status & id_toko, convert ke number
    if (name === "status" || name === "id_toko") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nama_akun, kode_akun, status, id_toko } = formData;

    // Validasi sederhana
    if (!nama_akun || !kode_akun || status === "" || !id_toko) {
      setAlert({
        message: "Semua field harus diisi.",
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
      // Buat payload dengan field tambahan created_by, created_at, dan id_toko
      const payload = {
        nama_akun,
        kode_akun,
        created_by: id_user,
        created_at: new Date().toISOString(),
        status,
        id_toko,
      };

      const response = await insertMasterAkun(payload, token);
      console.log("Insert Response:", response);

      if (response.success) {
        setAlert({
          message: "Master Akun berhasil ditambahkan.",
          type: "success",
          visible: true,
        });
        // Reset form
        setFormData({
          nama_akun: "",
          kode_akun: "",
          status: 0,
          id_toko: "",
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/basetroli/menu/masterakun");
        }, 2000);
      } else {
        setAlert({
          message: response.message || "Gagal menambahkan Master Akun.",
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      setAlert({
        message: error.message || "Gagal menambahkan Master Akun.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

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
          <span className="text-xs font-semibold text-gray-400">Tambah Akun</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Tambah Master Akun</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/akun">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Form Insert Master Akun */}
      <div className="p-4 max-w-xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Akun</h2>
        <form onSubmit={handleSubmit}>
          {/* Nama Akun & Kode Akun (sejajar) */}
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

          {/* DI BUAT TANGGAL & Status */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="created_at" className="block text-sm font-semibold text-blue-800 mb-1">
                DI BUAT TANGGAL
              </label>
              <input
                type="text"
                id="created_at"
                name="created_at"
                value={formatDate(new Date().toISOString())}
                disabled
                className="w-full border border-gray-300 rounded-md p-1 bg-gray-100"
              />
            </div>
            <div className="w-1/2">
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
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 rounded-md hover:bg-blue-950 transition duration-300 ${submitLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={submitLoading}
            >
              {submitLoading ? <Loading /> : "Tambah Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
