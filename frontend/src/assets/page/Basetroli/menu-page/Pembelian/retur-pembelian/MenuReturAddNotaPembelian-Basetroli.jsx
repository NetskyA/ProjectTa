import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getHeaderNotaPembelianBarang,
  getDetailNotaPembelianBarang,
  getLaporanMasterDepo,
  getLaporanMasterToko, // pastikan fungsi ini sudah tersedia di apiService
  insertReturPembelianBarang,
} from "../../../../../services/apiService.js";
import DialogRetur from "../../../../component/DialogTrueFalse.jsx";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Alert from "../../../../component/Alert.jsx";
import Loading from "../../../../component/Loading.jsx";
import Error from "../../../../component/Error.jsx";
import IconDelete from "../../../../../image/icon/logo-delete.svg";

// Komponen FilterSelect Kustom (untuk pilihan berbasis string)
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
          className="absolute top-6 right-2 text-red-600 text-sm"
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

export default function MenuReturNotaDetailPembelianBesttroli() {
  // Header Pembelian
  const [headerOptions, setHeaderOptions] = useState([]);
  const [headerList, setHeaderList] = useState([]);
  const [selectedKodePembelian, setSelectedKodePembelian] = useState("");

  // Detail Pembelian
  const [detailOptions, setDetailOptions] = useState([]);
  const [barangOptions, setBarangOptions] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState("");

  // Tabel data retur yang akan ditambahkan
  const [tableRows, setTableRows] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Dropdown Supplier (Depo)
  const [masterDepo, setMasterDepo] = useState([]);
  const [selectedDepo, setSelectedDepo] = useState("");

  // Tambahan: Master Toko
  const [masterToko, setMasterToko] = useState([]);

  // Satuan Retur (tetap)
  const [satuanRetur] = useState("Satuan Kecil");

  // Kode Retur is intentionally not sent from the frontend
  const [kodeRetur, setKodeRetur] = useState(""); // Not used
  const createBy = useSelector((state) => state.auth.username);

  // Dialog Retur
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  // Ambil id_user & id_toko dari Redux
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = parseInt(useSelector((state) => state.auth.id_toko), 10);

  // Ambil data Header Pembelian
  useEffect(() => {
    const fetchHeaderPembelian = async () => {
      try {
        setLoading(true);
        const response = await getHeaderNotaPembelianBarang(token);
        const allData = response ? Object.values(response) : [];
        // Filter by id_toko jika diperlukan
        const filteredData = allData.filter(
          (item) => parseInt(item.id_toko, 10) === id_toko
        );
        setHeaderOptions(filteredData);

        // Buat list kode_pembelian
        const list = filteredData.map((opt) => opt.kode_pembelian);
        const uniqueList = [...new Set(list)];
        setHeaderList(uniqueList);
      } catch (err) {
        console.error("Error mengambil header pembelian:", err);
        setError(err.message || "Gagal mengambil data header pembelian.");
      } finally {
        setLoading(false);
      }
    };
    fetchHeaderPembelian();
  }, [token, id_toko]);

  // Ambil data Detail Pembelian
  useEffect(() => {
    const fetchDetailPembelian = async () => {
      try {
        const response = await getDetailNotaPembelianBarang(token);
        const allDetail = response ? Object.values(response) : [];
        const filteredDetail = allDetail.filter(
          (item) => parseInt(item.id_toko, 10) === id_toko
        );
        setDetailOptions(filteredDetail);
      } catch (err) {
        console.error("Error mengambil detail pembelian:", err);
      }
    };
    fetchDetailPembelian();
  }, [token, id_toko]);

  // Ambil data Master Depo (Supplier)
  useEffect(() => {
    const fetchMasterDepo = async () => {
      try {
        const response = await getLaporanMasterDepo(token);
        const depoArr = response ? Object.values(response) : [];
        setMasterDepo(depoArr);
        if (depoArr.length > 0) {
          setSelectedDepo(depoArr[0].id_depo); // pre-select item pertama
        }
      } catch (err) {
        console.error("Error mengambil data depo:", err);
        setError(err.message || "Gagal mengambil data depo.");
      }
    };
    fetchMasterDepo();
  }, [token]);

  // Ambil data Master Toko (untuk mencocokan id_toko)
  useEffect(() => {
    const fetchMasterToko = async () => {
      try {
        const response = await getLaporanMasterToko(token);
        const tokoArr = response ? Object.values(response) : [];
        setMasterToko(tokoArr);
      } catch (err) {
        console.error("Error mengambil data master toko:", err);
        setError(err.message || "Gagal mengambil data master toko.");
      }
    };
    fetchMasterToko();
  }, [token]);

  // Update dropdown Barang berdasarkan Kode Pembelian yang dipilih
  useEffect(() => {
    if (selectedKodePembelian) {
      // Temukan header yang dipilih
      const selectedHeader = headerOptions.find(
        (opt) => opt.kode_pembelian === selectedKodePembelian
      );
      if (selectedHeader) {
        // Filter detail yang sesuai dengan id_header_pembelian
        const filteredBarang = detailOptions.filter(
          (item) =>
            parseInt(item.id_header_pembelian, 10) ===
            parseInt(selectedHeader.id_header_pembelian, 10)
        );
        // Map ke format "kode_barang - namabarang"
        const list = filteredBarang.map(
          (item) => `${item.kode_barang} - ${item.namabarang}`
        );
        setBarangOptions(list);

        // Jika hanya satu item, auto-select
        if (list.length === 1) {
          setSelectedBarang(list[0]);
        } else {
          setSelectedBarang("");
        }
      }
    } else {
      setBarangOptions([]);
      setSelectedBarang("");
    }
  }, [selectedKodePembelian, headerOptions, detailOptions]);

  // Fungsi untuk menambahkan baris ke tabel retur
  const handleAddRow = () => {
    if (!selectedKodePembelian) {
      setAlert({
        message: "Pilih kode pembelian terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 3000);
      return;
    }
    if (barangOptions.length > 1 && !selectedBarang) {
      setAlert({
        message: "Pilih kode barang / nama barang terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 3000);
      return;
    }
    // Temukan header yang dipilih
    const selectedHeader = headerOptions.find(
      (opt) => opt.kode_pembelian === selectedKodePembelian
    );
    // Temukan item detail
    const selectedDetail = detailOptions.find((item) => {
      if (!selectedHeader) return false;
      if (
        parseInt(item.id_header_pembelian, 10) !==
        parseInt(selectedHeader.id_header_pembelian, 10)
      )
        return false;
      const formattedBarang = `${item.kode_barang} - ${item.namabarang}`;
      if (barangOptions.length > 1) {
        return formattedBarang === selectedBarang;
      }
      return true;
    });

    if (selectedHeader && selectedDetail) {
      // Cari data toko yang cocok dari masterToko berdasarkan id_toko
      const matchingToko = masterToko.find(
        (toko) =>
          parseInt(toko.id_toko, 10) ===
          parseInt(selectedHeader.id_toko, 10)
      );
      // Tambahkan field kode_toko dari hasil matching atau fallback ke id_toko
      const newRow = {
        ...selectedDetail,
        qtyReturBeli: "",
        kode_pembelian: selectedHeader.kode_pembelian,
        nama_toko: selectedHeader.nama_toko,
        // simpan kode_toko yang didapat dari masterToko
        kode_toko: matchingToko ? matchingToko.kode_toko : selectedHeader.id_toko,
      };
      setTableRows((prevRows) => [...prevRows, newRow]);

      // Reset pilihan
      setSelectedKodePembelian("");
      setBarangOptions([]);
      setSelectedBarang("");
    } else {
      setAlert({
        message: "Data kode pembelian atau barang tidak ditemukan.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 3000);
    }
  };

  // Hapus baris
  const handleDeleteRow = (indexToRemove) => {
    setTableRows((prevRows) =>
      prevRows.filter((_, index) => index !== indexToRemove)
    );
  };

  // Ubah input qtyReturBeli per baris
  const handleQtyChange = (index, rawValue) => {
    setTableRows((prevRows) =>
      prevRows.map((row, i) => {
        if (i === index) {
          if (rawValue === "") return { ...row, qtyReturBeli: "" };
          const newQty = parseInt(rawValue, 10);
          if (isNaN(newQty)) return row;
          if (newQty < 1) {
            setAlert({
              message: "Qty Retur harus lebih dari 0.",
              type: "warning",
              visible: true,
            });
            setTimeout(
              () => setAlert((prev) => ({ ...prev, visible: false })),
              3000
            );
            return row;
          }
          return { ...row, qtyReturBeli: rawValue };
        }
        return row;
      })
    );
  };

  // Refresh halaman
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    window.location.reload();
  };

  // Export PDF
  const handleExportPDF = () => {
    try {
      if (tableRows.length === 0) {
        setAlert({
          message: "Tidak ada data untuk diekspor.",
          type: "warning",
          visible: true,
        });
        return;
      }
      const doc = new jsPDF("p", "mm", "a4");
      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      doc.setFontSize(10);
      doc.text("RETUR PEMBELIAN", 105, 10, { align: "center" });
      doc.setFontSize(8);

      doc.text(`Tanggal: ${currentDate}`, 10, 26);
      const tableBody = tableRows.map((row) => [
        row.kode_pembelian || "-",
        row.nama_toko || "-",
        row.kode_barang || "-",
        row.namabarang || "-",
        row.nama_depo || "-",
        row.qtyBeli !== undefined ? row.qtyBeli : "-",
        row.harga_beli !== undefined ? row.harga_beli : "-",
        row.subtotal_harga !== undefined ? row.subtotal_harga : "-",
        row.qtyReturBeli !== undefined ? row.qtyReturBeli : "-",
      ]);
      doc.autoTable({
        head: [
          [
            "Kode Pembelian",
            "Nama Toko",
            "Kode Barang",
            "Nama Barang",
            "Supplier",
            "Qty Beli",
            "Harga Beli",
            "Subtotal",
            "Qty Retur Beli",
          ],
        ],
        body: tableBody,
        startY: 32,
        styles: { fontSize: 6 },
      });
      doc.save(`Retur.pdf`);
    } catch (error) {
      console.error("Error saat mengekspor PDF:", error);
      setAlert({
        message: "Gagal melakukan proses ekspor PDF.",
        type: "warning",
        visible: true,
      });
    }
  };

  // Buka dialog retur
  const handleOpenReturDialog = () => {
    if (tableRows.length === 0) {
      setAlert({
        message: "Wajib menambahkan data terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      return;
    }
    if (!selectedDepo) {
      setAlert({
        message: "Supplier harus dipilih.",
        type: "warning",
        visible: true,
      });
      return;
    }
    // Cek bahwa setiap baris memiliki qtyReturBeli > 0
    const invalidRow = tableRows.find(
      (row) => !row.qtyReturBeli || parseInt(row.qtyReturBeli, 10) < 1
    );
    if (invalidRow) {
      setAlert({
        message: "Setiap baris harus memiliki Qty Retur Beli lebih dari 0.",
        type: "warning",
        visible: true,
      });
      return;
    }
    setIsDialogOpen(true);
  };

  // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Konfirmasi retur: panggil insertReturPembelianBarang
  const handleConfirmRetur = async () => {
    setIsDialogOpen(false);
    try {
      // Buat payload tiap baris, sertakan kode_toko yang telah dicocokkan
      const itemsPayload = tableRows.map((row) => ({
        id_toko: row.id_toko, // tetap kirim id_toko untuk proses insert detail
        kode_toko: row.kode_toko, // gunakan kode_toko untuk update stok barang
        id_header_pembelian: row.id_header_pembelian,
        kode_pembelian: row.kode_pembelian,
        kode_barang: row.kode_barang,
        qtyBeli: parseInt(row.qtyBeli, 10),
        qtyReturBeli: parseInt(row.qtyReturBeli, 10),
        id_depo: parseInt(selectedDepo, 10),
      }));

      // Construct the request body
      const userData = {
        createBy: parseInt(id_user, 10),
        items: itemsPayload,
      };

      // Call service
      const response = await insertReturPembelianBarang(userData, token);

      if (response.success) {
        setAlert({
          message: "Retur pembelian berhasil disimpan.",
          type: "success",
          visible: true,
        });
        // Redirect setelah timeout
        setTimeout(() => {
          navigate("/dashboard/basetroli/menu/notaretur/pembelian");
        }, 2000);
      } else {
        setAlert({
          message: response.message,
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      setAlert({
        message: error.message || "Gagal menyimpan retur pembelian.",
        type: "error",
        visible: true,
      });
    }
  };

  // Batal retur
  const handleCancelRetur = () => {
    setIsDialogOpen(false);
    setAlert({
      message: "Proses retur dibatalkan.",
      type: "warning",
      visible: true,
    });
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {/* Alert Global */}
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert((prev) => ({ ...prev, visible: false }))
          }
        />
      )}

      {/* Dialog Retur */}
      <DialogRetur
        isOpen={isDialogOpen}
        title="Konfirmasi Retur"
        message="Apakah Anda yakin ingin melanjutkan proses retur ini?"
        onConfirm={handleConfirmRetur}
        onCancel={handleCancelRetur}
      />

      {/* Breadcrumb & Tombol Refresh */}
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
          <Link
            to="/dashboard/basetroli/menu/notaretur/pembelian"
            className="text-xs font-semibold text-blue-900"
          >
            Retur Pembelian
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
            Tambah Retur Pembelian
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

      {/* Header Form */}
      <div className="bg-white rounded-md shadow-md p-2 mb-1 border border-gray-200">
        <h1 className="text-md font-bold text-blue-900 mb-1">
          Form Retur Pembelian
        </h1>
        <div className="flex w-fit gap-4 bg-gray-100 p-1 rounded-md shadow-md">
          <div className="flex flex-col md:flex-row gap-1">
            <FilterSelect
              label="Kode Pembelian:"
              options={headerList}
              value={selectedKodePembelian}
              onChange={setSelectedKodePembelian}
            />
            <FilterSelect
              label="Kode Barang / Nama Barang:"
              options={barangOptions}
              value={selectedBarang}
              onChange={setSelectedBarang}
            />
            {/* Tombol Tambah */}
            <div className="flex items-end text-center">
              <button
                onClick={handleAddRow}
                className="w-16 h-7 text-xs rounded-md border-2 text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
              >
                Tambah
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-1">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-900 mb-1">
                Supplier:
              </label>
              <select
                id="supplier"
                className="border border-gray-300 text-xs rounded p-1 w-32"
                value={selectedDepo}
                onChange={(e) => setSelectedDepo(e.target.value)}
              >
                {masterDepo.map((depo) => (
                  <option key={depo.id_depo} value={depo.id_depo}>
                    {depo.nama_depo}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-900 mb-1">
                Satuan:
              </label>
              <select
                value={satuanRetur}
                className="border border-gray-300 text-xs rounded p-1 bg-gray-100"
                disabled
              >
                <option value="Satuan Besar">CRT</option>
                <option value="Satuan Sedang">LSN</option>
                <option value="Satuan Kecil">PCS</option>
              </select>
            </div>
          </div>
        </div>
        <p className="italic text-red-600 pt-1" style={{ fontSize: "0.60rem" }}>
          *Pastikan data retur memiliki kode pembelian yang sesuai
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleOpenReturDialog}
            className="w-16 h-7 text-xs rounded-md border-2 font-semibold text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-2 mb-4">
        <h2 className="text-md font-bold text-blue-900 mb-2">
          Data Pembelian Terpilih
        </h2>
        <div className="overflow-x-auto" style={{ maxHeight: "40vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200 sticky top-0">
              <tr>
                <th className="px-1 py-0.5 border border-gray-500">No</th>
                <th className="px-1 py-0.5 border border-gray-500">Kode Pembelian</th>
                <th className="px-1 py-0.5 border border-gray-500">Nama Toko</th>
                <th className="px-1 py-0.5 border border-gray-500">Kode Barang</th>
                <th className="px-1 py-0.5 border border-gray-500">Nama Barang</th>
                <th className="px-1 py-0.5 border border-gray-500">Supplier</th>
                <th className="px-1 py-0.5 border border-gray-500">Qty Pembelian</th>
                <th className="px-1 py-0.5 border border-gray-500">Harga Beli</th>
                <th className="px-1 py-0.5 border border-gray-500">Subtotal</th>
                <th className="px-1 py-0.5 border border-gray-500">Qty Retur Pembelian</th>
                <th className="px-1 py-0.5 border border-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length > 0 ? (
                tableRows
                  .slice(indexOfFirstItem, indexOfLastItem)
                  .map((row, index) => (
                    <tr
                      key={`${row.kode_pembelian}-${index}`}
                      className="text-gray-900"
                    >
                      <td className="px-1 py-0.5 border border-gray-500">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.kode_pembelian || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.nama_toko || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.kode_barang || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.namabarang || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.nama_depo || "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.qtyBeli !== undefined ? row.qtyBeli : "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.harga_beli !== undefined
                          ? formatRupiah(row.harga_beli)
                          : "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        {row.subtotal_harga !== undefined
                          ? formatRupiah(row.subtotal_harga)
                          : "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        <input
                          type="text"
                          placeholder="0"
                          value={row.qtyReturBeli}
                          onChange={(e) => {
                            const onlyDigits = e.target.value.replace(/[^\d]/g, "");
                            handleQtyChange(index, onlyDigits);
                          }}
                          className="border border-gray-700 text-xs rounded p-1 w-20"
                        />
                      </td>
                      <td className="px-1 py-0.5 border border-gray-500">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteRow(index)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            <img
                              src={IconDelete}
                              className="w-4 h-4"
                              alt="delete"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-2 text-center text-gray-500 border">
                    Tidak ada data yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
