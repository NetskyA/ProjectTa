import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMasterHistoryPerubahanPembelian,
  getMasterDetailSalesOrder,
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import LogoExcel from "../../../../../image/icon/excel-document.svg";

// ========== FilterSelect Component ==========
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((option) =>
        option?.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

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
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
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
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => {
                onChange(option);
                setInputValue(option);
                setShowOptions(false);
              }}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MenuLaporanMasterRole() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  // Untuk status, kita gunakan opsi "Semua", "Aktif", "Non-Aktif"
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Search Term
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [kodeSalesOrderFilter, setKodeSalesOrderFilter] = useState("");
  const [kodePesananFilter, setKodePesananFilter] = useState("");
  const [detailSalesData, setDetailSalesData] = useState([]);
  const [dataWithHarga, setDataWithHarga] = useState([]);
  const [selisihFilter, setSelisihFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getMasterHistoryPerubahanPembelian(token);
        // console.log("Data fetched from API:", result);

        const historyArray =
          result && result.length > 0 && typeof result[0] === "object"
            ? Object.values(result[0])
            : [];

        setData(historyArray);
        setFilteredData(historyArray);
      } catch (err) {
        setError(err.message || "Gagal mengambil data kartu stok.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchDetailSalesOrder = async () => {
      try {
        const result = await getMasterDetailSalesOrder(token);
        // console.log("Raw detail SO:", result);

        const rowsObj = result[0] || {};
        const detailArray = Object.entries(rowsObj)
          .filter(([key, val]) => /^\d+$/.test(key)) // hanya key “0”, “1”, dst.
          .map(([_, val]) => val); // ambil valuenya saja

        // console.log("Flattened detailSO:", detailArray);
        setDetailSalesData(detailArray);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDetailSalesOrder();
  }, [token]);

  useEffect(() => {
    const enriched = data
      .map((item) => {
        const match = detailSalesData.find(
          (detail) =>
            Number(detail.id_master_pesanan_pembelian) ===
              Number(item.id_master_pesanan_pembelian) &&
            detail.kode_produk.toString().trim() ===
              item.kode_produk.toString().trim()
        );
        const harga = match ? parseFloat(match.harga_jual || 0) : 0;
        const delta = (item.quantity_terpenuhi || 0) - (item.quantity || 0);

        return {
          ...item,
          harga_jual: harga,
          selisih: delta,
          total_harga: harga * delta,
          total_harga_terpenuhi: harga * (item.quantity_terpenuhi || 0),
        };
      })
      // buang yang selisih-nya 0
      .filter((item) => item.selisih !== 0);

    setDataWithHarga(enriched);
  }, [data, detailSalesData]);

  // Sort Config
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  useEffect(() => {
    let filtered = [...dataWithHarga];

    if (kodeSalesOrderFilter) {
      filtered = filtered.filter(
        (item) => item.kode_sales_order === kodeSalesOrderFilter
      );
    }

    if (kodePesananFilter) {
      filtered = filtered.filter(
        (item) => item.kode_pesanan_pembelian === kodePesananFilter
      );
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        `${item.kode_sales_order} ${item.kode_pesanan_pembelian} ${item.kode_produk} ${item.nama_user}`
          .toLowerCase()
          .includes(lower)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, kodeSalesOrderFilter, kodePesananFilter, data]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
        let bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    let filtered = [...dataWithHarga]; // <-- pake dataWithHarga

    if (kodeSalesOrderFilter) {
      filtered = filtered.filter(
        (item) => item.kode_sales_order === kodeSalesOrderFilter
      );
    }

    if (kodePesananFilter) {
      filtered = filtered.filter(
        (item) => item.kode_pesanan_pembelian === kodePesananFilter
      );
    }

    if (statusFilter !== "Semua") {
      filtered = filtered.filter(
        (item) =>
          (statusFilter === "Aktif" && item.status === 0) ||
          (statusFilter === "Non-Aktif" && item.status === 1)
      );
    }

    if (selisihFilter === "lebih") {
      filtered = filtered.filter((item) => item.selisih > 0);
    } else if (selisihFilter === "kurang") {
      filtered = filtered.filter((item) => item.selisih < 0);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        `${item.kode_sales_order} ${item.kode_pesanan_pembelian} ${item.kode_produk}`
          .toLowerCase()
          .includes(q)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    dataWithHarga, // <-- tambahkan di deps
    searchTerm,
    kodeSalesOrderFilter,
    kodePesananFilter,
    statusFilter,
    selisihFilter,
  ]);

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());
    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}, ${time}`;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  const handleExport = () => {
    if (sortedData.length === 0) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }

    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;
    const filename = `Laporan-Kartu-Stok-${formattedDate}.xlsx`;

    const exportData = sortedData.map((item, index) => {
      const selisih = (item.quantity_terpenuhi || 0) - (item.quantity || 0);
      const tanda = selisih > 0 ? "+" : selisih < 0 ? "-" : "";
      return {
        No: indexOfFirstItem + index + 1,
        Kode_Sales_Order: item.kode_sales_order,
        Kode_Pesanan_Pembelian: item.kode_pesanan_pembelian,
        Kode_Produk: item.kode_produk,
        Quantity: item.quantity,
        Quantity_Terpenuhi: item.quantity_terpenuhi,
        Selisih: `${tanda}${Math.abs(selisih)}`,
        Selisih_Harga: item.total_harga,
        Total_Harga_Terpenuhi: item.total_harga_terpenuhi,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: [
        "No",
        "Kode_Sales_Order",
        "Kode_Pesanan_Pembelian",
        "Kode_Produk",
        "Quantity",
        "Quantity_Terpenuhi",
        "Selisih",
        "Selisih_Harga",
        "Total_Harga_Terpenuhi",
      ],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LaporanKartuStok");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(dataBlob, filename);

    setAlert({
      message: "Export berhasil!",
      type: "success",
      visible: true,
    });
    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 2000);
  };

  const handleEdit = (id_master_pesanan_pembelian) => {
    navigate(
      `/dashboard/master/menu/salesorder/detail/${id_master_pesanan_pembelian}`
    );
  };

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="head flex justify-between items-center mb-0.5">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Laporan Kartu Stok
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ========== Filter Section ========== */}
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Filter Sales Order"
            options={[
              ...new Set(data.map((item) => item.kode_sales_order || "")),
            ]}
            value={kodeSalesOrderFilter}
            onChange={setKodeSalesOrderFilter}
          />

          <FilterSelect
            label="Filter Pesanan Pembelian"
            options={[
              ...new Set(data.map((item) => item.kode_pesanan_pembelian || "")),
            ]}
            value={kodePesananFilter}
            onChange={setKodePesananFilter}
          />

          <FilterSelect
            label="Filter Selisih"
            options={["Semua", "Lebih", "Kurang"]}
            value={selisihFilter}
            onChange={(val) => setSelisihFilter(val.toLowerCase())}
          />
        </div>
      </div>

      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Kartu Stok
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
          {/* Button Export */}
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExport}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200 w-full">
              <tr>
                <th className="px-1 py-0.5 w-8 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10">
                  No
                </th>
                <th
                  onClick={() => handleSort("kode_sales_order")}
                  className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Kode Sales Order{" "}
                  {sortConfig.key === "kode_sales_order" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("kode_pesanan_pembelian")}
                  className="px-1 py-0.5 w-40 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Kode Pesanan Pembelian{" "}
                  {sortConfig.key === "kode_pesanan_pembelian" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("kode_produk")}
                  className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Kode Produk{" "}
                  {sortConfig.key === "kode_produk" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("quantity")}
                  className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Jumlah Pembelian{" "}
                  {sortConfig.key === "quantity" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("quantity_terpenuhi")}
                  className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Jumlah Terpenuhi{" "}
                  {sortConfig.key === "quantity_terpenuhi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-28 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10">
                  Selisih
                </th>
                <th className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10">
                  Selisih Harga
                </th>
                <th className="px-1 py-0.5 w-40 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10">
                  Total Harga Terpenuhi
                </th>

                <th
                  onClick={() => handleSort("nama_user")}
                  className="px-1 py-0.5 w-28 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Dibuat Oleh{" "}
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("createat")}
                  className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Tanggal Buat{" "}
                  {sortConfig.key === "createat" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-1 py-0.5 w-20 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer"
                >
                  Status{" "}
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 w-14 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  const rowBg =
                    item.selisih < 0
                      ? "bg-amber-500"
                      : item.selisih > 0
                      ? "bg-lime-500"
                      : "bg-white";

                  return (
                    <tr
                      key={index}
                      className={`text-gray-900 cursor-pointer hover:bg-opacity-75 ${rowBg}`}
                      onDoubleClick={() =>
                        handleEdit(item.id_master_pesanan_pembelian)
                      }
                    >
                      <td className="px-1 py-0.5 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.kode_sales_order}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.kode_pesanan_pembelian}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.kode_produk}
                      </td>
                      <td className="px-1 py-0.5 text-right border border-gray-700">
                        {item.quantity + " Pcs"}
                      </td>
                      <td className="px-1 py-0.5 border text-right border-gray-700">
                        {item.quantity_terpenuhi + " Pcs"}
                      </td>
                      <td className="px-1 py-0.5 border text-right border-gray-700">
                        {(() => {
                          const selisih =
                            item.quantity_terpenuhi - item.quantity;
                          const tanda =
                            selisih > 0 ? "+" : selisih < 0 ? "-" : "";
                          return `${tanda}${Math.abs(selisih)} Pcs`;
                        })()}
                      </td>
                      <td className="px-1 py-0.5 border text-right border-gray-700">
                        {formatRupiah(item.total_harga)}
                      </td>
                      <td className="px-1 py-0.5 border text-right border-gray-700">
                        {formatRupiah(item.total_harga_terpenuhi)}
                      </td>

                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_user}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {formatDate(item.createat)}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.status === 1
                          ? "Perubahan"
                          : item.status === 0
                          ? "Non-Aktif"
                          : ""}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() =>
                              handleEdit(item.id_master_pesanan_pembelian)
                            }
                            title="Detail"
                          >
                            <svg
                              className="w-5 h-5 text-green-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8zM9 13H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a3 3 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9 13zM18 8a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18 8z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-1 py-0.5 text-center">
                    Tidak ada data tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, sortedData.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {sortedData.length}
            </span>
          </span>
          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center py-0.5 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span>Previous</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center text-xs py-0.5 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <span>Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
