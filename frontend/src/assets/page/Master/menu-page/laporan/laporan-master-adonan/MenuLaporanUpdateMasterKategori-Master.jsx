import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMasterAdonan,
  getMasterAdonanProduk,
  getMasterDetailAdonan,
  getLaporanStokBarangAll,
  updateDetailAdonan,
  deleteMasterAdonanProduk,
} from "../../../../../services/apiService";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import LogoSave from "../../../../../image/icon/logo-save.svg";
import LogoPlus from "../../../../../image/icon/logo-plus.svg";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";
import Error from "../../../../component/Error";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function FilterSelect({ label, options, value, onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const matched = options.find((opt) => opt.value === value);
    setInputValue(matched ? matched.label : "");
  }, [value, options]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setInputValue(option.label);
    onChange(option.value); // ⬅️ Kembalikan hanya value
    setShowOptions(false);
  };

  return (
    <div className="relative w-full text-xs" ref={wrapperRef}>
      {label && (
        <label className="block text-blue-900 font-semibold text-xs mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        className="border border-gray-300 text-xs rounded bg-gray-100 p-1 w-full"
        value={inputValue}
        onChange={(e) => !disabled && setInputValue(e.target.value)}
        onFocus={() => !disabled && setShowOptions(true)}
        placeholder="Ketik atau pilih..."
        disabled={disabled}
      />
      {showOptions && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1 shadow-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(option)}
                className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-2 py-1 text-gray-500">Tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function MenuInsertMasterDataBarangMaster() {
  const { id: paramId, id_kategori_adonan_produk } = useParams();
  const id = paramId || id_kategori_adonan_produk;

  const [dataAdonan, setDataAdonan] = useState(null);
  const [bahanRows, setBahanRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const [selectedId, setSelectedId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTermBahan, setSearchTermBahan] = useState("");
  const [currentPageBahan, setCurrentPageBahan] = useState(1);
  const [itemsPerPageBahan, setItemsPerPageBahan] = useState(25);
  const [stokBarangData, setStokBarangData] = useState([]);
  const isNamaAdonanValid =
    dataAdonan?.nama_kategori_adonan_produk?.trim() !== "";
  useEffect(() => {
    const fetchStokBarang = async () => {
      try {
        const result = await getLaporanStokBarangAll();
        // console.log("Stok Barang:", result);
        setStokBarangData(
          Array.isArray(result) ? result : Object.values(result)
        );
      } catch (err) {
        console.error("Gagal ambil stok bahan:", err);
      }
    };
    fetchStokBarang();
  }, []);

  const handleAddRow = () => {
    setBahanRows((prev) => [
      ...prev,
      {
        id_adonan_produk: null, // penting agar backend tahu ini data baru
        id_bahan_baku: "",
        nama_kategori_bahan_baku: "",
        kode_bahan_baku: "",
        nama_bahan_baku: "",
        jumlah_kebutuhan: "",
        stok_bahan_baku: 0,
        harga_beli_barang: 0,
        total_harga: 0,
        biaya_total_adonan: 0,
        nama_satuan: "",
        id_satuan: "",
      },
    ]);
  };

  const handleRowChange = (index, field, value) => {
    setBahanRows((prev) => {
      const updated = [...prev];
      updated[index][field] = value;

      // Auto isi field lain jika kode atau nama diubah
      if (["kode_bahan_baku", "nama_bahan_baku"].includes(field)) {
        const match = stokBarangData.find((item) =>
          field === "kode_bahan_baku"
            ? item.kode_bahan_baku === value
            : item.nama_bahan_baku === value
        );
        if (match) {
          updated[index] = {
            ...updated[index],
            id_bahan_baku: match.id_bahan_baku,
            kode_bahan_baku: match.kode_bahan_baku,
            nama_bahan_baku: match.nama_bahan_baku,
            nama_kategori_bahan_baku: match.nama_kategori_bahan_baku,
            id_kategori_bahan_baku: match.id_kategori_bahan_baku,
            id_satuan: match.id_satuan,
            nama_satuan: match.nama_satuan,
            stok_bahan_baku: match.stok_bahan_baku,
            harga_beli_barang: match.harga_beli_barang,
            status_bahan_baku: match.status,
          };
        }
      }

      // Rehitung total harga jika jumlah diubah
      if (field === "jumlah_kebutuhan") {
        const jumlah = parseFloat(value) || 0;
        const harga = parseFloat(updated[index].harga_beli_barang || 0);
        updated[index].total_harga = jumlah * harga;
        updated[index].biaya_total_adonan = jumlah * harga;
      }

      return updated;
    });
  };

  const formatRupiah = (number) => {
    if (number == null || isNaN(number)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(
      date.getMonth() + 1
    )}/${date.getFullYear()}, ${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}:${pad(date.getSeconds())}`;
  };

  const formatDateOnly = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const adonanRes = await getMasterAdonan();
        // console.log("adonanRes", adonanRes);
        const adonanList = Array.isArray(adonanRes)
          ? adonanRes
          : Object.values(adonanRes);
        const master = adonanList.find(
          (r) => String(r.id_kategori_adonan_produk) === String(id)
        );
        if (!master) throw new Error(`Adonan ${id} tidak ditemukan.`);
        setDataAdonan(master);

        const detailRes = await getMasterDetailAdonan();
        // console.log("detailRes", detailRes);
        const detailList = Array.isArray(detailRes)
          ? detailRes
          : Object.values(detailRes);
        setBahanRows(
          detailList
            .filter((r) => String(r.id_kategori_adonan_produk) === String(id))
            .map((r) => ({
              ...r,
              id_adonan_produk: r.id_adonan_produk ?? null,
              status: r.status ?? 0, // ⬅️ tambahkan ini agar bisa dibaca di table
            }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // filter
  const filteredBahan = useMemo(() => {
    if (!searchTermBahan) return bahanRows;
    const q = searchTermBahan.toLowerCase();
    return bahanRows.filter((r) => r.nama_bahan_baku.toLowerCase().includes(q));
  }, [bahanRows, searchTermBahan]);

  // pagination
  const lastIdx = currentPageBahan * itemsPerPageBahan;
  const firstIdx = lastIdx - itemsPerPageBahan;
  const currentItems = filteredBahan.slice(firstIdx, lastIdx);
  const totalPages = Math.ceil(filteredBahan.length / itemsPerPageBahan);
  const paginate = (p) => setCurrentPageBahan(p);

  const exportExcel = () => {
    if (!currentItems.length) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const fn = `ResepBahanBaku-${dataAdonan.nama_kategori_adonan_produk}-${now}.xlsx`;
    const ws = XLSX.utils.json_to_sheet(
      currentItems.map((it, i) => ({
        No: firstIdx + i + 1,
        Lokasi: it.nama_lokasi,
        Adonan: dataAdonan.nama_kategori_adonan_produk,
        Kategori: it.nama_kategori_bahan_baku,
        Kode: it.kode_bahan_baku,
        Nama: it.nama_bahan_baku,
        Jumlah: it.jumlah_kebutuhan,
        Satuan: it.nama_satuan,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BahanBaku");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), fn);
    setAlert({ message: "Export berhasil!", type: "success", visible: true });
    setTimeout(() => setAlert((a) => ({ ...a, visible: false })), 2000);
  };

  const handleSimpanAdonan = async () => {
    try {
      const token = localStorage.getItem("token"); // atau ambil dari props/context
      if (!token) throw new Error("Token tidak ditemukan");

      const payload = {
        id_user: dataAdonan.createby,
        data: bahanRows
          .filter((r) => r.id_bahan_baku && r.jumlah_kebutuhan > 0)
          .map((r) => ({
            id_adonan_produk: r.id_adonan_produk || null, // pastikan ikut
            id_bahan_baku: r.id_bahan_baku,
            id_kategori_adonan_produk: dataAdonan.id_kategori_adonan_produk,
            jumlah_kebutuhan: parseFloat(r.jumlah_kebutuhan),
            status: dataAdonan.status ?? 0,
          })),
      };

      if (payload.data.length === 0) {
        setAlert({
          message: "Minimal 1 bahan baku valid harus diisi.",
          type: "error",
          visible: true,
        });
        return;
      }

      const result = await updateDetailAdonan(token, payload);

      if (result.success) {
        setAlert({
          message: result.message || "Berhasil disimpan.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert((a) => ({ ...a, visible: false }));
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.message || "Gagal menyimpan data.");
      }
    } catch (err) {
      setAlert({
        message: err.message || "Terjadi kesalahan saat menyimpan.",
        type: "error",
        visible: true,
      });
    }
  };
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan");

      const result = await deleteMasterAdonanProduk(selectedId, token);

      if (result.success) {
        setAlert({
          message: result.message || "Data berhasil dihapus.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert((a) => ({ ...a, visible: false }));
          window.location.reload();
        }, 2000);
        // Hapus dari tampilan bahanRows
        setBahanRows((prev) =>
          prev.filter((row) => row.id_adonan_produk !== selectedId)
        );
      } else {
        throw new Error(result.message || "Gagal menghapus data.");
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

  const handleDeleteClick = (id_adonan_produk) => {
    if (!id_adonan_produk) {
      setAlert({
        message: "ID adonan tidak valid.",
        type: "error",
        visible: true,
      });
      return;
    }
    setSelectedId(id_adonan_produk);
    setIsDialogOpen(true);
  };

  const cancelDelete = () => {
    setIsDialogOpen(false);
    setSelectedId(null);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14">
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((a) => ({ ...a, visible: false }))}
        />
      )}

      {/* HEADER */}

      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
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
            to="/dashboard/master/menu/laporan/adonan"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan Adonan
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
            to=""
            className="text-xs font-semibold text-gray-400"
          >
            Laporan Detail Adonan
          </Link>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-sm rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* DETAIL MASTER */}
      <div className="bg-white flex rounded-md shadow-md p-3 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Detail Adonan</p>
        <Link to="/dashboard/master/menu/laporan/adonan">
          <button className="cetakpdf h-6 rounded-md flex text-sm items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
            <p className="p-2">Back</p>
          </button>
        </Link>
      </div>

      {/* Info Adonan */}
      <fieldset className="border w-fit border-blue-400 rounded p-2 text-xs mb-2">
        <legend className="px-1 text-sm font-bold text-blue-900">
          Info Produk
        </legend>
        <div className="flex-row w-full gap-4 text-xs">
          <div className="flex w-full gap-1">
            <div>
              <label className="block font-medium text-blue-900">
                Nama Adonan:
              </label>
              <input
                readOnly
                value={dataAdonan.nama_kategori_adonan_produk}
                className="mt-1 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">
                Dibuat Oleh:
              </label>
              <input
                readOnly
                value={dataAdonan.nama_user}
                className="mt-1 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
          </div>
          <div className="flex w-full gap-1">
            <div>
              <label className="block font-medium text-blue-900">
                Dibuat Tanggal:
              </label>
              <input
                readOnly
                value={formatDateOnly(dataAdonan.createat)}
                className="mt-1 w-52 border text-sm border-gray-300 rounded p-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-medium text-blue-900">Status:</label>
              <input
                readOnly
                value={dataAdonan.status === 0 ? "aktif" : "tidak aktif"}
                className={`
                  mt-1 w-full border uppercase text-sm border-gray-300 rounded p-1 text-right
                  ${
                    dataAdonan.status === 1
                      ? "bg-red-500 text-white"
                      : "bg-lime-500"
                  }
                `}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Search + Export */}
      <div className="bg-white mt-2 rounded-md border border-gray-200 shadow-md p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-md font-semibold text-blue-900 absolute left-1">
            Detail Bahan Baku
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
                onChange={(e) => {
                  setSearchTermBahan(e.target.value);
                  setCurrentPageBahan(1);
                }}
              />
            </div>
          </div>
          <div className="absolute w-fit flex right-1 gap-1 items-center justify-center">
            {/* <div
              className="w-fit flex right-1 items-center justify-center bg-blue-900 rounded-md p-0.5 cursor-pointer"
              onClick={handleSimpanAdonan}
            >
              <button className="h-9 w-8 rounded-md flex items-center justify-center text-white">
                <img src={LogoSave} className="w-8 h-8" alt="Export to Excel" />
              </button>
              <p className="text-xs p-1 font-semibold text-white">Simpan</p>
            </div> */}
            <div
            className="w-fit flex right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={exportExcel}
            >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-900 border-collapse">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  No
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Kategori Bahan Baku
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Kode Bahan Baku
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Nama Bahan Baku
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Jumlah Stok
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Jml. Kebutuhan
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Harga Beli
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Total Harga
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Total Biaya Adonan
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Input Oleh
                </th>
                <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Tanggal
                </th>
                {/* <th className="px-1 py-0.5 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Action
                </th> */}
              </tr>
            </thead>
            <tbody>
              {bahanRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-gray-100 ${
                    row.status === 1
                      ? "bg-red-500 hover:bg-red-400 text-gray-800"
                      : ""
                  }`}
                >
                  <td className="px-1 py-0.5 border border-gray-700 text-center">
                    {idx + 1}
                  </td>

                  {/* Kategori */}
                  <td className="px-1 py-0.5 border border-gray-700">
                    <FilterSelect
                      value={row.nama_kategori_bahan_baku}
                      options={[
                        ...new Set(
                          stokBarangData.map((d) => d.nama_kategori_bahan_baku)
                        ),
                      ].map((k) => ({
                        value: k,
                        label: k,
                      }))}
                      onChange={(val) =>
                        handleRowChange(idx, "nama_kategori_bahan_baku", val)
                      }
                      disabled={row.status === 1}
                    />
                  </td>

                  {/* Kode */}
                  <td className="px-1 py-0.5 border border-gray-700">
                    <FilterSelect
                      value={row.kode_bahan_baku}
                      options={stokBarangData
                        .filter(
                          (d) =>
                            d.nama_kategori_bahan_baku ===
                            row.nama_kategori_bahan_baku
                        )
                        .map((d) => ({
                          value: d.kode_bahan_baku,
                          label: d.kode_bahan_baku,
                        }))}
                      onChange={(val) =>
                        handleRowChange(idx, "kode_bahan_baku", val)
                      }
                      disabled={row.status === 1}
                    />
                  </td>

                  {/* Nama */}
                  <td className="px-1 py-0.5 border border-gray-700">
                    <FilterSelect
                      value={row.nama_bahan_baku}
                      options={stokBarangData
                        .filter(
                          (d) =>
                            d.nama_kategori_bahan_baku ===
                            row.nama_kategori_bahan_baku
                        )
                        .map((d) => ({
                          value: d.nama_bahan_baku,
                          label: d.nama_bahan_baku,
                        }))}
                      onChange={(val) =>
                        handleRowChange(idx, "nama_bahan_baku", val)
                      }
                      disabled={row.status === 1}
                    />
                  </td>

                  {/* Stok */}
                  <td className="px-1 py-0.5 border border-gray-700 text-right">
                    {row.stok_bahan_baku} {row.nama_satuan}
                  </td>

                  {/* Jumlah Kebutuhan */}
                  <td className="px-1 py-0.5 border border-gray-700">
                    <input
                      type="number"
                      className="w-full border border-gray-300 text-xs rounded p-1"
                      value={row.jumlah_kebutuhan}
                      onChange={(e) =>
                        handleRowChange(idx, "jumlah_kebutuhan", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      disabled={row.status === 1}
                    />
                  </td>

                  {/* Harga Beli */}
                  <td className="px-1 py-0.5 border border-gray-700 text-right">
                    {parseFloat(row.harga_beli_barang || 0).toLocaleString(
                      "id-ID",
                      {
                        style: "currency",
                        currency: "IDR",
                      }
                    )}
                  </td>

                  {/* Total Harga */}
                  <td className="px-1 py-0.5 border border-gray-700 text-right">
                    {parseFloat(row.total_harga || 0).toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })}
                  </td>

                  {/* Biaya Adonan */}
                  <td className="px-1 py-0.5 border border-gray-700 text-right">
                    {parseFloat(row.biaya_total_adonan || 0).toLocaleString(
                      "id-ID",
                      {
                        style: "currency",
                        currency: "IDR",
                      }
                    )}
                  </td>

                  <td className="px-1 py-0.5 border border-gray-700">
                    {row.nama_user || "-"}
                  </td>
                  <td className="px-1 py-0.5 border border-gray-700">
                    {formatDate(row.createat)}
                  </td>
                  {/* <td className="px-1 py-0.5 border border-gray-700 text-center">
                    {row.id_adonan_produk && (
                      <button
                        onClick={() => handleDeleteClick(row.id_adonan_produk)}
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
                    )}
                  </td> */}
                </tr>
              ))}

              {/* Row Tambah */}
              {/* <tr>
                <td className="border text-center justify-center flex">
                  <button
                    type="button"
                    className={`w-6 h-6 rounded flex justify-center items-center ${
                      isNamaAdonanValid
                        ? "bg-blue-900 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    } transition`}
                    onClick={() => {
                      if (isNamaAdonanValid) handleAddRow();
                    }}
                    title="Tambah Bahan Baku"
                  >
                    <img src={LogoPlus} className="h-4 w-4" alt="" />
                  </button>
                </td>
                <td
                  colSpan={10}
                  className="border px-2 py-1 text-gray-400 italic"
                >
                  Tambah bahan baku baru,{" "}
                  <span className="text-red-400">
                    minimal 2 bahan baku dari adonan
                  </span>
                </td>
              </tr> */}
            </tbody>
          </table>
        </div>

        {/* Subtotal Table */}
        <div className="mt-1">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Biaya Adonan
                </td>
                <td className="px-1 py-0.5 border border-gray-500 font-semibold bg-lime-400">
                  {formatRupiah(
                    filteredBahan.reduce(
                      (sum, r) => sum + Number(r.biaya_total_adonan),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-500 font-semibold text-right uppercase bg-gray-300"
                >
                  Total Jumlah Kebutuhan
                </td>
                <td className="px-1 py-0.5 border border-gray-500 font-semibold bg-lime-400">
                  {filteredBahan.reduce(
                    (sum, r) => sum + Number(r.jumlah_kebutuhan || 0),
                    0
                  ) + " GR"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
          aria-label="Table navigation"
        >
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-xs text-gray-700">
              Tampilkan:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPageBahan}
              onChange={(e) => {
                setItemsPerPageBahan(Number(e.target.value));
                setCurrentPageBahan(1);
              }}
              className="border border-gray-300 rounded text-xs p-1"
            >
              {[5, 25, 50, 100, 250, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {firstIdx + 1}–{Math.min(lastIdx, filteredBahan.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredBahan.length}
            </span>
          </span>

          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPageBahan - 1)}
                disabled={currentPageBahan === 1}
                className={
                  `px-2 py-1 text-xs border border-gray-300 rounded-l bg-white hover:bg-gray-100 ` +
                  (currentPageBahan === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "")
                }
              >
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPageBahan + 1)}
                disabled={currentPageBahan === totalPages}
                className={
                  `px-2 py-1 text-xs border border-gray-300 rounded-r bg-white hover:bg-gray-100 ` +
                  (currentPageBahan === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "")
                }
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
