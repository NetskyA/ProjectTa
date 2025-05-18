import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getHeaderNotaReturPembelianBarang } from "../../../../../services/apiService";
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
      (options || []).filter((option) => {
        if (typeof option !== "string") return false;
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

export default function MenuReturNotaPembelianBasetroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Filter berdasarkan kode_retur_pembelian
  const [kodeReturFilter, setKodeReturFilter] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ambil data header nota retur pembelian barang
        const responseData = await getHeaderNotaReturPembelianBarang(token);
        console.log("Data Header Nota Retur Pembelian Barang:", responseData);
        // Perbaikan: konversi data menjadi array of objects
        const dataRows = responseData ? Object.values(responseData) : [];
        // Filter dataRows berdasarkan id_toko dan createBy (harus sama dengan id_user)
        const filteredRows = dataRows.filter(
          (item) =>
            parseInt(item.id_toko, 10) === parseInt(id_toko, 10) &&
            item.createBy === id_user
        );
        setData(filteredRows);
        setFilteredData(filteredRows);
      } catch (err) {
        console.error("Error mengambil data:", err);
        setError(err.message || "Gagal mengambil data header nota retur pembelian.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id_toko, id_user]);

  // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Fungsi untuk memformat tanggal
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

  // Nilai unik filter berdasarkan kode_retur_pembelian
  const uniqueKodeRetur = [...new Set(data.map((item) => item.kode_retur_pembelian))];

  // Handle Filter berdasarkan kode_retur_pembelian, searchTerm, dan tanggal
  useEffect(() => {
    let filtered = data;
    if (kodeReturFilter) {
      filtered = filtered.filter((item) =>
        item.kode_retur_pembelian
          .toLowerCase()
          .includes(kodeReturFilter.toLowerCase())
      );
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_retur_pembelian &&
            item.kode_retur_pembelian.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_user &&
            item.nama_user.toLowerCase().includes(lowercasedFilter))
        );
      });
    }
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
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [kodeReturFilter, searchTerm, data, startDate, endDate]);

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

  // Fungsi untuk menuju ke detail dengan mempassing id_retur_pembelian
  const detailNotaJual = (id_retur_pembelian) => {
    console.log("ID Retur Pembelian yang dipassing:", id_retur_pembelian);
    navigate(`/dashboard/basetroli/menu/notaretur/pembelian/proses/${id_retur_pembelian}`);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert((prev) => ({ ...prev, visible: false }))
          }
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/basetroli"
            className="text-xs font-semibold text-blue-900"
          >
            Pembelian
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
            Retur Pembelian
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

      {/* Filter Section (Hanya untuk kode_retur_pembelian & tanggal) */}
      <div className="bg-white flex relative flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-3/4">
          <FilterSelect
            label="Filter Kode Retur Pembelian"
            options={uniqueKodeRetur}
            value={kodeReturFilter}
            onChange={setKodeReturFilter}
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
        <div className="flex justify-end">
          <input
            type="text"
            id="simple-search"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block w-72 pl-10 p-2"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-center mb-2 relative">
        <p className="text-xl font-semibold text-blue-900 absolute left-1">
          Retur Pembelian
        </p>
        {/* Search Bar */}
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

        {/* Export / Tambah Button */}
        <div
          className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
        >
          <button
            onClick={() =>
              navigate("/dashboard/basetroli/menu/notaretur/pembelian/add")
            }
            className="toadd w-16 h-8 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white relative rounded-md shadow-md border border-gray-200 p-1.5">
        <div className="overflow-x-auto" style={{ height: "50vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200">
              <tr>
                <th className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10">
                  No
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_retur_pembelian")}
                >
                  Kode Retur Pembelian
                  {sortConfig.key === "kode_retur_pembelian" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("subtotal_harga_beli")}
                >
                  Nominal Retur
                  {sortConfig.key === "subtotal_harga_beli" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  Nama User
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  CreateAt
                  {sortConfig.key === "createAt" &&
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
                currentItems.map((item, index) => (
                  <tr
                    key={`${item.kode_retur_pembelian}-${index}`}
                    className="text-gray-900"
                  >
                    <td className="px-1 py-0.5 border border-gray-500">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-0.5 w-32 border border-gray-500">
                      {item.kode_retur_pembelian || "-"}
                    </td>
                    <td className="px-1 py-0.5 w-32 border border-gray-500">
                      {formatRupiah(item.subtotal_harga_beli) || "-"}
                    </td>
                    <td className="px-1 py-0.5 w-32 border border-gray-500">
                      {item.nama_user || "-"}
                    </td>
                    <td className="px-1 py-0.5 w-52 border border-gray-500">
                      {formatDate(item.createAt) || "-"}
                    </td>
                    <td className="px-1 py-0.5 w-28 justify-center border border-gray-500">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => detailNotaJual(item.id_retur_pembelian)}
                          className="flex items-center justify-center"
                          title={"Detail " + item.id_retur_pembelian}
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
                ))
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
