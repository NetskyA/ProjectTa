import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMasterUser,
  deleteMasterUser,
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

/* ========== FilterSelect Component ========== */
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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


export default function MasterUser() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter States
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [namaTokoFilter, setNamaTokoFilter] = useState("");

  // Unique values for dropdowns
  const uniqueRoles = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_role || ""))];
  }, [data]);

  const uniqueNamaToko = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_toko || ""))];
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const masterUserData = await getMasterUser(token);
        console.log("Data master user:", masterUserData);
        setData(masterUserData);
        setFilteredData(masterUserData);
      } catch (err) {
        console.error("Error dalam mengambil data master user:", err);
        setError(err.message || "Gagal mengambil data master user.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Handle Search and Filters
  useEffect(() => {
    let filtered = [...data];

    // Filter by Status (gunakan "Aktif" untuk status = 0 dan "Non-Aktif" untuk status = 1)
    if (statusFilter === "Aktif") {
      filtered = filtered.filter((item) => item.status === 0);
    } else if (statusFilter === "Non-Aktif") {
      filtered = filtered.filter((item) => item.status === 1);
    }

    // Filter by nama_role
    if (roleFilter) {
      filtered = filtered.filter((item) => item.nama_role === roleFilter);
    }

    // Filter by nama_toko
    if (namaTokoFilter) {
      filtered = filtered.filter((item) => item.nama_toko === namaTokoFilter);
    }

    // Handle Search
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_user &&
            item.kode_user.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_user &&
            item.nama_user.toLowerCase().includes(lowercasedFilter)) ||
          (item.kode_toko &&
            item.kode_toko.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_toko &&
            item.nama_toko.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, namaTokoFilter, data]);

  // Apply Sorting
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
  }, [filteredData, sortConfig]);

  // Calculate Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Close dropdown when clicking outside (untuk dropdown jika ada)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative.inline-block")) {
        // handle close dropdown jika ada
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  // Handler untuk Sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handler untuk Delete
  const handleDeleteClick = (id_user) => {
    setSelectedUserId(id_user);
    setIsDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (selectedUserId === null) return;

    try {
      await deleteMasterUser(selectedUserId, token);
      setAlert({
        message: "User berhasil di non aktifkan.",
        type: "success",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        handleRefresh();
      }, 2000);

      setData((prevData) =>
        prevData.filter((user) => user.id_user !== selectedUserId)
      );
      setFilteredData((prevFilteredData) =>
        prevFilteredData.filter((user) => user.id_user !== selectedUserId)
      );
    } catch (err) {
      console.error("Error saat menghapus user:", err);
      setAlert({
        message: "Gagal menghapus user.",
        type: "error",
        visible: true,
      });
    } finally {
      setIsDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setIsDialogOpen(false);
    setSelectedUserId(null);
  };

  // Handler untuk Edit
  const handleEdit = (id_user) => {
    navigate(`/dashboard/master/menu/user/update/${id_user}`);
  };

  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
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
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Master
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
          <Link to="/dashboard/master/menu/user">
            <span className="text-xs font-semibold text-gray-400">
              Master User
            </span>
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* ========== Filter Section ========== */}
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Filter Nama Role"
            options={uniqueRoles}
            value={roleFilter}
            onChange={setRoleFilter}
          />
          <FilterSelect
            label="Filter Nama Toko"
            options={uniqueNamaToko}
            value={namaTokoFilter}
            onChange={setNamaTokoFilter}
          />
          <FilterSelect
            label="Filter Status"
            options={["Aktif", "Non-Aktif"]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 mt-2">
        <div className="flex items-center justify-center mb-2 relative">
          {/* Left: List Account */}
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Master User
          </p>

          {/* Center: Search Bar */}
          <div className="w-2/5 sm:w-1/2 md:w-1/3">
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
                className="bg-gray-50 border h-10 border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search by Kode/User/Nama Toko"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Tambah Button */}
          <div className="absolute right-0 flex space-x-2">
            <Link to="/dashboard/master/menu/user/insert">
              <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
                <p className="p-2">Tambah</p>
              </button>
            </Link>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto" style={{ height: "60vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs text-blue-900 uppercase font-semibold bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-1 py-1 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  NO
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("id_role")}
                >
                  Role
                  {sortConfig.key === "id_role" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_toko")}
                >
                  Kode Toko
                  {sortConfig.key === "kode_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_toko")}
                >
                  Nama Toko
                  {sortConfig.key === "nama_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_user")}
                >
                  Kode User
                  {sortConfig.key === "kode_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  Username
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("password")}
                >
                  Password
                  {sortConfig.key === "password" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no_hp")}
                >
                  No HP
                  {sortConfig.key === "no_hp" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("alamat")}
                >
                  Alamat
                  {sortConfig.key === "alamat" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-1 w-10 sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={item.id_user || index}
                    onDoubleClick={() => handleEdit(item.id_user)}
                    className={`border-b cursor-pointer hover:opacity-75 text-gray-800 ${
                      item.status === 0
                        ? "bg-lime-500"
                        : item.status === 1
                        ? "bg-red-500"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-2 py-1 border border-gray-700">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.nama_role}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.kode_toko || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.nama_toko || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.kode_user || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.nama_user || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.password ? "********************" : "No Password"}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.no_hp || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-1 border border-gray-700">
                      {item.alamat || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-1 border font-semibold border-gray-700">
                      {item.status === 0 ? (
                        <p className="text-green-600">Aktif</p>
                      ) : (
                        <p className="text-red-700">Non-Aktif</p>
                      )}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(item.id_user)}
                          className="flex items-center justify-center"
                          title="Edit"
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
                          onClick={() => handleDeleteClick(item.id_user)}
                          className="flex items-center justify-center"
                          title="Delete"
                        >
                          <svg
                            className="w-5 h-5 text-red-700"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
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
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-1 py-1 text-center">
                    Tidak ada data tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dialog Konfirmasi Delete */}
        <DialogTrueFalse
          isOpen={isDialogOpen}
          title="Konfirmasi Penonaktifan"
          message="Apakah anda yakin ingin menonaktifkan akun ini?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        {/* Pagination + Items Per Page */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-2"
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
                setCurrentPage(1); // Reset ke halaman 1
              }}
              className="border border-gray-300 rounded-md text-xs p-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
          <span className="text-xs font-normal text-gray-700">
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
                className={`flex items-center justify-center py-1 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-1 px-2 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
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
