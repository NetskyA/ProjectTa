// File: MenuUpdateStokReturJual.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  getLaporanStokBarangRetur, 
  updateStokReturJual, 
  getLaporanMasterToko, 
  getMasterGudang 
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateStokReturJual() {
  const { id_stokretur } = useParams();
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  // State form untuk update stok retur
  const [formData, setFormData] = useState({
    id_stokretur: "",
    id_toko: "",
    kode_barang: "",
    nama_barang: "",
    nominal_retur: "",
    stok_barang: "",
    gudang_asal: "",    // read-only
    gudang_tujuan: ""   // editable
  });

  // Simpan nilai awal untuk validasi (misalnya untuk stok_barang)
  const [initialData, setInitialData] = useState({});

  // State untuk list data master toko dan gudang
  const [listToko, setListToko] = useState([]);
  const [listGudang, setListGudang] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Ambil data stok retur berdasarkan id_stokretur
  useEffect(() => {
    const fetchReturData = async () => {
      try {
        setLoading(true);
        const data = await getLaporanStokBarangRetur(token);
        const returArray = Array.isArray(data) ? data : Object.values(data);

        // Cari data yang sesuai dengan id_stokretur
        const record = returArray.find(
          (item) => parseInt(item.id_stokretur, 10) === parseInt(id_stokretur, 10)
        );
        if (!record) {
          throw new Error("Data stok retur tidak ditemukan.");
        }

        setFormData({
          id_stokretur: record.id_stokretur,
          id_toko: record.id_toko,
          kode_barang: record.kode_barang,
          nama_barang: record.nama_barang,
          nominal_retur: record.nominal_retur,
          stok_barang: record.stok_barang,
          gudang_asal: record.gudang_asal,     
          gudang_tujuan: record.gudang_tujuan    
        });

        setInitialData({
          stok_barang: record.stok_barang,
          gudang_tujuan: record.gudang_tujuan
        });
      } catch (err) {
        setError(err.message || "Gagal memuat data stok retur.");
      } finally {
        setLoading(false);
      }
    };

    fetchReturData();
  }, [id_stokretur, token]);

  // Ambil data master toko
  useEffect(() => {
    const fetchToko = async () => {
      try {
        const result = await getLaporanMasterToko(token);
        const tokoArray = Array.isArray(result) ? result : Object.values(result);
        setListToko(tokoArray);
      } catch (err) {
        console.error("Error fetching master toko:", err);
      }
    };
    fetchToko();
  }, [token]);

  // Ambil data master gudang dan filter hanya yang status = 0 (aktif)
  useEffect(() => {
    const fetchGudang = async () => {
      try {
        const result = await getMasterGudang(token);
        const gudangArray = Array.isArray(result) ? result : Object.values(result);
        const filteredGudang = gudangArray.filter((gudang) => gudang.status === 0);
        setListGudang(filteredGudang);
      } catch (err) {
        console.error("Error fetching master gudang:", err);
      }
    };
    fetchGudang();
  }, [token]);

  // Handler perubahan input (hanya field yang dapat diedit)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler submit form update
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: pastikan stok_barang dan gudang_tujuan terisi
    if (formData.stok_barang === "" || formData.gudang_tujuan === "") {
      setAlert({
        message: "Stok barang dan gudang tujuan harus diisi.",
        type: "error",
        visible: true
      });
      return;
    }

    // Validasi tambahan: stok_barang baru tidak boleh melebihi stok sebelumnya
    if (parseInt(formData.stok_barang, 10) > parseInt(initialData.stok_barang, 10)) {
      setAlert({
        message: "Stok tidak boleh melebihi nilai sebelumnya.",
        type: "warning",
        visible: true
      });
      return;
    }

    setSubmitLoading(true);
    try {
      // Untuk gudang tujuan 1, kita gunakan stok_barang sebagai qty tambahan
      const payload = {
        id_stokretur: formData.id_stokretur,
        stok_barang: parseInt(formData.stok_barang, 10),
        kode_barang: formData.kode_barang,
        gudang_tujuan: parseInt(formData.gudang_tujuan, 10),
        kode_toko: formData.id_toko,
        // Jika gudang tujuan 1, gunakan stok_barang sebagai qty; jika 2, qty tidak digunakan
        qty: parseInt(formData.stok_barang, 10)
      };

      const response = await updateStokReturJual(payload, token);
      if (response.success) {
        setAlert({
          message: "Stok retur berhasil diupdate.",
          type: "success",
          visible: true
        });
        setTimeout(() => {
          navigate("/dashboard/basetroli/menu/masterreturjual");
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal memperbarui stok retur.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui stok retur.",
        type: "error",
        visible: true
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

  // Dapatkan nama toko dari listToko berdasarkan id_toko
  const selectedToko = listToko.find(
    (toko) => parseInt(toko.id_toko, 10) === parseInt(formData.id_toko, 10)
  );
  const namaToko = selectedToko ? selectedToko.nama_toko : "Data tidak ditemukan";

  // Dapatkan nama gudang asal dari listGudang berdasarkan field gudang_asal
  const asalGudang = listGudang.find(
    (gudang) => parseInt(gudang.id_gudang, 10) === parseInt(formData.gudang_asal, 10)
  );
  const namaGudangAsal = asalGudang ? asalGudang.nama_gudang : "Data tidak ditemukan";

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
            Stok Retur
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/basetroli/menu/masterreturjual" className="text-xs font-semibold text-blue-900">
            Master Stok Retur
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to={`/dashboard/basetroli/menu/masterreturjual/update/${id_stokretur}`} className="text-xs font-semibold text-gray-400">
            Update Stok Retur
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
        <p className="text-xl font-semibold text-blue-900">Update Stok Retur</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/basetroli/menu/masterreturjual">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-2xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">Detail Stok Retur</h2>
        <form onSubmit={handleSubmit}>
          {/* Nama Toko */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-blue-800 mb-1">Nama Toko</label>
            <input
              type="text"
              value={namaToko}
              readOnly
              className="w-full border border-gray-300 bg-gray-200 text-sm rounded-md p-2"
            />
          </div>
          {/* Kode Barang dan Nama Barang */}
          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-blue-800 mb-1">Kode Barang</label>
              <input
                type="text"
                value={formData.kode_barang}
                readOnly
                className="w-full border border-gray-300 bg-gray-200 text-sm rounded-md p-2"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-blue-800 mb-1">Nama Barang</label>
              <input
                type="text"
                value={formData.nama_barang}
                readOnly
                className="w-full border border-gray-300 bg-gray-200 text-sm rounded-md p-2"
              />
            </div>
          </div>
          {/* Nominal Retur */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-blue-800 mb-1">Nominal Retur</label>
            <input
              type="text"
              value={formData.nominal_retur}
              readOnly
              className="w-full border border-gray-300 bg-gray-200 text-sm rounded-md p-2"
            />
          </div>
          {/* Gudang Asal dan Gudang Tujuan */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">Gudang Asal</label>
              <input
                type="text"
                value={namaGudangAsal}
                readOnly
                className="w-full border border-gray-300 bg-gray-200 text-sm rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">Gudang Tujuan</label>
              <select
                name="gudang_tujuan"
                value={formData.gudang_tujuan}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-2"
                required
              >
                <option value="">Pilih Gudang Tujuan</option>
                {listGudang.map((gudang) => (
                  <option key={gudang.id_gudang} value={gudang.id_gudang}>
                    {gudang.nama_gudang}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Stok Barang */}
          <div className="mb-4 w-1/2 gap-4">
            <label className="block text-sm font-semibold text-blue-800 mb-1">Stok Barang (Pcs)</label>
            <input
              type="number"
              name="stok_barang"
              value={formData.stok_barang}
              onChange={handleChange}
              className="w-full border border-gray-300 text-sm rounded-md p-2"
              required
            />
          </div>
          {/* Tidak ada input qty tambahan karena qty = stok_barang */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 text-sm rounded-md hover:bg-blue-950 transition duration-300 ${
                submitLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitLoading}
            >
              {submitLoading ? "Loading..." : "Update Stok Retur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
