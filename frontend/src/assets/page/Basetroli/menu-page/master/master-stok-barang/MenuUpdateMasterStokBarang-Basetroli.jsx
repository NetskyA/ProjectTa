import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
// Perbarui import: gunakan getMasterTokoOnlyMaster
import {
  getLaporanStokBarangAll,
  getMasterTokoOnlyMaster, // ganti di sini
  updateMasterStokBarang,
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterStokBarangMaster() {
  // Ambil id_stokbarang dari URL
  const { idstokbarang } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);

  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);

  // State form untuk update stok barang
  // Perubahan: hilangkan stok_tambahan, update langsung nilai stok_sebelumnya
  const [formData, setFormData] = useState({
    id_stokbarang: "",
    kode_toko: "",
    kode_barang: "",
    stok_sebelumnya: 0,
    status_barang: 1,
  });

  const [masterToko, setMasterToko] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data stok dan data toko saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ambil data stok barang tanpa filter id_toko
        const stokData = await getLaporanStokBarangAll(token);
        const stokArray = Array.isArray(stokData)
          ? stokData
          : Object.values(stokData);
        console.log("Stok Data:", stokArray);

        // Temukan stok berdasarkan idstokbarang
        const stok = stokArray.find(
          (item) => parseInt(item.id_stokbarang, 10) === parseInt(idstokbarang, 10)
        );
        if (!stok) {
          throw new Error("Data stok barang tidak ditemukan.");
        }

        // Ambil data toko tanpa filter id_toko
        const tokoData = await getMasterTokoOnlyMaster(token);
        const tokoArray = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        console.log("Toko Data:", tokoArray);
        // Filter hanya toko dengan id_toko yang sama dengan nilai id_toko dari auth
        const filteredToko = tokoArray.filter(
          (toko) => parseInt(toko.id_toko, 10) === id_toko
        );
        setMasterToko(filteredToko || []);

        // Set form data, misalnya kode_barang ditampilkan dengan format "kode_barang - namabarang"
        setFormData({
          id_stokbarang: stok.id_stokbarang || "",
          kode_toko: stok.kode_toko || "",
          kode_barang: `${stok.kode_barang || ""} - ${stok.namabarang || ""}`,
          stok_sebelumnya: stok.stok_barang ?? 0,
          status_barang: stok.status_barang ?? 1,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal memuat data stok barang.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idstokbarang, token, id_toko]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Karena sekarang stok_sebelumnya bisa diubah langsung, parsing nilainya
    if (name === "stok_sebelumnya" || name === "status_barang") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit untuk update stok
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { id_stokbarang, kode_toko, kode_barang, stok_sebelumnya, status_barang } = formData;

    // Validasi sederhana
    if (
      !id_stokbarang ||
      !kode_toko ||
      !kode_barang ||
      stok_sebelumnya === null ||
      status_barang === ""
    ) {
      setAlert({
        message: "Semua field harus diisi.",
        type: "error",
        visible: true,
      });
      setTimeout(() => setAlert({ message: "", type: "", visible: false }), 3000);
      return;
    }

    setSubmitLoading(true);
    setAlert({ message: "", type: "", visible: false });

    try {
      // Ekstrak kode_barang murni (tanpa " - namabarang")
      const pureKodeBarang = kode_barang.includes(" - ")
        ? kode_barang.split(" - ")[0]
        : kode_barang;

      const payload = {
        id_stokbarang,
        kode_toko,
        kode_barang: pureKodeBarang,
        // Perubahan: langsung gunakan stok_sebelumnya sebagai nilai final
        stok_barang: parseInt(stok_sebelumnya, 10),
        status_barang,
      };

      const response = await updateMasterStokBarang(payload, token);
      console.log("Update Response:", response);

      if (response.success) {
        setAlert({
          message: "Data Stok Barang berhasil diperbarui.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/basetroli/menu/masterstokbarang");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui Stok Barang.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui Stok Barang.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Refresh (tanpa filter id_toko)
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    const fetchData = async () => {
      try {
        setLoading(true);
        const stokData = await getLaporanStokBarangAll(token);
        const stokArray = Array.isArray(stokData)
          ? stokData
          : Object.values(stokData);
        console.log("Stok Data (Refresh):", stokArray);
        const stok = stokArray.find(
          (item) => parseInt(item.id_stokbarang, 10) === parseInt(idstokbarang, 10)
        );
        if (!stok) {
          throw new Error("Data stok barang tidak ditemukan.");
        }
        const tokoData = await getMasterTokoOnlyMaster(token);
        const tokoArray = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        console.log("Toko Data (Refresh):", tokoArray);
        // Filter hanya toko dengan id_toko yang sama
        const filteredToko = tokoArray.filter(
          (toko) => parseInt(toko.id_toko, 10) === id_toko
        );
        setMasterToko(filteredToko || []);
        setFormData({
          id_stokbarang: stok.id_stokbarang || "",
          kode_toko: stok.kode_toko || "",
          kode_barang: `${stok.kode_barang || ""} - ${stok.namabarang || ""}`,
          stok_sebelumnya: stok.stok_barang ?? 0,
          status_barang: stok.status_barang ?? 1,
        });
      } catch (err) {
        console.error("Error refreshing data:", err);
        setError(err.message || "Gagal refresh data stok barang.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500 mx-auto items-center stroke-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/basetroli/menu/masterstokbarang" className="text-xs font-semibold text-blue-900">
            Master Stok Barang
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500 mx-auto items-center stroke-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to={`/dashboard/basetroli/menu/masterstokbarang/update/${idstokbarang}`} className="text-xs font-semibold text-gray-400">
            Update Stok
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
        <p className="text-xl font-semibold text-blue-900">Update Stok Barang</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/basetroli/menu/masterstokbarang">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-3xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Stok Barang</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="flex-1 mb-4">
              <label htmlFor="kode_toko" className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Toko
              </label>
              <select
                id="kode_toko"
                name="kode_toko"
                value={formData.kode_toko}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              >
                {masterToko.map((toko) => (
                  <option key={toko.id_toko} value={toko.kode_toko}>
                    {`${toko.kode_toko} - ${toko.nama_toko}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 mb-4">
              <label htmlFor="kode_barang" className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Barang
              </label>
              <input
                type="text"
                id="kode_barang"
                name="kode_barang"
                value={formData.kode_barang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                placeholder="Masukkan kode barang"
                required
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="flex-1 mb-4">
              <label htmlFor="stok_sebelumnya" className="block text-sm font-semibold text-blue-800 mb-1">
                Stok Barang (PCS)
              </label>
              <input
                type="number"
                id="stok_sebelumnya"
                name="stok_sebelumnya"
                value={formData.stok_sebelumnya}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                placeholder="Masukkan stok barang"
                required
                min="0"
              />
            </div>
            <div className="flex-1 mb-4">
              <label htmlFor="status_barang" className="block text-sm font-semibold text-blue-800 mb-1">
                Status Barang
              </label>
              <select
                id="status_barang"
                name="status_barang"
                value={formData.status_barang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              >
                <option value={1}>Aktif</option>
                <option value={0}>Non-Aktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 text-sm rounded-md hover:bg-blue-950 transition duration-300 ${submitLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={submitLoading}
            >
              {submitLoading ? <Loading /> : "Update Stok"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
