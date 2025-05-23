/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useRef } from "react";
import ExcelJS from "exceljs";
import { useDispatch, useSelector } from "react-redux";
import { uploadStart, uploadSuccess, uploadFailure } from "../../../../store/index";
import {
  uploadFile,
  getMasterJenisTransaksi,
  getMasterJenisPembayaran,
  getMasterLokasi,
  getLaporanMasterSatuan,
} from "../../../../services/apiService";
import { Link } from "react-router-dom";
import IconDelete from "../../../../image/icon/logo-delete.svg";
import Alert from "../../../component/Alert";
import Loading from "../../../component/Loading"; // Komponen loading

/* --------------------------------------------------------------------------
   Komponen FilterSelect (autocomplete sederhana)
-------------------------------------------------------------------------- */
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options || []);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter(
        (opt) =>
          typeof opt === "string" &&
          opt.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt);
    setInputValue(opt);
    setShowOptions(false);
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
          onClick={handleClear}
          className="absolute top-6 right-2 text-red-500 text-sm"
          title="Clear"
        >
          &times;
        </button>
      )}
      {showOptions && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
          {filteredOptions.length ? (
            filteredOptions.map((opt, i) => (
              <li
                key={i}
                onClick={() => handleSelect(opt)}
                className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-xs text-gray-500">Tidak ada opsi</li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ---------- FORMAT RUPIAH ---------- */
const formatRupiah = (num) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);

export default function MenuImport() {
  /* ---------- STATE & REDUX ---------- */
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null); // baris mentah utk preview (masih id)
  const [groupedData, setGroupedData] = useState([]); // master–detail
  const [alert, setAlert] = useState({
    message: "",
    type: "",
    visible: false,
  });
  const [showLoading, setShowLoading] = useState(false);

  /* ---------- MASTER-DATA MAP (id → nama) ---------- */
  const [jenisTransaksiMap, setJenisTransaksiMap] = useState({});
  const [syaratBayarMap, setSyaratBayarMap] = useState({});
  const [lokasiMap, setLokasiMap] = useState({});
  const [satuanMap, setSatuanMap] = useState({});

  /* fetch master once */
  useEffect(() => {
    async function fetchMasters() {
      try {
        const [
          resJenis,
          resSyarat,
          resLokasi,
          resSatuan,
        ] = await Promise.all([
          getMasterJenisTransaksi(),
          getMasterJenisPembayaran(),
          getMasterLokasi(),
          getLaporanMasterSatuan(),
        ]);

        const jMap = {};
        Object.values(resJenis.data || resJenis).forEach((o) => {
          jMap[o.id_jenis_transaksi] = o.nama_transaksi;
        });

        const sMap = {};
        Object.values(resSyarat.data || resSyarat).forEach((o) => {
          sMap[o.id_syarat_bayar] = o.nama_syarat_bayar;
        });

        const lMap = {};
        Object.values(resLokasi.data || resLokasi).forEach((o) => {
          lMap[o.id_lokasi] = o.nama_lokasi;
        });

        const satMap = {};
        /* master satuan kadang berupa array di index 0 */
        const satuanArr = Array.isArray(resSatuan)
          ? resSatuan.flatMap((v) => Object.values(v))
          : Object.values(resSatuan.data || resSatuan);
        satuanArr.forEach((o) => {
          satMap[o.id_satuan] = o.nama_satuan;
        });

        setJenisTransaksiMap(jMap);
        setSyaratBayarMap(sMap);
        setLokasiMap(lMap);
        setSatuanMap(satMap);
      } catch (err) {
        console.error("Gagal mengambil master-data:", err);
      }
    }
    fetchMasters();
  }, []);

  /* ---------- FILTER STATE ---------- */
  const [filterNoTrans, setFilterNoTrans] = useState("");
  const [filterKodeBarang, setFilterKodeBarang] = useState("");
  const [filterNoPesanan, setFilterNoPesanan] = useState("");
  const [filterNoSurat, setFilterNoSurat] = useState("");
  const [filterJenisTransaksi, setFilterJenisTransaksi] = useState("");
  const [filterSyaratBayar, setFilterSyaratBayar] = useState("");
  const [filterPelanggan, setFilterPelanggan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ---------- TABLE STATE ---------- */
  const [searchTermPreview, setSearchTermPreview] = useState("");
  const [sortConfigPreview, setSortConfigPreview] = useState({
    key: null,
    direction: "asc",
  });
  const [itemsPerPagePreview, setItemsPerPagePreview] = useState(500);
  const [currentPagePreview, setCurrentPagePreview] = useState(1);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.upload);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);

  /* ---------- HEADER EXCEL ---------- */
const headers = [
  "Tgl Trans",
  "No. Trans",
  "Jenis Transaksi",
  "No. Penjualan",
  "No. Surat Jalan",
  "Syarat Bayar",
  "Pelanggan",
  "Kitchen",
  "Grand Total (Rp)",
  "Kode Barang",
  "Satuan",
  "Jumlah",
  "Jumlah Retur",              // NEW
  "Harga (Rp)",
  "Disc (%)",
  "HPP / Satuan (Rp)",
  "Umur Stok",                 // NEW
  "Stok Toko",                 // NEW
];

  const tableHeaders = ["No.", ...headers];

  /* ---------- HANDLE FILE CHANGE ---------- */
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (file) {
      setAlert({
        message: "Anda hanya dapat mengupload satu file.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((p) => ({ ...p, visible: false })), 3000);
      return;
    }

    setFile(selectedFile);
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await selectedFile.arrayBuffer());
      const ws = wb.worksheets[0];

      const rowsRaw = [];
      const prev = Array(headers.length).fill("");
ws.eachRow({ includeEmpty: true }, (row, i) => {
  if (i === 1) return;

  const dataRow = headers.map((_, idx) => {
    const cell = row.getCell(idx + 1);
    let value = cell.text?.trim() ?? "";

    if (idx === 0 && cell.value instanceof Date) {
      const d = cell.value;
      value = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    }

    if (value) {
      prev[idx] = value;
      return value;
    }

    // kolom master
    if (idx <= 7) return prev[idx] || "UNKNOWN";
    // detail kosong → treat 0
    return "0";
  });

  const emptyDetail = dataRow.slice(8).every((v) => v === "0");
  if (!emptyDetail) rowsRaw.push(dataRow);
});

      /* ---- GROUPING MASTER–DETAIL (pakai id sesuai backend) ---- */
      const groupMap = {}; // key => { ...master, details:[] }

      rowsRaw.forEach((r) => {
        // key unik master: gabungan kolom 0-7
        const masterKey = r.slice(0, 8).join("|");

        if (!groupMap[masterKey]) {
          groupMap[masterKey] = {
            tanggal_transaksi: r[0],
            no_transaksi: r[1],
            id_jenis_transaksi: r[2],
            no_pesanan_penjualan: r[3],
            no_surat_jalan: r[4],
            id_syarat_bayar: r[5],
            id_lokasi: r[6],
            id_kitchen: r[7],
            grand_total: r[8],
            details: [],
          };
        }

groupMap[masterKey].details.push({
  kode_barang: r[9],
  id_satuan: r[10],
  jumlah: r[11],
  jumlah_retur: r[12],         // NEW
  harga: r[13],
  discount: r[14],
  hpp_satuan: r[15],
  umur_stok: r[16],            // NEW
  stok_toko: r[17],            // NEW
});

      });

      const grouped = Object.values(groupMap);
      console.log("=== GROUPED DATA (siap dikirim) ===", grouped);

      /* ---- SET STATE ---- (fileData masih id, mapping nama terjadi di UI) */
      setFileData({ fileName: selectedFile.name, data: rowsRaw });
      setGroupedData(grouped);
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Gagal memproses file. Pastikan formatnya benar.",
        type: "error",
        visible: true,
      });
      setTimeout(() => setAlert((p) => ({ ...p, visible: false })), 3000);
    }
  };

  /* ---------- HANDLE UPLOAD ---------- */
  const handleUpload = async () => {
    if (!file) {
      setAlert({
        message: "Pilih file terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((p) => ({ ...p, visible: false })), 3000);
      return;
    }
    const payload = { id_user, id_toko, headerData: groupedData };
    /* ⇢ LOG payload ke console agar bisa dicek di browser dev-tools */
    console.log("=== PAYLOAD (akan dikirim ke backend) ===", payload);

    setShowLoading(true);
    dispatch(uploadStart());
    try {
      const [res] = await Promise.all([
        uploadFile(payload),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
      dispatch(uploadSuccess(res.data));
      setAlert({ message: "Upload berhasil!", type: "success", visible: true });
      setFile(null);
      setFileData(null);
      setGroupedData([]);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      dispatch(uploadFailure(err));
      const msg =
        err.response?.data?.message || "Upload gagal. Silakan coba lagi.";
      setAlert({ message: msg, type: "error", visible: true });
    } finally {
      setShowLoading(false);
      setTimeout(() => setAlert((p) => ({ ...p, visible: false })), 3000);
    }
  };

  /* ---------- DERIVE UNIQUE OPTIONS ---------- */
  const uniqueOptions = useMemo(() => {
    const d = fileData?.data || [];
    const setNo = new Set();
    const setKode = new Set();
    const setPesanan = new Set();
    const setSurat = new Set();
    const setJenis = new Set();
    const setSyarat = new Set();
    const setPelanggan = new Set();
    d.forEach((r) => {
      setNo.add(r[1]);
      setPesanan.add(r[3]);
      setSurat.add(r[4]);
      setJenis.add(jenisTransaksiMap[r[2]] || r[2]);
      setSyarat.add(syaratBayarMap[r[5]] || r[5]);
      setPelanggan.add(lokasiMap[r[6]] || r[6]);
      setKode.add(r[9]);
    });
    return {
      uniqueNoTrans: [...setNo],
      uniqueNoPesanan: [...setPesanan],
      uniqueNoSurat: [...setSurat],
      uniqueJenis: [...setJenis],
      uniqueSyarat: [...setSyarat],
      uniquePelanggan: [...setPelanggan],
      uniqueKodeBarang: [...setKode],
    };
  }, [fileData, jenisTransaksiMap, syaratBayarMap, lokasiMap]);

  /* ---------- SORT • FILTER • PAGING ---------- */
  useEffect(
    () => setCurrentPagePreview(1),
    [
      searchTermPreview,
      sortConfigPreview,
      filterNoTrans,
      filterKodeBarang,
      filterNoPesanan,
      filterNoSurat,
      filterJenisTransaksi,
      filterSyaratBayar,
      filterPelanggan,
      startDate,
      endDate,
    ]
  );

  const processedData = useMemo(() => {
    /* fileData.data masih id → kita bikin copy dg nama utk ditampilkan */
    let rows = [...(fileData?.data || [])].map((r) => {
      const copy = [...r];

      /* ⇢ format tanggal index 0 menjadi dd/mm/yyyy */
      const dt = new Date(copy[0]);
      if (!isNaN(dt)) copy[0] = dt.toLocaleDateString("id-ID");

      copy[2] = jenisTransaksiMap[copy[2]] || copy[2];
      copy[5] = syaratBayarMap[copy[5]] || copy[5];
      copy[6] = lokasiMap[copy[6]] || copy[6];
      copy[9] = satuanMap[copy[9]] || copy[9];
      return copy;
    });


    /* ⇢ apply filters */
    if (filterNoTrans) {
      rows = rows.filter((r) =>
        r[1]?.toLowerCase().includes(filterNoTrans.toLowerCase())
      );
    }
    if (filterNoPesanan) {
      rows = rows.filter((r) =>
        r[3]?.toLowerCase().includes(filterNoPesanan.toLowerCase())
      );
    }
    if (filterNoSurat) {
      rows = rows.filter((r) =>
        r[4]?.toLowerCase().includes(filterNoSurat.toLowerCase())
      );
    }
    if (filterJenisTransaksi) {
      rows = rows.filter(
        (r) => r[2]?.toLowerCase() === filterJenisTransaksi.toLowerCase()
      );
    }
    if (filterSyaratBayar) {
      rows = rows.filter((r) =>
        r[5]?.toLowerCase().includes(filterSyaratBayar.toLowerCase())
      );
    }
    if (filterPelanggan) {
      rows = rows.filter((r) =>
        r[6]?.toLowerCase().includes(filterPelanggan.toLowerCase())
      );
    }
    if (filterKodeBarang) {
      rows = rows.filter((r) =>
        r[8]?.toLowerCase().includes(filterKodeBarang.toLowerCase())
      );
    }
    if (startDate) {
      const s = new Date(startDate);
      rows = rows.filter((r) => {
        const dt = new Date(r[0]);
        return !isNaN(dt) && dt >= s;
      });
    }
    if (endDate) {
      const e = new Date(endDate);
      rows = rows.filter((r) => {
        const dt = new Date(r[0]);
        return !isNaN(dt) && dt <= e;
      });
    }

    /* ⇢ search term global */
    if (searchTermPreview) {
      const kw = searchTermPreview.toLowerCase();
      rows = rows.filter((r) =>
        r.some((v) => v && v.toString().toLowerCase().includes(kw))
      );
    }

    /* ⇢ sort */
    if (sortConfigPreview.key !== null) {
      rows.sort((a, b) => {
        let A = a[sortConfigPreview.key]?.toString().toLowerCase() || "";
        let B = b[sortConfigPreview.key]?.toString().toLowerCase() || "";
        if (A < B) return sortConfigPreview.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfigPreview.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [
    fileData,
    jenisTransaksiMap,
    syaratBayarMap,
    lokasiMap,
    satuanMap,
    filterNoTrans,
    filterKodeBarang,
    filterNoPesanan,
    filterNoSurat,
    filterJenisTransaksi,
    filterSyaratBayar,
    filterPelanggan,
    startDate,
    endDate,
    searchTermPreview,
    sortConfigPreview,
  ]);

  /* ---------- SUBTOTALS (mengikuti filter aktif) ---------- */
  const subtotalGrand = useMemo(
    () =>
      processedData.reduce(
        (s, r) => s + Number(r[7]?.toString().replace(/,/g, "") || 0),
        0
      ),
    [processedData]
  );
  const subtotalHarga = useMemo(
    () =>
      processedData.reduce(
        (s, r) => s + Number(r[11]?.toString().replace(/,/g, "") || 0),
        0
      ),
    [processedData]
  );
  const subtotalHPP = useMemo(
    () =>
      processedData.reduce(
        (s, r) => s + Number(r[13]?.toString().replace(/,/g, "") || 0),
        0
      ),
    [processedData]
  );
  /* ---------- Penomoran “No.” ---------- */
  const groupNumberMap = useMemo(() => {
    const map = {};
    let counter = 0;
    processedData.forEach((r) => {
      const noTrans = r[1];
      if (!(noTrans in map)) {
        counter += 1;
        map[noTrans] = counter;
      }
    });
    return map;
  }, [processedData]);
  const indexOfLast = currentPagePreview * itemsPerPagePreview;
  const indexOfFirst = indexOfLast - itemsPerPagePreview;
  const currentItems = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPagePreview);

  const handleSortPreview = (key) => {
    let dir = "asc";
    if (
      sortConfigPreview.key === key &&
      sortConfigPreview.direction === "asc"
    )
      dir = "desc";
    setSortConfigPreview({ key, direction: dir });
  };

  /* ---------- UI ---------- */
  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        />
      )}
      {showLoading && <Loading />}

      {/* breadcrumb + refresh */}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <div className="text-xs font-bold text-blue-900">
            <Link to="/dashboard/basetroli">Penjualan</Link>
          </div>
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
          <div className="text-xs font-bold text-gray-400">
            Import Penjualan
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* upload & info file */}
      <div className="mt-0 flex gap-3">
        <div className="w-fit border-dashed border-2 border-blue-600 bg-gray-200 rounded-md p-3 text-center shadow-md transition hover:bg-gray-50">
          <label
            htmlFor="file-upload"
            className="flex flex-col justify-center items-center cursor-pointer py-2 px-1 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-blue-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 16l4 4m0 0l4-4m-4 4V4m8 4h4m-4 4h4m-4 4h4"
              />
            </svg>
            <p className="text-gray-600 text-xs">Upload file</p>
            <p className="text-xs text-gray-700 mt-1">Mendukung: XLSX, XLS</p>
            <p className="text-xs text-gray-700 mt-1">Max 1 file</p>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="w-full bg-white border border-gray-400 shadow-md rounded-md pl-1.5 pt-1">
          {!file ? (
            <p className="text-gray-500 text-center pt-12 text-xs italic">
              Silakan pilih file terlebih dahulu.
            </p>
          ) : (
            <>
              <div className="w-full flex justify-between items-center p-2">
                <p className="text-xs text-blue-900">1.&nbsp;{file.name}</p>
                <button
                  onClick={() => {
                    setFile(null);
                    setFileData(null);
                    setGroupedData([]);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  <img className="w-5 mr-4" src={IconDelete} alt="delete" />
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-2 w-8 h-8 flex items-center justify-center py-1 m-2 bg-blue-950 float-end text-white font-xs text-xs rounded hover:bg-blue-900"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8v8H4z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                    />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------- FILTER BAR ---------- */}
      {fileData && (
        <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2 mt-2">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
            {/* baris 1 */}
            <FilterSelect
              label="Filter No. Trans"
              options={uniqueOptions.uniqueNoTrans.map(String)}
              value={filterNoTrans}
              onChange={setFilterNoTrans}
            />
            <FilterSelect
              label="Filter No. Pesanan"
              options={uniqueOptions.uniqueNoPesanan.map(String)}
              value={filterNoPesanan}
              onChange={setFilterNoPesanan}
            />
            <FilterSelect
              label="Filter No. Surat Jalan"
              options={uniqueOptions.uniqueNoSurat.map(String)}
              value={filterNoSurat}
              onChange={setFilterNoSurat}
            />
            <FilterSelect
              label="Filter Jenis Transaksi"
              options={uniqueOptions.uniqueJenis.map(String)}
              value={filterJenisTransaksi}
              onChange={setFilterJenisTransaksi}
            />
            {/* baris 2 */}
            <FilterSelect
              label="Filter Syarat Bayar"
              options={uniqueOptions.uniqueSyarat.map(String)}
              value={filterSyaratBayar}
              onChange={setFilterSyaratBayar}
            />
            <FilterSelect
              label="Filter Pelanggan"
              options={uniqueOptions.uniquePelanggan.map(String)}
              value={filterPelanggan}
              onChange={setFilterPelanggan}
            />
            <FilterSelect
              label="Filter Kode Barang"
              options={uniqueOptions.uniqueKodeBarang.map(String)}
              value={filterKodeBarang}
              onChange={setFilterKodeBarang}
            />
            {/* Rentang tanggal */}
            <div className="flex flex-col text-xs">
              <label className="block mb-1 text-blue-900 font-semibold">
                Filter Tanggal
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  className="border border-gray-300 w-40 h-7 px-2 rounded-md text-xs"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate("");
                  }}
                  max={endDate || ""}
                />
                <input
                  type="date"
                  className="border border-gray-300 w-40 h-7 px-2 rounded-md text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || ""}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- PREVIEW ---------- */}
      <div className="w-full mt-2 bg-white rounded-lg shadow-md p-2 border-gray-200 border">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Import Penjualan
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
                placeholder="Search Preview Data"
                value={searchTermPreview}
                onChange={(e) => setSearchTermPreview(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ height: "60vh" }}>
          <table className="w-full table-fixed text-xs text-left text-gray-500 border-collapse border">
            <thead className="bg-gray-200 text-xs text-blue-900 uppercase">
              <tr>
                {tableHeaders.map((h, i) => (
                  <th
                    key={i}
                    className="px-1 py-1 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10 w-32"
                    onClick={() => i !== 0 && handleSortPreview(i - 1)}
                  >
                    <div className="flex items-center">
                      {h}
                      {i !== 0 &&
                        sortConfigPreview.key === i - 1 && (
                          <span className="ml-1">
                            {sortConfigPreview.direction === "asc"
                              ? "▲"
                              : "▼"}
                          </span>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.length ? (
                (() => {
                  let prevNoTrans = null;
                  return currentItems.map((row, rIdx) => {
                    const noTrans = row[1];
                    const nomor =
                      noTrans !== prevNoTrans ? groupNumberMap[noTrans] : "";
                    prevNoTrans = noTrans;
                    return (
                      <tr
                        key={rIdx}
                        className="bg-white border-b hover:bg-gray-50"
                      >
                        {/* kolom No. */}
                        <td className="px-1 py-1 border border-gray-300 text-center font-semibold text-blue-900">
                          {nomor}
                        </td>
                        {row.map((c, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-1 py-1 border border-gray-300"
                          >
                            {c}
                          </td>
                        ))}
                      </tr>
                    );
                  });
                })()
              ) : (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="px-1 py-1 text-center text-gray-500 border-b"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- SUBTOTALS ---------- */}
        <div className="mt-1">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Grand&nbsp;Total&nbsp;(Rp)
                </td>
                <td className="px-1 py-0.5 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(subtotalGrand)}
                </td>
                <td
                  colSpan={3}
                  className="px-1 py-0.5 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Harga&nbsp;(Rp)
                </td>
                <td className="px-1 py-0.5 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(subtotalHarga)}
                </td>
                <td
                  colSpan={1}
                  className="px-1 py-0.5 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total HPP
                </td>
                <td className="px-1 py-0.5 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(subtotalHPP)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* paging */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4"
          aria-label="Table navigation"
        >
          <div className="flex items-center space-x-2 mb-2">
            <label className="text-xs text-gray-700">Tampilkan:</label>
            <select
              value={itemsPerPagePreview}
              onChange={(e) => {
                setItemsPerPagePreview(Number(e.target.value));
                setCurrentPagePreview(1);
              }}
              className="border border-gray-300 rounded-md text-xs p-1"
            >
              {[500, 1000, 1500, 2000].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-normal text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {indexOfFirst + 1}-{Math.min(indexOfLast, processedData.length)}
            </span>{" "}
            of
            <span className="font-semibold text-gray-900">
              {" "}
              {processedData.length}{" "}
            </span>
          </span>
          <ul className="inline-flex -space-x-px">
            <li>
              <button
                onClick={() => setCurrentPagePreview((p) => p - 1)}
                disabled={currentPagePreview === 1}
                className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-500 text-xs bg-white rounded-l-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPagePreview === 1
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPagePreview((p) => p + 1)}
                disabled={currentPagePreview === totalPages}
                className={`flex items-center justify-center py-1 px-1 text-gray-500 text-xs bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPagePreview === totalPages
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
    </div>
  );
}
