import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

/* =================================================================================
   SERVICE API                                                                     */
import {
  getMasterLokasiStore,
  getMasterLokasiKitchen,
  getMasterJenisPesanan,
  getMasterPelanggan,
  getMasterKategoriProduk,
  getMasterPengcekanPembelianSO,
  getMasterDetailSalesOrder,
  getMasterPesananPembelian,
  getMasterAdonan,
  getMasterBahanBakuProduk,
  insertMasterGabunganPermintaan,
  getMasterGabunganPermintaan,
  getMasterDetailGabunganPermintaan,
  updateGpTanggalVerifikasi,
} from "../../../../services/apiService";

/* =================================================================================
   KOMPONEN & ASET                                                                 */
import Alert from "../../../component/Alert";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";
import IconDelete from "../../../../image/icon/logo-delete.svg";
import LogoPrint from "../../../../image/icon/logo-print.svg";
import LogoSave from "../../../../image/icon/logo-save.svg";
import LogoApprove from "../../../../image/icon/logo-approve.png";
import LogoDraft from "../../../../image/icon/logo-draf.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

/* ===========================================================================
   MAIN COMPONENT
===========================================================================*/
export default function MenuAddPembelianBarangBasetroli() {
  const { id: paramId, id_master_gabungan_pemintaan } = useParams();
  const id = paramId || id_master_gabungan_pemintaan;
  // console.log("Id yang ditanggkap", id);
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

  /* filter penjualan */
  const [tglAwal, setTglAwal] = useState("");
  const [tglAkhir, setTglAkhir] = useState("");

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
  const [selectedSOIds, setSelectedSOIds] = useState([]);
  const [selectedSOs, setSelectedSOs] = useState([]); // daftar objek SO yang dipilih
  const [soDetails, setSoDetails] = useState([]);

  const [soChecks, setSoChecks] = useState([]); // hasil getMasterPengcekanPembelianSO
  const [soMasters, setSoMasters] = useState([]); // helper dari soChecks

  const [activeView, setActiveView] = useState("infoProduk");
  // di antara useState lainnya
  const [adonanMaster, setAdonanMaster] = useState([]);
  const [kebutuhanAdonan, setKebutuhanAdonan] = useState([]);

  const [gpHeader, setGpHeader] = useState(null); // 1 baris header GP
  const [gpDetails, setGpDetails] = useState([]); // detail gabungan (per‑SO)
  const isVerified = gpHeader?.status_gabungan === 1;

  const generateNoCetak = (kodeGP = "UNKNOWN") => {
    const rnd = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `C${kodeGP}-${rnd}`;
  };

  const handlePrintGabungan = () => {
    /* ---------- 0. Persiapan data & kolom ------------------ */
    let title = "";
    let head = [];
    let body = [];
    let tblW = 90; // default 9 cm  → Info/ Rekap
    let rowsPerHalf = 55;

    switch (activeView) {
      case "infoProduk":
        title = "DAFTAR INFO PRODUK";
        head = [["NO", "SO", "KODE", "NAMA", "QTY"]];
        body = tableRows.map((r, idx) => [
          idx + 1,
          r.kode_sales_order,
          r.kode_barang,
          r.namabarang,
          r.quantity + " Pcs",
        ]);
        break;

      case "rekapProduk":
        title = "REKAP PRODUK";
        head = [["NO", "NAMA", "TOTAL QTY"]];
        body = rekapData.map((r, idx) => [idx + 1, r.namabarang, r.totalQty + " Pcs"]);
        break;

      case "kebSetengahJadi":
        title = "KEBUTUHAN BARANG SETENGAH JADI";
        tblW = 100; // 15 cm
        rowsPerHalf = 30; // lebih longgar
        head = [["NO", "JENIS ADONAN", "BATCH", "BERAT/BT (gr)", "TOTAL (gr)"]];
        body = kebutuhanAdonan.map((a, idx) => [
          idx + 1,
          a.nama,
          a.batchCount,
          a.beratPerBatch.toLocaleString("id-ID"),
          a.totalBerat.toLocaleString("id-ID"),
        ]);
        break;

      case "kebBahanBaku":
        title = "KEBUTUHAN BAHAN BAKU";
        tblW = 80;
        rowsPerHalf = 30;
        head = [["NO", "NAMA", "STOK (gr)", "TOTAL KBT (gr)", "KBT (gr)"]];
        body = bahanBakuAggregated.map((b, idx) => [
          idx + 1,
          b.nama_bahan_baku,
          formatGr2(b.stok_bahan_baku),
          formatGr2(b.totalKebutuhan),
          formatGr2(b.kebutuhanPerPCS),
        ]);
        break;

      default:
        setAlert({
          message: "Tab tidak dikenal – gagal cetak.",
          type: "warning",
          visible: true,
        });
        return;
    }

    if (!body.length) {
      setAlert({
        message: "Tidak ada data untuk dicetak.",
        type: "warning",
        visible: true,
      });
      return;
    }

    /* ---------- 1. Inisialisasi PDF & header umum ----------- */
    const doc = new jsPDF("p", "mm", "a4");
    const kodeGP = gpHeader?.kode_gabungan_permintaan || "–";
    const noCetak = generateNoCetak(kodeGP);
    const today = new Date().toLocaleDateString("id-ID");

    const addHeader = (yStart = 5) => {
      doc.setFontSize(10).setFont("courier", "bold");
    
      /* —— pakai font monospace agar lebar karakter sama —— */
      doc.setFontSize(7).setFont("courier", "normal");   // <‑‑ cukup di sini
    
      /* helper untuk meratakan lebar label */
      const field = (label, val) => `${label.padEnd(11, " ")}:  ${val}`;
    
      const lines = [
        field("No/Cetak",  noCetak),
        field("Lokasi",    gpHeader?.nama_kitchen || "-"),
        field("User",      gpHeader?.nama_user    || "-"),
        field("Tgl Cetak", today),
      ];
    
      lines.forEach((t, i) => doc.text(t, 10, yStart + 4 + i * 3));
    
      doc.setFontSize(8).setFont("courier", "bold");
      doc.text(title, 10, yStart + 4 + lines.length * 3 + 2);
    
      return yStart + 20;      // posisi awal tabel
    };
    
    /* ---------- 2. Util dua‑kolom per halaman --------------- */
    const makeTwoColumns = (rows) => {
      const chunked = [];
      for (let i = 0; i < rows.length; i += rowsPerHalf) {
        chunked.push(rows.slice(i, i + rowsPerHalf));
      }
      return chunked;
    };

    /* ---------- 3. Cetak tabel ------------------------------ */
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftX = 10;
    const rightX = leftX + tblW + 5; // 5 mm spasi antar kolom
    const chunks = makeTwoColumns(body);

    let colPos = 0; // 0 → kiri, 1 → kanan
    let pagePos = 0; // nomor halaman (0‐based)

    chunks.forEach((chunk, idx) => {
      if (colPos === 0) {
        // kolom kiri  ⇒  tambah halaman baru KECUALI pertama
        if (idx !== 0) doc.addPage();
        const startY = addHeader();
        autoTable(doc, {
          head,
          body: chunk,
          startY,
          margin: { left: leftX },
          tableWidth: tblW,
          styles: {
            fontSize: 6,
            cellPadding: 0.6,
            lineWidth: 0.1,
            lineColor: [0, 0, 0], // hitam
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
          },
          theme: "grid",
        });
        colPos = 1;
      } else {
        /* kolom kanan di halaman yang sama */
        const startY = 33; // sama dgn kiri
        autoTable(doc, {
          head,
          body: chunk,
          startY,
          margin: { left: rightX },
          tableWidth: tblW,
          styles: {
            fontSize: 6,
            cellPadding: 0.6,
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
          },
          theme: "grid",
        });
        colPos = 0;
        pagePos++;
      }
    });

    /* ---------- 4. Nomor halaman ---------------------------- */
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(`${i}`, 10, doc.internal.pageSize.getHeight() - 5);
    }

    /* ---------- 5. Simpan / tampilkan ----------------------- */
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUrl;

    iframe.onload = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      iframe.onafterprint = () => {
        console.log("Print selesai!");
        URL.revokeObjectURL(pdfUrl);
        document.body.removeChild(iframe);
      };
    };

    document.body.appendChild(iframe);
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    // Format angka agar selalu dua digit
    const padZero = (num) => String(num).padStart(2, "0");
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };
  /**************************************************************************
   * 1. fungsi util untuk menghitung kebutuhan adonan dari tableRows
   **************************************************************************/
  const computeKebutuhanAdonan = (rows, adonanMaster, bahanBakuMaster) => {
    if (!rows.length) return [];

    // (1) hitung total PCS per id_produk
    const pcsPerProduk = rows.reduce((acc, r) => {
      acc[r.id_produk] = (acc[r.id_produk] || 0) + Number(r.quantity || 0);
      return acc;
    }, {});

    // (2) buat list kebutuhan per‑bahan‑baku
    const temp = bahanBakuMaster
      .filter((b) => pcsPerProduk[b.id_produk])
      .map((b) => {
        const namaAdonan =
          adonanMaster.find(
            (a) => a.id_kategori_adonan_produk === b.id_kategori_adonan_produk
          )?.nama_kategori_adonan_produk || `#${b.id_kategori_adonan_produk}`;

        return {
          id: b.id_kategori_adonan_produk,
          nama: namaAdonan,
          batchCount: pcsPerProduk[b.id_produk],
          kebutuhanPerPCS: Number(b.jumlah_kebutuhan || 0),
        };
      });

    // (3) gabungkan per id_kategori_adonan_produk
    const map = new Map();
    temp.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, { ...t, totalBerat: 0 });
      const m = map.get(t.id);
      m.totalBerat += t.kebutuhanPerPCS * t.batchCount;
    });

    // (4) hitung beratPerBatch (dedupe bahan baku)
    return Array.from(map.values()).map((row) => {
      const beratPerBatch = Array.from(
        new Map(
          bahanBakuMaster
            .filter((b) => b.id_kategori_adonan_produk === row.id)
            .map((b) => [b.id_bahan_baku, Number(b.jumlah_kebutuhan || 0)])
        ).values()
      ).reduce((s, gr) => s + gr, 0);

      return {
        ...row,
        beratPerBatch,
        totalBerat: row.totalBerat,
      };
    });
  };

  /**************************************************************************
   * 2.  recompute setiap kali tableRows OR master‑data berubah
   **************************************************************************/
  useEffect(() => {
    const info = computeKebutuhanAdonan(
      tableRows,
      adonanMaster,
      bahanBakuMaster
    );
    setKebutuhanAdonan(info);
  }, [tableRows, adonanMaster, bahanBakuMaster]);

  /* --------------------------------------------------------------
   AMBIL HEADER GP + DETAIL GP + HEADER SO  ➜  susun tableRows
----------------------------------------------------------------*/
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        /* 1️⃣ HEADER GABUNGAN  ------------------------------------------------*/
        const headerRaw = await getMasterGabunganPermintaan(token);
        // console.log("headerRaw", headerRaw);
        const gpFlat = Object.values(headerRaw[0] || {}).find(
          (h) => String(h.id_master_gabungan_pemintaan) === String(id)
        );
        setGpHeader(gpFlat);

        /* 2️⃣ DETAIL GABUNGAN (per‑SO)  --------------------------------------*/
        const detRaw = await getMasterDetailGabunganPermintaan(token);
        const detFlat = Object.values(detRaw[0] || {}).filter(
          (d) => String(d.id_master_gabungan_pemintaan) === String(id)
        );
        setGpDetails(detFlat);

        /* 3️⃣ HEADER SO, kita buat map keyed by id_master_sales_order ---------*/
        const soHdrRaw = await getMasterPengcekanPembelianSO(token);
        const soHeaders = soHdrRaw
          .flatMap((o) => Object.values(o))
          .flatMap((o) => Object.values(o)) // 🔹 tambahkan lapis flatten
          .map((r) => r["0"] || r)
          .filter((h) => h && h.id_master_sales_order); // 🔹 buang entri 0/undefined

        const soMap = new Map();
        soHeaders.forEach((h) => {
          if (
            !soMap.has(h.id_master_sales_order) &&
            (h.tanggal_transaksi || h.tanggal_kirim)
          ) {
            soMap.set(h.id_master_sales_order, h);
          }
        });

        /* 4️⃣ GABUNGKAN DETAIL PRODUK ----------------------------------------*/
        const rows = [];
        for (const d of detFlat) {
          const raw = await getMasterDetailSalesOrder(
            token,
            d.id_master_sales_order
          );
          const items = Object.values(raw[0] || {}).map((o) => o["0"] || o);

          const hdr = soMap.get(d.id_master_sales_order); // bisa undefined

          items
            .filter(
              (x) =>
                String(x.id_master_sales_order) ===
                  String(d.id_master_sales_order) &&
                String(x.id_master_pesanan_pembelian) ===
                  String(d.id_master_pesanan_pembelian)
            )
            .forEach((x) => {
              rows.push({
                /* info header/detail gabungan */
                soId: d.id_master_sales_order,
                pbId: d.id_master_pesanan_pembelian,
                kode_sales_order: d.kode_sales_order,
                kode_pesanan: d.kode_pesanan_pembelian,
                tanggal_transaksi: d.tanggal_transaksi || "-",
                tanggal_kirim: d.tanggal_kirim || "-",

                /* kitchen: pakai header GP → header SO → "-" */
                nama_kitchen: gpFlat?.nama_kitchen || hdr?.nama_kitchen || "-",

                /* detail produk */
                id_produk: x.id_produk,
                kode_barang: x.kode_produk,
                namabarang: x.nama_produk,
                quantity: x.quantity,
                harga_jual: parseFloat(x.harga_jual) || 0,
                id_kategori_adonan_produk: x.id_kategori_adonan_produk,
                id_kategori_filling_pertama: x.id_kategori_filling_pertama,
                id_kategori_filling_kedua: x.id_kategori_filling_kedua,
                id_kategori_topping_pertama: x.id_kategori_topping_pertama,
                id_kategori_topping_kedua: x.id_kategori_topping_kedua,
              });
            });
        }

        // console.log("rows", rows); // 🔹 cek hasil akhir
        setTableRows(rows);
      } catch (e) {
        setError(e.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, id]);

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
        message: "Pilih minimal satu Sales Order.",
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

  const nowSQL = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  };

  /* ── handler verifikasi (Lanjut Produksi) ─────────────────────── */
  const handleVerifyProduksi = async () => {
    if (!gpHeader?.id_master_gabungan_pemintaan) {
      setAlert({
        message: "Data gabungan belum lengkap.",
        type: "warning",
        visible: true,
      });
      return;
    }

    const payload = {
      id_master_gabungan_pemintaan: gpHeader.id_master_gabungan_pemintaan,
      tanggal_verifikasi_gb: nowSQL(), // "YYYY-MM-DD HH:mm:ss"
    };

    try {
      setLoading(true);
      const res = await updateGpTanggalVerifikasi(token, payload);

      if (res.success) {
        /* update state lokal supaya UI langsung berubah */
        setGpHeader((h) => ({
          ...h,
          status_gabungan: 1,
          tanggal_verifikasi_gb: payload.tanggal_verifikasi_gb,
        }));

        setAlert({
          message: res.message || "Verifikasi berhasil.",
          type: "success",
          visible: true,
        });

        setTimeout(() => {
          setAlert((a) => ({ ...a, visible: false }));
          window.location.reload(); // reload halaman untuk ambil data baru
        }, 2000);
      } else {
        setAlert({
          message: res.message || "Verifikasi gagal.",
          type: "warning",
          visible: true,
        });
      }
    } catch (err) {
      setAlert({
        message: err.message || "Gagal meng‑hubungi server.",
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
        message: "Klik Tambah Pesanan dulu.",
        type: "warning",
        visible: true,
      });
    }

    /* 1️⃣ — HEADER PAYLOAD  */
    const kitchenObj = masterKitchen.find(
      (k) => String(k.id_lokasi) === String(kitchenTujuan)
    );
    const kodeKitchen = kitchenObj?.kode_lokasi || ""; // KC01 / K003 etc.
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
    (s, r) => s + Number(r.quantity || 0) * r.harga_jual,
    0
  );
  /* total PCS di tab Rekap Produk */
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
  const totalBahanKg = totalBahanGr / 1000;
  const totalBahanPCS = bahanBakuAggregated.reduce(
    (s, b) => s + Number(b.totalPCS || 0),
    0
  );

  const subtotalHarga = visibleRows.reduce((s, r) => s + r.harga_jual, 0);
  const match = (str = "", kw = "") =>
    str.toLowerCase().includes(kw.toLowerCase());

  /* ================================================================
   Dataset dinamis sesuai tab
================================================================ */
  const viewData = useMemo(() => {
    switch (activeView) {
      case "infoProduk":
        return {
          rows: tableRows, // baris yg dirender
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
          getKode: (r) => r.id, // bisa juga nama
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
            to="/dashboard/adminkitchen"
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
            to="/dashboard/adminkitchen/menu/gabunganpermintaan"
            className="text-xs font-semibold text-blue-900"
          >
            Detail
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
                  value={gpHeader?.kode_gabungan_permintaan || "-"}
                  className="w-40 border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">Kitchen :</label>
                <input
                  disabled
                  value={gpHeader?.nama_kitchen || "-"}
                  className="w-40 border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
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
                  value={formatDate(gpHeader?.tanggal_verifikasi_gb) || "-"}
                  className="w-full border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                {/* akhir */}
                <label className="text-blue-900 font-semibold">
                  Status Gabungan
                </label>
                <input
                  disabled
                  value={
                    gpHeader?.status_gabungan === 0
                      ? "Menunggu Verifikasi"
                      : gpHeader?.status_gabungan === 1
                      ? "Lanjut Produksi"
                      : "-"
                  }
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              <div className="w-40">
                {/* awal */}
                <label className="text-blue-900 font-semibold">
                  Dibuat Oleh
                </label>
                <input
                  disabled
                  value={gpHeader?.nama_user || "-"}
                  className="w-full border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* ================= PANEL KANAN =================================== */}

        <fieldset className="flex flex-col h-full space-y-0.5">
          <fieldset className="border border-blue-500 rounded-md p-2 shadow-sm">
            <legend className="px-0.5 text-sm font-bold text-blue-900">
              Cetak
            </legend>
            <button
              onClick={handlePrintGabungan}
              className="flex items-center space-x-2 border bg-gray-100 border-gray-300 rounded p-1 text-blue-900 hover:bg-gray-100"
            >
              <img src={LogoPrint} alt="print" className="w-6 h-6" />
              <span className="text-sm font-semibold">Cetak Gabungan</span>
            </button>
            <p
              className="text-red-600 italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *Hasil sesuai dengan tampilan
            </p>
          </fieldset>
          <fieldset className="border border-blue-500 h-full rounded-md p-2 shadow-sm">
            <legend className="px-2 text-sm font-bold text-blue-900">
              Verifikasi Lanjut Produksi
            </legend>
            <button
              disabled={isVerified}
              onClick={isVerified ? undefined : handleVerifyProduksi}
              className={`flex items-center w-40 space-x-2 rounded p-1
    ${
      isVerified
        ? "bg-blue-300 cursor-not-allowed text-white" // ✓ sudah diverifikasi
        : "bg-blue-900 hover:bg-blue-800 text-white"
    }   // • masih bisa diverifikasi
  `}
            >
              <img src={LogoSave} alt="save" className="w-6 h-6" />
              <span className="text-xs font-semibold">Lanjut Produksi</span>
            </button>
            <p
              className="text-red-600 text-xs italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *Pastikan Bahan Baku Tersedia
            </p>
          </fieldset>
        </fieldset>
        <div className="flex-row">
          <div className="flex flex-col items-center m-4">
            {/* logo */}
            {gpHeader?.status_gabungan === 1 ? (
              /* ✔️  Lanjut Produksi / Approved */
              <img
                src={LogoApprove}
                alt="Approved"
                className="w-52 h-32 mb-4"
              />
            ) : (
              /* 0 (Menunggu Verifikasi) → Draft  */
              <img src={LogoDraft} alt="Draft" className="w-52 h-32 mb-4" />
            )}
          </div>
        </div>
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
                            <span className="whitespace-nowrap text-xs">
                              {" "}
                              {row.totalQty}{" "}
                            </span>
                            <span className="whitespace-nowrap text-xs">
                              PCS
                            </span>
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
                        {formatGr2(totalBeratGr)} gr
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
                        {(totalBahanPCS)}&nbsp;PCS
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
                        {formatKg(totalBahanGr)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
