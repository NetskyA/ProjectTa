// MenupembelianbarangBasetroli.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMasterPesananPembelian } from "../../../../../services/apiService";
import { useSelector } from "react-redux";

import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";

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
          {filteredOptions.map((opt, i) => (
            <li
              key={i}
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

export default function MenupembelianbarangBasetroli() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth.token);
  const id_toko = parseInt(useSelector((s) => s.auth.id_toko), 10);

  // filters
  const [kodePesanan, setKodePesanan] = useState("");
  const [kodeSalesOrder, setKodeSalesOrder] = useState("");
  const [namaKitchen, setNamaKitchen] = useState("");
  const [namaStore, setNamaStore] = useState("");
  const [tanggalTransaksiFilter, setTanggalTransaksiFilter] = useState("");
  const [tanggalKirimFilter, setTanggalKirimFilter] = useState("");

  // search / sort / pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const truncate = (str, max = 50) =>
    str && str.length > max ? str.substring(0, max) + "…" : str;
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
        const res = await getMasterPesananPembelian(token);
        let rows = [];
        if (Array.isArray(res) && res.length > 0) {
          const first = res[0];
          if (typeof first === "object" && first !== null && !Array.isArray(first)) {
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
  }, [token, id_toko]);
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  // format date
  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";

    const date = new Date(dateString);

    // Format angka agar selalu dua digit
    const padZero = (num) => String(num).padStart(2, "0");

    // Ambil komponen waktu (gunakan getHours() dsb. menyesuaikan kebutuhan)
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());

    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${day}/${month}/${year}, ${time}`;
  };


  // apply filters & search
  useEffect(() => {
    let f = data;
    if (kodePesanan) f = f.filter((r) => r.kode_pesanan_pembelian === kodePesanan);
    if (kodeSalesOrder) f = f.filter((r) => r.kode_sales_order === kodeSalesOrder);
    if (namaKitchen) f = f.filter((r) => r.nama_kitchen === namaKitchen);
    if (namaStore) f = f.filter((r) => r.nama_store === namaStore);
    if (tanggalTransaksiFilter) f = f.filter((r) => r.tanggal_transaksi === tanggalTransaksiFilter);
    if (tanggalKirimFilter) f = f.filter((r) => r.tanggal_kirim === tanggalKirimFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(
        (r) =>
          (r.kode_pesanan_pembelian || "").toLowerCase().includes(q) ||
          (r.kode_sales_order || "").toLowerCase().includes(q) ||
          (r.nama_kitchen || "").toLowerCase().includes(q) ||
          (r.nama_store || "").toLowerCase().includes(q)
      );
    }
    setFiltered(f);
    setCurrentPage(1);
  }, [
    data,
    kodePesanan,
    kodeSalesOrder,
    namaKitchen,
    namaStore,
    tanggalTransaksiFilter,
    tanggalKirimFilter,
    searchTerm,
  ]);

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

  const uniqueKodePesanan = [...new Set(data.map((r) => r.kode_pesanan_pembelian))];
  const uniqueSalesOrder = [...new Set(data.map((r) => r.kode_sales_order))];
  const uniqueKitchenNames = [...new Set(data.map((r) => r.nama_kitchen))];
  const uniqueStoreNames = [...new Set(data.map((r) => r.nama_store))];

  // const detailpembelianbarang = (id) =>
  //   // console.log("Navigating to detail with ID:", id);
  //   navigate(`/dashboard/master/menu/pembelianbarang/detail/${id}`);

    const detailpembelianbarang = (id) => {
      // console.log("Navigating to detail with ID:", id);
       navigate(`/dashboard/master/menu/pembelianbarang/detail/${id}`
      );
    }

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert message={alert.message} type={alert.type} onClose={() => setAlert((p) => ({ ...p, visible: false }))} />
      )}

      {/* header */}
      <div className="head flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">Pembelian</Link>
          <svg className="mx-1 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-xs font-semibold text-gray-400">Analisa & Pemesanan</span>
        </div>
        <button onClick={() => window.location.reload()} className="w-14 h-6 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition">
          Refresh
        </button>
      </div>

      {/* filters */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-1">
        <div className="flex text-xs flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect label="No. Pemesanan" options={uniqueKodePesanan} value={kodePesanan} onChange={setKodePesanan} />
          <FilterSelect label="No. SO" options={uniqueSalesOrder} value={kodeSalesOrder} onChange={setKodeSalesOrder} />
          <FilterSelect label="Kitchen" options={uniqueKitchenNames} value={namaKitchen} onChange={setNamaKitchen} />
          <FilterSelect label="Store" options={uniqueStoreNames} value={namaStore} onChange={setNamaStore} />
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-blue-900 font-semibold">Tanggal Transaksi</label>
            <input type="date" className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs" value={tanggalTransaksiFilter} onChange={(e) => setTanggalTransaksiFilter(e.target.value)} />
          </div>
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-blue-900 font-semibold">Tanggal Kirim</label>
            <input type="date" className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs" value={tanggalKirimFilter} onChange={(e) => setTanggalKirimFilter(e.target.value)} />
          </div>
        </div>
      </div>

      {/* search + add */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 mb-2">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
          Analisa & Pemesanan
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
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
          >
          <Link to="/dashboard/master/menu/pembelianbarang/add">
            <button className="h-8 px-2 text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 rounded-md">
              Tambah
            </button>
          </Link>
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto" style={{ height: "65vh" }}>
          <table className="min-w-max whitespace-nowrap text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th scope="col" className="px-2 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("no")}>
                  No{sortConfig.key === "no" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("kode_pesanan_pembelian")}>
                  No. Pemesanan{sortConfig.key === "kode_pesanan_pembelian" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("kode_sales_order")}>
                  No. Sales Order{sortConfig.key === "kode_sales_order" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("nama_store")}>
                  Store{sortConfig.key === "nama_store" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("nama_kitchen")}>
                  Kitchen{sortConfig.key === "nama_kitchen" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("nama_pesanan")}>
                  Jenis Pembelian{sortConfig.key === "nama_pesanan" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Pelanggan</th>
                <th scope="col" className="px-2 py-0.5 max-w-lg sticky top-0 border border-gray-500 bg-gray-200 z-10">Catatan</th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Subtotal</th>
                <th scope="col" className="px-2 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("tanggal_transaksi")}>
                  Tgl Transaksi{sortConfig.key === "tanggal_transaksi" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10" onClick={() => handleSort("tanggal_kirim")}>
                  Tgl Kirim{sortConfig.key === "tanggal_kirim" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Tgl Verifikasi AP</th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Status Batal</th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Status Pesanan</th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Status Sales Order</th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">DI BUAT OLEH</th>
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">DI BUAT TANGGAL</th>
                
                <th scope="col" className="px-2 py-0.5 w-32 sticky top-0 border border-gray-500 bg-gray-200 z-10">Action</th>
              </tr>
            </thead>
            <tbody>
  {pageRows.length > 0 ? (
    pageRows.map((r, i) => {
      const idx = iFirst + i + 1;
      // menentukan warna background berdasarkan status
      const rowBgClass =
        r.status_batal === 1
          ? "bg-red-500"
          : r.status_pesanan === 1
          ? (r.status_sales_order === 1 ? "bg-lime-500" : "bg-yellow-300")
          : "";

      return (
        <tr
          key={r.id_master_pesanan_pembelian}
          onDoubleClick={() =>
            detailpembelianbarang(r.id_master_pesanan_pembelian)
          }
          className={`border-b text-gray-900 cursor-pointer hover:opacity-80 hover:text-black ${rowBgClass}`}
        >
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {idx}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.kode_pesanan_pembelian}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.kode_sales_order}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.nama_store}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.nama_kitchen}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.nama_pesanan}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.nama_pelanggan_external || "-"}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
          {truncate(r.catatan, 40)}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 text-right">
            {formatRupiah(r.subtotal)}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.tanggal_transaksi}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.tanggal_kirim}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.tanggal_verifikasi_ap || "-"}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.status_batal_text}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.status_pesanan_text}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {r.status_sales_order_text}
          </td>
          <td className="px-2 py-0.5 border border-gray-500">
            {r.nama_user}
          </td>
          <td className="px-2 py-0.5 border border-gray-500 uppercase">
            {formatDate(r.createat)}
          </td>
                    
          <td className="px-2 py-0.5 border border-gray-500 uppercase text-center">
            <button onClick={() => detailpembelianbarang(r.id_master_pesanan_pembelian)}>
              <svg
                className="w-5 h-5 text-black"
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
        colSpan={18}
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
          <select className="border text-xs border-gray-300 rounded-md p-1" value={itemsPerPage} onChange={(e) => { setItemsPerPage(+e.target.value); setCurrentPage(1); }}>
            {[25, 50, 100, 250, 500].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>Showing {iFirst + 1}–{Math.min(iLast, sorted.length)} of {sorted.length}</div>
        <div className="inline-flex space-x-1">
          <button className="border px-2 rounded-l-md disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
          <button className="border px-2 rounded-r-md disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </nav>
      </div>

    </div>
  );
}
