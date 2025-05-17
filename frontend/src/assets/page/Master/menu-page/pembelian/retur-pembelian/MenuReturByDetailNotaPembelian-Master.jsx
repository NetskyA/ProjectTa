// File: MenuDetailReturNotaPembelianBasetroli.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getHeaderNotaReturPembelianBarang,
  getDetailNotaReturPembelianBarang,
} from "../../../../../services/apiService.js";
import { useSelector } from "react-redux";

// Komponen Alert, Loading, Error sesuai kebutuhan project
import Alert from "../../../../component/Alert.jsx";
import Loading from "../../../../component/Loading.jsx";
import Error from "../../../../component/Error.jsx";

// Komponen FilterSelect untuk filter string
function FilterSelect({ label, options, value, onChange }) {
  // ... (kode komponen FilterSelect tidak berubah)
}

export default function MenuDetailReturNotaPembelianBasetroli() {
  // 1) Tangkap param :id_retur_pembelian dari URL
  const { id_retur_pembelian } = useParams();
  console.log("id_retur_pembelian (from param):", id_retur_pembelian);

  // 2) Redux state (hapus id_toko karena tidak digunakan lagi)
  const token = useSelector((state) => state.auth.token);
  // const id_toko = parseInt(useSelector((state) => state.auth.id_toko), 10);

  // 3) Router Tools
  const navigate = useNavigate();

  // 4) State data
  const [headerData, setHeaderData] = useState(null); // data header retur
  const [detailData, setDetailData] = useState([]); // data detail retur
  const [filteredDetail, setFilteredDetail] = useState([]); // detail setelah di-filter

  // 5) Loading / Error / Alert
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // 6) STATE FILTER
  const [filterKodePembelian, setFilterKodePembelian] = useState("");
  const [filterNamaToko, setFilterNamaToko] = useState("");
  const [filterNamaBarang, setFilterNamaBarang] = useState("");

  // 7) Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Fungsi format Rupiah & Tanggal
  const formatRupiah = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const padZero = (n) => String(n).padStart(2, "0");
    return `${padZero(date.getDate())}/${padZero(date.getMonth() + 1)}/${date.getFullYear()}, ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
  };

  // -------------------------------
  // 1. FETCH HEADER RETUR
  // -------------------------------
  useEffect(() => {
    const fetchHeaderRetur = async () => {
      try {
        setLoading(true);
        setError(null);

        // Panggil API khusus header retur pembelian
        const responseHeader = await getHeaderNotaReturPembelianBarang(token);
        console.log("Header Data (raw):", responseHeader);

        // Pastikan response berupa array
        const headerArray = Array.isArray(responseHeader)
          ? responseHeader
          : Object.values(responseHeader);

        // Filter hanya berdasarkan id_retur_pembelian
        const selectedHeader = headerArray.find(
          (item) => item.id_retur_pembelian?.toString() === id_retur_pembelian
        );

        setHeaderData(selectedHeader || null);
      } catch (err) {
        console.error("Error fetchHeaderRetur:", err);
        setError("Gagal mengambil data header retur.");
      } finally {
        setLoading(false);
      }
    };

    fetchHeaderRetur();
  }, [id_retur_pembelian, token]);

  // -------------------------------
  // 2. FETCH DETAIL RETUR
  // -------------------------------
  useEffect(() => {
    const fetchDetailRetur = async () => {
      try {
        setLoading(true);
        setError(null);

        // Panggil API khusus detail retur pembelian
        const responseDetail = await getDetailNotaReturPembelianBarang(token);
        console.log("Detail Data (raw):", responseDetail);

        // Pastikan response berupa array
        const detailArray = Array.isArray(responseDetail)
          ? responseDetail
          : Object.values(responseDetail);

        // Filter hanya berdasarkan id_retur_pembelian
        const filtered = detailArray.filter(
          (item) => item.id_retur_pembelian?.toString() === id_retur_pembelian
        );
        setDetailData(filtered);
        setFilteredDetail(filtered);
      } catch (err) {
        console.error("Error fetchDetailRetur:", err);
        setError("Gagal mengambil data detail retur.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetailRetur();
  }, [id_retur_pembelian, token]);

  // -------------------------------
  // 3. FILTER DATA DETAIL
  // -------------------------------
  useEffect(() => {
    let temp = [...detailData];

    if (filterKodePembelian) {
      temp = temp.filter((item) =>
        item.kode_pembelian?.toLowerCase().includes(filterKodePembelian.toLowerCase())
      );
    }

    if (filterNamaToko) {
      temp = temp.filter((item) =>
        item.nama_toko?.toLowerCase().includes(filterNamaToko.toLowerCase())
      );
    }

    if (filterNamaBarang) {
      temp = temp.filter((item) =>
        item.namabarang?.toLowerCase().includes(filterNamaBarang.toLowerCase())
      );
    }

    setFilteredDetail(temp);
    setCurrentPage(1);
  }, [filterKodePembelian, filterNamaToko, filterNamaBarang, detailData]);

  // -------------------------------
  // 4. SORTING DATA DETAIL
  // -------------------------------
  const sortedDetail = useMemo(() => {
    let sortable = [...filteredDetail];
    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      sortable.sort((a, b) => {
        const aVal = a[key]?.toString().toLowerCase() || "";
        const bVal = b[key]?.toString().toLowerCase() || "";
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredDetail, sortConfig]);

  // -------------------------------
  // 5. PAGINATION
  // -------------------------------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDetail.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDetail.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // -------------------------------
  // 6. REFRESH
  // -------------------------------
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  // -------------------------------
  // 7. BUAT OPSI UNIK UNTUK FILTERSELECT
  // -------------------------------
  const uniqueKodePembelian = [
    ...new Set(detailData.map((item) => item.kode_pembelian)),
  ].filter(Boolean);
  const uniqueNamaToko = [
    ...new Set(detailData.map((item) => item.nama_toko)),
  ].filter(Boolean);
  const uniqueNamaBarang = [
    ...new Set(detailData.map((item) => item.namabarang)),
  ].filter(Boolean);

  // --------------------------------
  // RENDER UTAMA
  // --------------------------------
  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
            Pembelian
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500 mx-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link to="/dashboard/master/menu/notaretur/pembelian" className="text-xs font-semibold text-blue-900">
            Retur Pembelian
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500 mx-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Detail Retur Pembelian
          </span>
        </div>
        <div className="flex items-center">
          <button onClick={handleRefresh} className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
            Refresh
          </button>
        </div>
      </div>
      <div className="bg-white rounded-md shadow-md p-2 mb-2 border border-gray-200">
        <h1 className="text-lg font-bold text-blue-900">
          Header Retur Pembelian
        </h1>
        {headerData ? (
          <div className="flex gap-5 mt-2">
            <div className="bg-gray-100 p-2 rounded shadow-md text-xs">
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">Kode Retur:</div>
                <span className="text-gray-900">
                  {headerData.kode_retur_pembelian || "-"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">Total Retur:</div>
                <span className="text-gray-900">
                  {headerData.subtotal_harga_beli
                    ? formatRupiah(headerData.subtotal_harga_beli)
                    : "-"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">DI BUAT OLEH:</div>
                <span className="text-gray-900">
                  {headerData.nama_user || "-"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">DI BUAT TANGGAL:</div>
                <span className="text-gray-900">
                  {headerData.createAt ? formatDate(headerData.createAt) : "-"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-red-500 text-xs mt-2">
            Data Header Retur tidak ditemukan atau tidak sesuai.
          </p>
        )}
      </div>
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 mb-2 border border-gray-200 gap-4">
        <FilterSelect
          label="Filter Kode Pembelian"
          options={uniqueKodePembelian}
          value={filterKodePembelian}
          onChange={setFilterKodePembelian}
        />
        <FilterSelect
          label="Filter Nama Toko"
          options={uniqueNamaToko}
          value={filterNamaToko}
          onChange={setFilterNamaToko}
        />
        <FilterSelect
          label="Filter Nama Barang"
          options={uniqueNamaBarang}
          value={filterNamaBarang}
          onChange={setFilterNamaBarang}
        />
      </div>
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        <div className="overflow-x-auto" style={{ maxHeight: "40vh", overflowY: "auto" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200 sticky top-0">
              <tr>
                <th className="px-1 py-0.5 w-5 text-center border border-gray-500">No</th>
                <th className="px-1 py-0.5 w-28 border border-gray-500 cursor-pointer" onClick={() => handleSort("kode_retur_pembelian")}>
                  Kode Retur
                  {sortConfig.key === "kode_retur_pembelian" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-28 border border-gray-500 cursor-pointer" onClick={() => handleSort("kode_pembelian")}>
                  Kode Pembelian
                  {sortConfig.key === "kode_pembelian" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-20 border border-gray-500 cursor-pointer" onClick={() => handleSort("nama_toko")}>
                  Nama Toko
                  {sortConfig.key === "nama_toko" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-28 border border-gray-500 cursor-pointer" onClick={() => handleSort("nama_depo")}>
                  Gudang
                  {sortConfig.key === "nama_depo" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-52 border border-gray-500 cursor-pointer" onClick={() => handleSort("namabarang")}>
                  Nama Barang
                  {sortConfig.key === "namabarang" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-20 border border-gray-500 cursor-pointer" onClick={() => handleSort("qtyBeli")}>
                  Qty Order
                  {sortConfig.key === "qtyBeli" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-20 border border-gray-500 cursor-pointer" onClick={() => handleSort("qtyReturBeli")}>
                  Qty Retur
                  {sortConfig.key === "qtyReturBeli" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-28 border border-gray-500 cursor-pointer" onClick={() => handleSort("harga_beli")}>
                  Harga Beli
                  {sortConfig.key === "harga_beli" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-28 border border-gray-500 cursor-pointer" onClick={() => handleSort("nama_user")}>
                  DI BUAT OLEH
                  {sortConfig.key === "nama_user" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-32 border border-gray-500 cursor-pointer" onClick={() => handleSort("createAt")}>
                  DI BUAT TANGGAL
                  {sortConfig.key === "createAt" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={index} className="text-gray-900">
                    <td className="px-1 py-0.5 border border-gray-500">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.kode_retur_pembelian ?? headerData?.kode_retur_pembelian ?? "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.kode_pembelian || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.nama_toko || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.nama_depo || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.namabarang || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.qtyBeli !== undefined ? item.qtyBeli : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.qtyReturBeli !== undefined ? item.qtyReturBeli : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.harga_beli !== undefined ? formatRupiah(item.harga_beli) : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.nama_user || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.createAt ? formatDate(item.createAt) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-2 text-center text-gray-500">
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <nav className="flex flex-col md:flex-row justify-between items-center mt-4" aria-label="Table navigation">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedDetail.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {sortedDetail.length}
              </span>
            </span>
          </div>
          <ul className="inline-flex items-center">
            <li>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-xs border border-gray-300 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                }`}
              >
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-xs border border-gray-300 ml-1 ${
                  currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
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
