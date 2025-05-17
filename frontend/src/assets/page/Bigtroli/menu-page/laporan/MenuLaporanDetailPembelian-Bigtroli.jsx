/*  MenuPenjualanDetail.jsx  */
import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getLaporanPenjualanDetailed,
  getLaporanPenjualanMaster,
} from "../../../../services/apiService";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import LogoExcel from "../../../../image/icon/excel-document.svg";
import Alert from "../../../component/Alert";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";

/* ---------------- FilterSelect ---------------- */
function FilterSelect({ label, options, value, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((o) =>
        typeof o === "string"
          ? o.toLowerCase().includes(inputValue.toLowerCase())
          : false
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    const outside = (e) => {
      if (wrap.current && !wrap.current.contains(e.target))
        setShowOptions(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const select = (opt) => {
    onChange(opt);
    setInputValue(opt);
    setShowOptions(false);
  };

  return (
    <div className="relative w-full md:w-44" ref={wrap}>
      <label className="block mb-1 text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        value={inputValue}
        onFocus={() => setShowOptions(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setShowOptions(true);
        }}
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
        placeholder={placeholder || "Pilih atau ketik..."}
        type="text"
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue("");
            onChange("");
            setShowOptions(false);
          }}
          className="absolute top-6 right-2 text-red-500 text-sm"
        >
          &times;
        </button>
      )}
      {showOptions &&
        (filteredOptions.length ? (
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
        ) : (
          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
            Tidak ada opsi
          </div>
        ))}
    </div>
  );
}

/* ---------------- Komponen Utama ---------------- */
export default function MenuPenjualanDetail() {
  const token = useSelector((s) => s.auth.token);
  const { id_master_penjualan } = useParams();

  const [headerData, setHeaderData] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, message: "", type: "" });

  /* filter */
  const [kodeFilter, setKodeFilter] = useState("");
  const [namaBarangFilter, setNamaBarangFilter] = useState("");
  const [pelangganFilter, setPelangganFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* pagination & sort */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  /* ---------- UTIL ---------- */
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  const fmtDate = (s, full = false) =>
    s
      ? new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          ...(full
            ? {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }
            : {}),
          timeZone: "UTC",
        }).format(new Date(s))
      : "-";

  const ymd = (s) => (s ? new Date(s).toISOString().substring(0, 10) : "-");

  /* ---------- FETCH HEADER ---------- */
  useEffect(() => {
    (async () => {
      try {
        const master = await getLaporanPenjualanMaster(token);
        const rows = master
          .flatMap((o) => Object.values(o))
          .filter((r) => typeof r === "object");
        const header = rows.find(
          (r) => Number(r.id_master_penjualan) === Number(id_master_penjualan)
        );
        setHeaderData(header || null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token, id_master_penjualan]);

  /* ---------- FETCH DETAIL ---------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const detail = await getLaporanPenjualanDetailed(
          token,
          id_master_penjualan
        );
        const rows = detail
          .flatMap((o) => Object.values(o))
          .filter((r) => typeof r === "object")
          .filter(
            (r) => Number(r.id_master_penjualan) === Number(id_master_penjualan)
          );
        setDetailData(rows);
        setFilteredData(rows);
      } catch (e) {
        setError(e.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, id_master_penjualan]);

  /* ---------- FILTER ---------- */
  const kodeBarangList = [...new Set(detailData.map((d) => d.kode_barang))];
  const namaBarangList = [...new Set(detailData.map((d) => d.nama_produk))];
  const pelangganList = [...new Set(detailData.map((d) => d.nama_toko))];

  useEffect(() => {
    let tmp = detailData;
    if (kodeFilter)
      tmp = tmp.filter((d) =>
        d.kode_barang.toLowerCase().includes(kodeFilter.toLowerCase())
      );
    if (namaBarangFilter)
      tmp = tmp.filter((d) =>
        d.nama_produk.toLowerCase().includes(namaBarangFilter.toLowerCase())
      );
    if (pelangganFilter)
      tmp = tmp.filter((d) => d.nama_toko === pelangganFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      tmp = tmp.filter((d) =>
        Object.values(d).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    setFilteredData(tmp);
    setCurrentPage(1);
  }, [kodeFilter, namaBarangFilter, pelangganFilter, searchTerm, detailData]);

  /* ---------- SORT ---------- */
  const sortedData = useMemo(() => {
    const arr = [...filteredData];
    if (sortConfig.key) {
      arr.sort((a, b) => {
        const aK = a[sortConfig.key] ?? "";
        const bK = b[sortConfig.key] ?? "";
        if (aK < bK) return sortConfig.direction === "asc" ? -1 : 1;
        if (aK > bK) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [filteredData, sortConfig]);

  /* ---------- PAGINATION ---------- */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  /* ---------- EXPORT EXCEL ---------- */
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "warning",
        visible: true,
      });
      return;
    }

    // header kolom
    const headerRow = [
      "No.",
      "Tgl Trans",
      "No. Trans",
      "Jenis Transaksi",
      "No. Pesanan Penjualan",
      "No. Surat Jalan",
      "Syarat Bayar",
      "Pelanggan",
      "Grand Total (Rp)",
      "Kode Barang",
      "Satuan",
      "Jml",
      "Harga (Rp)",
      "Disc (%)",
      "HPP / Satuan (Rp)",
    ];

    // data
    const bodyRows = filteredData.map((d, idx) => [
      idx + 1,
      ymd(d.tanggal_transaksi),
      d.no_transaksi,
      d.id_jenis_transaksi ?? d.nama_transaksi ?? "",
      d.no_pesanan_penjualan,
      d.no_surat_jalan,
      d.id_syarat_bayar ?? d.nama_syarat_bayar ?? "",
      d.id_toko ?? d.nama_toko ?? "",
      d.grand_total,
      d.kode_barang,
      d.satuan ?? "",
      d.jumlah,
      d.harga,
      d.discount,
      d.hpp_satuan,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detail Penjualan");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Detail_Nota_Jual_${
        filteredData[0].no_pesanan_penjualan || "Unknown"
      }.xlsx`
    );
  };

  /* ---------- RENDER ---------- */
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

      {/* ----- HEAD / BREADCRUMB ----- */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/dashboard/adminkitchen"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
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
            to="/dashboard/adminkitchen/menu/laporanpenjualan"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan Penjualan
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
            Detail Penjualan
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition"
        >
          Refresh
        </button>
      </div>

      {/* ----- HEADER DATA ----- */}
      {headerData && (
        <div className="bg-white rounded-md shadow-md p-2 mb-2 border border-gray-200">
          <div className="bg-gray-100 shadow-md rounded-md">
            <div className="text-xs p-2">
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  No Transaksi:
                </div>
                <span className="text-gray-900">
                  {headerData.no_transaksi || "-"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Nama Kitchen:
                </div>
                <span className="text-gray-900">
                  {headerData.nama_kitchen || "-"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Pelanggan:
                </div>
                <span className="text-gray-900">
                  {detailData[0]?.nama_toko || "-"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Grand Total:
                </div>
                <span className="text-gray-900">
                  {formatRupiah(headerData.grand_total)}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Tanggal Transaksi:
                </div>
                <span className="text-gray-900">
                  {fmtDate(headerData.tanggal_transaksi)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----- FILTER BAR ----- */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Kode Barang"
            options={kodeBarangList}
            value={kodeFilter}
            onChange={setKodeFilter}
          />
          <FilterSelect
            label="Nama Barang"
            options={namaBarangList}
            value={namaBarangFilter}
            onChange={setNamaBarangFilter}
          />
          <FilterSelect
            label="Pelanggan"
            options={pelangganList}
            value={pelangganFilter}
            onChange={setPelangganFilter}
          />
        </div>
      </div>

      {/* ----- TABLE ----- */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Penjualan
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
                id="simple-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-10 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExportExcel}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="overflow-y-auto" style={{ height: "56vh" }}>
            <table className="min-w-max whitespace-nowrap text-xs text-left text-gray-500 border-collapse border">
              {/* ---------- THEAD ---------- */}
              <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
                <tr>
                  {/* (thead manual – tidak diubah) */}
                  <th className="px-2 py-0.5 w-6  sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    No
                  </th>
                  <th className="px-2 py-0.5 w-14 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    ID Master
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Tgl Transaksi
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    No Transaksi
                  </th>
                  <th className="px-2 py-0.5 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Nama Transaksi
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    No Pesanan
                  </th>
                  <th className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    No Surat Jalan
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Syarat Bayar
                  </th>
                  <th className="px-2 py-0.5 w-44 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Pelanggan
                  </th>
                  <th className="px-2 py-0.5 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Kode Barang
                  </th>
                  <th className="px-2 py-0.5 w-44 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Nama Produk
                  </th>
                  <th className="px-2 py-0.5 w-12 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Qty
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Harga
                  </th>
                  <th className="px-2 py-0.5 w-16 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Discount
                  </th>
                  <th className="px-2 py-0.5 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    HPP Sat
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Total Rp
                  </th>
                  <th className="px-2 py-0.5 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Disc Rp
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Subtotal Rp
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Total HPP
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Grand Total
                  </th>
                  <th className="px-2 py-0.5 w-24 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Profit Rp
                  </th>
                  <th className="px-2 py-0.5 w-28 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    DI BUAT OLEH
                  </th>
                  <th className="px-2 py-0.5 w-36 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    DI BUAT TANGGAL
                  </th>
                  <th className="px-2 py-0.5 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10">
                    Status
                  </th>
                </tr>
              </thead>

              {/* ---------- TBODY ---------- */}
              <tbody>
                {currentItems.length ? (
                  currentItems.map((d, i) => {
                    let rowBg = "";
                    if (d.id_jenis_transaksi === 1) rowBg = "bg-lime-500";
                    else if (d.id_jenis_transaksi === 2)
                      rowBg = "bg-yellow-300";
                    else if (d.id_jenis_transaksi === 3) rowBg = "bg-red-500";

                    return (
                      <tr key={i} className={`text-gray-900 hover:bg-lime-400 ${rowBg}`}>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {indexOfFirst + i + 1}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.id_master_penjualan}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {fmtDate(d.tanggal_transaksi)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.no_transaksi}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.nama_transaksi}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.no_pesanan_penjualan}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.no_surat_jalan}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.nama_syarat_bayar}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.nama_toko}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.kode_barang}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.nama_produk}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.jumlah + " Pcs"}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.harga)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.discount + " %"}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.hpp_satuan)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.total_rp)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.disc_rp)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.subtotal_rp)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.total_hpp)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.grand_total)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {formatRupiah(d.profit_rp)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.nama_createby}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {fmtDate(d.createat, true)}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-500">
                          {d.status_penjualan}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="px-2 py-0.5 text-center">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- SUBTOTAL FOOTER ---------- */}
        <div className="mt-1">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <tfoot>
              {/* BARIS 1 */}
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Harga
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.harga || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total HPP Sat
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.hpp_satuan || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Total Rp
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.total_rp || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Disc Rp
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.disc_rp || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Subtotal Rp
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.subtotal_rp || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Total HPP
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.total_hpp || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Grand Total
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.grand_total || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Profit Rp
                </td>
                <td className="px-1 py-0.5 border border-gray-700 bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.profit_rp || 0),
                      0
                    )
                  )}
                </td>
              </tr>
              {/* BARIS 2 */}
              <tr className="font-semibold text-blue-900 bg-gray-200"></tr>
              {/* BARIS 3 */}
              <tr className="font-semibold text-blue-900 bg-gray-200"></tr>
              {/* BARIS 4 */}
              <tr className="font-semibold text-blue-900 bg-gray-200"></tr>
            </tfoot>
          </table>
        </div>

        {/* ----- PAGINATION ----- */}
        <nav className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mt-4">
          <div className="flex items-center gap-2">
            <label htmlFor="ipp" className="text-xs">
              Tampilkan:
            </label>
            <select
              id="ipp"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-xs p-1"
            >
              {[25, 50, 100, 250, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs">
            Showing{" "}
            <span className="font-semibold">
              {indexOfFirst + 1}-{Math.min(indexOfLast, sortedData.length)}
            </span>{" "}
            of <span className="font-semibold">{sortedData.length}</span>
          </span>
          <div className="flex gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-2 text-xs border border-gray-300 rounded ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-2 text-xs border border-gray-300 rounded ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
