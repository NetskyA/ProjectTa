import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

/* =================================================================================
   SERVICE API                                                                     */
import {
  getMasterLokasiStore,
  getMasterLokasiKitchen,
  getMasterJenisPesanan,
  getMasterPelanggan,
  getMasterKategoriProduk,
  getMasterPesananPembelian,
  getMasterPesananPembelianDetail,
  updateJumlahPembelian,
  updateStatusPesananPembelian,
  updateSoTanggalVerPesananPembelian,
} from "../../../../../services/apiService";

/* =================================================================================
   KOMPONEN & ASET                                                                 */
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";
import LogoSave from "../../../../../image/icon/logo-save.svg";
import LogoBatal from "../../../../../image/icon/logo-trash.svg";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import LogoApprove from "../../../../../image/icon/logo-approve.png";
import LogoCancel from "../../../../../image/icon/logo-cancel.png";
import LogoDraft from "../../../../../image/icon/logo-draf.png";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
      (options || []).filter(
        (o) =>
          typeof o === "string" &&
          o.toLowerCase().includes(inputValue.toLowerCase())
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
          ×
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
=========================================================================== */
export default function MenuAddPembelianBarangBasetroli() {
  const { id: paramId, id_master_pesanan_pembelian } = useParams();
  const id = paramId || id_master_pesanan_pembelian;

  const token = useSelector((s) => s.auth.token);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  /* Info Transaksi */
  const [noPemesanan, setNoPemesanan] = useState("");
  const [kodeSalesOrder, setKodeSalesOrder] = useState("0");
  const [storeTujuan, setStoreTujuan] = useState("");
  const [kitchenTujuan, setKitchenTujuan] = useState("");
  const [jenisPembelian, setJenisPembelian] = useState(0);
  const [pembeliKhusus, setPembeliKhusus] = useState("");
  const [tanggalVerifikasiAP, setTanggalVerifikasiAP] = useState("");
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [tanggalTransaksi, setTanggalTransaksi] = useState(todayStr);
  const [tanggalKirim, setTanggalKirim] = useState("");
  const [catatanKitchen, setCatatanKitchen] = useState("");

  /* Status batal */
  const [statusBatal, setStatusBatal] = useState(0);
  const [statusPesanan, setStatusPesanan] = useState(0);
  const [statusSalesOrder, setStatusSalesOrder] = useState(0);
  const isCancelled = statusBatal === 1;

  /* Master Data */
  const [masterStore, setMasterStore] = useState([]);
  const [masterKitchen, setMasterKitchen] = useState([]);
  const [masterJenisPesanan, setMasterJenisPesanan] = useState([]);
  const [masterPelanggan, setMasterPelanggan] = useState([]);
  const [masterKategoriProduk, setMasterKategoriProduk] = useState([]);

  const [kodeLokasiStoreCode, setKodeLokasiStoreCode] = useState("");
  const [kodeLokasiKitchenCode, setKodeLokasiKitchenCode] = useState("");
  const [kodePelangganExternal, setKodePelangganExternal] = useState("");
  const isSoGenerated = kodeSalesOrder && kodeSalesOrder !== "0";
  const disableActions = isCancelled || isSoGenerated;
  /* Table & filters */
  const [tableRows, setTableRows] = useState([]);
  const [kodeFilter, setKodeFilter] = useState("");
  const [namaFilter, setNamaFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [namaPesanan, setNamaPesanan] = useState("");
  const [namaPembeliKhusus, setNamaPembeliKhusus] = useState("");
  const paginate = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  /* ===========================================================================
     Load Master Data & Existing Order
  =========================================================================== */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Load all master data in parallel
        const [storeRes, kitchenRes, jenisRes, pelRes, katRes] =
          await Promise.all([
            getMasterLokasiStore(token),
            getMasterLokasiKitchen(token),
            getMasterJenisPesanan(token),
            getMasterPelanggan(token),
            getMasterKategoriProduk(token),
          ]);

        const storeList = Object.values(storeRes).filter((l) => l.status === 0);
        const kitchenList = Object.values(kitchenRes).filter(
          (l) => l.status === 0
        );
        const jenisList = Object.values(jenisRes).filter((j) => j.status === 0);
        const pelangganList = Object.values(pelRes).filter(
          (p) => p.status === 0 && p.id_master_pelanggan_external
        );
        const kategoriList = Object.values(katRes).filter(
          (k) => k.status === 0
        );

        setMasterStore(storeList);
        setMasterKitchen(kitchenList);
        setMasterJenisPesanan(jenisList);
        setMasterPelanggan(pelangganList);
        setMasterKategoriProduk(kategoriList);

        // 2) Load the order master data
        const rawMaster = await getMasterPesananPembelian(token);
        const flat = Array.isArray(rawMaster)
          ? rawMaster.flatMap((g) => Object.values(g))
          : Object.values(rawMaster);
        const order = flat.find(
          (o) => o.id_master_pesanan_pembelian === Number(id)
        );

        if (order) {
          // set basic info
          setKodeSalesOrder(order.kode_sales_order ?? "0");
          setNoPemesanan(order.kode_pesanan_pembelian);
          setStoreTujuan(order.id_store);
          setKitchenTujuan(order.id_kitchen);
          setJenisPembelian(order.jenis_pesanan);
          setTanggalVerifikasiAP(order.tanggal_verifikasi_ap || "");
          setTanggalTransaksi(order.tanggal_transaksi);
          setTanggalKirim(order.tanggal_kirim);
          setCatatanKitchen(order.catatan);

          // set status flags
          setStatusBatal(order.status_batal);
          setStatusPesanan(order.status_pesanan);
          setStatusSalesOrder(order.status_sales_order);
          setNamaPembeliKhusus(order.nama_pelanggan_external || "");
          setPembeliKhusus(order.id_pelanggan_external || "");
          // set display names
          setNamaPesanan(order.nama_pesanan);

          // set lokasi codes
          setKodeLokasiKitchenCode(order.kode_lokasi_kitchen);
          setKodeLokasiStoreCode(order.kode_lokasi_store);

          // lookup kode_pelanggan_external with fallback:
          // 1) use masterPelanggan.kode_pelanggan_external
          // 2) else use order.id_master_pelanggan_external
          // 3) else default "1"
          const pelObj = pelangganList.find(
            (p) =>
              p.id_master_pelanggan_external ===
              order.id_master_pelanggan_external
          );
          const pelangganPart =
            pelObj?.kode_pelanggan_external ||
            String(order.id_master_pelanggan_external) ||
            "1";
          setKodePelangganExternal(pelangganPart);
        }

        // 3) Load detail rows
        const rawDetail = await getMasterPesananPembelianDetail(token, id);
        // console.log("rawDetail", rawDetail);
        const detailArr = Array.isArray(rawDetail)
          ? rawDetail.flatMap((g) => Object.values(g))
          : Object.values(rawDetail || {});
        const filteredArr = detailArr.filter(
          (d) => Number(d.id_master_pesanan_pembelian) === Number(id)
        );
        setTableRows(
          filteredArr.map((d) => ({
            id_master_detail_pesanan_pembelian:
              d.id_master_detail_pesanan_pembelian,
            kode_barang: d.kode_produk,
            namabarang: d.nama_produk,
            harga: Number(d.harga_jual),
            qtyBeli: String(d.quantity),
          }))
        );
      } catch (e) {
        setError(e.message || "Gagal load");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, id]);

  /* ===========================================================================
     Handlers
  =========================================================================== */
  const showCancelledAlert = () => {
    setAlert({
      message: "Pemesanan telah dibatalkan.",
      type: "error",
      visible: true,
    });
  };

  const handleUpdateQty = async (rowIdx, newQty) => {
    if (isCancelled) {
      showCancelledAlert();
      return;
    }

    const updated = [...tableRows];
    updated[rowIdx].qtyBeli = newQty;
    setTableRows(updated);

    const row = updated[rowIdx];
    try {
      await updateJumlahPembelian(token, {
        kode_barang: row.kode_barang,
        id_master_detail_pesanan_pembelian:
          row.id_master_detail_pesanan_pembelian,
        quantity: Number(newQty),
        catatan: catatanKitchen,
      });
      // kalau mau, bisa tampilkan toast kecil bahwa update berhasil
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "Gagal update qty.";
      console.error("Gagal update qty:", msg);

      setAlert({
        message: msg,
        type: status === 400 ? "warning" : "error",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
      }, 5000);
    }
  };

  const handleSaveDetails = async () => {
    if (isCancelled) {
      showCancelledAlert();
      return;
    }

    try {
      await Promise.all(
        tableRows.map((r) =>
          updateJumlahPembelian(token, {
            kode_barang: r.kode_barang,
            id_master_detail_pesanan_pembelian:
              r.id_master_detail_pesanan_pembelian,
            quantity: Number(r.qtyBeli),
            catatan: catatanKitchen,
          })
        )
      );

      setAlert({
        message: "Semua perubahan tersimpan.",
        type: "success",
        visible: true,
      });

      // beri waktu 2 detik agar user bisa baca pesan
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "Gagal menyimpan perubahan.";
      console.error("Gagal bulk save:", msg);

      setAlert({
        message: msg,
        type: status === 400 ? "warning" : "error",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
      }, 5000);
    }
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openCancelDialog = () => {
    if (isCancelled) return showCancelledAlert();
    setIsDialogOpen(true);
  };
  const cancelDelete = () => setIsDialogOpen(false);
  const confirmDelete = async () => {
    setIsDialogOpen(false);
    try {
      await updateStatusPesananPembelian(token, {
        id_master_pesanan_pembelian: id,
      });
      setAlert({
        message: "Pemesanan dibatalkan.",
        type: "success",
        visible: true,
      });
      setStatusBatal(1);
      setTimeout(() => {
        window.location.reload();
        // navigate(`/dashboard/adminpembelian/menu/notapembelian`)
      }, 2500);
    } catch {
      setAlert({ message: "Gagal batal.", type: "error", visible: true });
    }
  };

  // 3) Handler yang diubah
  const handleProceedKitchen = async () => {
    if (isCancelled) {
      showCancelledAlert();
      return;
    }
    try {
      // siapkan payload lengkap
      const payload = {
        id_master_pesanan_pembelian: id,
        kode_lokasi_store: kodeLokasiStoreCode,
        kode_lokasi_kitchen: kodeLokasiKitchenCode,
        kode_pesanan_pembelian: noPemesanan,
        kode_pelanggan_external: kodePelangganExternal, // harus string, bisa "" kalau tidak ada
        tanggal_verifikasi_ap: new Date().toISOString().slice(0, 10),
      };

      await updateSoTanggalVerPesananPembelian(token, payload);
      console.log("payload", updateSoTanggalVerPesananPembelian);
      setAlert({
        message: "Proses kitchen dilanjutkan.",
        type: "success",
        visible: true,
      });
      setTimeout(() => {
        navigate(`/dashboard/adminpembelian/menu/notapembelian`);
      }, 2500);
    } catch (e) {
      setAlert({ message: "Gagal proses.", type: "error", visible: true });
    }
  };

  const handleExportExcel = () => {
    // tidak ada data
    if (visibleRows.length === 0) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }

    // tanggal sekarang untuk file name
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const filename = `Pemesanan-${noPemesanan}-${dd}${mm}${yyyy}.xlsx`;

    // cari nama store / kitchen / jenis / pelanggan
    const storeName =
      masterStore.find((s) => s.id_lokasi === storeTujuan)?.nama_lokasi || "-";
    const kitchenName =
      masterKitchen.find((k) => k.id_lokasi === kitchenTujuan)?.nama_lokasi ||
      "-";

    // susun data eksport
    const exportData = visibleRows.map((r, idx) => ({
      "No Pemesanan": noPemesanan,
      Toko: storeName,
      Kitchen: kitchenName,
      "Jenis Pembelian": namaPesanan,
      "Pembeli Khusus": namaPembeliKhusus,
      "Tanggal Kirim": tanggalKirim,
      "Tanggal Transaksi": tanggalTransaksi,
      Kode: r.kode_barang,
      "Nama Barang": r.namabarang,
      "Jumlah Pembelian": Number(r.qtyBeli),
      Harga: r.harga,
      Total: Number(r.qtyBeli) * r.harga,
    }));

    // generate sheet & workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pemesanan");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // download
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), filename);

    setAlert({ message: "Export berhasil!", type: "success", visible: true });
    setTimeout(() => setAlert({ message: "", type: "", visible: false }), 2000);
  };

  const handleSort = (key) =>
    setSortConfig((p) =>
      p.key === key
        ? { key, direction: p.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  const sortedRows = [...tableRows].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;
    return (a[key] > b[key] ? 1 : -1) * (direction === "asc" ? 1 : -1);
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

  const formatRupiah = (number) => {
    if (!number || isNaN(number)) return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  const subtotalGrand = visibleRows.reduce(
    (s, r) => s + (Number(r.qtyBeli) || 0) * r.harga,
    0
  );
  const subtotalHarga = visibleRows.reduce((s, r) => s + r.harga, 0);

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
            to="/dashboard/adminpembelian"
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
            to="/dashboard/adminpembelian/menu/notapembelian"
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
              <div className="w-44">
                <label className="text-blue-900 font-semibold">
                  No Pemesanan :
                </label>
                <input
                  value={noPemesanan}
                  readOnly
                  disabled
                  className="w-44 border h-7 text-gray-700 border-gray-300 rounded p-1 disabled:bg-gray-100text-xs"
                />
              </div>
              <div className="w-44">
                <label className="text-blue-900 font-semibold">Toko :</label>
                <select
                  value={storeTujuan}
                  disabled
                  onChange={(e) => setStoreTujuan(e.target.value)}
                  className="w-44 border h-7 border-gray-300 rounded p-1 disabled:bg-gray-100 text-xs"
                >
                  {masterStore.map((s) => (
                    <option key={`store-${s.id_lokasi}`} value={s.id_lokasi}>
                      {s.nama_lokasi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-44">
                <label className="text-blue-900 font-semibold">Kitchen :</label>
                <select
                  value={kitchenTujuan}
                  disabled
                  onChange={(e) => setKitchenTujuan(e.target.value)}
                  className="w-44 border h-7 border-gray-300 rounded p-1 disabled:bg-gray-100 text-xs"
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
                        className="bg-gray-200 text-xs"
                        value={j.id_master_jenis_pesanan}
                        checked={jenisPembelian === j.id_master_jenis_pesanan}
                        onChange={() =>
                          setJenisPembelian(j.id_master_jenis_pesanan)
                        }
                        disabled={Boolean(id)}
                      />
                      <span className="text-blue-900 font-semibold">
                        {j.nama_pesanan || j.nama_jenis_pesanan}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-44">
                <label className="text-blue-900 font-semibold">
                  Pembeli Khusus :
                </label>
                <select
                  disabled
                  value={pembeliKhusus}
                  className="w-44 border h-7 text-xs border-gray-300 rounded p-1 bg-gray-100"
                >
                  <option value="">-</option>
                  {masterPelanggan.map((p) => (
                    <option
                      key={p.id_master_pelanggan_external}
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
              <div className="w-44">
                <label className="text-blue-900 font-semibold">
                  Tanggal Verifikasi AP :
                </label>
                {tanggalVerifikasiAP ? (
                  <input
                    type="date"
                    min={todayStr}
                    value={tanggalVerifikasiAP}
                    disabled
                    onChange={(e) => setTanggalVerifikasiAP(e.target.value)}
                    className="w-full h-7 text-gray-700 text-xs border border-gray-300 disabled:bg-gray-100 rounded p-1"
                  />
                ) : (
                  <input
                    type="text"
                    value="Auto Setelah Verifikasi"
                    disabled
                    className="w-full h-7 text-gray-500 text-xs border border-gray-300 bg-gray-100 rounded p-1 italic"
                  />
                )}
              </div>

              <div className="w-44">
                <label className="text-blue-900 font-semibold">
                  Tanggal Transaksi :
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={tanggalTransaksi}
                  disabled
                  onChange={(e) => setTanggalTransaksi(e.target.value)}
                  className="w-full h-7 text-gray-700 text-xs border border-gray-300 disabled:bg-gray-100 rounded p-1"
                />
              </div>
              <div className="w-44">
                <label className="text-blue-900 font-semibold">
                  Tanggal Kirim :
                </label>
                <input
                  type="date"
                  min={tanggalTransaksi || todayStr}
                  value={tanggalKirim}
                  disabled
                  onChange={(e) => setTanggalKirim(e.target.value)}
                  className="w-full h-7 text-gray-700 text-xs border border-gray-300 disabled:bg-gray-100 rounded p-1"
                />
              </div>
            </div>
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
            disabled={disableActions}
            maxLength={150}
            className={`flex items-center p-1 rounded w-60 min-h-[8rem] max-h-[8rem] border border-gray-300  text-xs resize-none overflow-y-auto ${
              disableActions
                ? "bg-gray-200 text-black cursor-not-allowed opacity-50 block w-60 min-h-[8rem] max-h-[8rem] border border-gray-300 rounded p-1 text-xs resize-none overflow-y-auto"
                : "bg-gray-100 hover:bg-gray-100 block w-60 min-h-[8rem] max-h-[8rem] border border-gray-300 rounded p-1 text-xs resize-none overflow-y-auto"
            }`}
            onChange={(e) => setCatatanKitchen(e.target.value)}
            placeholder="..."
          />
        </fieldset>

        {/* ================= PANEL KANAN =================================== */}
        <fieldset className="flex flex-col h-full space-y-0.5">
          <fieldset className="border border-blue-500 rounded-md p-2 shadow-sm">
            <legend className="px-0.5 text-sm font-bold text-blue-900">
              Verifikasi Pembatalan
            </legend>
            <button
              onClick={openCancelDialog}
              disabled={disableActions}
              className={`flex items-center w-40 space-x-2 border rounded p-1 text-white ${
                disableActions
                  ? "bg-red-400 cursor-not-allowed opacity-50"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <img src={LogoBatal} alt="" className="w-6 h-6" />
              <span className="text-sm font-semibold">Batal Pemesanan</span>
            </button>
            <p
              className="text-red-600 italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *Membatalkan pemesanan serta item
            </p>
          </fieldset>

          <fieldset className="border border-blue-500 h-full rounded-md p-2 shadow-sm">
            <legend className="px-2 text-sm font-bold text-blue-900">
              Verifikasi Lanjut
            </legend>
            <button
              onClick={handleProceedKitchen}
              disabled={disableActions}
              className={`flex items-center space-x-2 w-40 rounded p-1 text-white ${
                disableActions
                  ? "bg-blue-400 cursor-not-allowed opacity-50"
                  : "bg-blue-900 hover:bg-blue-800"
              }`}
            >
              <img src={LogoSave} alt="" className="w-6 h-6" />
              <span className="text-xs font-semibold">Lanjut Kitchen</span>
            </button>
            <p
              className="text-red-600 italic pt-1"
              style={{ fontSize: "10px" }}
            >
              *SO Otomatis Terbentuk
            </p>
          </fieldset>
        </fieldset>

        <div className="flex items-center justify-center">
          {isCancelled ? (
            <img src={LogoCancel} alt="Cancelled" className="w-52 h-32 ml-10" />
          ) : statusPesanan === 1 ? (
            statusSalesOrder === 1 ? (
              <img
                src={LogoApprove}
                alt="Approved"
                className="w-52 h-32 ml-10"
              />
            ) : (
              <img src={LogoDraft} alt="Draft" className="w-52 h-32 ml-10" />
            )
          ) : null}
        </div>
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
      <div className="bg-white border border-gray-200 rounded-md shadow-md p-2">
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
          <div className="w-fit gap-2 flex absolute right-1 items-center justify-center rounded-md p-0.5 cursor-pointer">
            <div className="bg-blue-900 hover:bg-blue-800 rounded-md">
              <button
                onClick={handleSaveDetails}
                disabled={disableActions}
                className={`flex items-center p-1 rounded ${
                  disableActions
                    ? "bg-blue-400 cursor-not-allowed opacity-50"
                    : "bg-blue-900 hover:bg-blue-800"
                }`}
              >
                <img src={LogoSave} className="w-8 h-7" alt="Save" />
                <p className="text-xs p-1 font-semibold text-white">Simpan</p>
              </button>
            </div>

            <div
              onClick={handleExportExcel}
              className="bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              <div className="flex items-center justify-center p-1">
                <button className="h-8 text-xs text-gray-100">
                  <img
                    src={LogoExcel}
                    className="w-8 h-8"
                    alt="Export to Excel"
                  />
                </button>
                <p className="text-xs p-1 font-semibold text-blue-900">
                  Export
                </p>
              </div>
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
                  className="px-1 py-0.5 w-72 border cursor-pointer"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang
                  {sortConfig.key === "namabarang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-24 border cursor-pointer">
                  Jumlah Pembelian
                </th>
                <th className="px-1 py-0.5 w-24 border">Harga</th>
                <th className="px-1 py-0.5 w-24 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((r, i) => (
                  <tr
                    key={r.id_master_detail_pesanan_pembelian}
                    className="text-gray-900 hover:bg-gray-200"
                  >
                    <td className="px-1 py-0.5 border">{i + 1}</td>
                    <td className="px-1 py-0.5 border">{r.kode_barang}</td>
                    <td className="px-1 py-0.5 border">{r.namabarang}</td>
                    <td className="px-1 py-0.5 border">
                      <div className="flex items-center text-right gap-1">
                        <input
                          type="text"
                          value={r.qtyBeli}
                          maxLength={4}
                          onChange={(e) =>
                            handleUpdateQty(
                              i,
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          disabled={disableActions}
                          className={`w-full border text-right  p-0.5 text-xs border-gray-300 bg-gray-100 rounded ${
                            disableActions
                              ? "bg-gray-100 border-gray-300 select-none cursor-not-allowed"
                              : ""
                          }`}
                        />
                        <span className="whitespace-nowrap text-xs">PCS</span>
                      </div>
                    </td>
                    <td className="px-1 py-0.5 border text-right">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(r.harga)}
                    </td>
                    <td className="px-1 py-0.5 border text-right">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format((+r.qtyBeli || 0) * r.harga)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    Tidak ada data tersedia
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
                  {formatRupiah(subtotalGrand)}
                </td>
                <td
                  colSpan={3}
                  className="px-1 py-0.5 border w-32 border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Harga
                </td>
                <td className="px-1 py-0.5 w-52	border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(subtotalHarga)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Dialog Confirmation Delete */}
        <DialogTrueFalse
          isOpen={isDialogOpen}
          title="Konfirmasi Penonaktifan"
          message="Apakah Anda yakin ingin membatalkan pemesanan ini"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
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
