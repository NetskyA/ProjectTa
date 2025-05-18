import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  getLaporanMasterKategori, 
  updateMasterKategori, 
  getLaporanMasterToko, 
  getLaporanMasterMarketPlace 
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

// Fungsi untuk parsing format "YYYY-MM-DD HH:MM:SS" (MySQL DATETIME)
// menjadi "YYYY-MM-DDTHH:MM" agar cocok dengan <input type="datetime-local" />.
const parseMySQLDatetimeToInput = (mysqlDateTime) => {
  if (!mysqlDateTime) return "";

  // Biasanya MySQL DATETIME => "YYYY-MM-DD HH:MM:SS"
  const [datePart, timePart = "00:00:00"] = mysqlDateTime.split(" ");
  if (!datePart) return "";

  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return "";

  // timePart => "HH:MM:SS"
  const [hours, minutes] = timePart.split(":");
  if (!hours || !minutes) return "";

  // Format final => "YYYY-MM-DDTHH:MM"
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function MenuUpdateMasterKategori() {
  const { id_kategori } = useParams();
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);
  
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);
  const navigate = useNavigate();

  // State form untuk update master kategori
  const [formData, setFormData] = useState({
    id_kategori: "",
    id_marketplace: "",
    id_toko: "",
    nama_kategori: "",
    biaya_admin: "",
    biaya_admin_fleksibel: "",       // ✅ Tambahan
    biaya_ongkir: "",
    biaya_ongkir_fleksibel: "",      // ✅ Tambahan
    periode_mulai: "",
    periode_akhir: "",
    status: 0, // 0: Aktif, 1: Non-Aktif
  });

  // State untuk menyimpan data awal (untuk mempertahankan nilai lama)
  const [initialData, setInitialData] = useState({});

  // State untuk dropdown list toko dan marketplace
  const [listToko, setListToko] = useState([]);
  const [listMarketplace, setListMarketplace] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data master kategori berdasarkan id_kategori saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getLaporanMasterKategori(token);
        const kategoriArray = Array.isArray(data) ? data : Object.values(data);

        // Temukan data kategori yang sesuai dengan id_kategori
        const kategori = kategoriArray.find(
          (item) => parseInt(item.id_kategori, 10) === parseInt(id_kategori, 10)
        );
        if (!kategori) {
          throw new Error("Data kategori tidak ditemukan.");
        }

        // Parsing datetime dari DB => format <input type="datetime-local" />
        const formattedPeriodeMulai = parseMySQLDatetimeToInput(kategori.periode_mulai);
        const formattedPeriodeAkhir = parseMySQLDatetimeToInput(kategori.periode_akhir);

        // Set formData dengan nilai yang sudah dikonversi
        setFormData({
          id_kategori: kategori.id_kategori,
          id_marketplace: kategori.id_marketplace,
          id_toko: kategori.id_toko,
          nama_kategori: kategori.nama_kategori,
          biaya_admin: kategori.biaya_admin,
          biaya_admin_fleksibel: kategori.biaya_admin_fleksibel || "",  // ✅ Tambahan
          biaya_ongkir: kategori.biaya_ongkir,
          biaya_ongkir_fleksibel: kategori.biaya_ongkir_fleksibel || "", // ✅ Tambahan
          periode_mulai: formattedPeriodeMulai,
          periode_akhir: formattedPeriodeAkhir,
          status: kategori.status,
        });

        // Simpan data awal untuk mempertahankan nilai lama
        setInitialData({
          periode_mulai: formattedPeriodeMulai,
          periode_akhir: formattedPeriodeAkhir,
        });
      } catch (err) {
        setError(err.message || "Gagal memuat data kategori.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_kategori, token]);

  // Ambil data list toko
  useEffect(() => {
    const fetchToko = async () => {
      try {
        const result = await getLaporanMasterToko(token);
        const tokoArray = Array.isArray(result) ? result : Object.values(result);
        // Filter toko berdasarkan id_toko
        const filteredToko = tokoArray.filter((item) => item.id_toko === id_toko);
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
        console.error("Error fetching master marketplace:", err);
      }
    };
    fetchMarketplace();
  }, [token]);

  // Handler perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? parseInt(value, 10) : value,
    }));
  };

  // Handler submit form update/insert
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Jika periode_mulai atau periode_akhir kosong, gunakan nilai awal dari API
    const periode_mulai_final =
      formData.periode_mulai.trim() === "" ? initialData.periode_mulai : formData.periode_mulai;
    const periode_akhir_final =
      formData.periode_akhir.trim() === "" ? initialData.periode_akhir : formData.periode_akhir;

    // Validasi: pastikan semua field wajib terisi
    if (
      !formData.id_marketplace ||
      !formData.id_toko ||
      !formData.nama_kategori ||
      formData.biaya_admin === "" ||
      formData.biaya_ongkir === "" ||
      formData.biaya_admin_fleksibel === "" ||       // ✅ Validasi tambahan
      formData.biaya_ongkir_fleksibel === "" ||        // ✅ Validasi tambahan
      formData.status === null
    ) {
      setAlert({
        message: "Semua field wajib diisi (kecuali periode jika tidak ingin diubah).",
        type: "error",
        visible: true,
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        id_kategori: formData.id_kategori,
        id_marketplace: parseInt(formData.id_marketplace, 10),
        id_toko: parseInt(formData.id_toko, 10),
        nama_kategori: formData.nama_kategori,
        biaya_admin: parseFloat(formData.biaya_admin),
        biaya_admin_fleksibel: parseFloat(formData.biaya_admin_fleksibel),   // ✅ Passing tambahan
        biaya_ongkir: parseFloat(formData.biaya_ongkir),
        biaya_ongkir_fleksibel: parseFloat(formData.biaya_ongkir_fleksibel), // ✅ Passing tambahan
        periode_mulai: periode_mulai_final,
        periode_akhir: periode_akhir_final,
        status: formData.status,
        id_user, // passing id_user dari auth
      };

      const response = await updateMasterKategori(payload, token);
      if (response.success) {
        setAlert({
          message: "Master Kategori berhasil diupdate.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          navigate("/dashboard/basetroli/menu/masterkategori");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui data kategori.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui data kategori.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handler untuk refresh halaman
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
          <Link to="/dashboard/adminkitchen" className="text-xs font-semibold text-blue-900">
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
          <Link to="/dashboard/basetroli/menu/masterkategori" className="text-xs font-semibold text-blue-900">
            Master Kategori
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
            to={`/dashboard/adminkitchen/menu/masterkategori/update/${id_kategori}`}
            className="text-xs font-semibold text-gray-400"
          >
            Update Kategori
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
        <p className="text-xl font-semibold text-blue-900">Update Master Kategori</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/basetroli/menu/masterkategori">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Kategori</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropdown Marketplace */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">Marketplace</label>
              <select
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                name="id_marketplace"
                value={formData.id_marketplace}
                onChange={handleChange}
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
                name="id_toko"
                value={formData.id_toko}
                onChange={handleChange}
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
              name="nama_kategori"
              value={formData.nama_kategori}
              onChange={handleChange}
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
                name="biaya_admin"
                step="0.01"
                value={formData.biaya_admin}
                onChange={handleChange}
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
                name="biaya_ongkir"
                step="0.01"
                value={formData.biaya_ongkir}
                onChange={handleChange}
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
                name="biaya_admin_fleksibel"
                step="0.01"
                value={formData.biaya_admin_fleksibel}
                onChange={handleChange}
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
                name="biaya_ongkir_fleksibel"
                step="0.01"
                value={formData.biaya_ongkir_fleksibel}
                onChange={handleChange}
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
                name="periode_mulai"
                value={formData.periode_mulai}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
              />
            </div>
            {/* Input Periode Akhir */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Periode Akhir
              </label>
              <input
                type="datetime-local"
                name="periode_akhir"
                value={formData.periode_akhir}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
              />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Status */}
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Status
              </label>
              <select
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
              {submitLoading ? "Loading..." : "Update Kategori"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
