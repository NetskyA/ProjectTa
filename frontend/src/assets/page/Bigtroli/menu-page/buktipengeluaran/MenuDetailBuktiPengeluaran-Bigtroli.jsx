import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

/* =================================================================================
   SERVICE API                                                                     */
import {
  getMasterSalesOrder,
  getMasterPengcekanPembelianSO,
  getMasterDetailSalesOrder,
  getMasterPesananPembelian,
  getMasterPesananPembelianDetail,
  getMasterAdonan,
  getMasterBahanBakuProduk,
  insertMasterGabunganPermintaan,
  getMasterGabunganPermintaan,
  getMasterDetailGabunganPermintaan,
  updateGpTanggalVerifikasi,
  getMasterProduksiProduk,
  updatePrTanggalVerifikasi,
  getMasterBuktiPengeluaran,
  getMasterDetailBuktiPengeluaran,
  updateBuktiStatusKode,
  getMasterLokasiKitchen,
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

// helper untuk flatten MySQL-nested responses
// helper untuk flatten MySQL‐nested responses (sekali lapis)
function flattenMySQLPayload(res) {
  const container = Array.isArray(res) ? res[0] || {} : res;
  return Object.values(container).map((o) => (o && o["0"]) || o);
}
/* ===========================================================================
   MAIN COMPONENT
===========================================================================*/
export default function MenuAddPembelianBarangBasetroli() {
  const { id: paramId, id_master_bukti_pengeluaran } = useParams();
  const id = paramId || id_master_bukti_pengeluaran;
  console.log("Id yang ditanggkap", id);
  /* ---------- Redux ---------- */
  const token = useSelector((s) => s.auth.token);
  const id_user = useSelector((s) => s.auth.id_user);
  const kode_toko = useSelector((s) => s.auth.kode_toko);
  const id_tokoInt = parseInt(
    useSelector((s) => s.auth.id_toko),
    10
  );
  const [buktiHeader, setBuktiHeader] = useState(null);
  const [buktiDetails, setBuktiDetails] = useState([]);
  /* ---------- Local state ---- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  /* master data */
  const [masterKitchen, setMasterKitchen] = useState([]);
  const [produksiHeader, setProduksiHeader] = useState(null);
  /* info transaksi */
  const [kitchenTujuan, setKitchenTujuan] = useState("");

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
  const [filteredSOOptions, setFilteredSOOptions] = useState([]); // string[] of kode_sales_order
  const [selectedSOIds, setSelectedSOIds] = useState([]);
  const [selectedSOs, setSelectedSOs] = useState([]); // daftar objek SO yang dipilih
  const [soDetails, setSoDetails] = useState([]);

  const [activeView, setActiveView] = useState("pesananPembelian");

  const [gpHeader, setGpHeader] = useState(null); // 1 baris header GP
  const [gpDetails, setGpDetails] = useState([]); // detail gabungan (per‑SO)
  const isVerified = gpHeader?.status_gabungan === 1;

  const [poHeaders, setPoHeaders] = useState([]);
  const [poDetails, setPoDetails] = useState([]);
  const [pesananDetails, setPesananDetails] = useState([]);
  const isBuktiVerified = buktiHeader?.status_bukti_pengeluaran === 1;

  useEffect(() => {
    (async () => {
      try {
        const kitchenRes = await getMasterLokasiKitchen(token);
        // flatten if necessary, or just take the array
        const kitchenList = Object.values(kitchenRes || {}).filter(
          (l) => l.status === 0
        );
        setMasterKitchen(kitchenList);
      } catch (e) {
        console.error("Gagal load master kitchen:", e);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      getMasterBuktiPengeluaran(token),
      getMasterDetailBuktiPengeluaran(token, id),
      getMasterPesananPembelian(token),
      getMasterSalesOrder(token), // ← новый API
    ])
      .then(async ([resB, resD, resP, resSo]) => {
        // 1) Header bukti
        const flatB = flattenMySQLPayload(resB);
        const thisHeader = flatB.find(
          (b) => String(b.id_master_bukti_pengeluaran) === String(id)
        );
        setBuktiHeader(thisHeader || null);

        // 2) Detail bukti
        const allBuktiDetails = flattenMySQLPayload(resD);
        const thisBuktiDetails = allBuktiDetails.filter(
          (d) => String(d.id_master_bukti_pengeluaran) === String(id)
        );
        setBuktiDetails(thisBuktiDetails);

        // 3) PO headers yang valid
        const allowedPB = new Set(
          thisBuktiDetails.map((d) => d.id_master_pesanan_pembelian)
        );
        const allHdr = flattenMySQLPayload(resP);

        // 4) Flatten sales orders
        const allSO = flattenMySQLPayload(resSo);
console.log("🟦 Pesanan Pembelian (allHdr):", allHdr);
console.log("🟩 Sales Orders (allSO):", allSO);
        // 5) Sisipkan tanggal dari sales order
        const headersForThis = allHdr
          .filter((h) => allowedPB.has(h.id_master_pesanan_pembelian))
.map((h) => {
const match = allSO.find(
  (so) =>
    Number(so.id_master_pesanan_pembelian) === Number(h.id_master_pesanan_pembelian)
);


if (!match) {
  console.warn("❌ Tidak ditemukan match:", h);
}

  return {
    ...h,
    salesOrderDate: match?.tanggal_transaksi || null,
    id_master_sales_order: match?.id_master_sales_order || null,
    kode_sales_order: match?.kode_sales_order || null,
    kode_lokasi_kitchen: h.kode_lokasi_kitchen,
    catatan_header: h.catatan,
    nama_pesanan: h.nama_pesanan,
  };
});


        setPoHeaders(headersForThis);

        // 6) Fetch & flatten detail PO
        const detailArrays = await Promise.all(
          headersForThis.map(async (h) => {
            const raw = await getMasterPesananPembelianDetail(
              token,
              h.id_master_pesanan_pembelian
            ).catch(() => null);
            console.log("raw", raw);
            return flattenMySQLPayload(raw)
              .filter(
                (r) =>
                  Number(r.id_master_pesanan_pembelian) ===
                  Number(h.id_master_pesanan_pembelian)
              )
              .map((r) => ({
                ...r,
                kode_sales_order: h.kode_sales_order,
                id_master_sales_order: h.id_master_sales_order,
              }));
            })
          );

        const allDetails = detailArrays.flat();
        setPesananDetails(allDetails);
        setPoDetails(allDetails);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Gagal memuat bukti pengeluaran");
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const isPRVerified =
    produksiHeader?.status_produksi === 1 &&
    produksiHeader?.tanggal_verifikasi_pr;
  const generateNoCetak = (kodeGP = "UNKNOWN") => {
    const rnd = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `C${kodeGP}-${rnd}`;
  };

  const handlePrintGabungan = () => {
    const mmPerInch = 25.4;
    const width = 9.5 * mmPerInch;
    const height = 5.5 * mmPerInch;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [width, height],
    });

    const today = new Date().toLocaleDateString("id-ID");
    poHeaders.forEach((h, idx) => {
      if (idx > 0) doc.addPage([width, height], "landscape");

      // ——— Title (font 14) ———
      doc
        .setFontSize(14)
        .setFont("helvetica", "bold")
        .text("DOUBLE O BAKERY", 10, 10)
        .text("SURAT JALAN", width - 10, 10, { align: "right" });

      // ukuran kotak
      const boxHeight = 15; // sebelumnya 20
      const boxY = 15;

      // ——— Kotak Kiri ———
      const leftBoxW = width * 0.6 - 7;
      doc
        .setLineWidth(0.1)
        .setDrawColor(120)
        .rect(10, boxY, leftBoxW, boxHeight);
      doc
        .setFontSize(7)
        .setFont("courier", "normal")
        .text("Kepada Yth", 12, boxY + 2)
        .text(h.nama_store || "-", 12, boxY + 6)
        .text(h.nama_pelanggan_external || "-", 12, boxY + 10)
        .text(`Tgl Cetak: ${today}`, 12, boxY + 14);

      // ——— Kotak Kanan ———
      const rightX = 10 + leftBoxW + 5;
      const rightW = width * 0.4 - 18;
      doc.rect(rightX, boxY, rightW, boxHeight);
      doc
        .setFont("courier")
        .setFontSize(7)
        .text(
          `No. SJ  : ${buktiHeader.kode_bukti_pengeluaran || "-"}`,
          rightX + 2,
          boxY + 2
        )
        .text(
          `Tgl SJ  : ${formatDate(buktiHeader.tanggal_verifikasi_bk)}`,
          rightX + 2,
          boxY + 6
        )
        .text(`No. SO  : ${h.kode_sales_order}`, rightX + 2, boxY + 10)
        .text(
          `Tgl SO  : ${formatDate(h.salesOrderDate)}`,
          rightX + 2,
          boxY + 14
        );

      // ——— Table & Catatan (sama seperti sebelumnya) ———
      const details = poDetails
        .filter(
          (d) => d.id_master_pesanan_pembelian === h.id_master_pesanan_pembelian
        )
        .map((d, i) => [
          i + 1,
          d.nama_produk,
          d.quantity + " PCS",
          d.catatan || "",
        ]);
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: boxY + boxHeight + 2,
        head: [["No", "Nama", "Jumlah", "Keterangan"]],
        body: details,
        theme: "grid",
        styles: {
          fontSize: 8,
          font: "courier",
          cellPadding: 1,
          lineWidth: 0.1,
          lineColor: [120, 120, 120],
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0], // Jaga teks body tetap hitam
        },
        headStyles: {
          fillColor: [255, 255, 255], // background putih
          textColor: [0, 0, 0], // teks header hitam
          lineWidth: 0.1,
          lineColor: [120, 120, 120],
        },
        margin: { left: 10, right: 10 },
      });

      // kotak Catatan
      const finalY = doc.lastAutoTable.finalY;
      doc.rect(10, finalY + 2, width - 20, 15);
      doc
        .setFontSize(8)
        .setFont("courier", "normal")
        .text("Catatan:", 12, finalY + 7)
        .text(h.catatan || "-", 28, finalY + 7);

      // ——— Area Tanda Tangan (posisi tetap) ———
      const bottomMargin = 20;
      const sigY = height - bottomMargin; // Y untuk label (“Penerima”, “Hormat Kami”)
      const gapLabelToLine = 19; // jarak dari label ke garis ttd

      // X-grid
      const usableWidth = width - 20;
      const colWidth = usableWidth / 3;
      const x1 = 10,
        x2 = x1 + colWidth,
        x3 = x1 + 2 * colWidth;

      // 1️⃣ Penerima
      doc.setFontSize(9).setFont("courier", "normal");
      doc.text("Penerima", x1 + 12, sigY);
      doc.text("(_____________________)", x1, sigY + gapLabelToLine);

      // 2️⃣ Tanda tangan tengah saja
      doc.text(
        "(_____________________)",
        x2 + colWidth / 2 - 45,
        sigY + gapLabelToLine
      );

      // 3️⃣ Hormat Kami / DOUBLE O
      doc.text("Hormat Kami, DOUBLE O BAKERY", x3 - 3, sigY);
      doc.text("(_____________________)", x3, sigY + gapLabelToLine);
    });

    // Cetak
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      iframe.onafterprint = () => {
        URL.revokeObjectURL(url);
        document.body.removeChild(iframe);
      };
    };
  };

  const rekapData = useMemo(() => {
    const map = new Map();
    pesananDetails.forEach((d) => {
      const key = `${d.kode_sales_order}::${d.kode_produk}`;
      if (!map.has(key)) {
        map.set(key, {
          kode_sales_order: d.kode_sales_order,
          kode_produk: d.kode_produk,
          nama_produk: d.nama_produk,
          totalQty: 0,
        });
      }
      map.get(key).totalQty += Number(d.quantity || 0);
    });
    return Array.from(map.values());
  }, [pesananDetails]);

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

  useEffect(() => {
    (async () => {
      try {
        const res = await getMasterProduksiProduk(token); // ← log sudah OK
        // console.log("produksiHeader", res); // 🔹 cek hasil
        // ► ambil hanya elemen pertama lalu Object.values untuk dapat semua baris
        const records =
          Array.isArray(res) && res.length > 0 ? Object.values(res[0]) : [];

        // cari yang sesuai id dari URL
        const found = records.find(
          (r) => String(r.id_master_produksi) === String(id)
        );

        setProduksiHeader(found || null);
      } catch (e) {
        console.error("Gagal fetch produksiHeader:", e);
      }
    })();
  }, [token, id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        /* HEADER GABUNGAN  ------------------------------------------------*/
        const headerRaw = await getMasterGabunganPermintaan(token);
        // console.log("headerRaw", headerRaw);
        const gpFlat = Object.values(headerRaw[0] || {}).find(
          (h) => String(h.id_master_gabungan_pemintaan) === String(id)
        );
        setGpHeader(gpFlat);

        /* DETAIL GABUNGAN (per‑SO)  --------------------------------------*/
        const detRaw = await getMasterDetailGabunganPermintaan(token);
        const detFlat = Object.values(detRaw[0] || {}).filter(
          (d) => String(d.id_master_gabungan_pemintaan) === String(id)
        );
        console.log("detFlat", detFlat);
        setGpDetails(detFlat);

        const soHdrRaw = await getMasterPengcekanPembelianSO(token);
        
        const soHeaders = soHdrRaw
          .flatMap((o) => Object.values(o))
          .flatMap((o) => Object.values(o)) //  tambahkan lapis flatten
          .map((r) => r["0"] || r)
          .filter((h) => h && h.id_master_sales_order);
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

    const forKitchen = salesOrderChecks.filter(
      (so) => Number(so.id_kitchen) === Number(kitchenTujuan) && inDateRange(so)
    );

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

      console.log("allRows", getMasterDetailSalesOrder);

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

  //* ── handler verifikasi (Verifikasi Pengeluaran) ─────────────────────── */
const handleVerifyPengeluaran = async () => {
  try {
    setLoading(true);
const firstDetail = gpDetails[0];
    const kitchenRec = masterKitchen.find(
      (k) => k.id_kitchen === buktiHeader.id_kitchen
    );
    const kitchenCode = kitchenRec?.kode_lokasi;
    if (!kitchenCode) {
      throw new Error(
        "Kode kitchen tidak ditemukan untuk id " + buktiHeader.id_kitchen
      );
    }

const payload = {
  productionId: produksiHeader.id_master_produksi,
  buktiId: buktiHeader.id_master_bukti_pengeluaran,
  createby: id_user,
  kitchenCode: poHeaders[0]?.kode_lokasi_kitchen || "-", // fallback
  items: gpDetails.map((d) => ({
    id_master_pesanan_pembelian: d.id_master_pesanan_pembelian,
    id_master_sales_order: d.id_master_sales_order,
  })),
};

    // console.log("payload", payload);
    // return;
    const res = await updateBuktiStatusKode(token, payload);

    if (res.success) {
      setBuktiHeader((h) => ({
        ...h,
        status_bukti_pengeluaran: 1,
        kode_bukti_pengeluaran: res.kode_bukti_pengeluaran,
      }));
      setAlert({ type: "success", message: res.message, visible: true });
      setTimeout(() => {
        setAlert((a) => ({ ...a, visible: false }));
        window.location.reload();
      }, 2000);
    } else {
      setAlert({ type: "warning", message: res.message, visible: true });
    }
  } catch (err) {
    setAlert({
      type: "error",
      message: err.message || "Gagal memverifikasi bukti pengeluaran.",
      visible: true,
    });
  } finally {
    setLoading(false);
  }
};


  const nowSQL = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
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

  /* ================================================================
   Dataset dinamis sesuai tab
================================================================ */
  const viewData = useMemo(() => {
    switch (activeView) {
      case "pesananPembelian":
        return {
          rows: tableRows, // baris yg dirender
          getKode: (r) => r.kode_barang,
          getNama: (r) => r.namabarang,
        };

      case "detailProdukPembelian":
        return {
          rows: rekapData,
          getKode: (r) => r.kode_barang,
          getNama: (r) => r.namabarang,
        };

      default:
        return { rows: [], getKode: () => "", getNama: () => "" };
    }
  }, [activeView, tableRows, rekapData]);

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

  const totalQtyRekap = rekapData.reduce(
    (sum, row) => sum + Number(row.totalQty || 0),
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
            to="/dashboard/adminkitchen/menu/buktipengeluaran"
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
            Bukti Pengeluaran Produksi
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
        <fieldset className="max-w-lg border border-blue-400 rounded-md p-2 shadow-sm">
          <legend className="px-0.5 text-sm font-bold text-blue-900">
            Info Produksi
          </legend>
          <div className="flex-row text-xs">
            <div className="flex gap-1.5">
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  No. Produksi Produk :
                </label>
                <input
                  disabled
                  value={buktiHeader?.kode_master_produksi || "-"}
                  className="w-40 border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Tanggal Verifikasi PR :
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.tanggal_verifikasi_pr
                      ? formatDate(buktiHeader.tanggal_verifikasi_pr)
                      : "-"
                  }
                  className="w-full border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Status Produksi
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.status_produksi === 1
                      ? "Produksi Selesai"
                      : "-"
                  }
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Bukti Pengeluaran :
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.status_bukti_pengeluaran === 0
                      ? "MENUNGGU VER. PENGELUARAN"
                      : "Cetak Bukti Pengeluaran"
                  }
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Dibuat Oleh
                </label>
                <input
                  disabled
                  value={buktiHeader?.nama_user || "-"}
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="max-w-lg border border-blue-400 rounded-md p-2 shadow-sm">
          <legend className="px-0.5 text-sm font-bold text-blue-900">
            Info Bukti Pengeluaran
          </legend>
          <div className="flex-row text-xs">
            <div className="flex gap-1.5">
              {/* No. Bukti */}
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  No. Bukti Pengeluaran:
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.kode_bukti_pengeluaran
                      ? buktiHeader.kode_bukti_pengeluaran
                      : "Belum Verifikasi"
                  }
                  className="w-40 border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>

              {/* Tgl Verifikasi BK */}
              <div className="w-52">
                <label className="text-blue-900 font-semibold">
                  Tgl Verifikasi BK:
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.tanggal_verifikasi_bk
                      ? formatDate(buktiHeader.tanggal_verifikasi_bk)
                      : "-"
                  }
                  className="w-full border h-7 text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
              {/* Status BK */}
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Status Produksi
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.status_produksi === 1
                      ? "Produksi Selesai"
                      : "Belum Verifikasi"
                  }
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Status B. Pengeluaran:
                </label>
                <input
                  disabled
                  value={
                    buktiHeader?.status_bukti_pengeluaran === 1
                      ? "Siap Cetak"
                      : "Belum Verifikasi"
                  }
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
              {/* Dibuat Oleh */}
              <div className="w-40">
                <label className="text-blue-900 font-semibold">
                  Dibuat Oleh:
                </label>
                <input
                  disabled
                  value={buktiHeader?.nama_user || "-"}
                  className="w-full border h-7 uppercase text-gray-500 border-gray-300 rounded p-1 bg-gray-100"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* ================= PANEL KANAN =================================== */}

        <fieldset className="flex flex-col h-full space-y-0.5">
          <fieldset className="border h-full border-blue-500 rounded-md p-2 shadow-sm">
            <legend className="px-0.5 text-sm font-bold text-blue-900">
              Cetak
            </legend>
            <button
              onClick={handlePrintGabungan}
              disabled={!isBuktiVerified} // disable kalau BELUM verifikasi
              className={`flex items-center space-x-2 border w-52 rounded p-1
      ${
        !isBuktiVerified
          ? "bg-gray-300 cursor-not-allowed text-gray-600"
          : "bg-gray-100 border-gray-300 text-blue-900 hover:bg-gray-100"
      }`}
            >
              <img src={LogoPrint} alt="print" className="w-6 h-6" />
              <span className="text-sm font-semibold">
                Cetak Bukti Pengeluaran
              </span>
            </button>
          </fieldset>
          <fieldset className="border border-blue-500 h-full rounded-md p-2 shadow-sm">
            <legend className="px-2 text-sm font-bold text-blue-900">
              Verifikasi Selesai
            </legend>
            <button
              disabled={isBuktiVerified}
              onClick={isBuktiVerified ? undefined : handleVerifyPengeluaran}
              className={`flex items-center w-48 space-x-2 rounded p-1
    ${
      isBuktiVerified
        ? "bg-blue-300 cursor-not-allowed text-white"
        : "bg-blue-900 hover:bg-blue-800 text-white"
    }`}
            >
              <img src={LogoSave} alt="save" className="w-6 h-6" />
              <span className="text-xs font-semibold">
                Lanjut Nota Penjualan
              </span>
            </button>
          </fieldset>
        </fieldset>
        <div className="flex-row">
          <div className="flex flex-col items-center m-4">
            {/* logo */}
            {buktiHeader?.status_bukti_pengeluaran === 1 ? (
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
      {/* <div className="bg-white flex flex-col mt-2 md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-2">
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
      </div> */}

      <div className="bg-white section-informasi rounded-md shadow-md p-1">
        {/* bagian ini nan jika ditekan akan menampilkan isi table yang berbeda-beda sesuai dengan button yang dipilih  */}
        <div className="bg-white section-informasi border border-gray-200 rounded-md shadow-md p-1 space-y-2">
          <div className="flex gap-1 text-xs">
            {/* ------------ INFO PRODUK ------------- */}
            <button
              onClick={() => setActiveView("pesananPembelian")}
              className={`p-1 w-40 font-semibold border-b-2 ${
                activeView === "pesananPembelian"
                  ? "border-blue-800 text-blue-800"
                  : "border-transparent text-gray-700"
              }`}
            >
              Pesanan Pembelian
            </button>

            {/* ------------ REKAP PRODUK ------------- */}
            <button
              onClick={() => setActiveView("detailProdukPembelian")}
              className={`p-1 w-40 font-semibold border-b-2
      ${
        activeView === "detailProdukPembelian"
          ? "border-blue-800 text-blue-800"
          : "border-transparent text-gray-700"
      }`}
            >
              Detail Pesanan Pembelian
            </button>
          </div>

          {/* now conditionally render each “page” */}
          {activeView === "pesananPembelian" && (
            <>
              <div className="overflow-x-auto" style={{ height: "50vh" }}>
                <table className="w-full text-xs text-left border-collapse border m-1">
                  <thead className="bg-gray-200 text-blue-900 uppercase">
                    <tr>
                      <th className="px-2 py-1 w-4 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Tgl Transaksi
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Tgl Kirim
                      </th>
                      <th className="px-2 py-1 w-4 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Kitchen
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Nama Store
                      </th>
                      <th className="px-2 py-1 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No Pemesanan
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No. Sales Order
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        jenis Pesanan
                      </th>
                      <th className="px-2 py-1 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Tanggal Transkasi
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Nama Pelanggan
                      </th>
                      <th className="px-2 py-1 w-36 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Catatan
                      </th>
                      <th className="px-2 py-1 w-16 sticky top-0 border border-gray-500 bg-gray-200 z-10 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poHeaders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-2">
                          Tidak ada data.
                        </td>
                      </tr>
                    ) : (
                      poHeaders.map((h, idx) => {
                        // ambil semua detail untuk PO ini
                        const details = poDetails.filter(
                          (d) =>
                            d.id_master_pesanan_pembelian ===
                            h.id_master_pesanan_pembelian
                        );
                        // hitung total rupiah
                        const total = details.reduce(
                          (sum, d) =>
                            sum + (d.quantity || 0) * (d.harga_jual || 0),
                          0
                        );
                        return (
                          <tr
                            key={h.id_master_pesanan_pembelian}
                            className="hover:bg-gray-100 text-blue-900"
                          >
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {formatDate(h.tanggal_transaksi)}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {formatDate(h.tanggal_kirim)}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.nama_kitchen}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.nama_store}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.kode_pesanan_pembelian}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.kode_sales_order}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.nama_pesanan}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.salesOrderDate
                                ? formatDate(h.salesOrderDate)
                                : "-"}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.nama_pelanggan_external}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase">
                              {h.catatan || "-"}
                            </td>
                            <td className="px-2 py-1 border border-gray-500 uppercase text-right">
                              {formatRp(total)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
                      {/* 1️⃣  Sub Total Pemesanan */}
                      <td className="px-1 py-1 border bg-gray-300 text-right uppercase">
                        Sub Total Pemesanan
                      </td>
                      <td className="px-1 py-1 border bg-lime-400 text-right">
                        {formatRp(subtotalHarga)}
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
          {activeView === "detailProdukPembelian" && (
            <>
              <div className="overflow-x-auto" style={{ height: "50vh" }}>
                <table className="w-2/3 text-xs text-left border-collapse border">
                  <thead className="bg-gray-200 text-blue-900 uppercase">
                    <tr>
                      <th className="px-2 py-1 w-4 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No
                      </th>
                      <th className="px-2 py-1 w-10 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        No. Pemesanan
                      </th>
                      <th className="px-2 py-1 w-10 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Kode
                      </th>
                      <th className="px-2 py-1 w-40 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Nama
                      </th>
                      <th className="px-2 py-1 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((row, i) => (
                      <tr
                        key={`${row.kode_sales_order}::${row.kode_produk}`}
                        className="hover:bg-gray-100 text-blue-900"
                      >
                        <td className="px-2 py-1 border border-gray-500 uppercase">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 uppercase">
                          {row.kode_sales_order}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 uppercase">
                          {row.kode_produk}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 uppercase">
                          {row.nama_produk}
                        </td>
                        <td className="px-2 py-1 border border-gray-500 uppercase">
                          {row.totalQty} PCS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        </div>
      </div>
    </div>
  );
}
