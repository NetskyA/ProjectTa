import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getReturDetailNotaPenjualanAll,
  getResultReturDetailNotaPenjualanAll,
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import LogoSave from "../../../../../image/icon/save-item.svg";

import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";

// Komponen FilterSelect Kustom
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      // Pastikan option adalah string
      (options || []).filter((option) => {
        if (typeof option !== "string") {
          return false;
        }
        return option.toLowerCase().includes(inputValue.toLowerCase());
      })
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
          className="absolute top-2 right-2 text-gray-500 text-sm"
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
              className="px-1 py-0.5 hover:bg-gray-200 cursor-pointer text-xs"
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

export default function MenuReturNotaPenjualanBigroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter hanya berdasarkan kode_retur dan no_pemesanan
  const [kodeReturFilter, setKodeReturFilter] = useState("");
  const [noPemesananFilter, setNoPemesananFilter] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user); // Pastikan ini mengambil dari Redux state
  const id_toko = useSelector((state) => state.auth.id_toko); // Tetap diambil dari Redux state
  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter Tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State utk menampung data retur (semua no_pemesanan yang pernah diretur)
  const [resultData, setResultData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ambil data retur penjualan (semua)
        const laporanData = await getReturDetailNotaPenjualanAll(token);
        console.log("Data Penjualan:", laporanData);
        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];
        // Filter dataRows berdasarkan id_toko
        const filteredRows = dataRows.filter(
          (item) => parseInt(item.id_toko, 10) === parseInt(id_toko, 10)
        );
        setData(filteredRows);
        setFilteredData(filteredRows);

        // Ambil data "result retur" (semua)
        const resultReturData = await getResultReturDetailNotaPenjualanAll("ALL", token);
        console.log("Data Retur:", resultReturData);
        const resultRows = resultReturData[0] ? Object.values(resultReturData[0]) : [];
        // Filter resultRows berdasarkan id_toko
        const filteredResultRows = resultRows.filter(
          (item) => parseInt(item.id_toko, 10) === parseInt(id_toko, 10)
        );
        setResultData(filteredResultRows);
      } catch (err) {
        console.error("Error mengambil data:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id_toko]);

  // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

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

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Kumpulkan no_pemesanan yang pernah diretur dalam bentuk Set
  const noPemesananReturSet = useMemo(() => {
    return new Set(resultData.map((item) => item.no_pemesanan));
  }, [resultData]);

  // Nilai unik filter (hanya kode_retur dan no_pemesanan)
  const uniqueKodeRetur = [...new Set(data.map((item) => item.kode_retur))];
  const uniqueNoPemesanan = [...new Set(data.map((item) => item.no_pemesanan))];

  // Handle Filter (hanya berdasarkan kode_retur dan no_pemesanan)
  useEffect(() => {
    let filtered = data;
    if (kodeReturFilter) {
      filtered = filtered.filter((item) =>
        item.kode_retur.toLowerCase().includes(kodeReturFilter.toLowerCase())
      );
    }
    if (noPemesananFilter) {
      filtered = filtered.filter((item) =>
        item.no_pemesanan.toLowerCase().includes(noPemesananFilter.toLowerCase())
      );
    }

    // Filter Tanggal
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(
        (item) => item.createAt && new Date(item.createAt) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (item) => item.createAt && new Date(item.createAt) <= end
      );
    }

    // Filter search jika diperlukan
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_retur &&
            item.kode_retur.toLowerCase().includes(lowercasedFilter)) ||
          (item.no_pemesanan &&
            item.no_pemesanan.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [kodeReturFilter, noPemesananFilter, searchTerm, startDate, endDate, data]);

  // Sorting
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key]
          ? a[sortConfig.key].toString().toLowerCase()
          : "";
        let bKey = b[sortConfig.key]
          ? b[sortConfig.key].toString().toLowerCase()
          : "";
        if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
        if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const detailNotaJual = (idRetur) => {
    console.log("ID Retur yang dipassing:", idRetur);
    navigate(`/dashboard/basetroli/menu/notapenjualan/returpenjualan/proses/${idRetur}`);
  };

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
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/basetroli"
            className="text-xs font-semibold text-blue-900"
          >
            Penjualan
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
            Retur Penjualan
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

      {/* Filter Section (Hanya untuk kode_retur dan no_pemesanan) */}
      <div className="bg-white flex relative flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-3/4">
          <FilterSelect
            label="Filter Kode Retur"
            options={uniqueKodeRetur}
            value={kodeReturFilter}
            onChange={setKodeReturFilter}
          />
          <FilterSelect
            label="Filter No Pemesanan"
            options={uniqueNoPemesanan}
            value={noPemesananFilter}
            onChange={setNoPemesananFilter}
          />
          {/* Filter Tanggal */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
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
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
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
      <div className="bg-white relative rounded-md shadow-md border border-gray-200 p-1.5">
      <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Retur Penjualan
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
            className="w-fit flex absolute right-1 items-center justify-center rounded-md p-0.5 cursor-pointer"
          >
            <button
              onClick={() =>
                navigate(
                  "/dashboard/basetroli/menu/notapenjualan/returpenjualan/add"
                )
              }
              className="toadd w-24 h-8 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
            >
              Tambah Retur
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full" style={{ height: "50vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  No
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_retur")}
                >
                  Kode Retur{" "}
                  {sortConfig.key === "kode_retur" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("total_harga_retur")}
                >
                  Nominal Retur{" "}
                  {sortConfig.key === "total_harga_retur" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("createBy")}
                >
                  DI BUAT OLEH{" "}
                  {sortConfig.key === "createBy" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("detailretur_createAt")}
                >
                  CreateAt{" "}
                  {sortConfig.key === "detailretur_createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  // Cek apakah no_pemesanan item ini ada di set retur
                  const isRetur = noPemesananReturSet.has(item.no_pemesanan);
                  // Tentukan warna baris: jika isRetur maka bg-orange-500, jika status 1 maka bg-lime-500, jika 0 maka bg-yellow-300
                  let bgColor = "";
                  if (isRetur) {
                    bgColor = "bg-orange-500";
                  } else if (item.status === 1) {
                    bgColor = "bg-lime-500";
                  } else if (item.status === 0) {
                    bgColor = "bg-yellow-300";
                  }
                  // Render row
                  return (
                    <tr
                      key={`${item.kode_retur}-${item.no_pemesanan}-${index}`}
                      className={`text-gray-900 ${bgColor} border-b`}
                    >
                      <td className="px-1 py-0.5 border border-gray-500">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {item.kode_retur || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {formatRupiah(item.total_harga_retur) || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {item.create_by || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {formatDate(item.retur_createAt) || "-"}
                      </td>
                      <td className="px-1 py-0.5 w-28 border border-gray-500">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => detailNotaJual(item.id_retur)}
                            className="flex items-center justify-center"
                            title={"Detail " + item.id_retur}
                          >
                            <svg
                              className="w-5 h-5 text-black"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                strokeWidth="2"
                                d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                              />
                              <path
                                stroke="currentColor"
                                strokeWidth="2"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
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
                    colSpan={6}
                    className="py-4 px-1 text-center text-gray-500 border-b"
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
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)}
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
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center text-xs py-0.5 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
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
