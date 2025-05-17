import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMasterAdonan,
  deleteMasterKategoriAdonan,
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";

// ========== FilterSelect Component ==========
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((opt) =>
        opt.toString().toLowerCase().includes(inputValue.toLowerCase())
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
  }, []);

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
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1 text-xs">
          {filteredOptions.map((opt, i) => (
            <li
              key={i}
              onClick={() => handleSelect(opt)}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer"
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

export default function MenuLaporanMasterKategori() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  // FILTERS
  const [kategoriFilter, setKategoriFilter] = useState("");
  const statusOptions = ["Semua", "Aktif", "Non-Aktif"];
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selectedId, setSelectedId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Filter tanggal (berdasarkan createat)
  const [filterDate, setFilterDate] = useState("");
  // const [endDate, setEndDate] = useState("");

  // Search Term
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination & Sort
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Alert & Dialog
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Fetch data dari getMasterAdonan
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getMasterAdonan(token);
        const list = Array.isArray(result) ? result : Object.values(result);
        setData(list);
        setFilteredData(list);
      } catch (err) {
        setError(err.message || "Gagal memuat data adonan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // opsi unik untuk filter kategori adonan
  const uniqueKategori = useMemo(
    () => [...new Set(data.map((d) => d.nama_kategori_adonan_produk || ""))],
    [data]
  );

  // handle refresh
  const handleRefresh = () => window.location.reload();

  // apply semua filter + search
  useEffect(() => {
    let temp = [...data];

    if (kategoriFilter) {
      temp = temp.filter(
        (d) => d.nama_kategori_adonan_produk === kategoriFilter
      );
    }
    if (statusFilter !== "Semua") {
      temp = temp.filter((d) =>
        statusFilter === "Aktif" ? d.status === 0 : d.status === 1
      );
    }
    if (filterDate) {
      temp = temp.filter((d) => {
        if (!d.createat) return false;
        // ambil hanya bagian yyyy-mm-dd
        const created = new Date(d.createat).toISOString().split("T")[0];
        return created === filterDate;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      temp = temp.filter((d) =>
        [
          d.id_kategori_adonan_produk,
          d.nama_kategori_adonan_produk,
          d.createby,
          d.nama_user,
          d.createat,
          d.status_text,
        ]
          .map((v) => (v ?? "").toString().toLowerCase())
          .join(" ")
          .includes(term)
      );
    }

    setFilteredData(temp);
    setCurrentPage(1);
  }, [data, kategoriFilter, statusFilter, filterDate, searchTerm]);

  // sort data
  const sortedData = useMemo(() => {
    const sortable = [...filteredData];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const A = (a[sortConfig.key] ?? "").toString().toLowerCase();
        const B = (b[sortConfig.key] ?? "").toString().toLowerCase();
        if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredData, sortConfig]);

  // pagination helpers
  const idxLast = currentPage * itemsPerPage;
  const idxFirst = idxLast - itemsPerPage;
  const currentItems = sortedData.slice(idxFirst, idxLast);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (p) => setCurrentPage(p);

  const formatDate = (dStr) => {
    if (!dStr) return "-";
    const d = new Date(dStr);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(
      d.getMonth() + 1
    )}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSort = (key) => {
    let dir = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      dir = "desc";
    }
    setSortConfig({ key, direction: dir });
  };

  // edit & delete
  const detailMasterAdonan = (id) => {
    console.log(`Detail Master Adonan ID: ${id}`);
    navigate(`/dashboard/master/menu/adonan/update/${id}`);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteMasterKategoriAdonan(selectedId, token);
      if (result.success) {
        setAlert({
          message: result.message || "Berhasil dihapus",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert((prev) => ({ ...prev, visible: false }));
          window.location.reload();
        }, 2000);
        // Filter ulang data
        setData((prev) =>
          prev.filter((d) => d.id_kategori_adonan_produk !== selectedId)
        );
      } else {
        throw new Error(result.message || "Gagal menonaktifkan");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Terjadi kesalahan saat menghapus.",
        type: "error",
        visible: true,
      });
    } finally {
      setIsDialogOpen(false);
      setSelectedId(null);
    }
  };

  const cancelDelete = () => {
    setIsDialogOpen(false);
    setSelectedId(null);
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((a) => ({ ...a, visible: false }))}
        />
      )}

      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/adminpembelian"
            className="text-xs font-semibold text-blue-900"
          >
            Master
          </Link>
          <div className="mx-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <Link
            to="/dashboard/adminpembelian/menu/masterkategori"
            className="text-xs font-semibold text-gray-400"
          >
            Master Adonan
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-sm rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow space-y-4 mb-2 border">
        <div className="flex flex-wrap gap-4">
          <FilterSelect
            label="Filter Kategori"
            options={uniqueKategori}
            value={kategoriFilter}
            onChange={setKategoriFilter}
          />
          <FilterSelect
            label="Filter Status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Master Adonan
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
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* EXPORT BUTTON */}
          <div className="absolute right-0 flex space-x-2">
            <Link to="/dashboard/master/menu/adonan/insert">
              <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
                <p className="p-2">Tambah</p>
              </button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ height: "60vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  No
                </th>
                <th
                  onClick={() => handleSort("nama_kategori_adonan_produk")}
                  scope="col"
                  className="px-1 py-0.5 max-w-2xl cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  Kategori Adonan{" "}
                  {sortConfig.key === "nama_kategori_adonan_produk" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("nama_user")}
                  scope="col"
                  className="px-1 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  DI BUAT OLEH{" "}
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("createat")}
                  scope="col"
                  className="px-1 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  DI BUAT TANGGAL{" "}
                  {sortConfig.key === "createat" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("status_text")}
                  scope="col"
                  className="px-1 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  Status{" "}
                  {sortConfig.key === "status_text" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-20 sticky top-0 border border-gray-500 bg-gray-200 z-10"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, idx) => {
                  const bgClass =
                    Number(item.status) === 0
                      ? "bg-lime-500"
                      : Number(item.status) === 1
                      ? "bg-red-500"
                      : "bg-white";

                  return (
                    <tr
                      key={`${item.id_kategori_adonan_produk}-${idx}`}
                      onDoubleClick={() =>
                        detailMasterAdonan(item.id_kategori_adonan_produk)
                      }
                      className={`border-b text-gray-700 cursor-pointer hover:opacity-75 ${bgClass}`}
                    >
                      <td className="px-1 py-0.5 border border-gray-700">
                        {idxFirst + idx + 1}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_kategori_adonan_produk}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_user}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {formatDate(item.createat)}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.status_text}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500 uppercase text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              detailMasterAdonan(item.id_kategori_adonan_produk)
                            }
                          >
                            <svg
                              className="w-5 h-5 text-green-600"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8Zm4.06 5H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a2.999 2.999 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9.06 13Zm9.032-5a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18.092 8Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(item.id_kategori_adonan_produk)
                            } // ⬅️ fix id yang dikirim
                            className="flex items-center px-1 justify-center"
                            title="Delete"
                          >
                            <svg
                              className="w-5 h-5 text-red-700"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z"
                                clipRule="evenodd"
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
                  <td colSpan={7} className="text-center py-4">
                    Tidak ada data tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* PAGINATION */}
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
              {indexOfFirstItem + 1}-{" "}
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
                className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-1 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <DialogTrueFalse
        isOpen={isDialogOpen}
        title="Konfirmasi Penonaktifan"
        message="Apakah Anda yakin ingin menonaktifkan data barang ini?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
