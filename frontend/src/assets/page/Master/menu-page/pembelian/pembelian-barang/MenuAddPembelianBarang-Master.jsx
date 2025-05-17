import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

/* =================================================================================
   SERVICE API                                                                     */
import {
  getMasterLokasiStore,
  getMasterLokasiKitchen,
  getMasterJenisPesanan,
  getMasterPelanggan,
  getMasterKategoriProduk,
  getAnalisaPenjualanDetailed,
  insertMasterPesananPembelian,
} from "../../../../../services/apiService";

/* =================================================================================
   KOMPONEN & ASET                                                                 */
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import IconDelete from "../../../../../image/icon/logo-delete.svg";
import LogoPrint from "../../../../../image/icon/logo-print.svg";
import LogoSave from "../../../../../image/icon/logo-save.svg";

/* --------------------------------------------------------------------------
   FilterSelect – dropdown autocomplete
---------------------------------------------------------------------------*/
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFiltered] = useState(options);
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setFiltered(
      (options || []).filter((o) =>
        typeof o === "string"
          ? o.toLowerCase().includes(inputValue.toLowerCase())
          : false
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const select = (opt) => {
    onChange(opt);
    setInputValue(opt);
    setShow(false);
  };

  return (
    <div ref={ref} className="relative w-full md:w-44">
      <label className="block mb-1 text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        placeholder="Pilih atau ketik..."
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue("");
            onChange("");
            setShow(false);
          }}
          className="absolute top-6 right-2 text-red-500 text-sm"
        >
          &times;
        </button>
      )}

      {show && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
          {filteredOptions.map((opt, i) => (
            <li
              key={i}
              onClick={() => select(opt)}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
      {show && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
          Tidak ada opsi
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   MultiSelectKategori – checkbox dropdown
---------------------------------------------------------------------------*/
function MultiSelectKategori({
  options = [],
  selectedIds = [],
  onChangeSelected,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = (id) =>
    onChangeSelected(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );

  const names = options
    .filter((o) => selectedIds.includes(o.id_kategori_produk))
    .map((o) => o.nama_kategori_produk)
    .join(", ");

  return (
    <div ref={ref} className="relative w-full">
      <input
        readOnly
        value={names}
        placeholder="- pilih kategori -"
        onClick={() => setOpen((o) => !o)}
        className="w-full border h-7 text-xs border-gray-300 rounded p-1 bg-white cursor-pointer"
      />
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded w-full max-h-48 overflow-y-auto">
          {options.map((o) => (
            <label
              key={o.id_kategori_produk}
              className="flex items-center gap-1 px-1 py-0.5 m-1 hover:bg-gray-100 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(o.id_kategori_produk)}
                onChange={() => toggle(o.id_kategori_produk)}
              />
              {o.nama_kategori_produk}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   MAIN COMPONENT
===========================================================================*/
export default function MenuAddPembelianBarangBasetroli() {
  /* ---------- Redux ---------- */
  const token = useSelector((s) => s.auth.token);
  const id_user = useSelector((s) => s.auth.id_user);
  const kode_toko = useSelector((s) => s.auth.kode_toko);
  const id_tokoInt = parseInt(
    useSelector((s) => s.auth.id_toko),
    10
  );

  /* ---------- Local state ---- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  /* master data */
  const [masterStore, setMasterStore] = useState([]);
  const [masterKitchen, setMasterKitchen] = useState([]);
  const [masterJenisPesanan, setMasterJenisPesanan] = useState([]);
  const [masterPelanggan, setMasterPelanggan] = useState([]);
  const [masterKategoriProduk, setMasterKategoriProduk] = useState([]);

  /* info transaksi */
  const [storeTujuan, setStoreTujuan] = useState("");
  const [kitchenTujuan, setKitchenTujuan] = useState("");
  const [jenisPembelian, setJenisPembelian] = useState("");
  const [pembeliKhusus, setPembeliKhusus] = useState("");

  /* tanggal */
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [tanggalTransaksi, setTanggalTransaksi] = useState(todayStr);
  const [tanggalKirim, setTanggalKirim] = useState("");

  /* filter penjualan */
  const [tglAwal, setTglAwal] = useState("");
  const [tglAkhir, setTglAkhir] = useState("");
  const [selectedKategoriIds, setSelectedKategoriIds] = useState([]);

  /* filter tambahan */
  const [kodeFilter, setKodeFilter] = useState("");
  const [namaFilter, setNamaFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* tabel & view state */
  const [tableRows, setTableRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  /* catatan */
  const [catatanKitchen, setCatatanKitchen] = useState("");
  const paginate = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  /* ---------- LOAD master data ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const storeRes = await getMasterLokasiStore(token);
        const storeList = Object.values(storeRes || {}).filter(
          (l) => l.status === 0
        );
        setMasterStore(storeList);
        if (storeList.length) setStoreTujuan(storeList[0].id_lokasi);

        const kitchenRes = await getMasterLokasiKitchen(token);
        const kitchenList = Object.values(kitchenRes || {}).filter(
          (l) => l.status === 0
        );
        setMasterKitchen(kitchenList);
        if (kitchenList.length) setKitchenTujuan(kitchenList[0].id_lokasi);

        const jenisRes = await getMasterJenisPesanan(token);
        const jenisList = Object.values(jenisRes || {}).filter(
          (j) => j.status === 0
        );
        setMasterJenisPesanan(jenisList);
        if (jenisList.length)
          setJenisPembelian(jenisList[0].id_master_jenis_pesanan);

const pelRes = await getMasterPelanggan(token);
const pelList = Object.values(pelRes || {}).filter(
  (p) =>
    Number(p.status) === 0 && // Pastikan status benar-benar angka dan 0
    !!p.id_master_pelanggan_external && // pastikan ada id
    !!p.nama_pelanggan_external // pastikan ada nama
);
setMasterPelanggan(pelList);


        const katRes = await getMasterKategoriProduk(token);
        const katList = Object.values(katRes || {}).filter(
          (k) => k.status === 0
        );
        setMasterKategoriProduk(katList);
      } catch (e) {
        setError(e.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  /* ------------------------------------------------------------------------
     Tampilkan barang berdasarkan filter analisa penjualan atau khusus
  ------------------------------------------------------------------------ */
  const handleShowBarang = async () => {
    // normalisasi hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // 0️⃣ Validasi khusus untuk Reguler (jenis=1)
    if (Number(jenisPembelian) === 1) {
      // a) Tgl Transaksi ∈ [today .. today+2]
      const transDate = new Date(tanggalTransaksi);
      transDate.setHours(0, 0, 0, 0);
      const daysFromToday = (transDate - today) / (1000 * 60 * 60 * 24);
      if (daysFromToday < 0 || daysFromToday > 2) {
        setAlert({
          message:
            "Untuk Pembelian Reguler, Tanggal Transaksi harus antara hari ini dan maksimal 2 hari ke depan.",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
  
      // b) Tgl Kirim ∈ [transDate .. transDate+2]
      if (!tanggalKirim) {
        setAlert({
          message: "Untuk Pembelian Reguler, Tanggal Kirim wajib diisi.",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
      const kirimDate = new Date(tanggalKirim);
      kirimDate.setHours(0, 0, 0, 0);
      const daysFromTrans = (kirimDate - transDate) / (1000 * 60 * 60 * 24);
      if (daysFromTrans < 0 || daysFromTrans > 4) {
        setAlert({
          message:
            "Untuk Pembelian Reguler, Tanggal Kirim maksimal 2 hari setelah Tanggal Transaksi.",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
  
      // c) Rentang Tgl Awal–Akhir wajib diisi & minimal 3 bulan kalender
      if (!tglAwal || !tglAkhir) {
        setAlert({
          message:
            "Untuk Pembelian Reguler, pilih rentang Tanggal Awal & Akhir minimal 3 bulan.",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
      const start = new Date(tglAwal);
      const end = new Date(tglAkhir);
      const monthDiff =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;
      if (monthDiff < 3) {
        setAlert({
          message:
            "Rentang Tanggal Awal & Akhir untuk Pembelian Reguler harus minimal 3 bulan.",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
    }
  
    // 1️⃣ Validasi umum untuk Reguler & Khusus (khusus skip cek awal)
    if (Number(jenisPembelian) !== 2) {
      // (tglKirim sudah dicek di blok reguler, tapi kalau jenis=1 logika sama)
      if (!tanggalKirim || new Date(tanggalKirim) < new Date(tanggalTransaksi)) {
        setAlert({
          message:
            "Tanggal Kirim wajib diisi dan tidak boleh sebelum Tanggal Transaksi.",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
      if (!tglAwal || !tglAkhir || new Date(tglAkhir) < new Date(tglAwal)) {
        setAlert({
          message:
            "Pilih rentang tanggal penjualan yang valid (Awal ≤ Akhir).",
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 4400);
        return;
      }
    }
  
    // 2️⃣ Pilih minimal satu kategori
    if (!selectedKategoriIds.length) {
      setAlert({
        message: "Pilih minimal satu kategori produk.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((p) => ({ ...p, visible: false }));
      }, 4400);
      return;
    }
  
    // 3️⃣ Fetch & tampilkan data
    try {
      setLoading(true);
      const raw = await getAnalisaPenjualanDetailed(token);
      const flat = (arr) =>
        arr.flatMap((it) =>
          typeof it === "object" && !Array.isArray(it)
            ? Object.values(it)
            : it
        );
      const all = Array.isArray(raw)
        ? flat(raw)
        : flat(Object.values(raw || {}));
  
      // group & filter sesuai kategori, tanggal & lokasi
      const map = new Map();
      all.forEach((d) => {
        if (!selectedKategoriIds.includes(d.id_kategori_produk)) return;
        if (Number(jenisPembelian) !== 2 && d.tanggal_transaksi) {
          const tgl = new Date(d.tanggal_transaksi);
          if (tgl < new Date(tglAwal) || tgl > new Date(tglAkhir)) return;
          if (String(d.id_lokasi) !== String(storeTujuan)) return;
          if (String(d.id_kitchen) !== String(kitchenTujuan)) return;
        }
        if (!map.has(d.kode_barang)) {
          const base = {
            kode_barang: d.kode_barang,
            namabarang:  d.nama_produk,
            harga:       d.hpp_satuan || d.harga,
            qtyBeli:     "",
            harga_jual:  parseFloat(d.harga_jual) || 0,
              status_produk: Number(d.status_produk) || 0,
            id_kategori_produk:        d.id_kategori_produk,
            id_kategori_bahan_baku:    d.id_kategori_bahan_baku,
            id_kategori_adonan_produk: d.id_kategori_adonan_produk,
            id_kategori_filling_pertama: d.id_kategori_filling_pertama,
            id_kategori_filling_kedua:   d.id_kategori_filling_kedua,
            id_kategori_topping_pertama: d.id_kategori_topping_pertama,
            id_kategori_topping_kedua:   d.id_kategori_topping_kedua,
          };
          if (Number(jenisPembelian) !== 2) {
            base.totalJual  = 0;
            base.totalRetur = 0;
            base.stok_toko  = d.stok_toko;
            base.umur_stok  = d.umur_stok;
          }
          map.set(d.kode_barang, base);
        }
        if (Number(jenisPembelian) !== 2) {
          const o = map.get(d.kode_barang);
          o.totalJual  += Number(d.jumlah || 0);
          o.totalRetur += Number(d.jumlah_retur || 0);
        }
      });
  
      // hitung final rows
      const rows = Array.from(map.values()).map((r) => {
        if (Number(jenisPembelian) !== 2) {
          const start = new Date(tglAwal);
          const end   = new Date(tglAkhir);
          const diffDays =
            Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return {
            ...r,
            jumlahJual:       r.totalJual,
            jumlahRetur:      r.totalRetur,
            penjualanPerHari: Math.round((r.totalJual - r.totalRetur) / diffDays),
          };
        }
        return r;
      });
  
      setTableRows(rows);
      setCurrentPage(1);
      setAlert({
        message: `Menampilkan ${rows.length} barang.`,
        type: "info",
        visible: true,
      });
    } catch (e) {
      setAlert({
        message: e.message || "Error memuat data.",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert((p) => ({ ...p, visible: false })), 2400);
    }
  };
  
  /* helper cari kode lokasi / pelanggan */
  const getKodeLokasi = (id, list) => {
    const f = list.find((x) => String(x.id_lokasi) === String(id));
    return f ? f.kode_lokasi : "";
  };
  const getKodePelangganExternal = (id, list) => {
    const f = list.find(
      (x) => String(x.id_master_pelanggan_external) === String(id)
    );
    return f ? f.kode_pelanggan_external : "";
  };

  /* ------------------------------------------------------------------------
   Simpan pemesanan
------------------------------------------------------------------------ */
  const handleSavePemesanan = async () => {
    // 1️⃣ Filter baris dengan qty > 0
    const detailRows = tableRows.filter((r) => Number(r.qtyBeli) > 0);
    if (!detailRows.length) {
      setAlert({
        message: "Tidak ada item dengan jumlah pembelian.",
        type: "warning",
        visible: true,
      });
      return;
    }

    // 2️⃣ Validasi field transaksi
    if (
      !storeTujuan ||
      !kitchenTujuan ||
      !jenisPembelian ||
      !tanggalTransaksi ||
      !tanggalKirim
    ) {
      setAlert({
        message: "Lengkapi semua field Info Transaksi.",
        type: "warning",
        visible: true,
      });
      return;
    }

    
    // 3️⃣ Spesial untuk pembeli khusus
    if (Number(jenisPembelian) === 2 && !pembeliKhusus) {
      setAlert({
        message: "Pilih Pembeli Khusus untuk jenis pembelian ini.",
        type: "warning",
        visible: true,
      });
      return;
    }

    // 4️⃣ Siapkan payload
    const kodePelangganExternal =
      Number(jenisPembelian) === 2
        ? getKodePelangganExternal(pembeliKhusus, masterPelanggan)
        : "";

    const masterPayload = {
      kode_sales_order: 0,
      id_store: Number(storeTujuan),
      id_kode_store: getKodeLokasi(storeTujuan, masterStore),
      id_kitchen: Number(kitchenTujuan),
      jenis_pesanan: Number(jenisPembelian),
      id_pelanggan_external:
        Number(jenisPembelian) === 2 ? Number(pembeliKhusus) : 0,
      kode_pelanggan_external: kodePelangganExternal,
      tanggal_transaksi: tanggalTransaksi,
      tanggal_kirim: tanggalKirim,
      catatan: catatanKitchen || "-",
    };

    const detailPayload = detailRows.map((r) => ({
      kode_produk: r.kode_barang,
      nama_produk: r.namabarang,
      id_kategori_produk: r.id_kategori_produk,
      id_kategori_bahan_baku: r.id_kategori_bahan_baku,
      id_kategori_adonan_produk: r.id_kategori_adonan_produk,
      id_kategori_filling_pertama: r.id_kategori_filling_pertama,
      id_kategori_filling_kedua: r.id_kategori_filling_kedua,
      id_kategori_topping_pertama: r.id_kategori_topping_pertama,
      id_kategori_topping_kedua: r.id_kategori_topping_kedua,
      quantity: Number(r.qtyBeli),
      harga_jual: r.harga_jual,
    }));

    const payload = {
      id_user,
      id_toko: id_tokoInt,
      master: masterPayload,
      detail: detailPayload,
    };

    // 5️⃣ Kirim ke server dan tangani response
    try {
      setLoading(true);
      const res = await insertMasterPesananPembelian(token, payload);

      if (res.success) {
        // benar-benar berhasil
        setAlert({
          message: res.message || "Pemesanan berhasil disimpan.",
          type: "success",
          visible: true,
        });
        setTableRows([]);
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
          window.location.reload();
        }, 1500);
      } else {
        // server mengembalikan warning (stok kurang, payload invalid, dll)
        setAlert({
          message: res.message,
          type: "warning",
          visible: true,
        });
        setTimeout(() => {
          setAlert((p) => ({ ...p, visible: false }));
        }, 3400);
      }
    } catch (e) {
      // hanya untuk network / server error (500, timeout, dll)
      setAlert({
        message: "Terjadi kesalahan sistem. Silakan coba lagi.",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SORT • FILTER • PAGINATION ------------------------------ */
  const handleSort = (key) =>
    setSortConfig((p) =>
      p.key === key
        ? { key, direction: p.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  const sortedRows = [...tableRows].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;
    if (a[key] === b[key]) return 0;
    return a[key] > b[key]
      ? direction === "asc"
        ? 1
        : -1
      : direction === "asc"
      ? -1
      : 1;
  });
  const visibleRows = sortedRows
    .filter((r) => !kodeFilter || r.kode_barang === kodeFilter)
    .filter((r) => !namaFilter || r.namabarang === namaFilter)
    .filter(
      (r) =>
        r.kode_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.namabarang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = visibleRows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(visibleRows.length / itemsPerPage);

  const formatRp = (n) =>
    isNaN(n)
      ? "-"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(n);

  const subtotalGrand = visibleRows.reduce(
    (s, r) => s + Number(r.qtyBeli || 0) * r.harga,
    0
  );
  const subtotalHarga = visibleRows.reduce((s, r) => s + r.harga, 0);

  const handleUpdateRow = (kodeBarang, field, value) =>
    setTableRows((rows) =>
      rows.map((r) =>
        r.kode_barang === kodeBarang ? { ...r, [field]: value } : r
      )
    );

  const handleDeleteRow = (idx) =>
    setTableRows((rows) => rows.filter((_, i) => i !== idx));

  /* ---------- RENDER -------------------------------------------------- */
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  const uniqueKode = [...new Set(tableRows.map((r) => r.kode_barang))];
  const uniqueNama = [...new Set(tableRows.map((r) => r.namabarang))];

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        />
      )}

      {/* ---------------- HEADER ------------------------------------------ */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Pembelian
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <Link
            to="/dashboard/master/menu/pembelianbarang"
            className="text-xs font-semibold text-blue-900"
          >
            Tambah
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Analisa & Pemesanan
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition"
        >
          Refresh
        </button>
      </div>

      {/* ---------------- PANEL ATAS (Info, Filter, Catatan, panel kanan) -- */}
      <div className="w-full flex gap-1">
        {/* ================= INFO TRANSAKSI =============================== */}
        <fieldset className="max-w-lg border border-blue-400 rounded-md p-2 shadow-sm">
          <legend className="px-0.5 text-sm font-bold text-blue-900">
            Info Transaksi
          </legend>
          <div className="flex-row text-xs">
            <div className="flex gap-1.5">
              {/* toko / kitchen */}
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  No Pemesanan :
                </label>
                <input
                  disabled
                  value="Auto Generate"
                  className="w-40 border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">Toko :</label>
                <select
                  value={storeTujuan}
                  onChange={(e) => setStoreTujuan(e.target.value)}
                  className="w-40 border border-gray-300 text-xs h-7 rounded p-1"
                >
                  {masterStore.map((s) => (
                    <option key={`store-${s.id_lokasi}`} value={s.id_lokasi}>
                      {s.nama_lokasi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">Kitchen :</label>
                <select
                  value={kitchenTujuan}
                  onChange={(e) => setKitchenTujuan(e.target.value)}
                  className="w-40 border border-gray-300 text-xs h-7 rounded p-1"
                >
                  {masterKitchen.map((k) => (
                    <option key={`kitchen-${k.id_lokasi}`} value={k.id_lokasi}>
                      {k.nama_lokasi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* jenis pembelian */}
            <div className="flex gap-1.5 mt-2">
              <div className="w-full">
                <p className="text-blue-900 font-semibold">Jenis Pembelian :</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {masterJenisPesanan.map((j) => (
                    <label
                      key={`jenis-${j.id_master_jenis_pesanan}`}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="radio"
                        name="jenis"
                        value={j.id_master_jenis_pesanan}
                        checked={jenisPembelian === j.id_master_jenis_pesanan}
                        onChange={() =>
                          setJenisPembelian(j.id_master_jenis_pesanan)
                        }
                      />
                      <span className="text-blue-900 font-semibold">
                        {j.nama_pesanan || j.nama_jenis_pesanan}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Pembeli Khusus :
                </label>
                <select
                  disabled={jenisPembelian !== 2}
                  value={pembeliKhusus}
                  onChange={(e) => setPembeliKhusus(e.target.value)}
                  className="w-40 border h-7 text-xs border-gray-300 rounded p-1 disabled:bg-gray-100"
                >
                  <option value="">- Pilih Pelanggan -</option>
                  {masterPelanggan.map((p, i) => (
                    <option
                      key={`pel-${p.id_master_pelanggan_external ?? i}`}
                      value={p.id_master_pelanggan_external}
                    >
                      {p.nama_pelanggan_external}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* tanggal */}
            <div className="flex gap-1.5 mt-2">
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Tanggal Verifikasi AP :
                </label>
                <input
                  disabled
                  value="Auto Setelah Verifikasi"
                  className="w-full border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Tanggal Transaksi :
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={tanggalTransaksi}
                  onChange={(e) => setTanggalTransaksi(e.target.value)}
                  className="w-full h-7 text-xs border border-gray-300 rounded p-1"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Tanggal Kirim :
                </label>
                <input
                  type="date"
                  min={tanggalTransaksi || todayStr}
                  value={tanggalKirim}
                  onChange={(e) => setTanggalKirim(e.target.value)}
                  className="w-full h-7 text-xs border border-gray-300 rounded p-1"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Filter Penjualan */}
        <fieldset className="border border-blue-400 rounded-md p-2 shadow-sm">
          <legend className="px-0.5 text-sm font-bold text-blue-900">
            Filter Penjualan
          </legend>
          <div className="flex w-72 gap-1.5 text-xs">
            <div className="w-40">
              <label className="text-blue-900 font-semibold">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={tglAwal}
                max={tglAkhir || ""}
                onChange={(e) => setTglAwal(e.target.value)}
                disabled={Number(jenisPembelian) === 2}
                className="w-full border h-7 text-xs border-gray-300 rounded p-1"
              />
            </div>
            <div className="w-40">
              <label className="text-blue-900 font-semibold">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={tglAkhir}
                min={tglAwal || ""}
                onChange={(e) => setTglAkhir(e.target.value)}
                disabled={Number(jenisPembelian) === 2}
                className="w-full border h-7 text-xs border-gray-300 rounded p-1"
              />
            </div>
          </div>
          <div className="w-full text-xs mt-2">
            <label className="text-blue-900 font-semibold">
              Kategori Produk :
            </label>
            <MultiSelectKategori
              options={masterKategoriProduk}
              selectedIds={selectedKategoriIds}
              onChangeSelected={setSelectedKategoriIds}
            />
          </div>
          <div className="btn mt-1">
            <button
              onClick={handleShowBarang}
              className="mt-4 h-7 w-full text-sm bg-blue-900 hover:bg-blue-800 text-white rounded p-1 font-semibold"
            >
              Tampilkan Barang
            </button>
          </div>
        </fieldset>

        {/* ================= CATATAN ====================================== */}
        <fieldset className="border border-blue-400 rounded-md p-2 shadow-sm">
          <legend className="px-0.5 text-sm font-bold text-blue-900">
            Catatan
          </legend>
          <label className="text-xs text-black block mb-0.5">
            Catatan Untuk Kitchen
          </label>
          <textarea
            value={catatanKitchen}
            maxLength={150}
            onChange={(e) => setCatatanKitchen(e.target.value)}
            placeholder="..."
            className="block w-60 min-h-[8rem] max-h-[8rem] border border-gray-300 rounded p-1 text-xs resize-none overflow-y-auto"
          />
        </fieldset>

        {/* ================= PANEL KANAN =================================== */}
        <fieldset className="flex flex-col h-full space-y-0.5">
          <fieldset className="border border-blue-500 rounded-md p-2 shadow-sm">
            <legend className="px-0.5 text-sm font-bold text-blue-900">
              Cetak
            </legend>
            <button
              onClick={() =>
                setAlert({
                  message: "Fitur print coming soon.",
                  type: "info",
                  visible: true,
                })
              }
              className="flex items-center space-x-2 border bg-gray-100 border-gray-300 rounded p-1 text-blue-900 hover:bg-gray-100"
            >
              <img src={LogoPrint} alt="print" className="w-6 h-6" />
              <span className="text-sm font-semibold">Cetak Pemesanan</span>
            </button>
            <p
              className="text-red-600 italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *SO Otomatis Terbentuk
            </p>
          </fieldset>

          <fieldset className="border border-blue-500 h-full rounded-md p-2 shadow-sm">
            <legend className="px-2 text-sm font-bold text-blue-900">
              Verifikasi Pemesanan
            </legend>
            <button
              onClick={handleSavePemesanan}
              className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white rounded p-1"
            >
              <img src={LogoSave} alt="save" className="w-6 h-6" />
              <span className="text-xs font-semibold">Simpan Pemesanan</span>
            </button>
            <p
              className="text-red-600 text-xs italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *Pastikan Bahwa Semua Inputan Telah Sesuai
            </p>
          </fieldset>
        </fieldset>
      </div>

      {/* ---------------- FILTER SECTION (kode / nama) --------------------- */}
      <div className="bg-white flex flex-col mt-2 md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Filter Kode Barang"
            options={uniqueKode}
            value={kodeFilter}
            onChange={setKodeFilter}
          />
          <FilterSelect
            label="Filter Nama Barang"
            options={uniqueNama}
            value={namaFilter}
            onChange={setNamaFilter}
          />
        </div>
      </div>

      {/* ---------------- TABEL DATA -------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-md shadow-md p-1">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Analisa &amp; Pemesanan
          </p>
          <div className="w-2/6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-8 rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ height: "50vh" }}>
          <table className="w-full text-xs text-left border-collapse border m-1">
            <thead className="bg-gray-200 text-blue-900 uppercase">
              <tr>
                <th
                  className="px-1 py-0.5 w-10 border cursor-pointer"
                  onClick={() => handleSort("no")}
                >
                  No
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-24 border cursor-pointer"
                  onClick={() => handleSort("kode_barang")}
                >
                  Kode
                  {sortConfig.key === "kode_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-64 border cursor-pointer"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang
                  {sortConfig.key === "namabarang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {Number(jenisPembelian) !== 2 && (
                  <>
                    <th className="px-1 py-0.5 w-32 border">Jumlah Beli</th>
                    <th className="px-1 py-0.5 w-32 border">Jumlah Retur</th>
                    <th className="px-1 py-0.5 w-32 border">Penjualan/Hari</th>
                    <th className="px-1 py-0.5 w-32 border">Stok Toko</th>
                    <th className="px-1 py-0.5 w-32 border">Umur Stok</th>
                  </>
                )}
                <th className="px-1 py-0.5 w-32 border">Jumlah Pembelian</th>
                <th
                  className="px-1 py-0.5 w-32 border cursor-pointer"
                  onClick={() => handleSort("harga")}
                >
                  Harga
                  {sortConfig.key === "harga" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-32 border">Total</th>
                <th className="px-1 py-0.5 w-20 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((r, i) => {
                // compute the true index into the full `tableRows` array
                const globalIndex = indexOfFirstItem + i;

                return (
<tr
  key={`${r.kode_barang}-${i}`}
  className={`text-gray-900 hover:bg-gray-200 ${
    r.status_produk === 1 ? "bg-red-200 text-gray-400 cursor-not-allowed" : ""
  }`}
>
                    {/* No */}
                    <td className="px-1 py-0.5 border">{globalIndex + 1}</td>

                    {/* Kode */}
                    <td className="px-1 py-0.5 border">{r.kode_barang}</td>

                    {/* Nama Barang */}
                    <td className="px-1 py-0.5 border">{r.namabarang}</td>

                    {/* these columns only for regular pembelian (jenis !== 2) */}
                    {Number(jenisPembelian) !== 2 && (
                      <>
                        <td className="px-1 py-0.5 border">{r.jumlahJual}</td>
                        <td className="px-1 py-0.5 border">{r.jumlahRetur}</td>
                        <td className="px-1 py-0.5 border">
                          {r.penjualanPerHari}
                        </td>
                        <td className="px-1 py-0.5 border">
                          {r.stok_toko} PCS
                        </td>
                        <td className="px-1 py-0.5 border">
                          {r.umur_stok} Hari
                        </td>
                      </>
                    )}

                    {/* Jumlah Pembelian (always present) */}
                    <td className="px-1 py-0.5 border">
                      <div className="flex items-center gap-0.5">
<input
  type="text"
  value={r.qtyBeli}
  disabled={r.status_produk === 1} // ✅ disable input
  maxLength={4}
  onChange={(e) => {
    const raw = e.target.value.replace(/\D/g, "");
    handleUpdateRow(r.kode_barang, "qtyBeli", raw);
  }}
  onBlur={() => {
    if (r.qtyBeli !== "" && Number(r.qtyBeli) < 1) {
      handleUpdateRow(r.kode_barang, "qtyBeli", "1");
    }
  }}
  className={`w-full border text-right p-0.5 text-xs rounded ${
    r.status_produk === 1
      ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-100 border-gray-400"
  }`}
/>
                        <span className="whitespace-nowrap text-xs">PCS</span>
                      </div>
                    </td>

                    {/* Harga */}
                    <td className="px-1 py-0.5 border text-right">
                      {formatRp(r.harga_jual)}
                    </td>

                    {/* Total */}
                    <td className="px-1 py-0.5 border text-right">
                      {formatRp((Number(r.qtyBeli) || 0) * r.harga_jual)}
                    </td>

                    {/* Action */}
                    <td className="px-1 py-0.5 border text-center">
                      <button onClick={() => handleDeleteRow(globalIndex)}>
                        <img src={IconDelete} alt="del" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* empty state */}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={Number(jenisPembelian) === 2 ? 7 : 13}
                    className="border text-center py-2 text-gray-500"
                  >
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- SUBTOTALS ---------- */}
        <div className="mt-0">
          <table className="w-full text-xs text-left text-gray-500	border-collapse border">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={9}
                  className="px-1 py-0.5 w-32 border	border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Pemesanan
                </td>
                <td className="px-1 py-0.5 w-52 border	border-gray-700 font-semibold bg-lime-400">
                  {formatRp(subtotalGrand)}
                </td>
                <td
                  colSpan={3}
                  className="px-1 py-0.5 border w-32 border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Harga
                </td>
                <td className="px-1 py-0.5 w-52	border border-gray-700 font-semibold bg-lime-400">
                  {formatRp(subtotalHarga)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4"
          aria-label="Table navigation"
        >
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-xs text-gray-700">
              Tampilkan:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-xs p-1"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
          <span className="text-xs font-normal text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {visibleRows.length === 0 ? 0 : indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, visibleRows.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {visibleRows.length}
            </span>
          </span>
          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center py-0.5 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs	border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center justify-center text-xs py-0.5 px-2 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages || totalPages === 0
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
