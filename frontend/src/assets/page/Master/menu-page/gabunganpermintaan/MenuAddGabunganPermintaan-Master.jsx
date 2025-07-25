import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

/* =================================================================================
   SERVICE API                                                                     */
import {
  getMasterLokasiStore,
  getMasterLokasiKitchen,
  getMasterJenisPesanan,
  getMasterPelanggan,
  getMasterKategoriProduk,
  insertMasterPesananPembelian,
  getMasterPengcekanPembelianSO,
  getMasterDetailSalesOrder,
  getMasterPesananPembelian,
  getMasterAdonan,
  getMasterBahanBakuProduk,
  insertMasterGabunganPermintaan,
} from "../../../../services/apiService";

/* =================================================================================
   KOMPONEN & ASET                                                                 */
import Alert from "../../../component/Alert";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";
import DialogTrueFalse from "../../../component/DialogTrueFalse";
import LogoSave from "../../../../image/icon/logo-save.svg";

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
function MultiSelectSo({
  options = [],            // [{ id_master_sales_order, kode_sales_order, … }]
  selectedIds = [],        // array of id_master_sales_order
  onChangeSelected,        // fn(ids: number[])
}) {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const ref = useRef(null);

  // tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOne = (id) =>
    onChangeSelected(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );

  const toggleAll = () =>
    onChangeSelected(
      selectedIds.length === options.length
        ? []
        : options.map((o) => o.id_master_sales_order)
    );

  // teks tampilan di input
  const display = options
    .filter((o) => selectedIds.includes(o.id_master_sales_order))
    .map((o) => o.kode_sales_order)
    .join(", ");

  // opsi yang cocok filterText
  const visibleOptions = options.filter((o) =>
    o.kode_sales_order.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full md:w-60">
      <input
        readOnly
        value={display}
        placeholder="– Pilih No. Pesanan –"
        onClick={() => setOpen((o) => !o)}
        className="w-full border h-7 text-xs border-gray-300 rounded p-1 bg-white cursor-pointer"
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded text-xs">
          {options.length === 0 ? (
            <div className="p-2 text-center text-gray-500">Tidak ada opsi</div>
          ) : (
            <>
              {/* HEADER: search + select all */}
              <div className="p-1 border-b border-gray-200 bg-gray-50 sticky top-0">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Cari No. Pesanan..."
                  className="w-full mb-2 p-1 border border-gray-300 rounded text-xs"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === options.length}
                    onChange={toggleAll}
                  />
                  <span className="font-semibold">Select All</span>
                </label>
              </div>

              {/* LIST OPSI: scrollable */}
              <div className="max-h-40 overflow-y-auto">
                {visibleOptions.length > 0 ? (
                  visibleOptions.map((so) => (
                    <label
                      key={so.id_master_sales_order}
                      className="flex items-center gap-1 px-1 py-1 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(so.id_master_sales_order)}
                        onChange={() => toggleOne(so.id_master_sales_order)}
                      />
                      <span className="text-xs">{so.kode_sales_order}</span>
                    </label>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-500">
                    Tidak ada opsi
                  </div>
                )}
              </div>
            </>
          )}
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
  const navigate = useNavigate();
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

  const [salesOrderChecks, setSalesOrderChecks] = useState([]); // raw getMasterPengcekanPembelianSO
  const [pesananMasters, setPesananMasters] = useState([]); // raw getMasterPesananPembelian
  const [filteredSOOptions, setFilteredSOOptions] = useState([]); // string[] of kode_sales_order
  const [selectedSO, setSelectedSO] = useState(""); // what the user picks
  const [selectedSOIds, setSelectedSOIds] = useState([]);
  const [selectedSOs, setSelectedSOs] = useState([]); // daftar objek SO yang dipilih
  const [soDetails, setSoDetails] = useState([]);

  const [soChecks, setSoChecks] = useState([]); // hasil getMasterPengcekanPembelianSO
  const [soMasters, setSoMasters] = useState([]); // helper dari soChecks

  const [activeView, setActiveView] = useState("infoProduk");
  // di antara useState lainnya
  const [usageMap, setUsageMap] = useState(new Map());
  const [masterAdonan, setMasterAdonan] = useState([]);
  const [adonanMaster, setAdonanMaster] = useState([]);
  const [kebutuhanAdonan, setKebutuhanAdonan] = useState([]);
  const [kebutuhanAdonanPerCombo, setKebutuhanAdonanPerCombo] = useState([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [dialogCfg, setDialogCfg] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "",
    cancelText: "Close",
  });
  //bahanbaku
  const [bahanBakuMaster, setBahanBakuMaster] = useState([]);
  const formatGr = (n) =>
    `${Number(n || 0).toLocaleString("id-ID", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })} gr`;

  const formatGr2 = (n) =>
    `${Number(n || 0).toLocaleString("id-ID", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })}`;

  const formatKg = (n) =>
    `${(Number(n || 0) / 1000).toLocaleString("id-ID", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} kg`;

  const hasStockShortage = () =>
    bahanBakuAggregated.some((b) => b.totalKebutuhan > b.stok_bahan_baku);
  const openSaveDialog = () => {
    if (tableRows.length === 0) {
      return setAlert({
        message: "Klik Tambah Pesanan dulu.",
        type: "warning",
        visible: true,
      });
    }

    if (hasStockShortage()) {
      // stok tidak cukup
      setDialogCfg({
        title: "Penuhi Stok Untuk Lanjut",
        message:
          "Sebagian bahan baku kurang dari kebutuhan. Silakan penuhi stok terlebih dahulu.",
        confirmText: "Buka Laporan Stok",
        onConfirm: () => {
          setIsSaveDialogOpen(false);
          navigate("/dashboard/master/menu/laporanmasterbarangstok");
        },
      });
    } else {
      // stok aman
      setDialogCfg({
        title: "Konfirmasi Simpan",
        message: "Apakah Anda yakin ingin melanjutkan?",
        confirmText: "Simpan",
        onConfirm: () => {
          setIsSaveDialogOpen(false);
          handleSaveGabungan(); // ← simpan benar‑benar dijalankan di sini
        },
      });
    }
    setIsSaveDialogOpen(true);
  };


  const rekapData = useMemo(() => {
    const map = new Map();
    tableRows.forEach((r) => {
      const key = r.kode_barang;
      if (!map.has(key)) {
        map.set(key, {
          kode_barang: r.kode_barang,
          namabarang: r.namabarang,
          totalQty: 0,
        });
      }
      map.get(key).totalQty += r.quantity;
    });
    return Array.from(map.values());
  }, [tableRows]);

  /* ======== KEBUTUHAN BAHAN BAKU (AGR. SEMUA SO) ==================== */
  const bahanBakuAggregated = useMemo(() => {
    if (!tableRows.length) return [];

    /* 1️⃣  total PCS per id_produk (dari SO ter‑pilih) */
    const pcsPerProduk = tableRows.reduce((acc, r) => {
      acc[r.id_produk] = (acc[r.id_produk] || 0) + Number(r.quantity || 0);
      return acc;
    }, {});

    const temp = bahanBakuMaster
      .filter((b) => pcsPerProduk[b.id_produk])
      .map((b) => ({
        ...b,
        nama_kategori_adonan_produk:
          adonanMaster.find(
            (a) => a.id_kategori_adonan_produk === b.id_kategori_adonan_produk
          )?.nama_kategori_adonan_produk || `#${b.id_kategori_adonan_produk}`,

        kebutuhanPerPCS: Number(b.jumlah_kebutuhan || 0),
        totalPCS: pcsPerProduk[b.id_produk],
        totalKebutuhan:
          Number(b.jumlah_kebutuhan || 0) * pcsPerProduk[b.id_produk],
      }));

    /* 3️⃣  gabungkan setiap id_bahan_baku */
    const merged = new Map();
    temp.forEach((row) => {
      if (!merged.has(row.id_bahan_baku))
        merged.set(row.id_bahan_baku, { ...row });
      else {
        const m = merged.get(row.id_bahan_baku);
        m.totalPCS += row.totalPCS;
        m.totalKebutuhan += row.totalKebutuhan;
      }
    });

    return Array.from(merged.values());
  }, [tableRows, bahanBakuMaster, adonanMaster]);

  useEffect(() => {
    getMasterAdonan(token)
      .then((res) => {
        // 1) ambil payload MySQL-nya
        const payload = Array.isArray(res) && res.length > 0 ? res[0] : res;
        // 2) jadikan array of objects
        const flatObjs = Object.values(payload);
        // 3) kalau ada nesting lagi, sesuaikan
        //    misalnya kadang bentuknya [ { "0": {...} }, { "0": {...} } ]
        //    maka:
        const real = flatObjs.map((item) => (item["0"] ? item["0"] : item));
        setAdonanMaster(real);
        // console.log(">> benar–benar adonanMaster:", real);
      })
      .catch(console.error);
    // console.log(">> adonanMaster", adonanMaster);
  }, [token]);

  useEffect(() => {
    getMasterBahanBakuProduk(token)
      .then((res) => {
        const payload = Array.isArray(res) && res.length > 0 ? res[0] : res;
        // flatten the mysql‐nested response
        const flat = Object.values(payload).map((o) => o["0"] || o);
        setBahanBakuMaster(flat);
      })
      .catch(console.error);
  }, [token]);

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
        // console.log("kitchenRes", kitchenRes);
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
            p.status === 0 &&
            p.id_master_pelanggan_external &&
            p.nama_pelanggan_external
        );
        setMasterPelanggan(pelList);

        const katRes = await getMasterKategoriProduk(token);
        const katList = Object.values(katRes || {}).filter(
          (k) => k.status === 0
        );
        setMasterKategoriProduk(katList);

        const soRaw = await getMasterPengcekanPembelianSO(token);
        // console.log("soRaw", soRaw);
        const ppRaw = await getMasterPesananPembelian(token);
        const rawSo = await getMasterPengcekanPembelianSO(token);
        // console.log("soRaw", soRaw);
        // normalize rows and drop metadata:
        const flatten = (arr) =>
          arr
            .flatMap((o) => Object.values(o))
            .map((r) => (r && r["0"] ? r["0"] : r))
            .filter((r) => r && r.id_master_pesanan_pembelian);
        const flatSo = rawSo
          .flatMap((o) => Object.values(o))
          .map((r) => r["0"] || r)
          .filter((r) => r.id_master_sales_order);
        setSoChecks(flatSo);
        // opsi hanya untuk kitchen dipilih:
        setSoMasters(
          flatSo.filter((so) => Number(so.id_kitchen) === Number(kitchenTujuan))
        );
        setSalesOrderChecks(flatten(soRaw));
        setPesananMasters(flatten(ppRaw));
      } catch (e) {
        setError(e.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    // 1) ambil semua SO check untuk kitchenTujuan
    const forKitchen = salesOrderChecks.filter(
      (so) => Number(so.id_kitchen) === Number(kitchenTujuan)
    );

    // 2) dedupe & simpan
    setFilteredSOOptions(
      Array.from(
        new Map(
          forKitchen.map((so) => [
            so.id_master_sales_order,
            {
              id_master_sales_order: so.id_master_sales_order,
              id_master_pesanan_pembelian: so.id_master_pesanan_pembelian,
              kode_sales_order: so.kode_sales_order,
              id_kitchen: so.id_kitchen,
              tanggal_verifikasi_so: so.tanggal_verifikasi_so,
            },
          ])
        ).values()
      )
    );

    // reset pilihan bila kitchen berubah
    setSelectedSOs([]);
  }, [salesOrderChecks, kitchenTujuan]);

  useEffect(() => {
    /** helper: cek apakah so.tanggal_transaksi ada di dalam rentang */
    const inDateRange = (so) => {
      if (!tglAwal && !tglAkhir) return true; // tak ada filter
      const d = new Date(so.tanggal_transaksi.slice(0, 10));

      if (tglAwal && d < new Date(tglAwal)) return false; // sebelum awal
      if (tglAkhir && d > new Date(tglAkhir)) return false; // sesudah akhir
      return true;
    };

    /* 1️⃣ filter kitchen + tanggal  */
    const forKitchen = salesOrderChecks.filter(
      (so) => Number(so.id_kitchen) === Number(kitchenTujuan) && inDateRange(so)
    );

    /* 2️⃣ deduplikasi per id_master_sales_order */
    const deduped = Array.from(
      new Map(
        forKitchen.map((so) => [
          so.id_master_sales_order,
          {
            id_master_sales_order: so.id_master_sales_order,
            id_master_pesanan_pembelian: so.id_master_pesanan_pembelian,
            kode_sales_order: so.kode_sales_order,
            id_kitchen: so.id_kitchen,
            tanggal_transaksi: so.tanggal_transaksi,
          },
        ])
      ).values()
    );

    setFilteredSOOptions(deduped);

    /* reset pilihan bila filter berubah supaya user tak “kejebak” id lama */
    setSelectedSOIds([]);
  }, [salesOrderChecks, kitchenTujuan, tglAwal, tglAkhir]);

  useEffect(() => {
    if (!selectedSOs.length) {
      setSoDetails([]);
      return;
    }
    const loadDetails = async () => {
      const all = [];
      for (let so of selectedSOs) {
        const raw = await getMasterDetailSalesOrder(
          token,
          so.id_master_sales_order
        );

        // flatten the MySQL response…
        const flat = raw[0]
          ? Object.values(raw[0]).map((r) => r["0"] || r)
          : Object.values(raw).flatMap((o) => Object.values(o));

        // then filter by **both** IDs:
        all.push(
          ...flat
            .filter(
              (d) =>
                d.id_master_sales_order === so.id_master_sales_order &&
                d.id_master_pesanan_pembelian === so.id_master_pesanan_pembelian
            )
            .map((d) => ({ ...d, _so: so }))
        );
      }
      setSoDetails(all);
    };
    loadDetails();
  }, [selectedSOs, token]);

  /* ------------------------------------------------------------------------
   Tampilkan barang berdasarkan filter analisa penjualan atau khusus
------------------------------------------------------------------------ */
  const handleShowBarang = async () => {
    if (!kitchenTujuan) {
      setAlert({
        message: "Pilih Kitchen dulu.",
        type: "warning",
        visible: true,
      });
      return;
    }
    if (selectedSOIds.length === 0) {
      setAlert({
        message: "Pilih minimal satu pesanan penjualan.",
        type: "warning",
        visible: true,
      });
      return;
    }

    try {
      setLoading(true);

      /* --------------------------------------------------------------------
       A. Tarik detail tiap SO dan satukan
    -------------------------------------------------------------------- */
      const soHeaders = salesOrderChecks.filter((h) =>
        selectedSOIds.includes(h.id_master_sales_order)
      );

      const allRows = [];
      for (let hdr of soHeaders) {
        const raw = await getMasterDetailSalesOrder(
          token,
          hdr.id_master_sales_order
        );
        const flat = raw[0]
          ? Object.values(raw[0]).map((r) => r["0"] || r)
          : Object.values(raw).flatMap((o) => Object.values(o));

        flat
          .filter(
            (d) =>
              d.id_master_sales_order === hdr.id_master_sales_order &&
              d.id_master_pesanan_pembelian === hdr.id_master_pesanan_pembelian
          )

          .forEach((d) => {
            allRows.push({
              soId: hdr.id_master_sales_order,
              pbId: hdr.id_master_pesanan_pembelian,
              tanggal_transaksi: hdr.tanggal_transaksi,
              nama_kitchen: hdr.nama_kitchen,
              tanggal_kirim: hdr.tanggal_kirim,
              kode_sales_order: hdr.kode_sales_order,
              id_produk: d.id_produk,
              kode_barang: d.kode_produk,
              namabarang: d.nama_produk,
              quantity: d.quantity,
              harga_jual: parseFloat(d.harga_jual) || 0,
              id_kategori_adonan_produk: d.id_kategori_adonan_produk,
              id_kategori_filling_pertama: d.id_kategori_filling_pertama,
              id_kategori_filling_kedua: d.id_kategori_filling_kedua,
              id_kategori_topping_pertama: d.id_kategori_topping_pertama,
              id_kategori_topping_kedua: d.id_kategori_topping_kedua,
            });
          });
      }

      /* --------------------------------------------------------------------
       B. Hitung kebutuhan adonan total (SEMUA SO)
    -------------------------------------------------------------------- */
      const kebutuhanMap = new Map();
      allRows.forEach((r) => {
        const qty = r.quantity || 0;
        [
          r.id_kategori_adonan_produk,
          r.id_kategori_filling_pertama,
          r.id_kategori_filling_kedua,
          r.id_kategori_topping_pertama,
          r.id_kategori_topping_kedua,
        ]
          .filter(Boolean)
          .forEach((id) => {
            if (!kebutuhanMap.has(id)) {
              const master = adonanMaster.find(
                (a) => a.id_kategori_adonan_produk === id
              );
              kebutuhanMap.set(id, {
                id,
                nama: master?.nama_kategori_adonan_produk || `#${id}`,
                batchCount: 0,
              });
            }
            kebutuhanMap.get(id).batchCount += qty;
          });
      });

      const adonanInfo = Array.from(kebutuhanMap.values()).map((a) => {
        /* deduplikasi bahan baku agar beratPerBatch tidak berlipat */
        const beratPerBatch = Array.from(
          new Map(
            bahanBakuMaster
              .filter((b) => b.id_kategori_adonan_produk === a.id)
              .map((b) => [b.id_bahan_baku, Number(b.jumlah_kebutuhan || 0)])
          ).values()
        ).reduce((sum, gr) => sum + gr, 0);

        return {
          id: a.id,
          nama: a.nama,
          batchCount: a.batchCount,
          beratPerBatch,
          totalBerat: beratPerBatch * a.batchCount,
        };
      });

      /* --------------------------------------------------------------------
       C. Simpan ke state & notifikasi
    -------------------------------------------------------------------- */
      setKebutuhanAdonan(adonanInfo);
      setTableRows(allRows);
      setCurrentPage(1);

      setAlert({
        message: `Menampilkan ${allRows.length} baris dari ${soHeaders.length} SO.`,
        type: "info",
        visible: true,
      });
      setTimeout(() => setAlert((a) => ({ ...a, visible: false })), 2000);
    } catch (e) {
      setAlert({
        message: e.message || "Gagal muat data.",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------
   Simpan pemesanan
------------------------------------------------------------------------ */
  // ==================  SIMPAN GABUNGAN PERMINTAAN  ==================
  const handleSaveGabungan = async () => {
    /* --- validasi singkat (tetap sama) --- */
    if (!kitchenTujuan) {
      return setAlert({
        message: "Pilih kitchen.",
        type: "warning",
        visible: true,
      });
    }
    if (selectedSOIds.length === 0) {
      return setAlert({
        message: "Pilih No. Pesanan Penjualan.",
        type: "warning",
        visible: true,
      });
    }
    if (tableRows.length === 0) {
      return setAlert({
        message: "Klik Tambah Pesanan dahulu.",
        type: "warning",
        visible: true,
      });
    }

    /* 1️⃣ — HEADER PAYLOAD  */
    const kitchenObj = masterKitchen.find(
      (k) => String(k.id_lokasi) === String(kitchenTujuan)
    );
    const kodeKitchen = kitchenObj?.kode_lokasi || "";
    const headerPayload = {
      id_kitchen: Number(kitchenTujuan),
      kode_lokasi_kitchen: kodeKitchen, // <‑‑ diminta backend
      tanggal_verifikasi_gb: "", // backend akan meng‑isi ketika diverifikasi
    };

    // —— agregasi nominal & qty per‑SO
    const bySO = new Map();
    tableRows.forEach((r) => {
      if (!bySO.has(r.soId)) {
        bySO.set(r.soId, { pbId: r.pbId, nominal: 0, items: {} });
      }
      const rec = bySO.get(r.soId);
      rec.nominal += Number(r.quantity || 0) * Number(r.harga_jual || 0);
      rec.items[r.kode_barang] =
        (rec.items[r.kode_barang] || 0) + Number(r.quantity || 0);
    });

    const detailPayload = Array.from(bySO.entries()).map(([id_so, d]) => ({
      id_master_sales_order: id_so,
      id_master_pesanan_pembelian: d.pbId,
      nominal_permintaan: d.nominal,
      products: Object.entries(d.items).map(([kode_produk, quantity]) => ({
        kode_produk,
        quantity,
      })),
    }));

    const payload = {
      id_user: Number(id_user),
      header: headerPayload,
      detail: detailPayload,
    };

    /* 🔎  ———  CONSOLE LOG DI SINI  ——— */
    console.log(">> PAYLOAD GABUNGAN\n", JSON.stringify(payload, null, 2));

    /* --- kirim ke server --- */
    try {
      setLoading(true);
      const res = await insertMasterGabunganPermintaan(token, payload);

      if (res.success) {
        setAlert({ type: "success", message: res.message, visible: true });
        setTableRows([]);
        setSelectedSOIds([]);
        setKebutuhanAdonan([]);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAlert({ type: "warning", message: res.message, visible: true });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: err.message || "Gagal simpan gabungan.",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const viewData = useMemo(() => {
    switch (activeView) {
      case "infoProduk":
        return {
          rows: tableRows,
          getKode: (r) => r.kode_barang,
          getNama: (r) => r.namabarang,
        };

      case "rekapProduk":
        return {
          rows: rekapData,
          getKode: (r) => r.kode_barang,
          getNama: (r) => r.namabarang,
        };

      case "kebSetengahJadi":
        return {
          rows: kebutuhanAdonan,
          getKode: (r) => r.id,
          getNama: (r) => r.nama,
        };

      case "kebBahanBaku":
        return {
          rows: bahanBakuAggregated,
          getKode: (r) => r.kode_bahan_baku,
          getNama: (r) => r.nama_bahan_baku,
        };

      default:
        return { rows: [], getKode: () => "", getNama: () => "" };
    }
  }, [activeView, tableRows, rekapData, kebutuhanAdonan, bahanBakuAggregated]);

  const kodeOptions = useMemo(
    () =>
      [...new Set(viewData.rows.map(viewData.getKode))].filter(Boolean).sort(),
    [viewData]
  );
  const namaOptions = useMemo(
    () =>
      [...new Set(viewData.rows.map(viewData.getNama))].filter(Boolean).sort(),
    [viewData]
  );

  const matchFilter = (row) => {
    const kode = (viewData.getKode(row) || "").toString();
    const nama = (viewData.getNama(row) || "").toString();
    const kw = searchTerm.toLowerCase();

    return (
      (!kodeFilter || kode === kodeFilter) &&
      (!namaFilter || nama === namaFilter) &&
      (kode.toLowerCase().includes(kw) || nama.toLowerCase().includes(kw))
    );
  };

  // 2️⃣  Lalu baru sortedRows & visibleRows:
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

  const visibleRows =
    viewData.rows === tableRows ? sortedRows.filter(matchFilter) : [];

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
    (s, r) => s + Number(r.quantity || 0) * r.harga_jual,
    0
  );
  const totalQtyRekap = rekapData.reduce(
    (sum, row) => sum + Number(row.totalQty || 0),
    0
  );

  /* ======== TOTAL–TOTAL KEBUTUHAN ADONAN (SEMUA BARIS) =============== */
  const totalBeratBatchGr = kebutuhanAdonan.reduce(
    (sum, a) => sum + Number(a.beratPerBatch || 0),
    0
  );
  const totalBeratBatchKg = totalBeratBatchGr / 1000;

  const totalKebutuhanPCS = kebutuhanAdonan.reduce(
    (sum, a) => sum + Number(a.batchCount || 0),
    0
  );

  const totalBeratGr = kebutuhanAdonan.reduce(
    (sum, a) => sum + Number(a.totalBerat || 0),
    0
  );
  const totalBeratKg = totalBeratGr / 1000;

  const totalBahanGr = bahanBakuAggregated.reduce(
    (s, b) => s + Number(b.totalKebutuhan || 0),
    0
  );
  const totalBahanPCS = bahanBakuAggregated.reduce(
    (s, b) => s + Number(b.totalPCS || 0),
    0
  );

  const subtotalHarga = visibleRows.reduce((s, r) => s + r.harga_jual, 0);

  /* ---------- RENDER -------------------------------------------------- */
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;


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
            Produksi
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
            to="/dashboard/master/menu/gabunganpermintaan"
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
            Gabung Permintaan
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
                  No. Gabungan Permintaan :
                </label>
                <input
                  disabled
                  value="Auto Generate"
                  className="w-40 border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">Kitchen :</label>
                <select
                  value={kitchenTujuan} // ← pakai kitchenTujuan
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

            {/* tanggal */}
            <div className="flex gap-1.5 mt-2">
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Tanggal Verifkasi GP :
                </label>
                <input
                  disabled
                  value="Auto Setelah Verifikasi"
                  className="w-full border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
            <hr className="mt-2 mb-1 border border-blue-300 rounded-lg" />
            <div className="flex gap-1.5">
              <div className="w-40">
                {/* awal */}
                <label className="text-blue-900 font-semibold">
                  Tanggal Awal
                </label>
                <input
                  type="date"
                  value={tglAwal}
                  /* kalau sudah ada akhir, boleh batasi agar awal ≤ akhir */
                  max={tglAkhir || undefined}
                  onChange={(e) => {
                    const start = e.target.value;
                    setTglAwal(start);

                    if (tglAkhir && new Date(tglAkhir) < new Date(start)) {
                      setTglAkhir("");
                    }
                  }}
                  className="w-full text-xs border h-7 text-gray-800 border-gray-300 rounded p-1"
                />
              </div>
              <div className="w-40">
                {/* akhir */}
                <label className="text-blue-900 font-semibold">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={tglAkhir}
                  /* inilah kuncinya: hari sebelum tglAwal otomatis disabled */
                  min={tglAwal || undefined}
                  onChange={(e) => setTglAkhir(e.target.value)}
                  className="w-full text-xs border h-7 text-gray-800 border-gray-300 rounded p-1"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Filter Penjualan */}
        <fieldset className="border border-blue-400 w-60 rounded-md p-2 shadow-sm">
          <legend className="px-0.5 text-sm font-bold text-blue-900">
            Info Pesanan Penjualan
          </legend>
          
          <div className="flex">

          <div className="w-full text-xs">
            <label className="text-blue-900 font-semibold">
              No. Pesanan Penjualan :
            </label>
            <MultiSelectSo
  options={filteredSOOptions}
  selectedIds={selectedSOIds}
  onChangeSelected={setSelectedSOIds}
/>
  </div>

          </div>
          <div className="btn mt-1">
            <button
              onClick={handleShowBarang}
              className="mt-4 h-7 w-full text-sm bg-blue-900 hover:bg-blue-800 text-white rounded p-1 font-semibold"
            >
              Tambah Pesanan
            </button>
          </div>
          <p
            className="text-red-600 text-xs italic pt-1"
            style={{ fontSize: "10px" }}
          >
            *Utamakan tanggal transaksi terdekat
          </p>
        </fieldset>

        {/* ================= PANEL KANAN =================================== */}
        <fieldset className="flex flex-col h-full space-y-0.5">
          <fieldset className="border border-blue-500 h-full rounded-md p-2 shadow-sm">
            <legend className="px-2 text-sm font-bold text-blue-900">
              Verifikasi Pemesanan
            </legend>
            <button
              onClick={openSaveDialog}
              className="flex items-center w-40 space-x-2 bg-blue-900 hover:bg-blue-800 text-white rounded p-1"
            >
              <img src={LogoSave} alt="save" className="w-6 h-6" />
              <span className="text-xs font-semibold">Simpan Gabungan</span>
            </button>
            <p
              className="text-red-600 text-xs italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *Pastikan Bahan Baku Tersedia
            </p>
          </fieldset>
        </fieldset>
      </div>

      {/* ---------------- FILTER SECTION (kode / nama) --------------------- */}
      <div className="bg-white flex flex-col mt-2 md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Filter Kode Barang"
            options={kodeOptions}
            value={kodeFilter}
            onChange={setKodeFilter}
          />
          <FilterSelect
            label="Filter Nama Barang"
            options={namaOptions}
            value={namaFilter}
            onChange={setNamaFilter}
          />
        </div>
      </div>

      <div className="bg-white section-informasi rounded-md shadow-md p-1">
        {/* bagian ini nan jika ditekan akan menampilkan isi table yang berbeda-beda sesuai dengan button yang dipilih  */}
        <div className="bg-white section-informasi border border-gray-200 rounded-md shadow-md p-1 space-y-2">
          <div className="flex gap-1 text-xs">
            {/* ------------ INFO PRODUK ------------- */}
            <button
              onClick={() => setActiveView("infoProduk")}
              className={`p-1 w-28 font-semibold border-b-2
      ${
        activeView === "infoProduk"
          ? "border-blue-800 text-blue-800"
          : "border-transparent text-gray-700"
      }`}
            >
              Info Produk
            </button>

            {/* ------------ REKAP PRODUK ------------- */}
            <button
              onClick={() => setActiveView("rekapProduk")}
              className={`p-1 w-28 font-semibold border-b-2
      ${
        activeView === "rekapProduk"
          ? "border-blue-800 text-blue-800"
          : "border-transparent text-gray-700"
      }`}
            >
              Rekap Produk
            </button>

            {/* ---- KEB. BARANG SETENGAH JADI ---- */}
            <button
              onClick={() => setActiveView("kebSetengahJadi")}
              className={`p-1 w-44 font-semibold border-b-2
      ${
        activeView === "kebSetengahJadi"
          ? "border-blue-800 text-blue-800"
          : "border-transparent text-gray-700"
      }`}
            >
              Keb. Barang Setengah Jadi
            </button>

            {/* ------------ KEB. BAHAN BAKU ------------- */}
            <button
              onClick={() => setActiveView("kebBahanBaku")}
              className={`p-1 w-28 font-semibold border-b-2
      ${
        activeView === "kebBahanBaku"
          ? "border-blue-800 text-blue-800"
          : "border-transparent text-gray-700"
      }`}
            >
              Keb. Bahan Baku
            </button>
          </div>

          {/* now conditionally render each “page” */}
          {activeView === "infoProduk" && (
            <>
              <div className="overflow-x-auto" style={{ height: "50vh" }}>
                <table className="w-full text-xs text-left border-collapse border">
                  <thead className="bg-gray-200 text-blue-900 uppercase">
                    <tr>
                      <th className="px-2 py-1 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Tgl Transaksi
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Tgl Kirim
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Kitchen
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        SO
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Kode
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Nama Barang
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Qty
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Harga
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((r, i) => {
                      const globalIndex = indexOfFirstItem + i;
                      const subtotal = (Number(r.quantity) || 0) * r.harga_jual;
                      return (
                        <tr
                          key={`${r.kode_barang}-${i}`}
                          className="text-blue-900 hover:bg-gray-200"
                        >
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {globalIndex + 1}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {r.tanggal_transaksi}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {r.tanggal_kirim}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {r.nama_kitchen}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {r.kode_sales_order}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {r.kode_barang}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {r.namabarang}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
  <div className="flex items-center gap-0.5 justify-end">
    <span className="whitespace-nowrap text-xs">{r.quantity}</span>
    <span className="whitespace-nowrap text-xs">PCS</span>
  </div>
</td>

                          <td className="px-2 py-1 border border-gray-500 text-right">
                            {formatRp(r.harga_jual)}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 text-right">
                            {formatRp(subtotal)}
                          </td>
                        </tr>
                      );
                    })}

                    {currentItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="border text-center py-2 text-gray-500"
                        >
                          Belum ada data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* ---------- SUBTOTALS ---------- */}
              </div>
              <div className="mt-0">
                <table className="w-full text-xs text-left text-blue-900 border-collapse border">
                  {/* 10 kolom = 1/10 lebar masing‑masing */}
                  <colgroup>
                    {Array.from({ length: 0 }).map((_, i) => (
                      <col key={i} className="w-1/10" />
                    ))}
                  </colgroup>

                  <tfoot>
                    <tr className="font-semibold bg-gray-200">
                      {/* 2️⃣  Sub Total Harga */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Sub Total Harga
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatRp(subtotalHarga)}
                      </td>
                      {/* 1️⃣  Sub Total Pemesanan */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Sub Total Pemesanan
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatRp(subtotalGrand)}
                      </td>

                      {/* sisanya 6 sel kosong agar genap 10 kolom */}
                      {Array.from({ length: 0 }).map((_, i) => (
                        <td key={i} className="border"></td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {activeView === "rekapProduk" && (
            <>
              <div className="overflow-x-auto" style={{ height: "50vh" }}>
                <div className="max-w-2xl">
                  <table className="text-xs text-left">
                    <thead className="bg-gray-200 text-blue-900 uppercase">
                      <tr>
                        <th className="px-2 py-1 w-4 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          No
                        </th>
                        <th className="px-2 py-1 w-32 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Kode
                        </th>
                        <th className="px-2 py-1 w-72 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Nama Barang
                        </th>
                        <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Jumlah
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapData.map((row, i) => (
                        <tr
                          key={row.kode_barang}
                          className="hover:bg-gray-200 text-blue-900"
                        >
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {i + 1}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {row.kode_barang}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
                            {row.namabarang}
                          </td>
                          <td className="px-2 py-1 border border-gray-500 uppercase">
  <div className="flex items-center gap-0.5 justify-end">
    <span className="whitespace-nowrap text-xs">{row.totalQty}</span>
    <span className="whitespace-nowrap text-xs">PCS</span>
  </div>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-0 w-full">
                <table className="w-full text-xs text-left text-blue-900 border-collapse border">
                  {/* 2 kolom identik */}
                  <colgroup>
                    <col className="w-2/3" />
                    <col className="w-10" />
                  </colgroup>

                  <tfoot>
                    <tr className="font-semibold bg-gray-200">
                      {/* Label */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Produksi
                      </td>

                      {/* Angka */}
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {totalQtyRekap} PCS
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {activeView === "kebSetengahJadi" && (
            <>
              <div className="overflow-x-auto" style={{ height: "50vh" }}>
                <table className="w-full text-xs text-left border-collapse border">
                  <thead className="bg-gray-200 text-blue-900 uppercase">
                    <tr>
                      <th className="px-2 py-1 w-4 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No
                      </th>
                      <th className="px-2 py-1 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Jenis Adonan
                      </th>
                      <th className="px-2 py-1 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Jumlah Satuan
                      </th>
                      <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Berat Batch (gr)
                      </th>
                      <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Berat Batch (kg)
                      </th>
                      <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Total Kebutuhan
                      </th>
                      <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Total Berat (gr)
                      </th>
                      <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Total Berat (kg)
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {kebutuhanAdonan.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-2">
                          Tidak ada data.
                        </td>
                      </tr>
                    ) : (
                      kebutuhanAdonan.map((a, idx) => {
                        const namaObj = adonanMaster.find(
                          (m) => m.id_kategori_adonan_produk === a.id
                        );
                        const nama =
                          namaObj?.nama_kategori_adonan_produk || `#${a.id}`;
                        return (
                          <tr
                            key={a.id}
                            className="hover:bg-gray-200 text-blue-900"
                          >
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {nama}
                            </td>

                            {/* Berat satu adonan selalu 1  */}
                            <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                              1
                            </td>

                            <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                              {formatGr(a.beratPerBatch)}
                            </td>
                            <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                              {formatKg(a.beratPerBatch)}
                            </td>

                            <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                              {a.batchCount}
                            </td>

                            <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                              {formatGr(a.totalBerat)}
                            </td>
                            <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                              {formatKg(a.totalBerat)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* ---------- FOOTER TOTAL KESETENGAH JADI ------------------------ */}
              <div className="mt-0 w-full">
                <table className="w-full text-xs text-r text-blue-900 border-collapse border">
                  {/* 12 kolom = lebar sama rata */}
                  <colgroup>
                    {Array.from({ length: 0 }).map((_, i) => (
                      <col key={i} className="w-1/12" />
                    ))}
                  </colgroup>

                  <tfoot>
                    <tr className="font-semibold bg-gray-200">
                      {/* 1️⃣ Total Kebutuhan (gr) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Kebutuhan (gr)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatGr(totalBeratBatchGr)}
                      </td>

                      {/* 2️⃣ Total Kebutuhan (kg) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Kebutuhan (kg)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatKg(totalBeratBatchKg)}
                      </td>

                      {/* 3️⃣ Total Adonan */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Adonan
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {totalKebutuhanPCS} PCS
                      </td>

                      {/* 4️⃣ Total Berat Kebutuhan (gr) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Berat Kebutuhan (gr)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatGr(totalBeratGr)}
                      </td>

                      {/* 5️⃣ Total Berat Kebutuhan (kg) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Berat Kebutuhan (kg)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatKg(totalBeratKg)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {activeView === "kebBahanBaku" && (
            <>
              <div className="overflow-x-auto" style={{ height: "50vh" }}>
                <div className="">
                  <table className="w-full whitespace-nowrap text-xs text-left text-gray-500 border-collapse border">
                    <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
                      <tr>
                        <th className="px-2 py-1 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          No
                        </th>
                        <th className="px-2 py-1 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Jenis Adonan
                        </th>
                        <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Kode Bahan Baku
                        </th>
                        <th className="px-2 py-1 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Nama Bahan Baku
                        </th>
                        <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Stok gr
                        </th>
                        <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Kebutuhan gr
                        </th>
                        <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Total Kebutuhan
                        </th>
                        <th className="px-2 py-1 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                          Total&nbsp;Kebutuhan&nbsp;(gr)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bahanBakuAggregated.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-2">
                            Tidak ada data.
                          </td>
                        </tr>
                      ) : (
                        bahanBakuAggregated.map((b, idx) => {
                          /* ────────── penentuan warna baris ────────── */
                          const shortage = b.totalKebutuhan > b.stok_bahan_baku;
                          const lowStock = b.stok_bahan_baku < 2000;
                          const rowClass = shortage
                            ? "bg-red-500 text-white"
                            : lowStock
                            ? "bg-yellow-300"
                            : "hover:bg-gray-200 text-blue-900";

                          return (
                            <tr key={b.id_bahan_baku} className={rowClass}>
                              <td className="px-2 py-1 border border-gray-500 uppercase">
                                {idx + 1}
                              </td>
                              <td className="px-2 py-1 border border-gray-500 uppercase">
                                {b.nama_kategori_adonan_produk}
                              </td>
                              <td className="px-2 py-1 border border-gray-500 uppercase">
                                {b.kode_bahan_baku}
                              </td>
                              <td className="px-2 py-1 border border-gray-500 uppercase">
                                {b.nama_bahan_baku}
                              </td>
                              <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                                {formatGr2(b.stok_bahan_baku) +
                                  " " +
                                  b.nama_satuan}
                              </td>
                              <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                                {formatGr2(b.kebutuhanPerPCS) +
                                  " " +
                                  b.nama_satuan}
                              </td>
                              <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                                {b.totalPCS}
                              </td>
                              <td className="px-2 py-1 border text-right border-gray-500 uppercase">
                                {formatGr(b.totalKebutuhan)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-0">
                <table className="w-full text-xs text-left text-blue-900 border-collapse border">
                  <colgroup>
                    {Array.from({ length: 0 }).map((_, i) => (
                      <col key={i} className="w-1/6" />
                    ))}
                  </colgroup>

                  <tfoot>
                    <tr className="font-semibold bg-gray-200">
                      {/* 1️⃣  Total Bahan Baku (PCS) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Bahan Baku&nbsp;(PCS)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {totalBahanPCS}&nbsp;PCS
                      </td>

                      {/* 2️⃣  Total Kebutuhan (gr) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Kebutuhan&nbsp;(gr)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatGr(totalBahanGr)}
                      </td>

                      {/* 3️⃣  Total Kebutuhan (kg) */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Total Kebutuhan&nbsp;(kg)
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatKg(totalBeratBatchKg)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
        <DialogTrueFalse
          isOpen={isSaveDialogOpen}
          title={dialogCfg.title}
          message={dialogCfg.message}
          confirmText={dialogCfg.confirmText}
          cancelText={dialogCfg.cancelText}
          onConfirm={dialogCfg.onConfirm}
          onCancel={() => setIsSaveDialogOpen(false)}
        />
      </div>
    </div>
  );
}
