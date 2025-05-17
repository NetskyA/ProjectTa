import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  // getLaporanMasterKategori, <-- Dihapus
  getLaporanMasterMarketPlace,
  getLaporanMasterTokoInsertDataBarang,
  getLaporanMasterSatuan,
  insertMasterDataBarang,
  getMasterLokasiKitchen,
  getMasterKategoriProduk,
  getMasterKategoriBahanBaku,
  getMasterAdonan,
  getMasterDetailAdonan,
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import LogoSave from "../../../../../image/icon/logo-save.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value?.label || "");
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setInputValue(option.label);
    onChange(option);
    setShowOptions(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        type="text"
        className="border border-gray-300 text-xs rounded p-1 w-full"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setShowOptions(true)}
        placeholder="Ketik atau pilih..."
      />
      {showOptions && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-36 overflow-y-auto mt-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(option)}
                className="px-2 py-1 hover:bg-gray-200 cursor-pointer text-xs"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-2 py-1 text-xs text-gray-500">Tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function MenuInsertMasterDataBarangMaster() {
  // State untuk data toko, marketplace
  const [masterToko, setMasterToko] = useState([]);
  const [masterMarketplace, setMasterMarketplace] = useState([]);

  // State untuk data satuan (dropdown)
  const [satuanBesarOptions, setSatuanBesarOptions] = useState([]);
  const [masterSatuan, setMasterSatuan] = useState([]);

  const [masterLokasi, setMasterLokasi] = useState([]);
  const [masterKategoriProduk, setMasterKategoriProduk] = useState([]);
  const [masterKategoriBahanBaku, setMasterKategoriBahanBaku] = useState([]);
  const [isProdukSaved, setIsProdukSaved] = useState(false);
  const [bahanBakuDetailRows, setBahanBakuDetailRows] = useState([]);

  const jenisAdonanList = [
    "ADONAN",
    "FILLING KEDUA",
    "FILLING PERTAMA",
    "TOPPING KEDUA",
    "TOPPING PERTAMA",
  ];
  const [detailAdonanRows, setDetailAdonanRows] = useState([]);
  const [masterAdonanKategori, setMasterAdonanKategori] = useState([]);
  const [detailAdonanData, setDetailAdonanData] = useState([]);

  // State form utama
  const [formData, setFormData] = useState({
    kode_barang: "",
    namabarang: "",
    id_lokasi: "",
    kode_toko: "",
    id_kategori_produk: "",
    id_kategori_bahan_baku: "",
    harga_beli: "",
    harga_beli_sedang: "",
    harga_beli_kecil: "",
    id_satuan: 7, // ← Default ke ID 7
    pajak: "",
    margin_kotor: "",
    konversi: "1",
    konversi1: "",
    konversi2: "",
    status: 0,
  });

  // State untuk data harga jual per marketplace
  // Format: [{ id_marketplace, nama_marketplace, isChecked, harga_jual, harga_barang_sedang, harga_barang_kecil }, ...]
  const [marketplaceData, setMarketplaceData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Redux
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user); // createBy
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const username = useSelector((state) => state.auth.username);
  const id_toko = parseInt(id_tokoString, 10);
  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);
  console.log("username:", username);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Fetch Master Toko
  useEffect(() => {
    const fetchToko = async () => {
      try {
        const tokoData = await getLaporanMasterTokoInsertDataBarang(token);
        const tokoArray = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        setMasterToko(tokoArray);
      } catch (err) {
        console.error("Error fetching toko data:", err);
      }
    };
    fetchToko();
  }, [token]);

  // 2. Fetch Master Marketplace
  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const mpData = await getLaporanMasterMarketPlace(token);
        let mpArray = Array.isArray(mpData) ? mpData : Object.values(mpData);

        // Filter agar tidak menampilkan marketplace dengan status = 1 (non-aktif)
        mpArray = mpArray.filter((mp) => mp.status !== 1);

        // Inisialisasi isChecked = false, harga dll.
        const initialMarketplaceData = mpArray.map((mp) => ({
          id_marketplace: mp.id_marketplace,
          nama_marketplace: mp.nama_marketplace,
          isChecked: false,
          harga_jual: "",
          harga_barang_sedang: "",
          harga_barang_kecil: "",
        }));
        setMasterMarketplace(mpArray);
        setMarketplaceData(initialMarketplaceData);
      } catch (err) {
        console.error("Error fetching marketplace data:", err);
      }
    };
    fetchMarketplace();
  }, [token]);

  // 3. Fetch Master Satuan
  useEffect(() => {
    const fetchSatuan = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getLaporanMasterSatuan(token);
        console.log("result:", result);
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

        setMasterSatuan(
          formattedData.filter((item) => parseInt(item.status, 10) !== 1)
        );
      } catch (err) {
        console.error("Error fetching master satuan data:", err);
        setError(err.message || "Failed to fetch master satuan data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSatuan();
  }, [token]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const lokasi = await getMasterLokasiKitchen(token);
        const kategoriProduk = await getMasterKategoriProduk(token);
        const kategoriBB = await getMasterKategoriBahanBaku(token);

        setMasterLokasi(Array.isArray(lokasi) ? lokasi : Object.values(lokasi));
        setMasterKategoriProduk(
          Array.isArray(kategoriProduk)
            ? kategoriProduk
            : Object.values(kategoriProduk)
        );
        setMasterKategoriBahanBaku(
          Array.isArray(kategoriBB) ? kategoriBB : Object.values(kategoriBB)
        );
      } catch (err) {
        console.error("Error fetching master data:", err);
      }
    };
    fetchMasterData();
  }, [token]);

  useEffect(() => {
    const fetchAdonan = async () => {
      try {
        const kategori = await getMasterAdonan(token);
        console.log("kategori:", kategori);
        const detail = await getMasterDetailAdonan(token);
        console.log("detail:", detail);
        // ✅ Ubah ke array jika perlu
        const kategoriArray = Array.isArray(kategori)
          ? kategori
          : Object.values(kategori || {});

        setMasterAdonanKategori(kategoriArray);
        setDetailAdonanData(
          Array.isArray(detail) ? detail : Object.values(detail || {})
        );
      } catch (error) {
        console.error("Gagal ambil data adonan:", error);
      }
    };

    fetchAdonan();
  }, [token]);

  const handleSimpanProduk = () => {
    if (!formData.pajak || !formData.margin_kotor) {
      setAlert({
        message:
          "Isi terlebih dahulu Pajak dan Margin Kotor sebelum menambahkan adonan.",
        type: "error",
        visible: true,
      });
      return;
    }

    const rows = jenisAdonanList.map((jenis) => ({
      nama_produk: formData.namabarang,
      jenis_adonan: jenis,
      id_kategori_adonan_produk: "",
      nama_kategori: "",
      jumlah_kebutuhan: "",
      harga_beli_barang: "",
      stok_bahan_baku: "",
    }));

    setDetailAdonanRows(rows);
    setIsProdukSaved(true); // Tambahkan ini
  };

  const isInfoProdukValid = () => {
    const {
      namabarang,
      id_lokasi,
      id_kategori_produk,
      id_kategori_bahan_baku,
      pajak,
      margin_kotor,
    } = formData;

    return (
      namabarang &&
      id_lokasi &&
      id_kategori_produk &&
      id_kategori_bahan_baku &&
      pajak &&
      margin_kotor
    );
  };

  const handleAdonanKategoriChange = (index, selectedId) => {
    const selectedKategori = masterAdonanKategori.find(
      (kat) => kat.id_kategori_adonan_produk === parseInt(selectedId)
    );

    const matchingDetails = detailAdonanData.filter(
      (d) => d.id_kategori_adonan_produk === parseInt(selectedId)
    );

    const totalKebutuhan = matchingDetails.reduce((sum, item) => {
      const nilai = Number(item.jumlah_kebutuhan);
      return sum + (isNaN(nilai) ? 0 : nilai);
    }, 0);

    // 🧾 Logging detail bahan baku
    console.log(
      "📦 Total bahan baku untuk kategori ID:",
      selectedId,
      " = ",
      matchingDetails.length
    );
    matchingDetails.forEach((item, idx) => {
      console.log(
        `#${idx + 1} - ${item.nama_bahan_baku} (${
          item.kode_bahan_baku
        }), kebutuhan: ${item.jumlah_kebutuhan} GR`
      );
    });
    console.log("Total Jumlah Kebutuhan:", totalKebutuhan, "GR");

    setDetailAdonanRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              id_kategori_adonan_produk: selectedId,
              nama_kategori:
                selectedKategori?.nama_kategori_adonan_produk || "-",
              jumlah_kebutuhan: totalKebutuhan, // ← ini sudah benar
              harga_beli_barang:
                matchingDetails.reduce(
                  (sum, item) => sum + Number(item.harga_beli_barang || 0),
                  0
                ) / matchingDetails.length || 0, // ambil rata-rata atau logika sesuai kebutuhan
              stok_bahan_baku: 0, // bisa dikosongkan jika tidak ingin ambil dari firstDetail
            }
          : row
      )
    );
  };

  // Jika hanya ada satu opsi pada Satuan Besar, set otomatis dan tidak bisa diubah
  useEffect(() => {
    if (satuanBesarOptions.length === 1) {
      setFormData((prev) => ({
        ...prev,
        satuanbesar: satuanBesarOptions[0].nama_satuan,
      }));
    }
  }, [satuanBesarOptions]);

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    // Reset form utama
    setFormData({
      kode_barang: "",
      namabarang: "",
      id_toko: "",
      kode_toko: "",
      harga_beli: "",
      harga_beli_sedang: "",
      harga_beli_kecil: "",
      satuanbesar: "",
      satuansedang: "",
      satuankecil: "",
      konversi: "1",
      konversi1: "",
      konversi2: "",
      status: 0,
    });

    // Reset marketplace
    const resetMPData = marketplaceData.map((mp) => ({
      ...mp,
      isChecked: false,
      harga_jual: "",
      harga_barang_sedang: "",
      harga_barang_kecil: "",
    }));
    setMarketplaceData(resetMPData);

    // Re-fetch data (Toko, Marketplace, Satuan)
    const fetchAll = async () => {
      try {
        const tokoData = await getLaporanMasterTokoInsertDataBarang(token);
        const tokoArray = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        setMasterToko(tokoArray);

        const mpData = await getLaporanMasterMarketPlace(token);
        let mpArray = Array.isArray(mpData) ? mpData : Object.values(mpData);
        mpArray = mpArray.filter((mp) => mp.status !== 1);
        const initialMarketplaceData = mpArray.map((mp) => ({
          id_marketplace: mp.id_marketplace,
          nama_marketplace: mp.nama_marketplace,
          isChecked: false,
          harga_jual: "",
          harga_barang_sedang: "",
          harga_barang_kecil: "",
        }));
        setMasterMarketplace(mpArray);
        setMarketplaceData(initialMarketplaceData);
      } catch (err) {
        console.error("Error refreshing data:", err);
        setError(err.message || "Failed to refresh data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  };

  // Handler change form utama
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = value === "555.50" ? "5556" : value;

    // Jika user memilih tanda "-" pada dropdown satuan, maka field terkait akan menyimpan tanda "-"
    if (
      (name === "satuansedang" || name === "satuankecil") &&
      newValue === ""
    ) {
      setFormData({ ...formData, [name]: "-" });
      return;
    }
    if (
      ["id_lokasi", "id_kategori_produk", "id_kategori_bahan_baku"].includes(
        name
      )
    ) {
      setFormData({ ...formData, [name]: parseInt(value, 10) });
      return;
    }
    // Jika mengubah harga CRT, otomatis hitung LSN & PCS
    if (name === "id_satuan") {
      setFormData({ ...formData, id_satuan: parseInt(value, 10) });
      return;
    }
    if (["pajak", "margin_kotor"].includes(name)) {
      // Hanya izinkan angka (tanpa huruf/simbol)
      if (!/^\d{0,3}$/.test(value)) return;

      const number = parseInt(value, 10);
      if (value === "" || (number >= 1 && number <= 100)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }

    // if (!formData.pajak || !formData.margin_kotor) {
    //   setAlert({
    //     message: "Pajak dan Margin Kotor wajib diisi (1–100%).",
    //     type: "error",
    //     visible: true,
    //   });
    //   return;
    // }

    // Konversi status ke integer
    if (name === "status") {
      setFormData({ ...formData, [name]: parseInt(newValue, 10) });
      return;
    }

    // Sisanya
    setFormData({ ...formData, [name]: newValue });
  };

  // Handler khusus untuk dropdown Toko
  const handleTokoChange = (e) => {
    const selectedId = e.target.value;
    const selectedToko = masterToko.find(
      (toko) => String(toko.id_toko) === selectedId
    );
    if (selectedToko) {
      setFormData((prev) => ({
        ...prev,
        id_toko: selectedId,
        kode_toko: selectedToko.kode_toko || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        id_toko: selectedId,
        kode_toko: "",
      }));
    }
  };

  const [kalkulasiHarga, setKalkulasiHarga] = useState({
    totalHpp: 0,
    labaKotor: 0,
    hargaJual: 0,
    hargaSetelahPajak: 0,
    hargaJualHpp: 0,
    persenHpp: 0,
  });

  const handleSimpanDetailAdonan = async () => {
    const filledRows = detailAdonanRows.filter(
      (row) => row.id_kategori_adonan_produk !== ""
    );

    if (filledRows.length < 1) {
      setAlert({
        message: "Minimal satu baris adonan harus dipilih.",
        type: "error",
        visible: true,
      });
      return;
    }

    const uniqueIds = new Set(
      filledRows.map((r) => r.id_kategori_adonan_produk)
    );
    if (uniqueIds.size !== filledRows.length) {
      setAlert({
        message: "Kategori adonan tidak boleh sama pada dua baris.",
        type: "warning",
        visible: true,
      });
      return;
    }

    const pajak = parseFloat(formData.pajak);
    const margin = parseFloat(formData.margin_kotor);

    if (!pajak || !margin || pajak <= 0 || margin <= 0) {
      setAlert({
        message: "Isi nilai pajak dan margin kotor dengan benar.",
        type: "error",
        visible: true,
      });
      return;
    }

    const totalHpp = filledRows.reduce(
      (sum, row) =>
        sum +
        (parseFloat(row.jumlah_kebutuhan || 0) /
          (parseFloat(row.stok_bahan_baku || 1) || 1)) *
          parseFloat(row.harga_beli_barang || 0),
      0
    );

    const hargaJual = totalHpp / (1 - margin / 100);
    const hargaSetelahPajak = hargaJual * (1 + pajak / 100);
    const hargaJualHpp = hargaJual - totalHpp;
    const persenHpp = (totalHpp / hargaJual) * 100;

    setKalkulasiHarga({
      totalHpp,
      labaKotor: margin,
      hargaJual,
      hargaSetelahPajak,
      hargaJualHpp,
      persenHpp,
    });

    // Bangun Detail Bahan Baku dari detailAdonanData
    const bahanBakuSemua = [];

    for (const row of filledRows) {
      const kategoriId = parseInt(row.id_kategori_adonan_produk);
      const matching = detailAdonanData.filter(
        (item) => parseInt(item.id_kategori_adonan_produk) === kategoriId
      );

      const mapped = matching.map((item) => ({
        nama_produk: formData.namabarang,
        jenis_adonan: row.jenis_adonan,
        nama_kategori_adonan_produk: row.nama_kategori,
        kode_bahan_baku: item.kode_bahan_baku,
        nama_bahan_baku: item.nama_bahan_baku,
        jumlah_kebutuhan: item.jumlah_kebutuhan,
        harga_beli_barang: item.harga_beli_barang,
        biaya_total_adonan: item.biaya_total_adonan,
        total_harga: item.total_harga,
        nama_user: item.nama_user,
        createat: item.createat,
      }));

      bahanBakuSemua.push(...mapped);
    }

    setBahanBakuDetailRows(bahanBakuSemua);

    setAlert({
      message: "Kalkulasi harga berhasil dihitung.",
      type: "success",
      visible: true,
    });
    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 3000);
  };

  // Submit (Hanya console.log payload)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      id_lokasi,
      id_kategori_produk,
      id_kategori_bahan_baku,
      pajak,
      margin_kotor,
      id_satuan, // ← ambil id_satuan, bukan string
      namabarang,
    } = formData;

    const selectedAdonan = detailAdonanRows.find(
      (row) => row.jenis_adonan === "ADONAN"
    );
    const selectedFilling1 = detailAdonanRows.find(
      (row) => row.jenis_adonan === "FILLING PERTAMA"
    );
    const selectedFilling2 = detailAdonanRows.find(
      (row) => row.jenis_adonan === "FILLING KEDUA"
    );
    const selectedTopping1 = detailAdonanRows.find(
      (row) => row.jenis_adonan === "TOPPING PERTAMA"
    );
    const selectedTopping2 = detailAdonanRows.find(
      (row) => row.jenis_adonan === "TOPPING KEDUA"
    );

    const payload = {
      id_lokasi: parseInt(id_lokasi, 10),
      id_kategori_produk: parseInt(id_kategori_produk, 10),
      id_kategori_bahan_baku: parseInt(id_kategori_bahan_baku, 10),
      id_kategori_adonan_produk: parseInt(
        selectedAdonan?.id_kategori_adonan_produk || 0
      ),
      id_kategori_filling_pertama: parseInt(
        selectedFilling1?.id_kategori_adonan_produk || 0
      ),
      id_kategori_filling_kedua: parseInt(
        selectedFilling2?.id_kategori_adonan_produk || 0
      ),
      id_kategori_topping_pertama: parseInt(
        selectedTopping1?.id_kategori_adonan_produk || 0
      ),
      id_kategori_topping_kedua: parseInt(
        selectedTopping2?.id_kategori_adonan_produk || 0
      ),
      nama_produk: namabarang,
      id_kemasan: 13, // default atau ambil dari input jika ada
      pajak: parseFloat(pajak) / 100,
      margin_kotor: parseFloat(margin_kotor) / 100,
      satuan: id_satuan.toString(), // karena backend minta VARCHAR, kirimkan ID-nya dalam string
      createby: id_user,
      status: 0,
    };

    try {
      const response = await insertMasterDataBarang(payload, token);
      if (response.success) {
        setAlert({
          message: "Produk berhasil ditambahkan.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/master/menu/databarang");
        }, 2000);
      } else {
        setAlert({
          message: response.message || "Gagal menambahkan produk.",
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      setAlert({
        message: error.message || "Terjadi kesalahan saat menyimpan data.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatGr = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "-" : `${num.toFixed(4)} gr`;
  };

  const formatRupiah2 = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "-";
    return `Rp ${num.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  };

  const formatRupiah = (number) => {
    if (number == null || isNaN(number)) return "Data tidak tersedia";
    const inRibuan = number / 10000;
    return `Rp ${inRibuan.toFixed(2).replace(".", ",")}`;
  };

  const formatPercentage = (value) => {
    if (value == null) return "-";
    const number = parseFloat(value);
    return `${Math.round(number)} %`;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

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
          <Link to="/dashboard/master" className="text-xs text-blue-900">
            Master
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500 mx-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <Link to="/dashboard/master/menu/databarang">
            <span className="text-xs text-blue-900">Master Data Barang</span>
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <Link to="/dashboard/master/menu/databarang/insert">
            <span className="text-xs text-gray-400">Tambah Barang</span>
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl text-blue-900">Tambah Barang</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/databarang">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-1">Back</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Form Insert Master Data Barang */}
      <div className="p-2 mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <form onSubmit={handleSubmit} className="">
          <div className="flex gap-1.5">
            {/* Baris 1: Kode Barang, Nama Barang, Toko, kategori */}
            <fieldset className="border border-blue-400 rounded-md p-2 shadow-sm w-1/2">
              <legend className="px-1 text-sm font-bold text-blue-900">
                Info Produk
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Kode Produk:
                  </label>
                  <input
                    type="text"
                    id="kode_barang"
                    name="kode_barang"
                    value={formData.kode_barang}
                    disabled
                    onChange={handleChange}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-200"
                    placeholder="Auto generate"
                    required
                  />
                </div>
                                <div className="">
                  <label className="block font-medium text-blue-900">
                    Dinput Oleh:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={username}
                    className="mt-1 w-full border bg-gray-200 text-gray-600 uppercase text-sm border-gray-300 rounded p-1"
                  />
                </div>
                {/* Toko */}

                <div className="">
                  <label className="block font-medium text-blue-900">
                    Kategori Produk:
                  </label>
                  <select
                    id="id_kategori_produk"
                    name="id_kategori_produk"
                    value={formData.id_kategori_produk}
                    onChange={handleChange}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
                    required
                  >
                    <option value="">Pilih Kategori Produk</option>
                    {masterKategoriProduk.map((kategori) => (
                      <option
                        key={kategori.id_kategori_produk}
                        value={kategori.id_kategori_produk}
                      >
                        {kategori.kode_kategori_produk} -{" "}
                        {kategori.nama_kategori_produk}
                      </option>
                    ))}
                  </select>
                </div>
                                {/* Nama Barang */}
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Nama Produk:
                  </label>
                  <input
                    type="text"
                    id="namabarang"
                    name="namabarang"
                    value={formData.namabarang}
                    onChange={handleChange}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
                    placeholder="Nama Barang"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 mt-4 lg:grid-cols-4 gap-4 text-xs">
                
                {/* Toko */}
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Satuan:
                  </label>
                  <select
                    name="id_satuan"
                    value={formData.id_satuan}
                    onChange={handleChange}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-200"
                    required
                    disabled // ⬅️ Tambahkan ini agar tidak bisa diubah
                  >
                    <option value="">Pilih Satuan</option>
                    {masterSatuan.map((satuan) => (
                      <option key={satuan.id_satuan} value={satuan.id_satuan}>
                        {satuan.nama_satuan} ({satuan.nama_satuan_kategori})
                      </option>
                    ))}
                  </select>
                </div>
                                <div className="">
                  <label className="block font-medium text-blue-900">
                    Kitchen:
                  </label>
                  <select
                    id="id_lokasi"
                    name="id_lokasi"
                    value={formData.id_lokasi}
                    onChange={handleChange}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
                    required
                  >
                    <option value="">Pilih Kitchen</option>
                    {masterLokasi.map((lokasi) => (
                      <option key={lokasi.id_lokasi} value={lokasi.id_lokasi}>
                        {lokasi.nama_lokasi}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Kategori Bahan Baku:
                  </label>
                  <select
                    id="id_kategori_bahan_baku"
                    name="id_kategori_bahan_baku"
                    value={formData.id_kategori_bahan_baku}
                    onChange={handleChange}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
                    required
                  >
                    <option value="">Pilih Kategori Bahan Baku</option>
                    {masterKategoriBahanBaku.map((kat) => (
                      <option
                        key={kat.id_kategori_bahan_baku}
                        value={kat.id_kategori_bahan_baku}
                      >
                        {kat.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="simpan-produk">
                  <label className="block font-medium pb-1 text-blue-900">
                    Simpan
                  </label>
                  <button
                    type="button"
                    onClick={handleSimpanProduk}
                    className={`w-full bg-blue-800 h-8 text-white p-1 rounded-md hover:bg-blue-950 transition duration-300 ${
                      !formData.pajak || !formData.margin_kotor
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={!formData.pajak || !formData.margin_kotor}
                  >
                    Tampilkan Adonan
                  </button>
                </div>
              </div>
            </fieldset>
            {/* Info Harga */}
            <fieldset className="border border-blue-400 rounded-md p-2 w-60 shadow-sm">
              <legend className="px-0.5 text-sm font-bold text-blue-900">
                Info Harga
              </legend>
              <div className="flex-row gap-4 text-xs">
                <div>
                  <label className="block font-medium text-blue-900">
                    Pajak:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="pajak"
                      value={formData.pajak}
                      onChange={handleChange}
                      className="mt-1 w-full border text-sm border-gray-300 rounded-l p-1 bg-gray-50 text-right"
                      required
                    />
                    <div className="flex items-center justify-center bg-gray-200 w-8 mt-1 rounded-r border border-l-0 border-gray-300">
                      <p className="text-sm">%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block font-medium text-blue-900">
                    Margin Kotor:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="margin_kotor"
                      value={formData.margin_kotor}
                      onChange={handleChange}
                      className="mt-1 w-full  border border-l-0 border-gray-300 text-sm p-1 rounded-l text-right"
                      required
                    />
                    <div className="flex items-center justify-center bg-gray-200 w-8 mt-1 rounded-r border border-l-0 border-gray-300">
                      <p className="text-sm">%</p>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
            <fieldset className="border border-blue-400 rounded-md p-2 shadow-sm w-1/2">
              <legend className="px-0.5 text-sm font-bold text-blue-900">
                Info Harga
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-blue-900">
                    Total HPP:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatRupiah(kalkulasiHarga.totalHpp)}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900">
                    Laba Kotor:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatPercentage(kalkulasiHarga.labaKotor)}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900">
                    Harga Jual:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatRupiah(kalkulasiHarga.hargaJual)}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900">
                    Harga Setelah Pajak:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatRupiah(kalkulasiHarga.hargaSetelahPajak)}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900">
                    Harga Jual HPP:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatRupiah(kalkulasiHarga.hargaJualHpp)}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900">
                    % HPP:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatPercentage(kalkulasiHarga.persenHpp)}
                    className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={0}
                    onChange={handleChange}
                    className="w-40 border border-gray-300 text-sm capitalize rounded-md p-1"
                    disabled
                  >
                    <option value={0}>Aktif</option>
                  </select>
                </div>
              </div>
            </fieldset>
            <fieldset className="border border-blue-400 rounded-md p-2 w-60 shadow-sm">
              <legend className="text-sm font-bold text-blue-900">
                Tambah Produk
              </legend>
              <div className="flex-row text-xs">
                <div>
                  <div className="flex">
                    <button
                      type="submit"
                      className={`flex items-center justify-center gap-2 bg-blue-800 text-white text-sm w-full h-10 rounded-md hover:bg-blue-950 transition duration-300 ${
                        submitLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={submitLoading}
                    >
                      <img src={LogoSave} className="w-7 h-7" alt="Simpan" />
                      {submitLoading ? <Loading /> : "Tambah Barang"}
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Detail Adonan Produk */}
          <div className="border mt-2 rounded-md p-2 shadow-sm max-w-4xl">
            <legend className="px-0.5 text-sm font-bold text-blue-900">
              Detail Adonan Produk
            </legend>

            {/* TABLE ADONAN */}
            <div className=" w-full">
              <table className="w-full text-xs text-left text-gray-500 border-collapse">
                <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
                  <tr>
                    <th className="px-2 py-0.5 w-3 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                      No
                    </th>
                    <th className="px-2 py-0.5 w-40 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                      Nama Produk
                    </th>
                    <th className="px-2 py-0.5 w-40 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                      Jenis Adonan
                    </th>
                    <th className="px-2 py-0.5 w-40 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                      Nama Kategori
                    </th>
                    <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                      Jumlah Kebutuhan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailAdonanRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-2 text-gray-600 italic"
                      >
                        Klik tombol <strong>Tampilkan Adonan</strong> untuk
                        menambahkan adonan produk.
                      </td>
                    </tr>
                  ) : (
                    detailAdonanRows.map((row, index) => (
                      <tr
                        key={index}
                        className="border border-gray-500 text-gray-400 hover:bg-gray-200"
                      >
                        <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                          {index + 1}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                          {formData.namabarang}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                          {row.jenis_adonan}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                          <FilterSelect
                            options={masterAdonanKategori.map((kat) => ({
                              label: kat.nama_kategori_adonan_produk,
                              value: kat.id_kategori_adonan_produk,
                            }))}
                            value={{
                              label: row.nama_kategori,
                              value: row.id_kategori_adonan_produk,
                            }}
                            onChange={(selected) =>
                              handleAdonanKategoriChange(index, selected.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1 border border-gray-500 text-black uppercase text-right">
                          {formatGr(row.jumlah_kebutuhan)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Subtotal Table */}
              {detailAdonanRows.length > 0 && (
                <div className="mt-1">
                  <table className="w-full text-xs text-left text-gray-500 border-collapse border">
                    <tfoot>
                      <tr className="font-semibold text-blue-900 bg-gray-200">
                        <td
                          colSpan={4}
                          className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-200"
                        >
                          Total Jumlah Kebutuhan
                        </td>
                        <td className="px-1 py-0.5 border border-gray-500 font-semibold bg-lime-400 text-right">
                          {formatGr(
                            detailAdonanRows.reduce(
                              (sum, row) =>
                                sum + Number(row.jumlah_kebutuhan || 0),
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-2">
              <div className="justify-end flex">
                <button
                  type="button"
                  onClick={handleSimpanDetailAdonan}
                  className={`simpan-detail w-32 text-xs bg-blue-800 h-8 text-white p-1 rounded-md hover:bg-blue-950 transition duration-300 ${
                    !isProdukSaved || !isInfoProdukValid()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!isProdukSaved || !isInfoProdukValid()}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>

          {/* Detail Bahan baku */}
          <div
            className="overflow-x-auto mt-2 border rounded p-2"
            style={{ height: "30vh" }}
          >
            <p className="text-sm font-semibold text-blue-900  left-1">
              Detail Bahan Baku
            </p>
            <table className="whitespace-nowrap w-full mt-0.5 text-xs text-left text-gray-500 border-collapse border">
              <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
                <tr>
                  {/* (thead manual – tidak diubah) */}
                  <th className="px-2 py-0.5 w-3 sticky top-0 border border-gray-500 bg-gray-200 z-20">
                    No
                  </th>
                  <th className="px-2 py-0.5 w-52 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Nama Produk
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Jenis Adonan
                  </th>
                  <th className="px-2 py-0.5 w-40 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Kategori Adonan Produk
                  </th>
                  <th className="px-2 py-0.5 w-14 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Kode
                  </th>
                  <th className="px-2 py-0.5 w-52 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Nama Bahan Baku
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Jumlah Kebutuhan
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Harga Beli barang
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Total Biaya Adonan
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Total Harga
                  </th>
                </tr>
              </thead>
              <tbody>
                {bahanBakuDetailRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="text-center py-2 italic text-gray-500"
                    >
                      Belum ada data bahan baku.
                    </td>
                  </tr>
                ) : (
                  bahanBakuDetailRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-200">
                      <td className="px-2 py-1 border border-gray-500">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1 border border-gray-500">
                        {r.nama_produk}
                      </td>
                      <td className="px-2 py-1 border border-gray-500">
                        {r.jenis_adonan}
                      </td>
                      <td className="px-2 py-1 border border-gray-500">
                        {r.nama_kategori_adonan_produk}
                      </td>
                      <td className="px-2 py-1 border border-gray-500">
                        {r.kode_bahan_baku}
                      </td>
                      <td className="px-2 py-1 border border-gray-500">
                        {r.nama_bahan_baku}
                      </td>
                      <td className="px-2 py-1 border border-gray-500 text-right">
                        {formatGr(r.jumlah_kebutuhan)}
                      </td>
                      <td className="px-2 py-1 border border-gray-500 text-right">
                        {formatRupiah2(r.harga_beli_barang)}
                      </td>
                      <td className="px-2 py-1 border border-gray-500 text-right">
                        {formatRupiah2(r.biaya_total_adonan)}
                      </td>
                      <td className="px-2 py-1 border border-gray-500 text-right">
                        {formatRupiah2(r.total_harga)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Subtotal Table */}
          <div className="mt-1">
            <table className="w-full text-xs text-left text-gray-500 border-collapse border">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <tfoot>
                <tr className="font-semibold text-blue-900 bg-gray-200">
                  <td
                    colSpan={7}
                    className="px-1 py-0.5 border border-gray-500 text-right uppercase bg-gray-200"
                  >
                    Total Jumlah Kebutuhan
                  </td>
                  <td className="px-1 py-0.5 border border-gray-500 bg-lime-400 text-right">
                    {formatGr(
                      bahanBakuDetailRows.reduce(
                        (sum, r) => sum + Number(r.jumlah_kebutuhan || 0),
                        0
                      )
                    )}
                  </td>
                  <td className="px-1 py-0.5 border border-gray-500 text-right uppercase bg-gray-200">
                    Total Harga Beli Barang
                  </td>
                  <td className="px-1 py-0.5 border border-gray-500 bg-lime-400 text-right">
                    {formatRupiah2(
                      bahanBakuDetailRows.reduce(
                        (sum, r) => sum + Number(r.harga_beli_barang || 0),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </form>
      </div>
    </div>
  );
}
