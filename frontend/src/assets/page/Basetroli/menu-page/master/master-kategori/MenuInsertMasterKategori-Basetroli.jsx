import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMasterAdonan,
  getMasterAdonanProduk,
  getMasterDetailAdonan,
} from "../../../../../services/apiService";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Error from "../../../../component/Error";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function MenuInsertMasterDataBarangMaster() {
  const { id: paramId, id_kategori_adonan_produk } = useParams();
  const id = paramId || id_kategori_adonan_produk;

  const [dataAdonan, setDataAdonan] = useState(null);
  const [bahanRows, setBahanRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const [searchTermBahan, setSearchTermBahan] = useState("");
  const [currentPageBahan, setCurrentPageBahan] = useState(1);
  const [itemsPerPageBahan, setItemsPerPageBahan] = useState(25);

  const formatRupiah = (number) => {
    if (number == null || isNaN(number)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(
      date.getMonth() + 1
    )}/${date.getFullYear()}, ${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}:${pad(date.getSeconds())}`;
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
  const formatDateOnly = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const adonanRes = await getMasterAdonan();
        const adonanList = Array.isArray(adonanRes)
          ? adonanRes
          : Object.values(adonanRes);
        const master = adonanList.find(
          (r) => String(r.id_kategori_adonan_produk) === String(id)
        );
        if (!master) throw new Error(`Adonan ${id} tidak ditemukan.`);
        setDataAdonan(master);

        const detailRes = await getMasterDetailAdonan();
        const detailList = Array.isArray(detailRes)
          ? detailRes
          : Object.values(detailRes);
        setBahanRows(
          detailList.filter(
            (r) => String(r.id_kategori_adonan_produk) === String(id)
          )
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // filter
  const filteredBahan = useMemo(() => {
    if (!searchTermBahan) return bahanRows;
    const q = searchTermBahan.toLowerCase();
    return bahanRows.filter((r) => r.nama_bahan_baku.toLowerCase().includes(q));
  }, [bahanRows, searchTermBahan]);

  // pagination
  const lastIdx = currentPageBahan * itemsPerPageBahan;
  const firstIdx = lastIdx - itemsPerPageBahan;
  const currentItems = filteredBahan.slice(firstIdx, lastIdx);
  const totalPages = Math.ceil(filteredBahan.length / itemsPerPageBahan);
  const paginate = (p) => setCurrentPageBahan(p);

  const exportExcel = () => {
    if (!currentItems.length) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const fn = `ResepBahanBaku-${dataAdonan.nama_kategori_adonan_produk}-${now}.xlsx`;
    const ws = XLSX.utils.json_to_sheet(
      currentItems.map((it, i) => ({
        No: firstIdx + i + 1,
        Lokasi: it.nama_lokasi,
        Adonan: dataAdonan.nama_kategori_adonan_produk,
        Kategori: it.nama_kategori_bahan_baku,
        Kode: it.kode_bahan_baku,
        Nama: it.nama_bahan_baku,
        Jumlah: it.jumlah_kebutuhan,
        Satuan: it.nama_satuan,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BahanBaku");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), fn);
    setAlert({ message: "Export berhasil!", type: "success", visible: true });
    setTimeout(() => setAlert((a) => ({ ...a, visible: false })), 2000);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14">
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((a) => ({ ...a, visible: false }))}
        />
      )}

      {/* HEADER */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/dashboard/adminpembelian"
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
            to="/dashboard/adminpembelian/menu/masterkategori"
            className="text-xs font-semibold text-blue-900"
          >
            Master Adonan
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
            Detail Master Adonan
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
        <p className="text-xl font-semibold text-blue-900">Detail Adonan</p>
        <Link to="/dashboard/adminpembelian/menu/masterkategori">
          <button className="cetakpdf h-6 rounded-md flex text-sm items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
            <p className="p-2">Back</p>
          </button>
        </Link>
      </div>

      {/* Info Adonan */}
      <fieldset className="border w-fit border-blue-400 rounded p-2 text-xs mb-2">
        <legend className="px-1 text-sm font-bold text-blue-900">
          Info Produk
        </legend>
        <div className="flex-row w-full gap-4 text-xs">
          <div className="flex w-full gap-1">
            <div>
              <label className="block font-medium text-blue-900">
                Nama Adonan:
              </label>
              <input
                readOnly
                value={dataAdonan.nama_kategori_adonan_produk}
                className="mt-1 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Dibuat Oleh:
              </label>
              <input
                readOnly
                value={dataAdonan.nama_user}
                className="mt-1 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
          </div>
          <div className="flex w-full gap-1">
            <div>
              <label className="block font-medium text-blue-900">
                Dibuat Tanggal:
              </label>
              <input
                readOnly
                value={formatDateOnly(dataAdonan.createat)}
                className="mt-1 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">Status:</label>
              <input
                readOnly
                value={dataAdonan.status === 0 ? "aktif" : "tidak aktif"}
                className={`
                  mt-1 w-full border uppercase text-sm border-gray-300 rounded p-1 text-right
                  ${dataAdonan.status === 1 ? "bg-red-500 text-white" : "bg-lime-500"}
                `}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Search + Export */}
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
            onClick={exportExcel}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table
            className="w-full text-xs text-left text-gray-500 border-collapse"
            style={{ width: "100vw" }}
          >
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th className="px-1 py-0.5 w-3 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  No
                </th>
                <th className="px-1 py-0.5 w-40 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Lokasi Penyimpanan
                </th>
                <th className="px-1 py-0.5 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Kategori Bahan Baku
                </th>
                <th className="px-1 py-0.5 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Kode Bahan Baku
                </th>
                <th className="px-1 py-0.5 w-52 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Nama Bahan Baku
                </th>
                <th className="px-1 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Jumlah Stok
                </th>
                <th className="px-1 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Jml. Kebutuhan
                </th>
                <th className="px-1 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Harga Beli
                </th>
                <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  Total Biaya Adonan
                </th>
                <th className="px-1 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Total Harga
                </th>
                <th className="px-1 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Di input Oleh
                </th>
                <th className="px-1 py-0.5 w-32 sticky	top-0 border border-gray-500 bg-gray-200 z-10">
                  Di buat Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length ? (
                currentItems.map((it, i) => (
                  <tr key={it.id_bahan_baku} className="hover:bg-gray-200">
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {firstIdx + i + 1}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {it.nama_lokasi}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {it.nama_kategori_bahan_baku}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {it.kode_bahan_baku}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {it.nama_bahan_baku}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black uppercase">
                      {it.stok_bahan_baku + " " + it.nama_satuan}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black uppercase">
                      {formatGr2(it.jumlah_kebutuhan) + " " + it.nama_satuan}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black ">
                      {formatRupiah(it.harga_beli_barang)}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black ">
                      {formatRupiah(it.total_harga)}
                    </td>
                    <td className="px-2 py-1 border text-right border-gray-500 text-black">
                      {formatRupiah(it.biaya_total_adonan)}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black">
                      {it.nama_user}
                    </td>
                    <td className="px-2 py-1 border border-gray-500 text-black uppercase">
                      {formatDate(it.createat)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-4">
                    Tidak ada data
                  </td>
                </tr>
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
                <td className="px-1 py-0.5 border text-right border-gray-500 font-semibold bg-lime-400">
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
                  Total Jumlah Kebutuhan
                </td>
                <td className="px-1 py-0.5 border text-right border-gray-500 font-semibold bg-lime-400">
                  {formatGr(filteredBahan.reduce(
                    (sum, r) => sum + Number(r.jumlah_kebutuhan || 0),
                    0
                  ))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
          aria-label="Table navigation"
        >
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-xs text-gray-700">
              Tampilkan:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPageBahan}
              onChange={(e) => {
                setItemsPerPageBahan(Number(e.target.value));
                setCurrentPageBahan(1);
              }}
              className="border border-gray-300 rounded text-xs p-1"
            >
              {[5, 25, 50, 100, 250, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {firstIdx + 1}–{Math.min(lastIdx, filteredBahan.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredBahan.length}
            </span>
          </span>

          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPageBahan - 1)}
                disabled={currentPageBahan === 1}
                className={
                  `px-2 py-1 text-xs border border-gray-300 rounded-l bg-white hover:bg-gray-100 ` +
                  (currentPageBahan === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "")
                }
              >
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPageBahan + 1)}
                disabled={currentPageBahan === totalPages}
                className={
                  `px-2 py-1 text-xs border border-gray-300 rounded-r bg-white hover:bg-gray-100 ` +
                  (currentPageBahan === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "")
                }
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
