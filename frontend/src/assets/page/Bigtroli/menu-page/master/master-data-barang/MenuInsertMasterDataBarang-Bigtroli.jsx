import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMasterAdonanProduk,
  getMasterBahanBakuProduk,
  getLaporanMasterDataBarang,
} from "../../../../../services/apiService";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Error from "../../../../component/Error";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function MenuInsertMasterDataBarangMaster() {
  const { id: paramId, id_produk } = useParams();
  const id = paramId || id_produk;

  const [dataBarang, setDataBarang] = useState(null);
  const [adonanRows, setAdonanRows] = useState([]);
  const [bahanRows, setBahanRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Search & pagination state untuk Adonan
  const [searchTermAdonan, setSearchTermAdonan] = useState("");
  const [currentPageAdonan, setCurrentPageAdonan] = useState(1);
  const itemsPerPageAdonan = 5;

  // Search & pagination state untuk Bahan
  const [searchTermBahan, setSearchTermBahan] = useState("");
  const [currentPageBahan, setCurrentPageBahan] = useState(1);
  const itemsPerPageBahan = 5;

  const formatRupiah = (number) => {
    if (number == null || isNaN(number)) return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  const formatPercentage = (value) => {
    if (value == null) return "-";
    const number = parseFloat(value) * 100;
    return `${Math.round(number)} %`;
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const barangResult = await getLaporanMasterDataBarang();
        // console.log("barangResult", barangResult);
        const barangItems = Array.isArray(barangResult)
          ? barangResult
          : Object.values(barangResult);
        const matchedBarang = barangItems.find(
          (item) => String(item.id_produk) === String(id)
        );
        if (!matchedBarang)
          throw new Error(`Data produk dengan id ${id} tidak ditemukan.`);
        setDataBarang(matchedBarang);

        const adonanResult = await getMasterAdonanProduk();
        const adonanItems = Array.isArray(adonanResult)
          ? adonanResult
          : Object.values(adonanResult);
        setAdonanRows(
          adonanItems.filter((r) => String(r.id_produk) === String(id))
        );

        const bahanRes = await getMasterBahanBakuProduk();
        const bahanList = Array.isArray(bahanRes)
          ? bahanRes
          : Object.values(bahanRes);
        setBahanRows(
          bahanList.filter((r) => String(r.id_produk) === String(id))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  // Filter & pagination for Adonan
  const filteredAdonan = useMemo(() => {
    if (!searchTermAdonan) return adonanRows;
    const q = searchTermAdonan.toLowerCase();
    return adonanRows.filter(
      (r) =>
        (r.jenis_adonan || "").toLowerCase().includes(q) ||
        (r.nama_kategori || "").toLowerCase().includes(q)
    );
  }, [adonanRows, searchTermAdonan]);
  const totalPagesAdonan = Math.ceil(
    filteredAdonan.length / itemsPerPageAdonan
  );
  const startIdxAdonan = (currentPageAdonan - 1) * itemsPerPageAdonan;
  const currentItemsAdonan = filteredAdonan.slice(
    startIdxAdonan,
    startIdxAdonan + itemsPerPageAdonan
  );

  // Filter & pagination for Bahan Baku
  const filteredBahan = useMemo(() => {
    if (!searchTermBahan) return bahanRows;
    const q = searchTermBahan.toLowerCase();
    return bahanRows.filter(
      (r) =>
        (r.nama_bahan_baku || "").toLowerCase().includes(q) ||
        (r.kode_bahan_baku || "").toLowerCase().includes(q)
    );
  }, [bahanRows, searchTermBahan]);
  const totalPagesBahan = Math.ceil(filteredBahan.length / itemsPerPageBahan);
  const startIdxBahan = (currentPageBahan - 1) * itemsPerPageBahan;
  const currentItemsBahan = filteredBahan.slice(
    startIdxBahan,
    startIdxBahan + itemsPerPageBahan
  );

// di dalam component, setelah deklarasi currentItemsAdonan dan currentItemsBahan:

// ─────────────────────────────────────────────────────────
// EXPORT → EXCEL untuk ADONAN (hanya yang sedang tampil di tabel)
// ─────────────────────────────────────────────────────────
const handleExportExcelAdonan = () => {
  if (currentItemsAdonan.length === 0) {
    setAlert({
      message: "Tidak ada data adonan yang sedang ditampilkan untuk diekspor.",
      type: "error",
      visible: true,
    });
    return;
  }

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();

  // Nama file berdasarkan produk + tanggal
  const filename = `Adonan-${dataBarang.nama_produk}-${dd}${mm}${yyyy}.xlsx`;

  // Buat array JSON dari currentItemsAdonan
  const exportData = currentItemsAdonan.map((item, idx) => ({
    No: startIdxAdonan + idx + 1,
    "Nama Produk": item.nama_produk,
    "Jenis Adonan": item.jenis_adonan,
    "Kategori Adonan": item.nama_kategori,
    "Jumlah Kebutuhan": item.jumlah_kebutuhan,
    "Diinput Oleh": item.nama_user,
    "Dibuat Tanggal": item.createat,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Adonan");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  saveAs(blob, filename);

  setAlert({ message: "Export adonan berhasil!", type: "success", visible: true });
  setTimeout(() => setAlert({ message: "", type: "", visible: false }), 2000);
};

// ─────────────────────────────────────────────────────────
// EXPORT → EXCEL untuk BAHAN BAKU (hanya yang sedang tampil di tabel)
// ─────────────────────────────────────────────────────────
const handleExportExcelBahanBaku = () => {
  if (currentItemsBahan.length === 0) {
    setAlert({
      message: "Tidak ada data bahan baku yang sedang ditampilkan untuk diekspor.",
      type: "error",
      visible: true,
    });
    return;
  }

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();

  const filename = `BahanBaku-${dataBarang.nama_produk}-${dd}${mm}${yyyy}.xlsx`;

  const exportData = currentItemsBahan.map((item, idx) => ({
    No: startIdxBahan + idx + 1,
    "Nama Produk": item.nama_produk,
    "Jenis Adonan": item.jenis_adonan,
    "Kategori Adonan": item.nama_kategori_adonan_produk,
    "Kode Bahan Baku": item.kode_bahan_baku,
    "Nama Bahan Baku": item.nama_bahan_baku,
    "Jumlah Kebutuhan": item.jumlah_kebutuhan,
    "Harga Beli Barang": item.harga_beli_barang,
    "Total Harga": item.total_harga,
    "Diinput Oleh": item.nama_user,
    "Dibuat Tanggal": item.createat,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BahanBaku");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  saveAs(blob, filename);

  setAlert({ message: "Export bahan baku berhasil!", type: "success", visible: true });
  setTimeout(() => setAlert({ message: "", type: "", visible: false }), 2000);
};

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

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* HEADER */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/dashboard/adminkitchen"
            className="text-xs font-semibold text-blue-900"
          >
            Master
          </Link>
          <svg
            className="w-4 h-4 text-gray-500 mx-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <Link
            to="/dashboard/adminkitchen/menu/masterdatabarang"
            className="text-xs font-semibold text-blue-900"
          >
            Master Produk
          </Link>
          <svg
            className="w-4 h-4 text-gray-500 mx-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Detail Master Produk
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* DETAIL MASTER */}
      <div className="bg-white flex rounded-md shadow-md p-3 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">
          Detail Master Produk
        </p>
        <Link to="/dashboard/adminkitchen/menu/masterdatabarang">
          <button className="cetakpdf h-6 rounded-md flex text-sm items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
            <p className="p-2">Back</p>
          </button>
        </Link>
      </div>

      {/* INFO PRODUK + HARGA */}
      <div className="mt-2 flex gap-1.5">
        {/* Info Produk */}
        <fieldset className="border border-blue-400 rounded-md p-2 shadow-sm w-1/2">
          <legend className="px-1 text-sm font-bold text-blue-900">
            Info Produk
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-blue-900">
                Kode Produk:
              </label>
              <input
                type="text"
                value={dataBarang.kode_produk}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Nama Produk:
              </label>
              <input
                type="text"
                value={dataBarang.nama_produk}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Kitchen:
              </label>
              <input
                type="text"
                value={dataBarang.nama_lokasi}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Kategori Produk:
              </label>
              <input
                type="text"
                value={`${dataBarang.kode_kategori_produk.trim()} - ${
                  dataBarang.nama_kategori_produk
                }`}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Kategori Bahan Baku:
              </label>
              <input
                type="text"
                value={dataBarang.nama_kategori_bahan_baku}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Kategori Adonan Produk:
              </label>
              <input
                type="text"
                value={dataBarang.nama_kategori_adonan_produk}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">Satuan:</label>
              <input
                type="text"
                value={dataBarang.nama_satuan}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Dinput Oleh:
              </label>
              <input
                type="text"
                value={dataBarang.nama_user}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
          </div>
        </fieldset>
        {/* Info Harga */}
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
                value={formatRupiah(dataBarang.biaya_total_adonan)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Laba Kotor:
              </label>
              <input
                type="text"
                value={formatPercentage(dataBarang.margin_kotor)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Harga Jual:
              </label>
              <input
                type="text"
                value={formatRupiah(dataBarang.harga_jual)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">Pajak:</label>
              <input
                type="text"
                value={formatPercentage(dataBarang.pajak)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Harga Setelah Pajak:
              </label>
              <input
                type="text"
                value={formatRupiah(dataBarang.harga_setelah_pajak)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Harga Jual HPP:
              </label>
              <input
                type="text"
                value={formatRupiah(dataBarang.selisih_harga_jual_hpp)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">% HPP:</label>
              <input
                type="text"
                value={formatRupiah(dataBarang.persentase_hpp)}
                readOnly
                className="mt-1 w-full border text-sm border-gray-300 rounded p-1 bg-gray-50 text-right"
              />
            </div>
            <div>
  <label className="block font-medium text-blue-900">% HPP:</label>
  <input
    type="text"
    value={dataBarang.status === 0 ? "aktif" : "tidak aktif"}
    readOnly
    className={`
      mt-1 w-full border uppercase text-sm border-gray-300 rounded p-1 text-right
      ${dataBarang.status === 1 ? "bg-red-500 text-white" : "bg-lime-500"}
    `}
  />
</div>

          </div>
        </fieldset>
      </div>

      {/* Detail Adonan Produk */}
      <div className="bg-white mt-2 max-w-6xl rounded-md border border-gray-200 shadow-md p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-md font-semibold text-blue-900 absolute left-1">
            Detail Adonan Produk
          </p>

          {/* SEARCH */}
          <div className="w-2/6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
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
                id="simple-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-8 rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                onChange={(e) => {
                  setSearchTermAdonan(e.target.value);
                  setCurrentPageAdonan(1);
                }}
              />
            </div>
          </div>
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExportExcelAdonan}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        {/* TABLE ADONAN */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left text-gray-500 border-collapse">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th className="px-2 py-0.5 w-3 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  No
                </th>
                <th className="px-2 py-0.5 w-52 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Nama Produk
                </th>
                <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Jenis Adonan
                </th>
                <th className="px-2 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Nama Kategori
                </th>
                <th className="px-2 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Jumlah Kebutuhan
                </th>
                <th className="px-2 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Diinput Oleh
                </th>
                <th className="px-2 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Dibuat Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItemsAdonan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-2">
                    Tidak ada data adonan untuk produk ini.
                  </td>
                </tr>
              ) : (
                currentItemsAdonan.map((row, i) => (
                  <tr
                    key={i}
                    className={`border border-gray-500 hover:bg-gray-200`}
                  >
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {startIdxAdonan + i + 1}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {row.nama_produk}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {row.jenis_adonan}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {row.nama_kategori}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black uppercase">
                      {formatGr(row.jumlah_kebutuhan)}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black">
                      {row.nama_user}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {row.createat}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Subtotal Table */}
          <div className="mt-1">
            <table className="w-full text-xs text-left text-gray-500 border-collapse border">
              <colgroup>
                <col style={{ width: "50%" }} />
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
                    Total Jumlah Kebutuhan
                  </td>
<td className="px-1 py-0.5 border text-right border-gray-500 font-semibold bg-lime-400">
  {formatGr(
    filteredAdonan.reduce(
      (sum, r) => sum + Number(r.jumlah_kebutuhan || 0),
      0
    )
  )}
</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Bahan Baku */}
      <div className="bg-white mt-2 rounded-md border border-gray-200 shadow-md p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-md font-semibold text-blue-900 absolute left-1">
            Detail Bahan Baku
          </p>

          {/* SEARCH */}
          <div className="w-2/6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
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
                id="simple-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-8 rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                onChange={(e) => {
                  setSearchTermBahan(e.target.value);
                  setCurrentPageBahan(1);
                }}
              />
            </div>
          </div>
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExportExcelBahanBaku}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        {/* TABLE BAHAN BAKU */}
        <div className="overflow-x-auto w-full" style={{ height: "30vh" }}>
          <table
            className="w-full text-xs text-left text-gray-500 border-collapse"
            style={{ width: "100vw" }}
          >
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                {/* (thead manual – tidak diubah) */}
                <th className="px-2 py-0.5 w-3 sticky top-0 border border-gray-500 bg-gray-200 z-10">
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
                <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Diinput Oleh
                </th>
                <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Dibuat Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBahan.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-2">
                    Tidak ada data bahan baku.
                  </td>
                </tr>
              ) : (
                filteredBahan.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-200">
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {i + 1}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {r.nama_produk}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {r.jenis_adonan}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {r.nama_kategori_adonan_produk}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {r.kode_bahan_baku}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {r.nama_bahan_baku}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black uppercase">
                      {formatGr2(r.jumlah_kebutuhan) + " " + r.nama_satuan}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black ">
                      {formatRupiah(r.harga_beli_barang)}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black ">
                      {formatRupiah(r.biaya_total_adonan)}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black ">
                      {formatRupiah(r.total_harga)}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black ">
                      {r.nama_user}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black ">
                      {r.createat}
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
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Biaya Adonan
                </td>
                <td className="px-1 py-0.5 text-right border border-gray-500 font-semibold bg-lime-400">
  {formatRupiah(
    filteredBahan.reduce(
      (sum, r) => sum + Number(r.biaya_total_adonan),
      0
    )
  )}
</td>

                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Jumlah Kebutuhan
                </td>
                <td className="px-1 py-0.5 text-right border border-gray-500 font-semibold bg-lime-400">
                  {formatGr(filteredBahan.reduce(
                    (sum, r) => sum + Number(r.jumlah_kebutuhan),
                    0
                  ))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
