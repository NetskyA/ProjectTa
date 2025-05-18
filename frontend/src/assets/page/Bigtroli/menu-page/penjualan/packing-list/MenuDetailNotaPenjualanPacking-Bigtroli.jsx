import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getNotaPenjualanDetailAll,
  insertPackingList,
  updateStokBarangBatch,
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import LogoPDF from "../../../../../image/icon/pdf2-svgrepo.svg";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

// ============= Komponen FilterSelect =============
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (option) => {
    onChange(option);
    setInputValue(option);
    setShowOptions(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowOptions(true);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
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
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
        placeholder="Pilih atau ketik..."
      />
      {inputValue && (
        <button
          onClick={handleClear}
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
              onClick={() => handleSelect(option)}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
            >
              {option}
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

export default function MenuNotaDetailPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // ========== State Filter ==========
  const [searchTerm, setSearchTerm] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [kodePackinglist, setKodePackinglist] = useState("");
  const [kodePemesanan, setKodePemesanan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ========== States untuk pagination, dsb. ==========
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [expandedRows, setExpandedRows] = useState([]);

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user); 
  const id_toko = useSelector((state) => state.auth.id_toko);
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getNotaPenjualanDetailAll(token);
        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];
        // Filter data sesuai dengan id_toko (ubah id_toko dari string ke int)
        const tokoIdInt = parseInt(id_toko, 10);
        const filteredRows = dataRows.filter(
          (item) => parseInt(item.id_toko, 10) === tokoIdInt
        );
        console.log("laporanData (filtered):", filteredRows);

        setData(filteredRows);
        setFilteredData(filteredRows);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id_toko]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // =========== Memetakan data unik untuk FilterSelect ===========
  const uniqueMarketplace = useMemo(() => {
    const arr = data.map((item) => item.nama_marketplace).filter(Boolean);
    return Array.from(new Set(arr)); // unique
  }, [data]);

  const uniqueKodePackinglist = useMemo(() => {
    const arr = data.map((item) => item.kode_packinglist).filter(Boolean);
    return Array.from(new Set(arr));
  }, [data]);

  const uniqueKodePemesanan = useMemo(() => {
    const arr = data.map((item) => item.kode_pemesanan).filter(Boolean);
    return Array.from(new Set(arr));
  }, [data]);

  // =========== Filter Berdasarkan searchTerm, marketplace, dll. ===========
  useEffect(() => {
    let tempFiltered = data;

    // Filter berdasarkan searchTerm
    if (searchTerm.trim() !== "") {
      const lowercasedFilter = searchTerm.toLowerCase();
      tempFiltered = tempFiltered.filter((item) => {
        return (
          (item.kode_barang &&
            item.kode_barang.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_marketplace &&
            item.nama_marketplace.toLowerCase().includes(lowercasedFilter)) ||
          (item.kode_pemesanan &&
            item.kode_pemesanan.toLowerCase().includes(lowercasedFilter)) ||
          (item.namabarang &&
            item.namabarang.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    // Filter Marketplace
    if (marketplace) {
      tempFiltered = tempFiltered.filter(
        (item) => item.nama_marketplace === marketplace
      );
    }

    // Filter Kode Packinglist
    if (kodePackinglist) {
      tempFiltered = tempFiltered.filter(
        (item) => item.kode_packinglist === kodePackinglist
      );
    }

    // Filter Kode Pemesanan
    if (kodePemesanan) {
      tempFiltered = tempFiltered.filter(
        (item) => item.kode_pemesanan === kodePemesanan
      );
    }

    // Filter Tanggal berdasarkan createAt
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      tempFiltered = tempFiltered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate >= start && itemDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);

      tempFiltered = tempFiltered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);

      tempFiltered = tempFiltered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate <= end;
      });
    }

    setFilteredData(tempFiltered);
    setCurrentPage(1);
  }, [
    data,
    searchTerm,
    marketplace,
    kodePackinglist,
    kodePemesanan,
    startDate,
    endDate,
  ]);

  // Kelompokkan data berdasarkan kode_packinglist
  const groupedData = useMemo(() => {
    const group = {};
    filteredData.forEach((item) => {
      const key = item.kode_packinglist || "Menunggu dicetak";
      if (!group[key]) {
        group[key] = [];
      }
      group[key].push(item);
    });
    return Object.keys(group).map((kode_packinglist, index) => ({
      kode_packinglist,
      createAt: group[kode_packinglist][0].createAt, 
      details: group[kode_packinglist],
      groupIndex: index,
    }));
  }, [filteredData]);

  // Sorting
  const sortedData = useMemo(() => {
    let sortableData = [...groupedData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : "";
        let bKey = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : "";

        if (aKey < bKey) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [groupedData, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";

    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    // Gunakan getHours, getMinutes, getSeconds (bukan UTC) jika ingin waktu lokal
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());
    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${day}/${month}/${year}, ${time}`;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleRowDoubleClick = (kode_packinglist) => {
    if (expandedRows.includes(kode_packinglist)) {
      setExpandedRows(expandedRows.filter((kode) => kode !== kode_packinglist));
    } else {
      setExpandedRows([...expandedRows, kode_packinglist]);
    }
  };

  const displayValue = (value, fallback = "belum dicetak") => {
    return value ? value : fallback;
  };

  return (
    <div className="py-14 font-sans">
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/bigtorlly"
            className="text-xs font-semibold text-blue-900"
          >
            Penjualan
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
            Packing List
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          {/* Filter Marketplace */}
          <FilterSelect
            label="Filter Marketplace"
            options={uniqueMarketplace}
            value={marketplace}
            onChange={setMarketplace}
          />

          {/* Filter Kode Packinglist */}
          <FilterSelect
            label="Filter Kode Packinglist"
            options={uniqueKodePackinglist}
            value={kodePackinglist}
            onChange={setKodePackinglist}
          />

          {/* Filter Kode Pemesanan */}
          <FilterSelect
            label="Filter Kode Pemesanan"
            options={uniqueKodePemesanan}
            value={kodePemesanan}
            onChange={setKodePemesanan}
          />

          {/* Filter Tanggal */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-8 px-1 rounded-md text-xs"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate("");
                  }
                }}
                max={endDate || ""}
                placeholder="Start Date"
              />
              <input
                type="date"
                className="border border-gray-300 w-44 h-8 px-1 rounded-md text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || ""}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 space-y-4 md:space-y-0">
          {/* Search */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-3/4 pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ height: "57vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-1 w-5 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-4 py-1 w-72 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_packinglist")}
                >
                  Kode Packinglist/DO
                  {sortConfig.key === "kode_packinglist" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-1 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  DI BUAT TANGGAL
                  {sortConfig.key === "createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((group, index) => {
                  const totalHarga = group.details.reduce(
                    (acc, item) => acc + (parseFloat(item.total_harga) || 0),
                    0
                  );
                  return (
                    <React.Fragment
                      key={`${group.kode_packinglist}-${group.createAt}-${index}`}
                    >
                      {/* Baris Utama */}
                      <tr
                        className={`cursor-pointer text-gray-800 ${
                          group.details[0].status === 1
                            ? "bg-lime-500"
                            : group.details[0].status === 0
                            ? "bg-yellow-300"
                            : ""
                        }`}
                        onDoubleClick={() =>
                          handleRowDoubleClick(group.kode_packinglist)
                        }
                      >
                        <td className="px-4 py-1 border border-gray-500">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-4 py-1 border border-gray-500">
                          {displayValue(group.kode_packinglist, "belum dicetak")}
                        </td>
                        <td className="px-4 py-1 border border-gray-500">
                          {formatDate(group.createAt) || "Data tidak ditemukan"}
                        </td>
                      </tr>
                      {/* Baris Detail */}
                      {expandedRows.includes(group.kode_packinglist) && (
                        <tr>
                          <td
                            colSpan={5}
                            className="pl-4 pb-2 border border-gray-500 bg-gray-50"
                          >
                            <div className="overflow-y-auto max-h-96">
                              <table className="w-full text-xs text-left text-gray-900">
                                <thead className="text-xs text-blue-900 uppercase bg-gray-200">
                                  <tr>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Kode Pemesanan
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Marketplace
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Kode Barang
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Nama Barang
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Quantity (pcs)
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Harga Barang
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Total Harga
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      DI BUAT OLEH
                                    </th>
                                    <th className="px-2 py-1 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      DI BUAT TANGGAL
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.details.map((item, idx) => (
                                    <tr
                                      key={`${item.id_header_pemesanan}-${item.kode_barang}-${idx}`}
                                      className={`text-gray-900 ${
                                        item.status === 1
                                          ? "bg-lime-500"
                                          : item.status === 0
                                          ? "bg-yellow-300"
                                          : ""
                                      }`}
                                    >
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.kode_pemesanan ||
                                          "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.nama_marketplace ||
                                          "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.kode_barang ||
                                          "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.namabarang || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.quantity || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.harga_barang ||
                                          "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.total_harga ||
                                          "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {item.nama_user || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-1 border border-gray-500">
                                        {formatDate(item.createAt) ||
                                          "Data tidak ditemukan"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex justify-end pr-4 pt-2">
                              <div className="space-y-0">
                                <div className="flex justify-end">
                                  <span className="text-sm font-semibold">
                                    Total Harga: Rp{" "}
                                    {totalHarga.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-1 text-center text-gray-500"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
                className={`flex items-center justify-center py-1 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-1 px-2 text-gray-500 bg-white rounded-r-md border border-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
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
