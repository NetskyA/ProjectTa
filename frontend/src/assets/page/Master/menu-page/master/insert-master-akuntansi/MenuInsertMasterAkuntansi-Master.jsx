// MenuinsertMasterAkuntansi-Master.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  insertMasterAkuntansi, 
  getMasterAkun, 
  getMasterToko 
} from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";

/** 
 * Dropdown for selecting an object item with free-text search
 * Accepts `options` in the form of [{ value, label }]
 */
function FilterSelectObject({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(
    value ? options.find((o) => o.value === value)?.label : ""
  );
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
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

  const handleSelect = (option) => {
    onChange(option.value);
    setInputValue(option.label);
    setShowOptions(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowOptions(true);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setShowOptions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-blue-800 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-sm rounded-md p-1.5 w-full"
        placeholder="Pilih atau ketik..."
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute top-7 right-2 text-red-500 text-sm"
          title="Clear"
        >
          &times;
        </button>
      )}
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
          {filteredOptions.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
            >
              {option.label}
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

export default function MenuinsertMasterAkuntansiMaster() {
  // Form state untuk master akun akuntansi
  const [formData, setFormData] = useState({
    id_toko: "",         // store selected toko
    id_master_akun: "",  // store selected akun
    nama_akun_akuntansi: "",
    saldo_awal: "",
    deskripsi: "",
    status: 0, // 0 = Aktif, 1 = Non-Aktif
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // We will store ALL Master Akun data here, with their id_toko, etc.
  const [allMasterAkun, setAllMasterAkun] = useState([]);
  // This state will be the filtered dropdown options for Tipe Akun
  const [masterAkunOptions, setMasterAkunOptions] = useState([]);

  // We also store the Toko options
  const [masterTokoOptions, setMasterTokoOptions] = useState([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Ambil token dan id_user dari Redux
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);

  // Fetch data master akun untuk dropdown (full data)
  useEffect(() => {
    const fetchMasterAkun = async () => {
      try {
        const data = await getMasterAkun(token);
        // data should look like an array of objects: { id_master_akun, nama_akun, id_toko, ... }
        const dataRows = Array.isArray(data) ? data : Object.values(data);
        setAllMasterAkun(dataRows); 
        // We won't set masterAkunOptions here yet, because we only want to 
        // show relevant akun after the Toko is chosen.
      } catch (err) {
        console.error("Error fetching master akun:", err);
      }
    };
    fetchMasterAkun();
  }, [token]);

  // Fetch data master toko untuk dropdown
  useEffect(() => {
    const fetchMasterToko = async () => {
      try {
        const data = await getMasterToko(token);
        // data = [{ id_toko, nama_toko, ... }, ...]
        const dataRows = Array.isArray(data) ? data : Object.values(data);
        const options = dataRows.map((item) => ({
          value: item.id_toko,
          label: item.nama_toko,
        }));
        setMasterTokoOptions(options);
      } catch (err) {
        console.error("Error fetching master toko:", err);
      }
    };
    fetchMasterToko();
  }, [token]);

  // Whenever `id_toko` changes, filter the `allMasterAkun` to get akun for that toko
  useEffect(() => {
    if (!formData.id_toko) {
      // if no toko selected, you can either show no akun or show all
      // Let's show none to force the user to pick a Toko first
      setMasterAkunOptions([]);
      // Also reset the selected id_master_akun in formData if needed
      setFormData((prev) => ({ ...prev, id_master_akun: "" }));
    } else {
      // Filter allMasterAkun by the selected id_toko
      const filtered = allMasterAkun
        .filter((akun) => akun.id_toko === formData.id_toko)
        .map((akun) => ({
          value: akun.id_master_akun,
          label: akun.nama_akun, 
        }));

      setMasterAkunOptions(filtered);
      // Optionally reset the selected Tipe Akun if the previously selected 
      // one doesn't belong to the new toko 
      setFormData((prev) => ({ ...prev, id_master_akun: "" }));
    }
  }, [formData.id_toko, allMasterAkun]);

  // Helper: format date
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert numeric fields to numbers
    if (name === "status" || name === "saldo_awal") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { 
      id_toko,
      id_master_akun, 
      nama_akun_akuntansi, 
      saldo_awal, 
      deskripsi, 
      status 
    } = formData;

    // Validasi sederhana
    if (
      !id_toko ||
      !id_master_akun ||
      !nama_akun_akuntansi ||
      saldo_awal === "" ||
      !deskripsi ||
      (status === "" && status !== 0)
    ) {
      setAlert({
        message: "Semua field harus diisi (termasuk Toko).",
        type: "error",
        visible: true,
      });
      setTimeout(() => setAlert({ message: "", type: "", visible: false }), 3000);
      return;
    }

    setSubmitLoading(true);
    setAlert({ message: "", type: "", visible: false });

    try {
      // Buat payload
      const payload = {
        id_toko,
        id_master_akun, 
        nama_akun_akuntansi,
        saldo_awal,
        deskripsi,
        created_by: id_user,
        created_at: new Date().toISOString(),
        status,
      };

      const response = await insertMasterAkuntansi(payload, token);
      console.log("Insert Response:", response);
      if (response.success) {
        setAlert({
          message: "Master Akun Akuntansi berhasil ditambahkan.",
          type: "success",
          visible: true,
        });
        // Reset form
        setFormData({
          id_toko: "",
          id_master_akun: "",
          nama_akun_akuntansi: "",
          saldo_awal: "",
          deskripsi: "",
          status: 0,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          navigate("/dashboard/master/menu/akuntansi");
        }, 2000);
      } else {
        setAlert({
          message: response.message || "Gagal menambahkan Master Akun Akuntansi.",
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      setAlert({
        message: error.message || "Gagal menambahkan Master Akun Akuntansi.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
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
      
      {/* Breadcrumb, Header, etc. */}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
            Master
          </Link>
          <div className="mx-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/master/menu/akuntansi" className="text-xs font-semibold text-blue-900">
            Master Akuntansi
          </Link>
          <div className="mx-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">Tambah Akuntansi</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-lg font-semibold text-blue-900">Tambah Master Akuntansi</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/akuntansi">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-sm text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Form Insert Master Akuntansi */}
      <div className="p-4 max-w-xl mt-2 bg-white rounded-md shadow-md border border-gray-300">
        <h2 className="text-sm font-semibold mb-4">Detail Akuntansi</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Dropdown Toko & Dropdown Tipe Akun */}
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <FilterSelectObject
                label="Pilih Toko"
                options={masterTokoOptions}
                value={formData.id_toko}
                onChange={(val) => 
                  setFormData((prev) => ({ ...prev, id_toko: val }))
                }
              />
            </div>
            <div className="w-full md:w-1/2">
              <FilterSelectObject
                label="Tipe Akun"
                options={masterAkunOptions}
                value={formData.id_master_akun}
                onChange={(val) => 
                  setFormData((prev) => ({ ...prev, id_master_akun: val }))
                }
              />
            </div>
          </div>

          {/* Nama Akuntansi & Kode Akuntansi */}
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label
                htmlFor="nama_akun_akuntansi"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Nama Akuntansi
              </label>
              <input
                type="text"
                id="nama_akun_akuntansi"
                name="nama_akun_akuntansi"
                value={formData.nama_akun_akuntansi}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan nama akuntansi"
                required
              />
            </div>
            <div className="w-full md:w-1/2">
              <label
                htmlFor="kode_akun_akuntansi"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Kode Akuntansi
              </label>
              <input
                type="text"
                id="kode_akun_akuntansi"
                name="kode_akun_akuntansi"
                value="Auto Generated"
                disabled
                className="w-full border border-gray-300 rounded-md p-1 bg-gray-100 text-gray-500"
                placeholder="Auto Generated"
              />
            </div>
          </div>

          {/* Saldo Awal & Deskripsi */}
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label
                htmlFor="saldo_awal"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Saldo Awal
              </label>
              <input
                type="text"
                id="saldo_awal"
                name="saldo_awal"
                value={formData.saldo_awal}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan saldo awal"
                required
                min="0"
              />
            </div>
          </div>
            <div className="w-full mb-2">
              <label
                htmlFor="deskripsi"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Deskripsi
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                placeholder="Masukkan deskripsi"
                required
                rows="2"
              />
            </div>

          {/* DI BUAT TANGGAL & Status */}
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label
                htmlFor="created_at"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                DI BUAT TANGGAL
              </label>
              <input
                type="text"
                id="created_at"
                name="created_at"
                value={formatDate(new Date().toISOString())}
                disabled
                className="w-full border border-gray-300 rounded-md p-1 bg-gray-100"
              />
            </div>
            <div className="w-full md:w-1/2">
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-blue-800 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-1"
                required
              >
                <option value="">Pilih Status</option>
                <option value={0}>Aktif</option>
                <option value={1}>Non-Aktif</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full md:w-auto bg-blue-800 text-white p-2 rounded-md hover:bg-blue-950 transition duration-300 ${
                submitLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitLoading}
            >
              {submitLoading ? <Loading /> : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
