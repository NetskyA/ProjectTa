import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getResultReturBfrDetailNotaPenjualanAll,
  getMasterGudang,
  returNotaPenjualan,
  getResultReturDetailNotaPenjualanAll,
} from "../../../../services/apiService.js";
import DialogRetur from "../../../component/DialogTrueFalse.jsx"; // <-- Import DialogRetur
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import LogoPDF from "../../../../image/icon/pdf2-svgrepo.svg";
import Alert from "../../../component/Alert.jsx";
import Loading from "../../../component/Loading.jsx";
import Error from "../../../component/Error.jsx";

// Komponen FilterSelect Kustom
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
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
          className="absolute top-5 right-2 text-red-500 text-md"
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

export default function MenuReturNotaDetailPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [masterGudang, setMasterGudang] = useState([]);

  // State untuk menampung result retur
  const [resultData, setResultData] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [loadingGudang, setLoadingGudang] = useState(true);
  const [loadingResult, setLoadingResult] = useState(true);
  const [error, setError] = useState(null);
  const [errorGudang, setErrorGudang] = useState(null);
  const [errorResult, setErrorResult] = useState(null);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // State form retur
  const [gudangTujuan, setGudangTujuan] = useState("");
  const [qtyRetur, setQtyRetur] = useState(0);
  const [satuanRetur, setSatuanRetur] = useState("Satuan Besar");

  // State tambahan
  const [kodeRetur, setKodeRetur] = useState("");
  const [status, setStatus] = useState(0);
  const createBy = useSelector((state) => state.auth.username);

  // State untuk menampilkan dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const navigate = useNavigate();
  // Gunakan parameter id_retur dari URL
  const { id_retur } = useParams();
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  // Ambil id_user dari Redux state (jika dibutuhkan)
  const id_user = useSelector((state) => state.auth.id_user);

  // Filter tambahan (berlaku untuk kedua tabel)
  const [packingListFilter, setPackingListFilter] = useState("");
  const [notaJualFilter, setNotaJualFilter] = useState("");
  const [noPemesananFilter, setNoPemesananFilter] = useState("");
  const [marketPlaceFilter, setMarketPlaceFilter] = useState("");

  // Search, Pagination, Sorting untuk tabel Sebelum Retur Penjualan
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ---------------------------------------------
  //  USEEFFECT: FETCH DATA
  // ---------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingGudang(true);
        setErrorGudang(null);
        setLoadingResult(true);
        setErrorResult(null);

        // 1. Ambil data BFR (Before Retur) tanpa parameter id_retur
        const laporanData = await getResultReturBfrDetailNotaPenjualanAll(token);
        console.log("laporanData bfr :", laporanData);

        // Ubah object jadi array
        let dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];

        // Filter agar hanya menampilkan data dengan id_retur sesuai parameter
        // (Jika Anda hanya ingin menampilkan data BFR untuk id_retur ini)
        const idReturNumber = parseInt(id_retur);
        dataRows = dataRows.filter((item) => item.id_retur === idReturNumber);

        setData(dataRows);
        setFilteredData(dataRows);

        // 2. Ambil data Master Gudang
        const masterGudangData = await getMasterGudang(token);
        const masterGudangArray = masterGudangData
          ? Object.values(masterGudangData)
          : [];
        setMasterGudang(masterGudangArray);
        setLoadingGudang(false);

        // 3. Generate kodeRetur (bisa menyesuaikan id_toko, dsb.)
        if (dataRows.length > 0) {
          const idTokoRow = dataRows[0].id_toko || "0000";
          setKodeRetur(generateKodeRetur(idTokoRow));
        } else {
          setKodeRetur(generateKodeRetur("0000"));
        }

        // 4. Ambil data "Result Retur" (detail) untuk id_retur
        const resultReturData = await getResultReturDetailNotaPenjualanAll(
          id_retur,
          token
        );
        console.log("resultReturData :", resultReturData);

        let resultRows = resultReturData[0]
          ? Object.values(resultReturData[0])
          : [];

        // Filter agar hanya data dengan id_retur sama
        resultRows = resultRows.filter((item) => item.id_retur === idReturNumber);
        setResultData(resultRows);

        setLoadingResult(false);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        // Identifikasi error API yang berbeda
        if (
          err.response &&
          err.response.config.url.includes("getMasterGudang")
        ) {
          setErrorGudang(err.message || "Gagal mengambil data gudang.");
        } else if (
          err.response &&
          err.response.config.url.includes(
            "getResultReturDetailNotaPenjualanAll"
          )
        ) {
          setErrorResult(err.message || "Gagal mengambil data result retur.");
        } else {
          setError(err.message || "Gagal mengambil data laporan.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id_retur]);

  // ---------------------------------------------
  //  USEEFFECT: FILTER DATA BFR
  // ---------------------------------------------
  useEffect(() => {
    let tempData = [...data];
    if (packingListFilter) {
      tempData = tempData.filter(
        (item) =>
          item.kode_packinglist &&
          item.kode_packinglist
            .toLowerCase()
            .includes(packingListFilter.toLowerCase())
      );
    }
    if (notaJualFilter) {
      tempData = tempData.filter(
        (item) =>
          item.kode_pemesanan &&
          item.kode_pemesanan.toLowerCase().includes(notaJualFilter.toLowerCase())
      );
    }
    if (noPemesananFilter) {
      tempData = tempData.filter(
        (item) =>
          item.no_pemesanan &&
          item.no_pemesanan
            .toLowerCase()
            .includes(noPemesananFilter.toLowerCase())
      );
    }
    if (marketPlaceFilter) {
      tempData = tempData.filter(
        (item) =>
          item.nama_marketplace &&
          item.nama_marketplace
            .toLowerCase()
            .includes(marketPlaceFilter.toLowerCase())
      );
    }
    setFilteredData(tempData);
    setCurrentPage(1);
  }, [
    packingListFilter,
    notaJualFilter,
    noPemesananFilter,
    marketPlaceFilter,
    data,
  ]);

  // ---------------------------------------------
  //  MEMO: FILTER DATA RESULT RETUR
  // ---------------------------------------------
  const filteredResultData = useMemo(() => {
    let tempResult = [...resultData];
    if (packingListFilter) {
      tempResult = tempResult.filter(
        (item) =>
          item.kode_packinglist &&
          item.kode_packinglist
            .toLowerCase()
            .includes(packingListFilter.toLowerCase())
      );
    }
    if (notaJualFilter) {
      tempResult = tempResult.filter(
        (item) =>
          item.kode_pemesanan &&
          item.kode_pemesanan.toLowerCase().includes(notaJualFilter.toLowerCase())
      );
    }
    if (noPemesananFilter) {
      tempResult = tempResult.filter(
        (item) =>
          item.no_pemesanan &&
          item.no_pemesanan
            .toLowerCase()
            .includes(noPemesananFilter.toLowerCase())
      );
    }
    if (marketPlaceFilter) {
      tempResult = tempResult.filter(
        (item) =>
          item.nama_marketplace &&
          item.nama_marketplace
            .toLowerCase()
            .includes(marketPlaceFilter.toLowerCase())
      );
    }
    return tempResult;
  }, [
    resultData,
    packingListFilter,
    notaJualFilter,
    noPemesananFilter,
    marketPlaceFilter,
  ]);

  // ---------------------------------------------
  //  NILAI UNIK UNTUK FILTER
  // ---------------------------------------------
  const uniquePackingList = [
    ...new Set(data.map((item) => item.kode_packinglist || "").filter(Boolean)),
  ];
  const uniqueNotaJual = [
    ...new Set(data.map((item) => item.kode_pemesanan || "").filter(Boolean)),
  ];
  const uniqueNoPemesanan = [
    ...new Set(data.map((item) => item.no_pemesanan || "").filter(Boolean)),
  ];
  const uniqueMarketPlace = [
    ...new Set(data.map((item) => item.nama_marketplace || "").filter(Boolean)),
  ];

  // ---------------------------------------------
  //  FUNGSI HELPER
  // ---------------------------------------------
  const generateKodeRetur = (id_toko) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const fullYear = now.getFullYear();
    const year = String(fullYear).slice(-2);

    const storageKey = `counter_RTPJ_${id_toko}_${year}${month}${day}`;
    let counter = parseInt(localStorage.getItem(storageKey) || "0", 10);
    counter += 1;
    localStorage.setItem(storageKey, counter.toString());

    const counterStr = String(counter).padStart(4, "0");
    return `RTPJ-${year}${month}${day}${counterStr}`;
  };

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
    setLoadingGudang(true);
    setLoadingResult(true);
    setError(null);
    setErrorGudang(null);
    setErrorResult(null);
    setAlert({ message: "", type: "", visible: false });
    window.location.reload();
  };

  // ---------------------------------------------
  //  SORTING (UNTUK DATA BFR)
  // ---------------------------------------------
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

  // ---------------------------------------------
  //  PAGINATION (UNTUK DATA BFR)
  // ---------------------------------------------
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

  // ---------------------------------------------
  //  EXPORT PDF (MENGGUNAKAN FILTEREDRESULTDATA)
  // ---------------------------------------------
  const handleExportPDF = () => {
    try {
      if (filteredResultData.length === 0) {
        setAlert({
          message: "Tidak ada data hasil retur untuk diekspor.",
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

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 5;
      const rightMargin = 5;
      const bottomMargin = 10;
      const columnSpacing = 5;

      const columnStyles = {
        0: { cellWidth: 11 }, // Kode Barang
        1: { cellWidth: 47 }, // Nama Barang
        2: { cellWidth: 8 },  // Sat
        3: { cellWidth: 6, halign: "right" }, // KRT
        4: { cellWidth: 6, halign: "right" }, // LSN
        5: { cellWidth: 6, halign: "right" }, // PCS
      };

      const totalColumnWidth = Object.values(columnStyles).reduce(
        (sum, style) => sum + (style.cellWidth || 0),
        0
      );

      const totalTableWidth =
        totalColumnWidth +
        columnSpacing * (Object.keys(columnStyles).length - 1);

      let currentY = 10;

      // Generate mapping dari kode_retur ke item-itemnya
      const kodeReturMap = {};
      filteredResultData.forEach((item) => {
        if (!kodeReturMap[item.kode_retur]) {
          kodeReturMap[item.kode_retur] = [];
        }
        kodeReturMap[item.kode_retur].push(item);
      });

      // Iterasi setiap kode_retur untuk membuat section terpisah
      Object.entries(kodeReturMap).forEach(([kode_retur, items], idx) => {
        if (idx !== 0) {
          doc.addPage();
          currentY = 10;
        }

        const addHeader = () => {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const packingListX = leftMargin + totalTableWidth / 2.5;
          doc.text("RETUR PENJUALAN", packingListX, currentY, {
            align: "center",
          });

          currentY += 2;

          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(`No Cetak: ${kode_retur}`, leftMargin, currentY + 3);
          doc.text(`Tanggal: ${currentDate}`, leftMargin, currentY + 6);
          doc.text(
            `Lokasi: ${items[0].nama_gudang_tujuan || "Data tidak tersedia"}`,
            leftMargin,
            currentY + 9
          );

          currentY += 11;
        };

        addHeader();

        const tableBody = items.map((item) => [
          item.retur_kode_barang || "-",
          item.namabarang || "-",
          `1/${item.konversi1 || "0"}/${item.konversi2 || "0"}`,
          item.besar || "-",
          item.sedang || "-",
          item.kecil || "-",
        ]);

        doc.autoTable({
          head: [["Kode", "Nama", "Sat", "KRT", "LSN", "PCS"]],
          body: tableBody,
          startY: currentY,
          margin: { left: leftMargin, right: rightMargin },
          styles: {
            fontSize: 6,
            fontStyle: "normal",
            textColor: [0, 0, 0],
            lineHeight: 1,
            cellPadding: 1,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontStyle: "normal",
            fontSize: 6,
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
          },
          columnStyles: columnStyles,
          tableWidth: totalTableWidth,
          theme: "grid",
          pageBreak: "auto",
          rowPageBreak: "auto",
        });

        const finalY = doc.autoTable.previous.finalY;

        // Hitung grand total untuk kode_retur ini
        const grandTotal = items.reduce(
          (acc, item) => acc + (parseFloat(item.total_harga) || 0),
          0
        );

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Grand Total: Rp ${grandTotal.toLocaleString("id-ID")}`,
          leftMargin,
          finalY + 4
        );

        const signatureWidth = 40;
        const signatureHeight = 15;
        const signatureY = finalY + 10;

        doc.text(
          `${items[0].nama_gudang_tujuan || "Data tidak tersedia"}`,
          leftMargin,
          signatureY + signatureHeight
        );

        const penerimaX = leftMargin + signatureWidth + 20;
        doc.text("Penerima", penerimaX, signatureY + signatureHeight);
      });

      // Tambahkan nomor halaman
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageNumber = `Halaman ${i} dari ${totalPages}`;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
          pageNumber,
          pageWidth - rightMargin,
          pageHeight - bottomMargin,
          { align: "right" }
        );
      }

      // Menampilkan PDF di iframe dan mencetaknya
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfUrl;

      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
        iframe.onafterprint = () => {
          console.log("Print selesai!");
          URL.revokeObjectURL(pdfUrl);
          document.body.removeChild(iframe);
        };
      };

      document.body.appendChild(iframe);
    } catch (error) {
      console.error("Error saat mengekspor PDF:", error);
      setAlert({
        message: "Gagal melakukan proses ekspor PDF.",
        type: "warning",
        visible: true,
      });
    }
  };

  // ---------------------------------------------
  //  HANDLE OPEN RETUR DIALOG
  // ---------------------------------------------
  const handleOpenReturDialog = () => {
    // Gudang Asal fix di 1 sesuai kebutuhan
    const fixedGudangAsal = "1";

    // Validasi sebelum membuka dialog
    if (!gudangTujuan) {
      setAlert({
        message: "Gudang Tujuan harus dipilih.",
        type: "warning",
        visible: true,
      });
      return;
    }
    if (gudangTujuan === fixedGudangAsal) {
      setAlert({
        message: "Gudang Asal dan Gudang Tujuan tidak boleh sama.",
        type: "warning",
        visible: true,
      });
      return;
    }

    if (qtyRetur <= 0) {
      setAlert({
        message: "Qty Retur tidak boleh kurang dari 1.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return;
    }

    // Periksa apakah Qty Retur melebihi quantity di setiap item
    if (data.some((item) => qtyRetur > item.quantity)) {
      setAlert({
        message: "Qty Retur tidak boleh lebih dari quantity item yang ada.",
        type: "warning",
        visible: true,
      });
      return;
    }

    // Cek apakah sudah pernah diretur
    const isAlreadyReturned = resultData.some((item) => item.status === 1);
    if (isAlreadyReturned) {
      setAlert({
        message:
          "No Pemesanan telah atau pernah diretur. Tidak dapat melakukan retur kembali.",
        type: "warning",
        visible: true,
      });
      return;
    }

    // Jika semua validasi OK, buka dialog
    setIsDialogOpen(true);
  };

  // ---------------------------------------------
  //  HANDLE CONFIRM RETUR
  // ---------------------------------------------
  const handleConfirmRetur = async () => {
    try {
      // Gudang Asal fix di 1 sesuai kebutuhan
      const fixedGudangAsal = "1";

      // Persiapkan items
      const items = data.map((item) => ({
        id_header_pemesanan: item.id_header_pemesanan,
        no_pemesanan: item.no_pemesanan,
        kode_barang: item.kode_barang,
        gudang_asal: parseInt(fixedGudangAsal),
        gudang_tujuan: parseInt(gudangTujuan),
        qtyretur: parseInt(qtyRetur),
        kode_toko: item.kode_toko,
      }));

      // Panggil API retur
      const response = await returNotaPenjualan(kodeRetur, status, createBy, items);

      if (response.success) {
        setAlert({ message: response.message, type: "success", visible: true });
        handleRefresh();
      } else {
        setAlert({ message: response.message, type: "error", visible: true });
      }
    } catch (error) {
      setAlert({
        message: error.message || "Gagal menyimpan retur penjualan.",
        type: "error",
        visible: true,
      });
    } finally {
      // Tutup dialog setelah proses selesai
      setIsDialogOpen(false);
    }
  };

  // ---------------------------------------------
  //  HANDLE CANCEL RETUR
  // ---------------------------------------------
  const handleCancelRetur = () => {
    setIsDialogOpen(false);
    setAlert({
      message: "Proses retur dibatalkan.",
      type: "warning",
      visible: true,
    });
  };

  // ---------------------------------------------
  //  RENDER UTAMA
  // ---------------------------------------------
  if (loading || loadingGudang || loadingResult) return <Loading />;
  if (error || errorGudang || errorResult)
    return <Error message={error || errorGudang || errorResult} />;

  // Data header untuk menampilkan ringkasan
  const headerData = data.length > 0 ? data[0] : {};

  // Apakah sudah pernah retur
  const isAlreadyReturned = resultData.some((item) => item.status === 1);

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
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

      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/master/menu/notapenjualan/returpenjualan"
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
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link
            to="/dashboard/master/menu/notapenjualan/returpenjualan"
            className="text-xs font-semibold text-blue-900"
          >
            Retur Penjualan
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Detail Retur Penjualan
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

      {/* Header Data */}
      <div className="bg-white rounded-md shadow-md p-2 mb-2 border border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-900">
            Header Retur Penjualan
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={handleExportPDF}
              title="Cetak Packing List"
              className="h-8 w-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
            >
              <img src={LogoPDF} className="w-6 h-6" alt="Export PDF" />
            </button>
          </div>
        </div>

        {/* Menampilkan data header */}
        <div className="flex gap-5">
          <div className="bg-gray-100 shadow-md rounded-md">
            <div className="text-xs p-2">
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Kode Retur:
                </div>
                <span className="text-gray-900">
                  {headerData.kode_retur || "Data tidak ditemukan"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  No Packing List:
                </div>
                <span className="text-gray-900">
                  {headerData.kode_packinglist || "Data tidak ditemukan"}
                </span>
              </div>
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Nota Jual:
                </div>
                <span className="text-gray-900">
                  {headerData.kode_pemesanan || "Data tidak ditemukan"}
                </span>
              </div>
              {/* <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  No Pemesanan:
                </div>
                <span className="text-gray-900">
                  {headerData.no_pemesanan || "Data tidak ditemukan"}
                </span>
              </div> */}
              <div className="mb-1 flex">
                <div className="font-semibold w-36 text-gray-600">
                  Market Place:
                </div>
                <span className="text-gray-900">
                  {headerData.nama_marketplace || "Data tidak ditemukan"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 mb-2 border border-gray-200 gap-4">
        <FilterSelect
          label="Filter Packing List"
          options={uniquePackingList}
          value={packingListFilter}
          onChange={setPackingListFilter}
        />
        <FilterSelect
          label="Filter Nota Jual"
          options={uniqueNotaJual}
          value={notaJualFilter}
          onChange={setNotaJualFilter}
        />
        <FilterSelect
          label="Filter No Pemesanan"
          options={uniqueNoPemesanan}
          value={noPemesananFilter}
          onChange={setNoPemesananFilter}
        />
        <FilterSelect
          label="Filter Market Place"
          options={uniqueMarketPlace}
          value={marketPlaceFilter}
          onChange={setMarketPlaceFilter}
        />
      </div>

      {/* Tabel Hasil Retur Penjualan */}
      {filteredResultData.length > 0 && (
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-blue-900">
            Hasil Retur Penjualan
          </h2>
          <div
            className="overflow-x-auto"
            style={{ maxHeight: "40vh", overflowY: "auto" }}
          >
            <table className="w-full text-xs text-left text-gray-500 border-collapse">
              <thead className="text-xs text-blue-900 uppercase bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-1 py-0.5 w-5 text-center border border-gray-500">
                    No
                  </th>
                  <th className="px-1 py-0.5 w-28 border border-gray-500">
                    Nota Jual
                  </th>
                  <th className="px-1 py-0.5 w-28 border border-gray-500">
                    Packing List
                  </th>
                  <th className="px-1 py-0.5 w-32 border border-gray-500">
                    No Pemesanan
                  </th>
                  <th className="px-1 py-0.5 w-32 border border-gray-500">
                    Market Place
                  </th>
                  <th className="px-1 py-0.5 w-28 border border-gray-500">
                    Kode Barang
                  </th>
                  <th className="px-1 py-0.5 w-52 border border-gray-500">
                    Nama Barang
                  </th>
                  <th className="px-1 py-0.5 w-20 border border-gray-500">
                    Qty Order
                  </th>
                  <th className="px-1 py-0.5 w-20 border border-gray-500">
                    Qty Retur
                  </th>
                  <th className="px-1 py-0.5 w-32 border border-gray-500">
                    Total order
                  </th>
                  <th className="px-1 py-0.5 w-32 border border-gray-500">
                    Total retur
                  </th>
                  <th className="px-1 py-0.5 w-24 border border-gray-500">
                    Gudang
                  </th>
                  <th className="px-1 py-0.5 w-24 border border-gray-500">
                    DI BUAT OLEH
                  </th>
                  <th className="px-1 py-0.5 w-32 border border-gray-500">
                    DI BUAT TANGGAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResultData.map((item, index) => (
                  <tr
                    key={`result-${item.id_retur}-${item.id_detailretur}-${index}`}
                    className={`text-gray-900 ${
                      item.status === 1
                        ? "bg-orange-500"
                        : item.status === 0
                        ? "bg-green-300"
                        : ""
                    }`}
                  >
                    <td className="px-1 py-0.5 border border-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.kode_pemesanan || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.kode_packinglist || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.no_pemesanan || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.nama_marketplace || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.retur_kode_barang || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.namabarang || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.total_quantity_order !== undefined
                        ? item.total_quantity_order
                        : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.total_quantity_retur !== undefined
                        ? item.total_quantity_retur
                        : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {formatRupiah(item.total_harga_sebelum_retur) || "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {formatRupiah(item.total_harga_setelah_retur) || "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.nama_gudang_tujuan || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.create_by || "Data tidak tersedia"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-500">
                      {item.retur_createAt
                        ? formatDate(item.retur_createAt)
                        : "Data tidak tersedia"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contoh Form Input Retur (opsional, jika memang ada) */}
      {!isAlreadyReturned && (
        <div className="bg-white p-4 mt-4 border border-gray-200 rounded-md">
          <div className="mb-2 text-sm text-blue-900 font-semibold">
            Form Retur Penjualan
          </div>
          <div className="mb-2 flex items-center">
            <label className="w-24 text-xs font-semibold text-gray-700">
              Gudang Tujuan:
            </label>
            <select
              value={gudangTujuan}
              onChange={(e) => setGudangTujuan(e.target.value)}
              className="border border-gray-300 text-xs rounded-md p-1"
            >
              <option value="">Pilih Gudang Tujuan</option>
              {masterGudang.map((gudang) => (
                <option key={gudang.id_gudang} value={gudang.id_gudang}>
                  {gudang.nama_gudang}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2 flex items-center">
            <label className="w-24 text-xs font-semibold text-gray-700">
              Qty Retur:
            </label>
            <input
              type="number"
              min="1"
              value={qtyRetur}
              onChange={(e) => setQtyRetur(e.target.value)}
              className="border border-gray-300 text-xs rounded-md p-1 w-20"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleOpenReturDialog}
              className="px-3 py-1 text-xs rounded-md border-2 text-gray-100 bg-green-700 hover:bg-green-500 transition duration-300"
            >
              Proses Retur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
