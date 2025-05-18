import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getLaporanMasterSatuan, updateMasterSatuan, getLaporanMasterSatuanKategori } from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterSatuan() {
  const { id_satuan } = useParams();
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);
  const navigate = useNavigate();

  // State form untuk update master satuan (tambahkan id_satuan_kategori)
  const [formData, setFormData] = useState({
    id_satuan: "",
    kode_satuan: "",
    nama_satuan: "",
    status: 0,
    id_satuan_kategori: "",
  });

  // State untuk dropdown kategori
  const [kategoriOptions, setKategoriOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data satuan berdasarkan id_satuan saat mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getLaporanMasterSatuan(token);
        // console.log("Data Master Satuan (update):", data);

        let satuanArray = [];
        // Jika response merupakan array dengan objek data di elemen pertama
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && !Array.isArray(data[0])) {
          satuanArray = Object.values(data[0]);
        } else if (Array.isArray(data)) {
          satuanArray = data;
        } else {
          satuanArray = Object.values(data);
        }

        // Cari data satuan dengan perbandingan tipe data yang sama
        const satuan = satuanArray.find(
          (item) => parseInt(item.id_satuan, 10) === parseInt(id_satuan, 10)
        );

        if (!satuan) {
          throw new Error("Data satuan tidak ditemukan.");
        }

        setFormData({
          id_satuan: satuan.id_satuan,
          kode_satuan: satuan.kode_satuan,
          nama_satuan: satuan.nama_satuan,
          status: satuan.status,
          id_satuan_kategori: satuan.id_satuan_kategori,
        });
      } catch (err) {
        setError(err.message || "Gagal memuat data satuan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_satuan, token]);

  // Ambil data kategori untuk dropdown
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const response = await getLaporanMasterSatuanKategori(token);
        // Response berdasarkan contoh:
        // [ { "0": { ... }, "1": { ... }, "2": { ... } }, { meta data } ]
        if (response && response[0]) {
          const data = Object.values(response[0]);
          setKategoriOptions(data);
        }
      } catch (err) {
        console.error("Error fetching kategori:", err);
      }
    };
    fetchKategori();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kode_satuan || !formData.nama_satuan || formData.status === null) {
      setAlert({
        message: "Semua field (kode_satuan, nama_satuan, status) harus diisi.",
        type: "error",
        visible: true,
      });
      return;
    }
    if (!formData.id_satuan_kategori) {
      setAlert({
        message: "Kategori Satuan harus dipilih.",
        type: "error",
        visible: true,
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        id_satuan: formData.id_satuan,
        kode_satuan: formData.kode_satuan,
        nama_satuan: formData.nama_satuan,
        status: formData.status,
        id_satuan_kategori: formData.id_satuan_kategori,
        id_user,
        id_toko,
      };

      const response = await updateMasterSatuan(payload, token);
      if (response.success) {
        setAlert({
          message: response.message || "Master Satuan berhasil diupdate.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          navigate("/dashboard/master/menu/master/satuan");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui data satuan.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui data satuan.",
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
          <Link to="/dashboard/master/menu/master/satuan" className="text-xs font-semibold text-blue-900">
            Master Satuan
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
          <Link to={`/dashboard/master/menu/master/satuan/update/${id_satuan}`} className="text-xs font-semibold text-gray-400">
            Update Satuan
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
        <p className="text-xl font-semibold text-blue-900">Update Master Satuan</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/master/satuan">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Satuan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            {/* Field Kode Satuan */}
            <div className="w-1/2">
              <label htmlFor="kode_satuan" className="block text-sm font-semibold text-blue-800 mb-1">
                Kode Satuan
              </label>
              <input
                type="text"
                id="kode_satuan"
                name="kode_satuan"
                value={formData.kode_satuan}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              />
            </div>
            {/* Dropdown Kategori Satuan */}
            <div className="w-1/2">
              <label htmlFor="id_satuan_kategori" className="block text-sm font-semibold text-blue-800 mb-1">
                Kategori Satuan
              </label>
              <select
                id="id_satuan_kategori"
                name="id_satuan_kategori"
                value={formData.id_satuan_kategori}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              >
                {kategoriOptions.map((item) => (
                  <option key={item.id_satuan_kategori} value={item.id_satuan_kategori}>
                    {item.nama_satuan_kategori}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4 flex gap-4">

          <div className="w-1/2">
            {/* Field Nama Satuan */}
            <label htmlFor="nama_satuan" className="block text-sm font-semibold text-blue-800 mb-1">
              Nama Satuan
            </label>
            <input
              type="text"
              id="nama_satuan"
              name="nama_satuan"
              value={formData.nama_satuan}
              onChange={handleChange}
              className="w-full border border-gray-300 text-sm rounded-md p-2"
              required
            />
          </div>
          <div className="w-1/2">
            {/* Field Status */}
            <label htmlFor="status" className="block text-sm font-semibold text-blue-800 mb-1">
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
              {submitLoading ? "Loading..." : "Update Satuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
