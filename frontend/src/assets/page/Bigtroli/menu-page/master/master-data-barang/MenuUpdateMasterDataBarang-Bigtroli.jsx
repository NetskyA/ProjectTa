import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getLaporanMasterDataBarang,       // Mengambil semua data barang
  // getLaporanMasterKategori,       // Dihilangkan (tidak dipanggil)
  getLaporanMasterMarketPlace,       // Mengambil data marketplace
  getLaporanMasterTokoInsertDataBarang, // Mengambil data toko
  getLaporanMasterSatuan,            // Mengambil data satuan
  updateMasterDataBarang,            // Untuk update
  hardDeleteHargaBarang,             // Fungsi hard delete harga barang
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterDataBarangMaster() {
  const { idbarang } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);

  // Ambil id_toko (untuk admin biasa)
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);
  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);
  const dispatch = useDispatch();

  // === FORM DATA (Tanpa id_kategori) ===
  const [formData, setFormData] = useState({
    idbarang: "",
    kode_barang: "",
    namabarang: "",
    id_toko: "",
    id_master_hargabeli: "",
    harga_beli: "",
    harga_beli_sedang: "",
    harga_beli_kecil: "",
    satuanbesar: "",
    satuansedang: "",
    satuankecil: "",
    konversi1: "",
    konversi2: "",
    status: 0,
  });

  // State dropdown satuan
  const [satuanBesarOptions, setSatuanBesarOptions] = useState([]);
  const [satuanSedangOptions, setSatuanSedangOptions] = useState([]);
  const [satuanKecilOptions, setSatuanKecilOptions] = useState([]);

  // State array marketplace => setiap item: 
  // { 
  //   id_marketplace, 
  //   nama_marketplace, 
  //   id_master_hargabarang, 
  //   isChecked, 
  //   harga_jual, 
  //   harga_barang_sedang, 
  //   harga_barang_kecil
  // }
  const [marketplaceData, setMarketplaceData] = useState([]);
  const [initialMarketplaceData, setInitialMarketplaceData] = useState([]);

  // Master data (TANPA kategori)
  const [masterToko, setMasterToko] = useState([]);
  const [masterMarketplace, setMasterMarketplace] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // === 1. Fetch Master Satuan ===
  useEffect(() => {
    const fetchSatuan = async () => {
      try {
        const result = await getLaporanMasterSatuan(token);
        let formattedData = [];
        if (
          Array.isArray(result) &&
          result.length > 0 &&
          typeof result[0] === "object" &&
          !Array.isArray(result[0])
        ) {
          formattedData = Object.values(result[0]);
        } else if (Array.isArray(result)) {
          formattedData = result;
        } else {
          formattedData = Object.values(result);
        }
        const besar = formattedData.filter(
          (item) =>
            parseInt(item.id_satuan_kategori, 10) === 1 &&
            parseInt(item.status, 10) !== 1
        );
        const sedang = formattedData.filter(
          (item) =>
            parseInt(item.id_satuan_kategori, 10) === 2 &&
            parseInt(item.status, 10) !== 1
        );
        const kecil = formattedData.filter(
          (item) =>
            parseInt(item.id_satuan_kategori, 10) === 3 &&
            parseInt(item.status, 10) !== 1
        );
        setSatuanBesarOptions(besar);
        setSatuanSedangOptions(sedang);
        setSatuanKecilOptions(kecil);
      } catch (err) {
        console.error("Error fetching master satuan data:", err);
      }
    };
    fetchSatuan();
  }, [token]);

  // === 2. Fetch Data Barang + Toko + Marketplace (Tanpa kategori) ===
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // A. Data barang
        const allBarangData = await getLaporanMasterDataBarang(token);
        const barangArray = Array.isArray(allBarangData)
          ? allBarangData
          : Object.values(allBarangData);

        // Filter data barang berdasarkan idbarang
        const rowsForThisBarang = barangArray.filter(
          (b) => b.idbarang === parseInt(idbarang, 10)
        );
        if (rowsForThisBarang.length === 0) {
          throw new Error(
            "Barang tidak ditemukan atau belum memiliki data marketplace."
          );
        }
        const mainRow = rowsForThisBarang[0];

        // B. Toko
        const tokoData = await getLaporanMasterTokoInsertDataBarang(token);
        const tokoArray = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        setMasterToko(tokoArray || []);

        // C. Marketplace
        const mpData = await getLaporanMasterMarketPlace(token);
        let mpArray = Array.isArray(mpData) ? mpData : Object.values(mpData);
        // Filter marketplace non-aktif
        mpArray = mpArray.filter((mp) => mp.status !== 1);
        setMasterMarketplace(mpArray);

        // D. Mapping marketplaceData (Tanpa kategori)
        const newMarketplaceData = mpArray.map((mp) => {
          const foundRow = rowsForThisBarang.find(
            (r) => r.id_marketplace === mp.id_marketplace
          );
          if (foundRow) {
            return {
              id_marketplace: mp.id_marketplace,
              nama_marketplace: mp.nama_marketplace,
              id_master_hargabarang: foundRow.id_master_hargabarang || null,
              isChecked: true,
              harga_jual: foundRow.harga_barang || "",
              harga_barang_sedang: foundRow.harga_barang_sedang || "",
              harga_barang_kecil: foundRow.harga_barang_kecil || "",
            };
          } else {
            // Marketplace baru (belum ada data)
            return {
              id_marketplace: mp.id_marketplace,
              nama_marketplace: mp.nama_marketplace,
              id_master_hargabarang: null,
              isChecked: false,
              harga_jual: "",
              harga_barang_sedang: "",
              harga_barang_kecil: "",
            };
          }
        });
        setMarketplaceData(newMarketplaceData);
        setInitialMarketplaceData(JSON.parse(JSON.stringify(newMarketplaceData)));

        // E. Set formData
        setFormData({
          idbarang: mainRow.idbarang || "",
          kode_barang: mainRow.kode_barang || "",
          namabarang: mainRow.namabarang || "",
          id_toko: mainRow.id_toko || "",
          id_master_hargabeli: mainRow.id_master_hargabeli || "",
          harga_beli: mainRow.harga_beli || "",
          harga_beli_sedang: mainRow.harga_beli_sedang || "",
          harga_beli_kecil: mainRow.harga_beli_kecil || "",
          satuanbesar: mainRow.satuanbesar || "",
          satuansedang: mainRow.satuansedang || "",
          satuankecil: mainRow.satuankecil || "",
          konversi1: mainRow.konversi1 || "",
          konversi2: mainRow.konversi2 || "",
          status: mainRow.status || 0,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal memuat data barang.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [idbarang, token]);

  // === 3. Perhitungan Otomatis Harga Beli Sedang & Kecil ===
  useEffect(() => {
    const hargaBeli = parseFloat(formData.harga_beli);
    const konv1 = parseFloat(formData.konversi1);
    const konv2 = parseFloat(formData.konversi2);
    if (!isNaN(hargaBeli) && konv1 > 0) {
      const newHargaBeliSedang = Math.ceil(hargaBeli / konv1);
      if (newHargaBeliSedang !== parseFloat(formData.harga_beli_sedang)) {
        setFormData((prev) => ({
          ...prev,
          harga_beli_sedang: newHargaBeliSedang.toString(),
        }));
      }
      if (!isNaN(newHargaBeliSedang) && konv2 > 0) {
        const newHargaBeliKecil = Math.ceil(newHargaBeliSedang / konv2);
        if (newHargaBeliKecil !== parseFloat(formData.harga_beli_kecil)) {
          setFormData((prev) => ({
            ...prev,
            harga_beli_kecil: newHargaBeliKecil.toString(),
          }));
        }
      }
    }
  }, [formData.harga_beli, formData.konversi1, formData.konversi2]);

  // === 4. Handler Refresh ===
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    setFormData({
      idbarang: "",
      kode_barang: "",
      namabarang: "",
      id_toko: "",
      id_master_hargabeli: "",
      harga_beli: "",
      harga_beli_sedang: "",
      harga_beli_kecil: "",
      satuanbesar: "",
      satuansedang: "",
      satuankecil: "",
      konversi1: "",
      konversi2: "",
      status: 0,
    });
    setMarketplaceData([]);
    window.location.reload();
  };

  // === 5. Handler FormData Change (kecuali marketplace) ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert numeric
    const numericFields = ["harga_beli", "konversi1", "konversi2", "status"];
    if (numericFields.includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // === 6. Handler Checkbox Marketplace (isChecked) ===
  const handleMarketplaceCheck = (index) => {
    setMarketplaceData((prev) =>
      prev.map((mp, i) => {
        if (i === index) {
          const newIsChecked = !mp.isChecked;
          return {
            ...mp,
            isChecked: newIsChecked,
            // Reset data jika uncheck
            harga_jual: newIsChecked ? mp.harga_jual : "",
            harga_barang_sedang: newIsChecked ? mp.harga_barang_sedang : "",
            harga_barang_kecil: newIsChecked ? mp.harga_barang_kecil : "",
          };
        }
        return mp;
      })
    );
  };

  // === 7. Handler Marketplace: Hitung Otomatis CRT => LSN => PCS ===
  const handleMarketplaceCrtChange = (index, value) => {
    let inputValue = value === "555.50" ? "5556" : value;
    setMarketplaceData((prev) =>
      prev.map((mp, i) => {
        if (i === index) {
          const hargaCRT = parseFloat(inputValue) || 0;
          const konv1 = parseFloat(formData.konversi1) || 0;
          const konv2 = parseFloat(formData.konversi2) || 0;
          let hargaLSN = "";
          let hargaPCS = "";
          if (formData.satuansedang && formData.satuansedang !== "-" && konv1 > 0) {
            hargaLSN = Math.ceil(hargaCRT / konv1).toString();
          }
          if (formData.satuankecil && formData.satuankecil !== "-" && konv2 > 0 && hargaLSN) {
            hargaPCS = Math.ceil(parseFloat(hargaLSN) / konv2).toString();
          }
          return {
            ...mp,
            harga_jual: inputValue,
            harga_barang_sedang: hargaLSN,
            harga_barang_kecil: hargaPCS,
          };
        }
        return mp;
      })
    );
  };

  // === 8. Handler Marketplace Price Change (LSN/PCS manual) ===
  const handleMarketplacePriceChange = (index, field, value) => {
    setMarketplaceData((prev) =>
      prev.map((mp, i) => {
        if (i === index) {
          return { ...mp, [field]: value };
        }
        return mp;
      })
    );
  };

  // === 9. (Kategori dihapus) => Tidak ada handleMarketplaceKategoriChange ===

  // === 10. Submit Update (Hanya console.log payload) ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      idbarang,
      kode_barang,
      namabarang,
      id_toko,
      harga_beli,
      satuanbesar,
      satuansedang,
      satuankecil,
      konversi1,
      konversi2,
      status,
      id_master_hargabeli,
      harga_beli_sedang,
      harga_beli_kecil,
    } = formData;

    // Validasi field utama
    if (
      !idbarang ||
      !kode_barang ||
      !namabarang ||
      !id_toko ||
      !harga_beli ||
      !satuanbesar ||
      !satuansedang ||
      !satuankecil ||
      !konversi1 ||
      !konversi2 ||
      status === ""
    ) {
      setAlert({
        message: "Semua field utama harus diisi.",
        type: "error",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
      }, 3000);
      return;
    }

    if (parseFloat(harga_beli) === 0) {
      setAlert({
        message: "Harga beli tidak boleh 0.",
        type: "error",
        visible: true,
      });
      return;
    }

    if (!id_master_hargabeli) {
      setAlert({
        message: "Data harga beli tidak lengkap: id_master_hargabeli tidak ditemukan.",
        type: "warning",
        visible: true,
      });
      return;
    }

    // marketplacePrices => isi array
    const marketplacePrices = marketplaceData
      .filter((mp) => mp.isChecked)
      .map((mp) => ({
        id_master_hargabarang: mp.id_master_hargabarang,
        id_marketplace: mp.id_marketplace,
        // id_kategori Dihapus => tidak lagi dikirim
        harga_jual: mp.harga_jual,
        harga_barang_sedang: mp.harga_barang_sedang,
        harga_barang_kecil: mp.harga_barang_kecil,
      }));

    setSubmitLoading(true);
    setAlert({ message: "", type: "", visible: false });

    // Buat payload TANPA KATEGORI
    const payload = {
      idbarang: parseInt(idbarang, 10),
      kode_barang,
      namabarang,
      id_toko: parseInt(id_toko, 10),
      harga_beli,
      harga_beli_sedang,
      harga_beli_kecil,
      satuanbesar,
      satuansedang,
      satuankecil,
      konversi1: parseInt(konversi1, 10),
      konversi2: parseInt(konversi2, 10),
      status: parseInt(status, 10),
      createBy: id_user,
      id_master_hargabeli,
      marketplacePrices,
    };

    // Console.log payload agar kita tahu apa yang dikirim
    console.log("DEBUG: Full Payload =>", payload);

    // Tampilkan alert agar user tahu data siap "diupdate"
    setAlert({
      message: "Data siap diupdate. Lihat console untuk detail payload.",
      type: "success",
      visible: true,
    });

    // Reset submitLoading
    setSubmitLoading(false);

    // Jika ingin benar-benar update, uncomment code berikut:
    try {
      const response = await updateMasterDataBarang(payload, token);
      console.log("Update Response:", response);

      if (response.success) {
        // Hard Delete bagi marketplace uncheck
        const toDelete = initialMarketplaceData.filter((initialMP) => {
          if (initialMP.isChecked && initialMP.id_master_hargabarang) {
            const currentMP = marketplaceData.find(
              (mp) => mp.id_marketplace === initialMP.id_marketplace
            );
            if (!currentMP || !currentMP.isChecked) {
              return true;
            }
          }
          return false;
        });

        for (const mp of toDelete) {
          try {
            await hardDeleteHargaBarang(
              {
                id_master_hargabarang: mp.id_master_hargabarang,
                id_toko: parseInt(id_toko, 10),
                id_marketplace: mp.id_marketplace,
                kode_barang,
              },
              token
            );
            console.log(`Hard delete sukses: marketplace ${mp.nama_marketplace}`);
          } catch (err) {
            console.error(`Hard delete gagal: marketplace ${mp.nama_marketplace}:`, err.message);
          }
        }

        setAlert({
          message: "Master Data Barang berhasil diperbarui.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/basetroli/menu/masterdatabarang");
        }, 1500);
      } else {
        throw new Error(response.message || "Gagal memperbarui Master Data Barang.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal memperbarui Master Data Barang.",
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
          <Link to="/dashboard/basetroli" className="text-sm font-semibold text-blue-900">
            Master
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link to="/dashboard/basetroli/menu/masterdatabarang">
            <span className="text-sm font-semibold text-blue-900">Master Data Barang</span>
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link to={`/dashboard/basetroli/menu/masterdatabarang/update/${idbarang}`}>
            <span className="text-sm font-semibold text-gray-400">Update Barang</span>
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
        <p className="text-xl font-semibold text-blue-900">Update Barang</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/basetroli/menu/masterdatabarang">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-1">Back</p>
            </button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-4xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold mb-2">Detail Barang</h2>
        <form onSubmit={handleSubmit}>
          {/* Kode & Nama Barang */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="kode_barang" className="block text-sm font-semibold text-blue-800 mb-1">
                Kode Barang
              </label>
              <input
                type="text"
                id="kode_barang"
                name="kode_barang"
                value={formData.kode_barang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1"
                placeholder="Masukkan kode barang"
                required
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="namabarang" className="block text-sm font-semibold text-blue-800 mb-1">
                Nama Barang
              </label>
              <input
                type="text"
                id="namabarang"
                name="namabarang"
                value={formData.namabarang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1"
                placeholder="Masukkan nama barang"
                required
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="id_toko" className="block text-sm font-semibold text-blue-800 mb-1">
                Toko
              </label>
              <select
                id="id_toko"
                name="id_toko"
                value={formData.id_toko}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm capitalize rounded-md p-1"
                required
              >
                <option value="">Pilih Toko</option>
                {masterToko
                  .filter((toko) => parseInt(toko.id_toko, 10) === id_toko)
                  .map((toko) => (
                    <option key={toko.id_toko} value={toko.id_toko}>
                      {toko.nama_toko}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Dropdown Satuan */}
          <div className="w-full flex gap-4">
            {satuanBesarOptions.length === 1 ? (
              <div className="mb-3 w-1/3">
                <label htmlFor="satuanbesar" className="block text-sm font-semibold text-blue-800 mb-1">
                  Satuan Besar
                </label>
                <input
                  type="text"
                  id="satuanbesar"
                  name="satuanbesar"
                  value={satuanBesarOptions[0].nama_satuan}
                  className="w-full border border-gray-300 rounded-md p-1"
                  disabled
                />
              </div>
            ) : (
              <div className="mb-3 w-1/3">
                <label htmlFor="satuanbesar" className="block text-sm font-semibold text-blue-800 mb-1">
                  Satuan Besar
                </label>
                <select
                  id="satuanbesar"
                  name="satuanbesar"
                  value={formData.satuanbesar}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-1"
                  required
                >
                  <option value="">Pilih Satuan Besar</option>
                  {satuanBesarOptions.map((option) => (
                    <option key={option.id_satuan} value={option.nama_satuan}>
                      {option.nama_satuan}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-3 w-1/3">
              <label htmlFor="satuansedang" className="block text-sm font-semibold text-blue-800 mb-1">
                Satuan Sedang
              </label>
              <select
                id="satuansedang"
                name="satuansedang"
                value={formData.satuansedang}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                required
              >
                <option value="-">-</option>
                {satuanSedangOptions.map((option) => (
                  <option key={option.id_satuan} value={option.nama_satuan}>
                    {option.nama_satuan}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 w-1/3">
              <label htmlFor="satuankecil" className="block text-sm font-semibold text-blue-800 mb-1">
                Satuan Kecil
              </label>
              <select
                id="satuankecil"
                name="satuankecil"
                value={formData.satuankecil}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                required
              >
                <option value="-">-</option>
                {satuanKecilOptions.map((option) => (
                  <option key={option.id_satuan} value={option.nama_satuan}>
                    {option.nama_satuan}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Konversi */}
          <div className="mb-4 flex gap-4">
            <div className="w-1/2">
              <label htmlFor="konversi" className="block text-sm font-semibold text-blue-800 mb-1">
                Konversi Besar
              </label>
              <input
                type="text"
                id="konversi"
                name="konversi"
                value={"1"}
                disabled
                className="w-full border border-gray-300 text-sm rounded-md p-1.5 bg-gray-200"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="konversi1" className="block text-sm font-semibold text-blue-800 mb-1">
                Konversi 1
              </label>
              <input
                type="number"
                id="konversi1"
                name="konversi1"
                value={formData.konversi1}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1.5"
                placeholder="Masukkan konversi 1"
                required
                min="1"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="konversi2" className="block text-sm font-semibold text-blue-800 mb-1">
                Konversi 2
              </label>
              <input
                type="number"
                id="konversi2"
                name="konversi2"
                value={formData.konversi2}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1.5"
                placeholder="Masukkan konversi 2"
                required
                min="1"
              />
            </div>
          </div>

          {/* Harga Beli */}
          <div className="w-full flex gap-2">
            <div className="w-1/2 mb-2">
              <label htmlFor="harga_beli" className="block text-sm font-semibold text-blue-800 mb-1">
                Harga Beli CRT
              </label>
              <input
                type="text"
                id="harga_beli"
                name="harga_beli"
                value={formData.harga_beli}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1.5"
                placeholder="Masukkan harga beli CRT"
                required
                min="0"
              />
            </div>
            <div className="w-1/2 mb-2">
              <label htmlFor="harga_beli_sedang" className="block text-sm font-semibold text-blue-800 mb-1">
                Harga Beli LSN
              </label>
              <input
                type="text"
                id="harga_beli_sedang"
                name="harga_beli_sedang"
                value={formData.harga_beli_sedang}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1.5"
                placeholder="Masukkan harga beli LSN"
                required
                min="0"
              />
            </div>
            <div className="w-1/2 mb-2">
              <label htmlFor="harga_beli_kecil" className="block text-sm font-semibold text-blue-800 mb-1">
                Harga Beli PCS
              </label>
              <input
                type="text"
                id="harga_beli_kecil"
                name="harga_beli_kecil"
                value={formData.harga_beli_kecil}
                onChange={handleChange}
                className="w-full border border-gray-300 text-sm rounded-md p-1.5"
                placeholder="Masukkan harga beli PCS"
                required
                min="0"
              />
            </div>
          </div>

          {/* Harga Jual per Marketplace (Tanpa Kategori) */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-blue-900">Harga Jual</p>
            <div className="flex flex-wrap">
              {marketplaceData.map((mp, index) => (
                <div key={mp.id_marketplace} className="flex items-center mb-2 mr-4">
                  <div className="flex w-24 mr-2 items-center">
                    <input
                      type="checkbox"
                      id={`mp-${mp.id_marketplace}`}
                      checked={mp.isChecked}
                      onChange={() => handleMarketplaceCheck(index)}
                      className="mr-1"
                    />
                    <label
                      htmlFor={`mp-${mp.id_marketplace}`}
                      className="text-sm font-semibold items-center text-blue-800"
                    >
                      {mp.nama_marketplace}
                    </label>
                  </div>

                  <div className="flex gap-2">
                    {/* Harga Jual CRT */}
                    <div className="w-64">
                      <input
                        type="text"
                        placeholder="Harga jual CRT"
                        value={mp.harga_jual}
                        onChange={(e) => handleMarketplaceCrtChange(index, e.target.value)}
                        disabled={!mp.isChecked}
                        className={`border border-gray-300 rounded-md p-1.5 text-sm w-full ${
                          !mp.isChecked ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min="0"
                      />
                    </div>
                    {/* Harga Jual LSN */}
                    <div className="w-60">
                      <input
                        type="text"
                        placeholder="Harga jual LSN"
                        value={mp.harga_barang_sedang}
                        onChange={(e) =>
                          handleMarketplacePriceChange(index, "harga_barang_sedang", e.target.value)
                        }
                        disabled={!mp.isChecked}
                        className={`border border-gray-300 rounded-md p-1.5 text-sm w-full ${
                          !mp.isChecked ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min="0"
                      />
                    </div>
                    {/* Harga Jual PCS */}
                    <div className="w-60">
                      <input
                        type="text"
                        placeholder="Harga jual PCS"
                        value={mp.harga_barang_kecil}
                        onChange={(e) =>
                          handleMarketplacePriceChange(index, "harga_barang_kecil", e.target.value)
                        }
                        disabled={!mp.isChecked}
                        className={`border border-gray-300 rounded-md p-1.5 text-sm w-full ${
                          !mp.isChecked ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min="0"
                      />
                    </div>
                    {/* Kategori dihapus => Tidak ada dropdown kategori */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="w-44 mb-4">
            <label htmlFor="status" className="block text-sm font-semibold text-blue-800 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 text-sm capitalize rounded-md p-1"
              required
            >
              <option value={0}>Aktif</option>
              <option value={1}>Non-Aktif</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-1 text-sm rounded-md hover:bg-blue-950 transition duration-300 ${
                submitLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitLoading}
            >
              {submitLoading ? "Loading..." : "Update Barang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
