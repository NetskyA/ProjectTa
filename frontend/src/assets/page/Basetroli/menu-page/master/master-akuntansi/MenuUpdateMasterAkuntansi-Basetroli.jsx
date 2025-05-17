import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  getMasterAkuntansi, 
  updateMasterAkuntansi,
  getMasterToko,
  getMasterAkun // <-- pastikan ada fungsi ini di apiService
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuupdateMasterAkuntansi() {
  // Ambil id_master_akun_akuntansi dari URL
  const { id_master_akun_akuntansi } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);
  const kode_toko = useSelector((state) => state.auth.kode_toko);

  // State form
  const [formData, setFormData] = useState({
    id_master_akun_akuntansi: "",
    id_master_akun: "",      // <-- Akan dipilih dari dropdown "Tipe Akun"
    id_toko: "",             // <-- Akan dipilih dari dropdown "Toko"
    kode_akun_akuntansi: "",
    nama_akun_akuntansi: "",
    saldo_awal: "",
    deskripsi: "",
    status: 0,
    // Info read-only
    created_by_user: "",
    created_at: "",
  });

  // Data Toko: untuk dropdown Toko
  const [masterTokoOptions, setMasterTokoOptions] = useState([]);
  // Semua data Master Akun (termasuk id_toko) => agar bisa difilter
  const [allMasterAkun, setAllMasterAkun] = useState([]);
  // Dropdown Tipe Akun hasil filter
  const [masterAkunOptions, setMasterAkunOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // ================== Helper ==================
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

  // ================== Fetch Data Toko & Master Akun ==================
  useEffect(() => {
    const fetchTokoAndAkun = async () => {
      try {
        // 1) Ambil daftar Toko
        const tokoRes = await getMasterToko(token);
        // Asumsikan array of { id_toko, nama_toko, ... }
        const tokoData = Array.isArray(tokoRes) ? tokoRes : [];
        // Filter data Toko: hanya tampilkan toko dengan id_toko yang sama dengan nilai id_toko dari state
        const filteredToko = tokoData.filter(
          (toko) => parseInt(toko.id_toko, 10) === id_toko
        );
        setMasterTokoOptions(filteredToko);

        // 2) Ambil semua Master Akun
        const akunRes = await getMasterAkun(token);
        // Asumsikan array of { id_master_akun, nama_akun, id_toko, ... }
        const akunRows = Array.isArray(akunRes) ? akunRes : Object.values(akunRes);
        setAllMasterAkun(akunRows);
      } catch (err) {
        console.error("Error fetching data Toko/Akun:", err);
      }
    };
    fetchTokoAndAkun();
  }, [token, id_toko]);

  // ================== Fetch Data Detail Master Akuntansi ==================
  useEffect(() => {
    const fetchDataDetail = async () => {
      try {
        setLoading(true);
        const masterAkuntansiData = await getMasterAkuntansi(token);
        const dataRows = Array.isArray(masterAkuntansiData)
          ? masterAkuntansiData
          : Object.values(masterAkuntansiData);

        const selected = dataRows.find(
          (item) =>
            parseInt(item.id_master_akun_akuntansi, 10) ===
            parseInt(id_master_akun_akuntansi, 10)
        );
        if (!selected) {
          throw new Error("Data master akuntansi tidak ditemukan.");
        }

        // Isi formData
        setFormData({
          id_master_akun_akuntansi: selected.id_master_akun_akuntansi,
          id_master_akun: selected.id_master_akun || "",
          id_toko: selected.id_toko || "",
          kode_akun_akuntansi: selected.kode_akun_akuntansi || "",
          nama_akun_akuntansi: selected.nama_akun_akuntansi || "",
          saldo_awal: selected.saldo_awal,
          deskripsi: selected.deskripsi || "",
          status: selected.status,
          created_by_user: selected.created_by_user || "",
          created_at: selected.created_at || "",
        });
      } catch (err) {
        console.error("Error fetching master akuntansi:", err);
        setError(err.message || "Gagal mengambil data master akuntansi.");
      } finally {
        setLoading(false);
      }
    };
    fetchDataDetail();
  }, [id_master_akun_akuntansi, token]);

  // ================== Filter Tipe Akun by Toko ==================
  useEffect(() => {
    if (!formData.id_toko) {
      // Kalau belum ada id_toko, kosongkan dropdown Tipe Akun
      setMasterAkunOptions([]);
      // Optional: reset formData.id_master_akun => ""
      setFormData((prev) => ({ ...prev, id_master_akun: "" }));
    } else {
      // Filter allMasterAkun => hanya yang id_tokonya = formData.id_toko
      const filtered = allMasterAkun
        .filter((akun) => parseInt(akun.id_toko, 10) === parseInt(formData.id_toko, 10))
        .map((akun) => ({
          value: akun.id_master_akun,
          label: akun.nama_akun, // Nama dari master_akun
        }));
      setMasterAkunOptions(filtered);

      // Jika id_master_akun sekarang tidak ada di filtered, reset jadi ""
      const masihAda = filtered.find(
        (f) => parseInt(f.value, 10) === parseInt(formData.id_master_akun, 10)
      );
      if (!masihAda) {
        setFormData((prev) => ({ ...prev, id_master_akun: "" }));
      }
    }
  }, [formData.id_toko, allMasterAkun]);

  // ================== Handle Changes ==================
  const handleChange = (e) => {
    const { name, value } = e.target;
    // numeric fields
    if (name === "status" || name === "saldo_awal") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ================== Submit Update ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      id_master_akun_akuntansi,
      id_master_akun,
      id_toko,
      kode_akun_akuntansi,
      nama_akun_akuntansi,
      saldo_awal,
      deskripsi,
      status,
    } = formData;

    // Validasi sederhana
    if (
      !id_toko ||
      !id_master_akun ||
      !kode_akun_akuntansi ||
      !nama_akun_akuntansi ||
      saldo_awal === "" ||
      !deskripsi ||
      status === ""
    ) {
      setAlert({
        message: "Semua field wajib diisi (termasuk Pilih Toko dan Tipe Akun).",
        type: "error",
        visible: true,
      });
      setTimeout(() => setAlert({ message: "", type: "", visible: false }), 3000);
      return;
    }

    setSubmitLoading(true);
    try {
      // Kirim payload ke backend
      const payload = {
        id_master_akun_akuntansi,
        id_master_akun,
        id_toko,
        kode_akun_akuntansi,
        nama_akun_akuntansi,
        saldo_awal,
        deskripsi,
        status,
      };

      const response = await updateMasterAkuntansi(payload, token);
      console.log("Update Response:", response);
      if (response.success) {
        setAlert({
          message: "Master Akuntansi berhasil diperbarui.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/basetroli/menu/masterakuntansi");
        }, 2000);
      } else {
        setAlert({
          message: response.message || "Gagal memperbarui Master Akuntansi.",
          type: "error",
          visible: true,
        });
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui Master Akuntansi.",
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

      {/* Breadcrumb + Header */}
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
          <Link to="/dashboard/basetroli/menu/masterakuntansi" className="text-xs font-semibold text-blue-900">
            Master Akuntansi
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
          <span className="text-xs font-semibold text-gray-400">Update Akuntansi</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Update Master Akuntansi</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/basetroli/menu/masterakuntansi">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-sm text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Akuntansi</h2>
        <form onSubmit={handleSubmit}>
          {/* Toko Dropdown */}
          <div className="mb-4 flex gap-4">
            {/* Pilih Toko */}
            <div className="w-1/2">
              <label htmlFor="id_toko" className="block text-sm font-semibold text-blue-800 mb-1">
                Pilih Toko
              </label>
              <select
                id="id_toko"
                name="id_toko"
                value={formData.id_toko}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                required
              >
                {masterTokoOptions.map((toko) => (
                  <option key={toko.id_toko} value={toko.id_toko}>
                    {toko.nama_toko}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Tipe Akun */}
            <div className="w-1/2">
              <label htmlFor="id_master_akun" className="block text-sm font-semibold text-blue-800 mb-1">
                Tipe Akun
              </label>
              <select
                id="id_master_akun"
                name="id_master_akun"
                value={formData.id_master_akun}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                required
              >
                {masterAkunOptions.map((akun) => (
                  <option key={akun.value} value={akun.value}>
                    {akun.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Akuntansi & Kode Akuntansi */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="nama_akun_akuntansi" className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Akuntansi
              </label>
              <input
                type="text"
                id="nama_akun_akuntansi"
                name="nama_akun_akuntansi"
                value={formData.nama_akun_akuntansi}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan nama akuntansi"
                required
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="kode_akun_akuntansi" className="block text-sm font-semibold text-blue-800 mb-1">
                Kode Akuntansi
              </label>
              <input
                type="text"
                id="kode_akun_akuntansi"
                name="kode_akun_akuntansi"
                value={formData.kode_akun_akuntansi}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan kode akun"
                required
              />
            </div>
          </div>

          {/* Saldo Awal & Deskripsi */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="saldo_awal" className="block text-sm font-semibold text-blue-800 mb-1">
                Saldo Awal
              </label>
              <input
                type="text"
                id="saldo_awal"
                name="saldo_awal"
                value={formData.saldo_awal}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan saldo awal"
                required
                min="0"
              />
            </div>
          </div>
          <div className="w-full mb-2">
            <label htmlFor="deskripsi" className="block text-sm font-semibold text-blue-800 mb-1">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-1"
              placeholder="Masukkan deskripsi"
              required
              rows="2"
            ></textarea>
          </div>

          {/* DI BUAT OLEH & DI BUAT TANGGAL (read-only) */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="created_by_user" className="block text-sm font-semibold text-blue-800 mb-1">
                DI BUAT OLEH
              </label>
              <input
                type="text"
                id="created_by_user"
                name="created_by_user"
                value={formData.created_by_user}
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
                value={formData.created_at ? formatDate(formData.created_at) : ""}
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

          {/* Button Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 rounded-md hover:bg-blue-950 transition duration-300 ${
                submitLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitLoading}
            >
              {submitLoading ? <Loading /> : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}