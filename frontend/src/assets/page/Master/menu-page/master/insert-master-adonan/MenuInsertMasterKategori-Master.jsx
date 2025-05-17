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
  getLaporanStokBarangAll,
  insertDetailAdonan
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import LogoSave from "../../../../../image/icon/logo-save.svg";
import LogoPlus from "../../../../../image/icon/logo-plus.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

function FilterSelect({ label, options, value, onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const matched = options.find((opt) => opt.value === value);
    setInputValue(matched ? matched.label : "");
  }, [value, options]);

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
    onChange(option.value); // ⬅️ Kembalikan hanya value
    setShowOptions(false);
  };

  return (
    <div className="relative w-full text-xs" ref={wrapperRef}>
      {label && (
        <label className="block text-blue-900 font-semibold text-xs mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        className="border border-gray-300 text-xs rounded bg-gray-100 p-1 w-full"
        value={inputValue}
        onChange={(e) => !disabled && setInputValue(e.target.value)}
        onFocus={() => !disabled && setShowOptions(true)}
        placeholder="Ketik atau pilih..."
        disabled={disabled}
      />
      {showOptions && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1 shadow-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(option)}
                className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-2 py-1 text-gray-500">Tidak ditemukan</li>
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
  const [stokBarangData, setStokBarangData] = useState([]);
  const [masterLokasi, setMasterLokasi] = useState([]);
  const [masterKategoriProduk, setMasterKategoriProduk] = useState([]);
  const [masterKategoriBahanBaku, setMasterKategoriBahanBaku] = useState([]);
  const [isProdukSaved, setIsProdukSaved] = useState(false);
  const [bahanBakuDetailRows, setBahanBakuDetailRows] = useState([]);
  const [bahanBakuRows, setBahanBakuRows] = useState([]);

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
  const isNamaAdonanValid = formData.namabarang.trim() !== "";
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

  useEffect(() => {
    const fetchStokBarang = async () => {
      try {
        const data = await getLaporanStokBarangAll(token);
        console.log("data:", data);
        setStokBarangData(
          Array.isArray(data) ? data : Object.values(data || {})
        );
      } catch (err) {
        console.error("Gagal mengambil data stok:", err);
      }
    };

    fetchStokBarang();
  }, [token]);

  const handleAddRow = () => {
    if (bahanBakuRows.length >= 10) return;

    // Cek row kosong
    const hasEmptyRow = bahanBakuRows.some(
      (row) =>
        !row.nama_kategori_bahan_baku ||
        !row.kode_bahan_baku ||
        !row.nama_bahan_baku ||
        !row.jumlah_kebutuhan ||
        isNaN(Number(row.jumlah_kebutuhan)) ||
        Number(row.jumlah_kebutuhan) <= 0
    );

    if (hasEmptyRow) {
      setAlert({
        message: "Isi terlebih dahulu row yang kosong sebelum menambahkan.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert({ visible: false }), 2000);
      return;
    }

    // ✅ Cek duplikat Kode/Nama Bahan Baku
    const kodeList = bahanBakuRows.map((r) => r.kode_bahan_baku);
    const namaList = bahanBakuRows.map((r) => r.nama_bahan_baku);
    const hasDuplicate =
      new Set(kodeList).size !== kodeList.length ||
      new Set(namaList).size !== namaList.length;

    if (hasDuplicate) {
      setAlert({
        message: "Terdapat Kode atau Nama Bahan Baku yang duplikat.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert({ visible: false }), 2000);
      return;
    }

    // Tambahkan baris baru
    setBahanBakuRows((prev) => [
      ...prev,
      {
        id_kategori_bahan_baku: "",
        nama_kategori_bahan_baku: "",
        kode_bahan_baku: "",
        nama_bahan_baku: "",
        id_satuan: "",
        nama_satuan: "",
        stok_bahan_baku: 0,
        jumlah_kebutuhan: "",
        harga_beli_barang: 0,
        total_harga: 0,
        biaya_total_adonan: 0,
      },
    ]);
  };

  const handleRowChange = (index, field, value) => {
    setBahanBakuRows((prevRows) => {
      const updated = [...prevRows];

      // ⛔ Cek duplikat saat user pilih kode atau nama bahan baku
      if (field === "kode_bahan_baku") {
        const isDuplicate = prevRows.some(
          (r, i) => r.kode_bahan_baku === value && i !== index
        );
        if (isDuplicate) {
          setAlert({
            message: "Kode Bahan Baku sudah digunakan di baris lain.",
            type: "warning",
            visible: true,
          });
          setTimeout(() => setAlert({ visible: false }), 3000);
          return prevRows;
        }
      }

      if (field === "nama_bahan_baku") {
        const isDuplicate = prevRows.some(
          (r, i) => r.nama_bahan_baku === value && i !== index
        );
        if (isDuplicate) {
          setAlert({
            message: "Nama Bahan Baku sudah digunakan di baris lain.",
            type: "warning",
            visible: true,
          });
          setTimeout(() => setAlert({ visible: false }), 2000);
          return prevRows;
        }
      }

      updated[index][field] = value;

      const related = stokBarangData.find(
        (item) =>
          item.nama_kategori_bahan_baku ===
            updated[index].nama_kategori_bahan_baku &&
          ((field === "kode_bahan_baku" && item.kode_bahan_baku === value) ||
            (field === "nama_bahan_baku" && item.nama_bahan_baku === value))
      );

      if (related) {
        updated[index] = {
          ...updated[index],
          id_bahan_baku: related.id_bahan_baku,
          kode_bahan_baku: related.kode_bahan_baku,
          nama_bahan_baku: related.nama_bahan_baku,
          id_kategori_bahan_baku: related.id_kategori_bahan_baku,
          nama_kategori_bahan_baku: related.nama_kategori_bahan_baku,
          id_satuan: related.id_satuan,
          nama_satuan: related.nama_satuan,
          stok_bahan_baku: related.stok_bahan_baku,
          harga_beli_barang: related.harga_beli_barang,
        };
      }

      if (updated[index].jumlah_kebutuhan && updated[index].harga_beli_barang) {
        const jumlah = parseFloat(updated[index].jumlah_kebutuhan);
        const harga = parseFloat(updated[index].harga_beli_barang);
        updated[index].total_harga = jumlah * harga;
        updated[index].biaya_total_adonan = jumlah * harga;
      }

      return updated;
    });
  };

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

const handleSimpanProduk = async () => {
  const namaAdonan = formData.namabarang.trim();

  if (!namaAdonan) {
    setAlert({
      message: "Nama Adonan wajib diisi.",
      type: "error",
      visible: true,
    });
    return;
  }

  const bahanValid = bahanBakuRows.filter(
    (b) =>
      b.kode_bahan_baku &&
      b.nama_bahan_baku &&
      !isNaN(b.jumlah_kebutuhan) &&
      Number(b.jumlah_kebutuhan) > 0
  );

  if (bahanValid.length < 2) {
    setAlert({
      message: "Minimal 2 bahan baku harus diisi.",
      type: "error",
      visible: true,
    });
    return;
  }

  try {
    setSubmitLoading(true);

    // Format payload untuk endpoint /insertmasteradonan
    const payload = {
      nama_adonan: namaAdonan,
      createby: id_user,
      status: 0,
      bahan_baku: bahanValid.map((b) => ({
        id_bahan_baku: b.id_bahan_baku, // atau ganti ke ID asli kalau tersedia
        jumlah_kebutuhan: parseFloat(b.jumlah_kebutuhan),
      })),
    };

    const response = await insertDetailAdonan(token, payload);

    if (response.success) {
      setAlert({
        message: "Adonan dan bahan baku berhasil ditambahkan.",
        type: "success",
        visible: true,
      });
      setIsProdukSaved(true);
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        window.location.reload();
      }, 2000);
    } else {
      throw new Error(response.message || "Gagal menyimpan adonan.");
    }
  } catch (error) {
    setAlert({
      message: error.message || "Terjadi kesalahan saat menyimpan adonan.",
      type: "error",
      visible: true,
    });
  } finally {
    setSubmitLoading(false);
  }
};

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [filteredBahan, setFilteredBahan] = useState([]);
  const [form, setForm] = useState({
    nama_kategori_bahan_baku: "",
    kode_bahan_baku: "",
    nama_bahan_baku: "",
    jumlah_kebutuhan: "",
    id_satuan: "",
  });

  const [autoFields, setAutoFields] = useState({
    stok_bahan_baku: "",
    harga_beli_barang: "",
    total_harga: "",
    biaya_total_adonan: "",
  });

  useEffect(() => {
    const kategoriSet = new Set(
      stokBarangData.map((item) => item.nama_kategori_bahan_baku)
    );
    setKategoriOptions(Array.from(kategoriSet));
  }, [stokBarangData]);

  useEffect(() => {
    const bahanFiltered = stokBarangData.filter(
      (item) => item.nama_kategori_bahan_baku === form.nama_kategori_bahan_baku
    );
    setFilteredBahan(bahanFiltered);
  }, [form.nama_kategori_bahan_baku]);

  useEffect(() => {
    let selected;
    if (form.kode_bahan_baku) {
      selected = stokBarangData.find(
        (item) => item.kode_bahan_baku === form.kode_bahan_baku
      );
    } else if (form.nama_bahan_baku) {
      selected = stokBarangData.find(
        (item) => item.nama_bahan_baku === form.nama_bahan_baku
      );
    }
    if (selected) {
      setForm((prev) => ({
        ...prev,
        kode_bahan_baku: selected.kode_bahan_baku,
        nama_bahan_baku: selected.nama_bahan_baku,
      }));
      setAutoFields({
        stok_bahan_baku: selected.stok_bahan_baku,
        harga_beli_barang: selected.harga_beli_barang,
        total_harga:
          parseFloat(form.jumlah_kebutuhan || 0) *
          parseFloat(selected.harga_beli_barang || 0),
        biaya_total_adonan: 0,
      });
    }
  }, [form.kode_bahan_baku, form.nama_bahan_baku, form.jumlah_kebutuhan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
  const handleRefresh = () => window.location.reload();

  // Submit (Hanya console.log payload)
const handleSubmit = async (e) => {
  e.preventDefault();

  const {
    id_lokasi,
    id_kategori_produk,
    id_kategori_bahan_baku,
    pajak,
    margin_kotor,
    id_satuan,
    namabarang,
  } = formData;

  if (!id_lokasi || !id_kategori_produk || !id_kategori_bahan_baku || !pajak || !margin_kotor || !namabarang.trim()) {
    setAlert({
      message: "Mohon lengkapi semua data produk terlebih dahulu.",
      type: "warning",
      visible: true,
    });
    setTimeout(() => setAlert({ visible: false }), 2000);

    return;
  }

  const getKategoriId = (jenis) => {
    const selected = detailAdonanRows.find((row) => row.jenis_adonan === jenis);
    return selected?.id_kategori_adonan_produk || null;
  };

  const payload = {
    id_lokasi: Number(id_lokasi),
    id_kategori_produk: Number(id_kategori_produk),
    id_kategori_bahan_baku: Number(id_kategori_bahan_baku),
    id_kategori_adonan_produk: getKategoriId("ADONAN"),
    satuan: id_satuan.toString(),
    createby: id_user,
    status: 0,
  };

  try {
    setSubmitLoading(true);
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
      throw new Error(response.message || "Gagal menambahkan produk.");
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

  useEffect(() => {
    // Auto tambah baris pertama saat buka halaman
    if (bahanBakuRows.length === 0) {
      handleAddRow();
    }
  }, []);

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
            to="/dashboard/master/menu/adonan"
            className="text-xs font-semibold text-blue-900"
          >
            Master Adonan
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
            to=""
            className="text-xs font-semibold text-gray-400"
          >
            Tambah Master Adonan
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
        <p className="text-xl text-blue-900">Tambah Barang</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/adonan">
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
            <fieldset className="border border-blue-400 rounded-md p-2 shadow-sm">
              <legend className="text-sm font-bold text-blue-900">
                Tambah Barang
              </legend>
              <div className="flex text-xs gap-2">
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Diinput Oleh:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={username}
                    className="mt-1 w-full border bg-gray-200 text-gray-600 uppercase text-sm border-gray-300 rounded p-1"
                  />
                </div>
                {/* Nama Barang */}
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Nama Adonan:
                  </label>
                  <input
                    type="text"
                    id="namabarang"
                    name="namabarang"
                    value={formData.namabarang}
                    onChange={handleFormDataChange}
                    className="mt-1 w-full border text-xs border-gray-300 rounded p-1 bg-gray-50"
                    placeholder="Nama Barang"
                  />
                </div>
              </div>
              <div className="flex text-xs gap-2 mt-2">
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Dibuat Tanggal:
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
                {/* Nama Barang */}
                <div className="">
                  <label className="block font-medium text-blue-900">
                    Status Adonan:
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={0}
                    onChange={handleChange}
                    className="mt-1 w-44 border bg-gray-200 text-gray-600 uppercase text-sm border-gray-300 rounded p-1"
                    disabled
                  >
                    <option value={0}>Aktif</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-blue-400 rounded-md p-2 w-44 shadow-sm">
              <legend className="text-sm font-bold text-blue-900">
                Tambah Adonan
              </legend>
              <div className="flex-row text-xs">
                <div>
                  <div className="flex">
<button
  type="button" // Ubah dari "submit" agar tidak trigger form submit
  onClick={handleSimpanProduk}
  className={`flex items-center justify-center gap-2 bg-blue-800 text-white text-sm w-full h-10 rounded-md hover:bg-blue-950 transition duration-300 ${
    submitLoading ? "opacity-50 cursor-not-allowed" : ""
  }`}
  disabled={submitLoading}
>
  <img src={LogoSave} className="w-7 h-7" alt="Simpan" />
  {submitLoading ? <Loading /> : "Tambah Adonan"}
</button>

                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Detail Bahan baku */}
        <div className="overflow-x-auto w-full mt-2" style={{ height: "56vh" }}>
                              <p className="text-sm font-semibold text-blue-900  left-1">
          Detail Bahan Baku
          </p>
          <table
            className="w-full text-xs text-left mt-0.5 text-gray-500 border-collapse"
          >
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                  <th className="px-1 py-0.5 w-4 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    No
                  </th>
                  <th className="px-1 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Kategori Bahan Baku
                  </th>
                  <th className="px-1 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Kode Bahan Baku
                  </th>
                  <th className="px-1 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Nama Bahan Baku
                  </th>
                  <th className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Jumlah Stok
                  </th>
                  <th className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Jml. Kebutuhan
                  </th>
                  <th className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Harga Beli
                  </th>
                  <th className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Total Biaya Adonan
                  </th>
                  <th className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Total Harga
                  </th>
                </tr>
              </thead>
              <tbody>
                {bahanBakuRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="border px-2 py-1 text-center">{idx + 1}</td>

                    {/* Kategori Bahan Baku */}
                    <td className="border px-2 py-1">
<FilterSelect
  value={row.nama_kategori_bahan_baku}
  options={[...new Set(stokBarangData.map((d) => d.nama_kategori_bahan_baku))].map((k) => ({
    value: k,
    label: k,
  }))}
  onChange={(val) => handleRowChange(idx, "nama_kategori_bahan_baku", val)}
  disabled={!isNamaAdonanValid}
/>

                    </td>

                    {/* Kode Bahan Baku */}
                    <td className="border px-2 py-1">
<FilterSelect
  value={row.kode_bahan_baku}
  options={stokBarangData
    .filter((d) => d.nama_kategori_bahan_baku === row.nama_kategori_bahan_baku)
    .map((d) => ({
      value: d.kode_bahan_baku,
      label: d.kode_bahan_baku,
    }))}
  onChange={(val) => handleRowChange(idx, "kode_bahan_baku", val)}
  disabled={!isNamaAdonanValid}
/>
                    </td>

                    {/* Nama Bahan Baku */}
                    <td className="border px-2 py-1">
<FilterSelect
  value={row.nama_bahan_baku}
  options={stokBarangData
    .filter((d) => d.nama_kategori_bahan_baku === row.nama_kategori_bahan_baku)
    .map((d) => ({
      value: d.nama_bahan_baku,
      label: d.nama_bahan_baku,
    }))}
  onChange={(val) => handleRowChange(idx, "nama_bahan_baku", val)}
  disabled={!isNamaAdonanValid}
/>
                    </td>

                    {/* Jumlah Stok */}
                    <td className="border px-2 py-1 text-right">
                      {row.stok_bahan_baku} {row.nama_satuan}
                    </td>

                    {/* Jumlah Kebutuhan */}
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        className="w-full text-xs border border-gray-400 bg-gray-100 rounded p-1"
                        value={row.jumlah_kebutuhan}
                        placeholder="Jml. Kebutuhan"
                        onChange={(e) => {
                          const val = e.target.value;
                          // Hanya angka dan dalam rentang 1 - 10000
                          if (
                            /^\d*$/.test(val) &&
                            (val === "" ||
                              (parseInt(val) >= 1 && parseInt(val) <= 10000))
                          ) {
                            handleRowChange(idx, "jumlah_kebutuhan", val);
                          }
                        }}
                      />
                    </td>

                    {/* Harga Beli */}
                    <td className="border px-2 py-1 text-right">
                      {parseFloat(row.harga_beli_barang || 0).toLocaleString(
                        "id-ID",
                        {
                          style: "currency",
                          currency: "IDR",
                        }
                      )}
                    </td>

                    {/* Total Biaya Adonan */}
                    <td className="border px-2 py-1 text-right">
                      {parseFloat(row.biaya_total_adonan || 0).toLocaleString(
                        "id-ID",
                        {
                          style: "currency",
                          currency: "IDR",
                        }
                      )}
                    </td>

                    {/* Total Harga */}
                    <td className="border px-2 py-1 text-right">
                      {parseFloat(row.total_harga || 0).toLocaleString(
                        "id-ID",
                        {
                          style: "currency",
                          currency: "IDR",
                        }
                      )}
                    </td>
                  </tr>
                ))}

                {/* Baris tombol tambah-bahan-baku */}
                <tr>
                  <td className="border text-center justify-center flex">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded flex justify-center items-center ${
                        isNamaAdonanValid
                          ? "bg-blue-900 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      } transition`}
                      onClick={() => {
                        if (isNamaAdonanValid) handleAddRow();
                      }}
                      title="Tambah Bahan Baku"
                    >
                      <img src={LogoPlus} className="h-4 w-4" alt="" />
                    </button>
                  </td>
                  <td
                    colSpan={8}
                    className="border px-2 py-1 text-gray-400 italic"
                  >
                    Tambah bahan baku baru, <span className="text-red-400">minimal 2 bahan baku dari adonan</span> 
                  </td>
                </tr>
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
                    colSpan={9}
                    className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-300"
                  >
                    Sub Total Biaya Adonan
                  </td>
                  <td className="px-1 py-0.5 border border-gray-500 font-semibold bg-lime-400">
                    {/* {formatRupiah(
                    filteredBahan.reduce(
                      (sum, r) => sum + Number(r.biaya_total_adonan),
                      0
                    )
                  )} */}
                  </td>
                  <td
                    colSpan={9}
                    className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-300"
                  >
                    Total Jumlah Kebutuhan
                  </td>
                  <td className="px-1 py-0.5 border border-gray-500 font-semibold bg-lime-400">
                    {/* {filteredBahan.reduce(
                    (sum, r) => sum + Number(r.jumlah_kebutuhan || 0),
                    0
                  ) + " GR"} */}
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
