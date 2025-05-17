import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getDetailNotaPenjualanCetakPackingAll,
  insertPackingList, // API untuk simpan packing list
  updateStokBarangBatch,
} from "../../../../../services/apiService";

import LogoPDF from "../../../../../image/icon/pdf2-svgrepo.svg";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuNotaDetailPenjualanBesttroli() {
  // ----------------------------------------------------------------
  //   STATES & REDUX
  // ----------------------------------------------------------------
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noCetak, setNoCetak] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);

  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);

  // Debug
  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Row expansion
  const [expandedRows, setExpandedRows] = useState([]);

  // Dropdown (jika dibutuhkan)
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // ----------------------------------------------------------------
  //   USE EFFECT: FETCH DATA
  // ----------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getDetailNotaPenjualanCetakPackingAll(token);
        console.log("laporanData:", laporanData);

        // laporanData[0] kemungkinan object => convert ke array
        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];

        // Filter data berdasarkan id_toko
        const filteredRows = dataRows.filter(
          (item) => parseInt(item.id_toko, 10) === id_toko
        );

        setData(filteredRows);
        setFilteredData(filteredRows);
      } catch (err) {
        console.error("Error mengambil data:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id_toko]);

  // ----------------------------------------------------------------
  //   HANDLER: REFRESH
  // ----------------------------------------------------------------
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // ----------------------------------------------------------------
  //   GENERATE NO CETAK
  // ----------------------------------------------------------------
  const generateNoCetak = (id_toko) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const fullYear = now.getFullYear();
    const year = String(fullYear).slice(-2);

    const storageKey = `counter_DO_${id_toko}_${year}${month}${day}`;
    let counter = parseInt(localStorage.getItem(storageKey) || "0", 10);
    counter += 1;
    localStorage.setItem(storageKey, counter.toString());

    const counterStr = String(counter).padStart(4, "0");
    return `DO-${year}${month}${day}${counterStr}`;
  };

  // ----------------------------------------------------------------
  //   AGGREGATE DATA (untuk PDF)
  // ----------------------------------------------------------------
  const aggregateData = (rawData) => {
    const aggregation = {};
    rawData.forEach((item) => {
      const kode = item.kode_barang;
      if (kode) {
        if (!aggregation[kode]) {
          aggregation[kode] = {
            ...item,
            total_quantity: 0,
            total_harga: 0,
            besar: 0,
            sedang: 0,
            kecil: 0,
          };
        }
        aggregation[kode].total_quantity += parseFloat(item.total_quantity) || 0;
        aggregation[kode].total_harga += parseFloat(item.netto) || 0;
        aggregation[kode].besar += parseInt(item.besar) || 0;
        aggregation[kode].sedang += parseInt(item.sedang) || 0;
        aggregation[kode].kecil += parseInt(item.kecil) || 0;
      }
    });
    return Object.values(aggregation);
  };

  // ----------------------------------------------------------------
  //   HANDLE EXPORT PDF
  // ----------------------------------------------------------------
  const handleExportPDF = async () => {
    try {
      // Data yang status = 0 => belum dicetak
      const dataToProcess = data.filter((item) => item.status === 0);

      if (dataToProcess.length === 0) {
        setAlert({
          message: "Hanya mencetak NJ yang belum dicetak.",
          type: "warning",
          visible: true,
        });
        return;
      }

      // Update stok barang
      await updateStokBarangBatch(dataToProcess);

      // Agregasi data untuk PDF
      const aggregatedData = aggregateData(dataToProcess);

      // Ambil id_header_pemesanan yang unik (array)
      const validIds = [
        ...new Set(dataToProcess.map((item) => item.id_header_pemesanan)),
      ];

      // Generate no cetak
      const generatedNoCetak = generateNoCetak(id_toko);
      setNoCetak(generatedNoCetak);

      // Insert packing list (header dan detail secara bersamaan)
      const insertResponse = await insertPackingList({
        id_header_pemesanan: validIds,
        kodePackinglist: generatedNoCetak,
      });
      if (!insertResponse.success) {
        setAlert({
          message: insertResponse.message || "Gagal menyimpan packing list.",
          type: "error",
          visible: true,
        });
        return;
      } else {
        setAlert({
          message: "Cetak berhasil!",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert((prev) => ({ ...prev, visible: false }));
        }, 3000);
      }

      // ----------------------------------------------------------------
      //   Generate PDF (sama seperti sebelumnya)
      // ----------------------------------------------------------------
      const doc = new jsPDF("p", "mm", "a4");
      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const leftMargin = 5;
      const rightMargin = 5;
      const bottomMargin = 10;
      const columnSpacing = 5;

      const columnStyles = {
        0: { cellWidth: 11 },
        1: { cellWidth: 47 },
        2: { cellWidth: 9, halign: "right" },
        3: { cellWidth: 6, halign: "right" },
        4: { cellWidth: 6, halign: "right" },
        5: { cellWidth: 6, halign: "right" },
      };

      const totalColumnWidth = Object.values(columnStyles).reduce(
        (sum, style) => sum + (style.cellWidth || 0),
        0
      );
      const totalTableWidth =
        totalColumnWidth +
        columnSpacing * (Object.keys(columnStyles).length - 1);

      let currentY = 10;
      const packingListShift = 9;

      const addHeader = () => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const packingListX = leftMargin + totalTableWidth / 2 - packingListShift;
        doc.text("PACKING LIST", packingListX, currentY, { align: "center" });
        currentY += 3;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("BEST TROLI", leftMargin, currentY);
        doc.text(`No Cetak: ${generatedNoCetak}`, leftMargin, currentY + 3);
        doc.text(`Tanggal: ${currentDate}`, leftMargin, currentY + 6);
        doc.text(`Lokasi: Gudang Induk`, leftMargin, currentY + 9);
        currentY += 11;
      };

      // Halaman pertama
      addHeader();

      const chunkSize = 57;
      const chunks = [];
      for (let i = 0; i < aggregatedData.length; i += chunkSize) {
        chunks.push(aggregatedData.slice(i, i + chunkSize));
      }

      chunks.forEach((chunk, index) => {
        if (index !== 0) {
          doc.addPage();
          currentY = 10;
          addHeader();
        }

        autoTable(doc, {
          head: [["Kode", "Nama", "Sat", "KRT", "LSN", "PCS"]],
          body: chunk.map((item) => [
            item.kode_barang || "-",
            item.namabarang || "-",
            `1/${item.konversi1 || "0"}/${item.konversi2 || "0"}`,
            item.besar || "-",
            item.sedang || "-",
            item.kecil || "-",
          ]),
          startY: currentY,
          margin: { left: leftMargin, right: rightMargin },
          styles: {
            fontSize: 6,
            fontStyle: "normal",
            textColor: [0, 0, 0],
            lineHeight: 1,
            cellPadding: 0.8,
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

        if (doc.lastAutoTable) {
          currentY = doc.lastAutoTable.finalY + 10;
        }
      });

      const grandTotal = aggregatedData.reduce((acc, item) => {
        return acc + (parseFloat(item.total_harga) || 0);
      }, 0);

      if (doc.lastAutoTable) {
        const finalMarginLeft = doc.lastAutoTable.settings.margin.left;
        const finalY = doc.lastAutoTable.finalY;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Grand Total: Rp ${grandTotal.toLocaleString("id-ID")}`,
          finalMarginLeft,
          finalY + 5
        );

        const signatureWidth = 40;
        const signatureHeight = 15;
        const signatureY = finalY + 10;

        doc.text("Gudang Induk", finalMarginLeft, signatureY + signatureHeight);
        const penerimaX = finalMarginLeft + signatureWidth + 20;
        doc.text("Penerima", penerimaX, signatureY + signatureHeight);
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(String(i), leftMargin, pageHeight - bottomMargin);
      }

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
        message: "Gagal melakukan proses. Silakan coba lagi.",
        type: "warning",
        visible: true,
      });
    }
  };

  // ----------------------------------------------------------------
  //   SEARCH & SORTING
  // ----------------------------------------------------------------
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = data.filter((item) => {
      const kodeBarang = item.kode_barang || "";
      const namaMarketplace = item.nama_marketplace || "";
      const kodePemesanan = item.kode_pemesanan || "";
      const namaBarang = item.namabarang || "";
      return (
        kodeBarang.toLowerCase().includes(lowercasedFilter) ||
        namaMarketplace.toLowerCase().includes(lowercasedFilter) ||
        kodePemesanan.toLowerCase().includes(lowercasedFilter) ||
        namaBarang.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, data]);

  const groupedData = useMemo(() => {
    const group = {};
    filteredData.forEach((item) => {
      if (!group[item.kode_pemesanan]) {
        group[item.kode_pemesanan] = [];
      }
      group[item.kode_pemesanan].push(item);
    });
    return Object.keys(group).map((kode_pemesanan, index) => ({
      kode_pemesanan,
      createAt: group[kode_pemesanan][0].createAt,
      details: group[kode_pemesanan],
      groupIndex: index,
    }));
  }, [filteredData]);

  const sortedData = useMemo(() => {
    let sortableData = [...groupedData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : "";
        let bKey = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : "";
        if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
        if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [groupedData, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative.inline-block")) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    const hours = padZero(date.getUTCHours());
    const minutes = padZero(date.getUTCMinutes());
    const seconds = padZero(date.getUTCSeconds());
    const day = padZero(date.getUTCDate());
    const month = padZero(date.getUTCMonth() + 1);
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleRowDoubleClick = (kode_pemesanan) => {
    setExpandedRows((prev) => {
      if (prev.includes(kode_pemesanan)) {
        return prev.filter((kode) => kode !== kode_pemesanan);
      }
      return [...prev, kode_pemesanan];
    });
  };

  // ----------------------------------------------------------------
  //   RENDERING
  // ----------------------------------------------------------------
  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="py-14 font-sans" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/basetroli" className="text-xs font-bold text-blue-900">
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
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-bold text-gray-400">Cetak Packing List</span>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Cetak Packing List</p>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPDF}
            title="Cetak Packing List"
            className="h-10 w-10 rounded-md flex items-center justify-center text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            <img src={LogoPDF} className="w-9 h-8" alt="Export PDF" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
      <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            {/* Cetak Packing List */}
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

        </div>

        <div className="overflow-x-auto" style={{ height: "57vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-5 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-48 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_pemesanan")}
                >
                  Kode Pemesanan {sortConfig.key === "kode_pemesanan" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-36 cursor-pointer sticky top-0 border border-gray-500 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  Dibuat {sortConfig.key === "createAt" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((group, index) => {
                  const totalHarga = group.details.reduce(
                    (acc, item) => acc + (parseFloat(item.netto) || 0),
                    0
                  );
                  const totalQuantity = group.details.reduce(
                    (acc, item) => acc + (parseFloat(item.total_quantity) || 0),
                    0
                  );

                  return (
                    <React.Fragment key={`${group.kode_pemesanan}-${group.groupIndex}`}>
                      <tr
                        className={`cursor-pointer text-gray-800 ${
                          group.details[0].status === 1 ? "bg-lime-500" : group.details[0].status === 0 ? "bg-yellow-300" : ""
                        }`}
                        onDoubleClick={() => handleRowDoubleClick(group.kode_pemesanan)}
                      >
                        <td className="px-1 py-0.5 border border-gray-500">
                          {index + 1 + indexOfFirstItem}
                        </td>
                        <td className="px-1 py-0.5 border border-gray-500">
                          {group.kode_pemesanan || (
                            <p className="text-red-900 text-xs">Data tidak ditemukan</p>
                          )}
                        </td>
                        <td className="px-1 py-0.5 border border-gray-500">
                          {formatDate(group.createAt) || "Data tidak ditemukan"}
                        </td>
                      </tr>

                      {expandedRows.includes(group.kode_pemesanan) && (
                        <tr>
                          <td colSpan={3} className="pl-4 pb-0 border border-gray-500 bg-gray-50">
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                              <table className="w-full text-xs text-left text-gray-500">
                                <thead className="text-xs text-blue-900 uppercase bg-gray-200">
                                  <tr>
                                    <th className="px-2 py-0.5 w-60 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Marketplace
                                    </th>
                                    <th className="px-2 py-0.5 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Kode Barang
                                    </th>
                                    <th className="px-2 py-0.5 w-80 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Nama Barang
                                    </th>
                                    <th className="px-2 py-0.5 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      Total Quantity
                                    </th>
                                    <th className="px-2 py-0.5 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      DI BUAT OLEH
                                    </th>
                                    <th className="px-2 py-0.5 border border-gray-500 sticky top-0 bg-gray-200 z-10">
                                      DI BUAT TANGGAL
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.values(
                                    group.details.reduce((acc, item) => {
                                      const key = item.kode_barang;
                                      if (acc[key]) {
                                        acc[key].total_quantity += parseFloat(item.total_quantity) || 0;
                                      } else {
                                        acc[key] = {
                                          ...item,
                                          total_quantity: parseFloat(item.total_quantity) || 0,
                                        };
                                      }
                                      return acc;
                                    }, {})
                                  ).map((itemAgg, idx) => (
                                    <tr
                                      key={`${group.kode_pemesanan}-${itemAgg.kode_barang}-${idx}`}
                                      className={`text-gray-900 ${
                                        itemAgg.status === 1 ? "bg-lime-500" : itemAgg.status === 0 ? "bg-yellow-300" : ""
                                      }`}
                                    >
                                      <td className="px-2 py-0.5 border border-gray-500">
                                        {itemAgg.nama_marketplace || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-0.5 border border-gray-500">
                                        {itemAgg.kode_barang || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-0.5 border border-gray-500">
                                        {itemAgg.namabarang || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-0.5 border border-gray-500">
                                        {itemAgg.total_quantity || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-0.5 border border-gray-500">
                                        {itemAgg.nama_user || "Data tidak ditemukan"}
                                      </td>
                                      <td className="px-2 py-0.5 border border-gray-500">
                                        {formatDate(itemAgg.createAt) || "Data tidak ditemukan"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex justify-end pr-4 pt-1">
                              <div>
                                <span className="text-sm font-semibold">
                                  Total Harga: Rp {totalHarga.toLocaleString("id-ID")}
                                </span>
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
                  <td colSpan={3} className="px-1 py-0.5 text-center text-gray-500">
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
                className={`flex items-center justify-center py-0.5 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-0.5 px-2 text-gray-500 bg-white rounded-r-md border border-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
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
