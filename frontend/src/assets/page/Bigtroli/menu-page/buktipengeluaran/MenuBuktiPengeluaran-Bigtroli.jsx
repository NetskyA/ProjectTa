// MenuProduksiProduk.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMasterBuktiPengeluaran  } from "../../../../services/apiService";
import { useSelector } from "react-redux";

import Loading from "../../../component/Loading";
import Error from "../../../component/Error";
import Alert from "../../../component/Alert";

function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter(
        (opt) =>
          typeof opt === "string" &&
          opt.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    const onOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="relative w-full md:w-44" ref={wrapperRef}>
      <label className="block mb-1 text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        type="text"
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
        value={inputValue}
        placeholder="Pilih atau ketik..."
        onFocus={() => setShowOptions(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setShowOptions(true);
        }}
      />
      {inputValue && (
        <button
          className="absolute top-6 right-2 text-red-500 text-sm"
          onClick={() => {
            setInputValue("");
            onChange("");
            setShowOptions(false);
          }}
        >
          &times;
        </button>
      )}
{showOptions && filteredOptions.length > 0 && (
  <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
    {filteredOptions.map((opt, idx) => (
      <li
        key={`${opt}-${idx}`}
        className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
        onClick={() => {
          setInputValue(opt);
          onChange(opt);
          setShowOptions(false);
        }}
      >
        {opt}
      </li>
    ))}
  </ul>
)}

      {showOptions && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
          Tidak ada opsi
        </div>
      )}
    </div>
  );
}

export default function MenuNotaPembelianBasetroli() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth.token);
  const id_toko = parseInt(
    useSelector((s) => s.auth.id_toko),
    10
  );

  // filters
  const [kodePesanan, setKodePesanan] = useState("");
  const [kodeSalesOrder, setKodeSalesOrder] = useState("");
  const [namaKitchen, setNamaKitchen] = useState("");
  const [tanggalTransaksiFilter, setTanggalTransaksiFilter] = useState("");
  const [tanggalKirimFilter, setTanggalKirimFilter] = useState("");
  const [kodeProduksiFilter, setKodeProduksiFilter] = useState("");
  const [tanggalBuatFilter, setTanggalBuatFilter] = useState("");
  // search / sort / pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleSort = (key) =>
    setSortConfig((c) => ({
      key,
      direction: c.key === key && c.direction === "asc" ? "desc" : "asc",
    }));
  // load data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMasterBuktiPengeluaran (token);
        console.log("res", res);
        let rows = [];
        if (Array.isArray(res) && res.length > 0) {
          const first = res[0];
          if (
            typeof first === "object" &&
            first !== null &&
            !Array.isArray(first)
          ) {
            rows = Object.values(first);
          } else if (Array.isArray(first)) {
            rows = first;
          }
        }
        setData(rows);
        setFiltered(rows);
      } catch (e) {
        console.error(e);
        setError(e.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);
  

  // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  // format date
  const formatDate = (isoString) => {
    if (!isoString) return "–";
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    const day   = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year  = d.getFullYear();
    const hh    = pad(d.getHours());
    const mm    = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hh}:${mm}`;
  };

  // somewhere in your component (or utils.js)
const formatDateNoTime = (isoString) => {
  if (!isoString) return "–";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  const day   = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
};

  
  // apply filters & search
  useEffect(() => {
    let f = data;
  
    // only filter by kode_master_produksi and createat date
    if (kodeProduksiFilter) {
      f = f.filter(r => r.kode_master_produksi === kodeProduksiFilter);
    }
    if (tanggalBuatFilter) {
      f = f.filter(r =>
        r.createat && r.createat.slice(0, 10) === tanggalBuatFilter
      );
    }
  
    // optional: still allow free‐text search if you like
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(r =>
        r.kode_master_produksi.toLowerCase().includes(q) ||
        r.nama_user.toLowerCase().includes(q)
      );
    }
  
    setFiltered(f);
    setCurrentPage(1);
  }, [data, kodeProduksiFilter, tanggalBuatFilter, searchTerm]);
  

  // sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortConfig.key) {
      arr.sort((a, b) => {
        let x = a[sortConfig.key],
          y = b[sortConfig.key];
        x = x == null ? "" : x.toString().toLowerCase();
        y = y == null ? "" : y.toString().toLowerCase();
        if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
        if (x > y) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [filtered, sortConfig]);

  // pagination
  const iLast = currentPage * itemsPerPage;
  const iFirst = iLast - itemsPerPage;
  const pageRows = sorted.slice(iFirst, iLast);
  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  const uniqueKodeGP = [
    ...new Set(data.map((r) => r.kode_gabungan_permintaan)),
  ];
  const uniqueKitchenName = [...new Set(data.map((r) => r.nama_kitchen))];

  // const detailGabunganPermintaan = (id) =>
  //   console.log("Navigating to detail with ID:", id);
  //   navigate(`/dashboard/adminpembelian/menu/notapembelian/detail/${id}`);

  const detailGabunganPermintaan = (id) => {
    console.log("Navigating to detail with ID:", id);
    navigate(`/dashboard/adminkitchen/menu/buktipengeluaran/detail/${id}`);
  };

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        />
      )}

      {/* header */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link
            to="/dashboard/adminkitchen"
            className="text-xs font-semibold text-blue-900"
          >
            Produksi
          </Link>
          <svg
            className="mx-1 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Bukti Pengeluaran
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition"
        >
          Refresh
        </button>
      </div>

      {/* filters */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-1">
        <div className="flex text-xs flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
        <FilterSelect
            label="No. Produksi"
            options={[...new Set(data.map(r => r.kode_master_produksi))]}
            value={kodeProduksiFilter}
            onChange={setKodeProduksiFilter}
          />
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-blue-900 font-semibold">Tanggal Buat</label>
            <input
              type="date"
              className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
              value={tanggalBuatFilter}
              onChange={e => setTanggalBuatFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* search + add */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 mb-2">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
          Bukti Pengeluaran
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* EXPORT BUTTON */}
          {/* <div className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer">
            <Link to="/dashboard/adminkitchen/menu/produksiproduk/add">
              <button className="h-8 px-2 text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 rounded-md">
                Tambah
              </button>
            </Link>
          </div> */}
        </div>

        {/* table */}
        <div className="overflow-x-auto" style={{ height: "65vh" }}>
          <table className="whitespace-nowrap w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>

                <th
                  scope="col"
                  className="px-2 py-0.5 w-56 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_gabungan_permintaan")}
                >
                  No. Produksi Produk
                  {sortConfig.key === "kode_gabungan_permintaan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>

                <th
                  scope="col"
                  className="px-2 py-0.5 w-56 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_bukti_pengeluaran")}
                >
                  No. Bukti Pengeluaran
                  {sortConfig.key === "kode_bukti_pengeluaran" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>

                <th
                  scope="col"
                  className="px-2 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("tanggal_verifikasi_pr")}
                >
                  Tgl Verifikasi BK
                  {sortConfig.key === "tanggal_verifikasi_pr" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("status_produksi")}
                >
                 Status Produksi
                  {sortConfig.key === "status_produksi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("status_bukti_pengeluaran")}
                >
                 Status B. Pengeluaran
                  {sortConfig.key === "status_bukti_pengeluaran" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-2 py-0.5 w-44 sticky top-0 border border-gray-500 bg-gray-200 z-10"
                >
                  Di Buat Oleh
                </th>

                <th
                  scope="col"
                  className="px-2 py-0.5 w-44 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("createat")}
                >
                  Di Buat Tanggal
                  {sortConfig.key === "createat" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>

                <th
                  scope="col"
                  className="px-2 py-0.5 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10 text-center"
                >
                  Action
                </th>
              </tr>
            </thead>

            {/* ===== BODY ===== */}
            <tbody>
              {pageRows.length ? (
                pageRows.map((r, i) => {
                  const globalIdx = iFirst + i + 1;

                  const rowBg =
                    Number(r.status_bukti_pengeluaran) === 0
                      ? "bg-yellow-300 text-blue-900"
                      : "bg-lime-500 text-blue-900";

                  return (
                    <tr
                      key={r.id_master_bukti_pengeluaran}
                      className={`border-b cursor-pointer hover:bg-opacity-70 hover:text-black text-black ${rowBg}`}
                      onDoubleClick={() =>
                        detailGabunganPermintaan(r.id_master_bukti_pengeluaran)
                      }
                    >
                      {/* No */}
                      <td className="px-2 py-0.5 border border-gray-500">
                        {globalIdx}
                      </td>

                      {/* Kode GP */}
                      <td className="px-2 py-0.5 border border-gray-500 uppercase">
                      {r.kode_master_produksi}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-500 uppercase">
                      {r.kode_bukti_pengeluaran}
                      </td>

                      {/* Kitchen */}
                      <td className="px-2 py-0.5 border border-gray-500 uppercase">
                      {formatDateNoTime(r.tanggal_verifikasi_bk)}
                      </td>

                      {/* Tgl Verifikasi GB */}
                      <td className="px-2 py-0.5 border border-gray-500">
                      {r.status_produksi === 0
          ? "MENUNGGU"
          : "PRODUKSI SELESAI"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-500">
                      {r.status_bukti_pengeluaran === 0
          ? "MENUNGGU CETAK"
          : "SELESAI"}
                      </td>
                      {/* Dibuat oleh */}
                      <td className="px-2 py-0.5 border border-gray-500">
                        {r.nama_user}
                      </td>

                      {/* Dibuat tanggal */}
                      <td className="px-2 py-0.5 border border-gray-500">
                        {formatDate(r.createat)}
                      </td>

                      {/* Action */}
                      <td className="px-2 py-0.5 border border-gray-500 text-center">
                        <button
                          onClick={() =>
                            detailGabunganPermintaan(
                              r.id_master_bukti_pengeluaran
                            )
                          }
                        >
                          {/* ikon “eye” */}
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-4 text-center text-gray-500 border"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* pagination */}
        <nav className="flex justify-between items-center mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <label>Tampilkan:</label>
            <select
              className="border text-xs border-gray-300 rounded-md p-1"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(+e.target.value);
                setCurrentPage(1);
              }}
            >
              {[25, 50, 100, 250, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            Showing {iFirst + 1}–{Math.min(iLast, sorted.length)} of{" "}
            {sorted.length}
          </div>
          <div className="inline-flex space-x-1">
            <button
              className="border px-2 rounded-l-md disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <button
              className="border px-2 rounded-r-md disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
