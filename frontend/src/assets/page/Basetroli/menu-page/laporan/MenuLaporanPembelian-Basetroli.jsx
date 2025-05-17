/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLaporanPenjualanMaster } from "../../../../services/apiService";
import { useSelector } from "react-redux";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";
import Alert from "../../../component/Alert";

/* -------------------------------------------------------------
   Komponen   : FilterSelect
---------------------------------------------------------------- */
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((opt) =>
        typeof opt === "string"
          ? opt.toLowerCase().includes(inputValue.toLowerCase())
          : false
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    function outside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowOptions(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const select = (opt) => {
    onChange(opt);
    setInputValue(opt);
    setShowOptions(false);
  };

  return (
    <div className="relative w-full md:w-44" ref={wrapperRef}>
      <label className="block mb-1 text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-sm rounded-md p-1 w-full"
        placeholder="Pilih atau ketik..."
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue("");
            onChange("");
            setShowOptions(false);
          }}
          className="absolute top-6 right-2 text-red-500 text-sm"
          title="Clear"
        >
          &times;
        </button>
      )}
      {showOptions && (
        <>
          {filteredOptions.length ? (
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
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
   Komponen   : MenuLaporanPenjualanBesttroli
---------------------------------------------------------------- */
export default function MenuLaporanPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [noTransaksiFilter, setNoTransaksiFilter] = useState("");
  const [noPesananFilter, setNoPesananFilter] = useState("");
  const [syaratBayarFilter, setSyaratBayarFilter] = useState("");
  const [jenisTransaksiFilter, setJenisTransaksiFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((s) => s.auth.token);
  const navigate = useNavigate();

  /* ------------------- FETCH ------------------ */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getLaporanPenjualanMaster(token);
        const rows = res
          .flatMap((it) => Object.values(it))
          .filter((r) => typeof r === "object");
        setData(rows);
        setFilteredData(rows);
      } catch (e) {
        setError(e.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ------------------- UTIL ------------------ */
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  const fmtDate = (s, withTime = false) =>
    s
      ? new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          ...(withTime
            ? {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }
            : {}),
          timeZone: "UTC",
        }).format(new Date(s))
      : "Data tidak tersedia";

  /* ------------------- FILTERS ------------------ */
  const noTransaksiList = [...new Set(data.map((d) => d.no_transaksi))];
  const noPesananList = [...new Set(data.map((d) => d.no_pesanan_penjualan))];
  const syaratBayarList = [...new Set(data.map((d) => d.nama_syarat_bayar))];
  const jenisTransaksiList = [
    ...new Set(data.map((d) => d.nama_jenis_transaksi)),
  ];

  useEffect(() => {
    let tmp = data;

    if (noTransaksiFilter)
      tmp = tmp.filter((d) => d.no_transaksi === noTransaksiFilter);
    if (noPesananFilter)
      tmp = tmp.filter((d) => d.no_pesanan_penjualan === noPesananFilter);
    if (syaratBayarFilter)
      tmp = tmp.filter((d) => d.nama_syarat_bayar === syaratBayarFilter);
    if (jenisTransaksiFilter)
      tmp = tmp.filter((d) => d.nama_jenis_transaksi === jenisTransaksiFilter);

    if (startDate || endDate) {
      const s = startDate && new Date(startDate);
      const e = endDate && new Date(endDate);
      tmp = tmp.filter((d) => {
        const t = new Date(d.tanggal_transaksi);
        return (!s || t >= s) && (!e || t <= e);
      });
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      tmp = tmp.filter((d) =>
        Object.values(d).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    setFilteredData(tmp);
    setCurrentPage(1);
  }, [
    noTransaksiFilter,
    noPesananFilter,
    syaratBayarFilter,
    jenisTransaksiFilter,
    startDate,
    endDate,
    searchTerm,
    data,
  ]);

  /* ------------------- SORT ------------------ */
  const sortedData = useMemo(() => {
    const arr = [...filteredData];
    if (sortConfig.key !== null) {
      arr.sort((a, b) => {
        const aK =
          a[sortConfig.key] !== null && a[sortConfig.key] !== undefined
            ? a[sortConfig.key].toString().toLowerCase()
            : "";
        const bK =
          b[sortConfig.key] !== null && b[sortConfig.key] !== undefined
            ? b[sortConfig.key].toString().toLowerCase()
            : "";
        if (aK < bK) return sortConfig.direction === "asc" ? -1 : 1;
        if (aK > bK) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [filteredData, sortConfig]);

  /* ------------------- PAGINATION ------------------ */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const pageData = sortedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  /* ------------------- SUBTOTAL ------------------ */
  const subtotalGrand = filteredData.reduce(
    (acc, d) => acc + Number(d.grand_total || 0),
    0
  );

  /* ------------------- HANDLER ------------------ */
  const setSort = (k) =>
    setSortConfig((p) => ({
      key: k,
      direction: p.key === k && p.direction === "asc" ? "desc" : "asc",
    }));

  const detail = (id) => {
    console.log("Navigating to detail with ID:", id);
    navigate(`/dashboard/adminpembelian/menu/laporanpenjualan/detail/${id}`);
  };

  /* ------------------- VIEW ------------------ */
  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        />
      )}
      {loading && <Loading />}
      {error && <Error message={error} />}

      {/* ----- HEADER ----- */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/dashboard/adminpembelian"
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
          <span className="text-xs font-semibold text-gray-400">
            Laporan Penjualan
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* ----- FILTER BAR ----- */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full">
          <FilterSelect
            label="No Transaksi"
            options={noTransaksiList}
            value={noTransaksiFilter}
            onChange={setNoTransaksiFilter}
          />
          <FilterSelect
            label="No Pesanan Penjualan"
            options={noPesananList}
            value={noPesananFilter}
            onChange={setNoPesananFilter}
          />
          <FilterSelect
            label="Jenis Transaksi"
            options={jenisTransaksiList}
            value={jenisTransaksiFilter}
            onChange={setJenisTransaksiFilter}
          />
          <FilterSelect
            label="Syarat Bayar"
            options={syaratBayarList}
            value={syaratBayarFilter}
            onChange={setSyaratBayarFilter}
          />
          {/* Tanggal */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Tanggal Transaksi
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate("");
                }}
                max={endDate || ""}
              />
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ----- TABLE ----- */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        {/* Title & search */}
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-8 rounded-md pl-10 p-2 w-full"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ height: "50vh" }}>
          <table className="min-w-max w-full text-xs text-left text-gray-500 border table-auto whitespace-nowrap">
            <thead className="bg-gray-200 text-blue-900 uppercase sticky top-0">
              <tr>
                {/* No row */}
                <th
                  className="px-2 py-1 w-8 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("no")}
                >
                  No
                </th>

                {/* Tgl Transaksi moved left */}
                <th
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("tanggal_transaksi")}
                >
                  Tgl Transaksi{" "}
                  {sortConfig.key === "tanggal_transaksi" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-40 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("no_transaksi")}
                >
                  No Transaksi{" "}
                  {sortConfig.key === "no_transaksi" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("nama_jenis_transaksi")}
                >
                  Jenis Transaksi{" "}
                  {sortConfig.key === "nama_jenis_transaksi" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-40 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("no_pesanan_penjualan")}
                >
                  No Pesanan Penjualan{" "}
                  {sortConfig.key === "no_pesanan_penjualan" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-40 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("no_surat_jalan")}
                >
                  No Surat Jalan{" "}
                  {sortConfig.key === "no_surat_jalan" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-28 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("nama_syarat_bayar")}
                >
                  Syarat Bayar{" "}
                  {sortConfig.key === "nama_syarat_bayar" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("grand_total")}
                >
                  Grand Total{" "}
                  {sortConfig.key === "grand_total" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                {/* new column Total HPP */}
                <th
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("total_hpp")}
                >
                  Total HPP{" "}
                  {sortConfig.key === "total_hpp" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                {/* new column Profit Rp */}
                <th
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("profit_rp")}
                >
                  Profit (Rp){" "}
                  {sortConfig.key === "profit_rp" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-32 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("nama_createby")}
                >
                  Create By{" "}
                  {sortConfig.key === "nama_createby" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-36 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("createat")}
                >
                  DI BUAT TANGGAL{" "}
                  {sortConfig.key === "createat" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-1 w-28 sticky top-0 border border-gray-700 bg-gray-200 cursor-pointer"
                  onClick={() => setSort("status")}
                >
                  Status{" "}
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th className="px-1 py-0.5 w-10 sticky top-0 border border-gray-500 bg-gray-200">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {pageData.length ? (
                pageData.map((it, idx) => {
                  /* ---------- PEWARNAAN SESUAI id_jenis_transaksi ---------- */
                  let rowBg = "";
                  if (it.id_jenis_transaksi === 1) rowBg = "bg-lime-500";
                  else if (it.id_jenis_transaksi === 2) rowBg = "bg-yellow-300";
                  else if (it.id_jenis_transaksi === 3) rowBg = "bg-red-500";

                  /* ---------- label status ---------- */
                  const statusLbl =
                    it.status === 0
                      ? "Selesai"
                      : it.status === 1
                      ? "Produksi"
                      : "Unknown";

                  return (
                    <tr
                      key={idx}
                      /* ⬇️  pindah ke detail dengan double-click */
                      onDoubleClick={() => detail(it.id_master_penjualan)}
                      className={`border-b text-gray-700 hover:opacity-75 cursor-pointer ${rowBg}`}
                    >
                      <td className="px-2 py-0 border border-gray-700">
                        {indexOfFirst + idx + 1}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {fmtDate(it.tanggal_transaksi)}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {it.no_transaksi || "-"}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {it.nama_jenis_transaksi || "-"}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {it.no_pesanan_penjualan || "-"}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {it.no_surat_jalan || "-"}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {it.nama_syarat_bayar || "-"}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {formatRupiah(it.grand_total)}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {formatRupiah(it.total_hpp)}
                      </td>
                      <td className="px-2 py-0 border border-gray-700">
                        {formatRupiah(it.profit_rp)}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {it.nama_createby || "-"}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {fmtDate(it.createat, true)}
                      </td>
                      <td className="px-2 py-1 border border-gray-700">
                        {statusLbl}
                      </td>

                      {/* tombol aksi tetap ada; cegah double-click bubble jika diperlukan */}
                      <td className="px-1 py-0.5 border border-gray-500">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // ← mencegah trigger onDoubleClick
                              detail(it.id_master_penjualan);
                            }}
                            className="flex items-center justify-center"
                            title="Detail"
                          >
                            <svg
                              className="w-5 h-5 text-black"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                            >
                              <path d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
                              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={15}
                    className="py-4 text-center text-gray-500 border-b"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ----- SUBTOTAL ----- */}
        <div className="mt-0.5">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={7}
                  className="px-2 py-1 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Total Grand Total
                </td>
                <td className="px-2 py-1 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(subtotalGrand)}
                </td>
                <td
                  colSpan={7}
                  className="border border-gray-700 bg-gray-300"
                />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ----- PAGINATION ----- */}
        <nav className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 gap-2">
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
