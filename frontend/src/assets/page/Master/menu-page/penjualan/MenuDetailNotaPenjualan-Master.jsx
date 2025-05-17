// MenuNotaDetailPenjualanBesttroli.jsx

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getDetailNotaPenjualanMaster,
  insertPackingList,
  updateStokBarangBatch,
} from "../../../../services/apiService";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import LogoPDF from "../../../../image/icon/pdf2-svgrepo.svg";
import Alert from "../../../component/Alert";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";

export default function MenuNotaDetailPenjualanBesttroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noCetak, setNoCetak] = useState("");

  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((state) => state.auth.token);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getDetailNotaPenjualanMaster(token);
        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];
        console.log("laporanData:", dataRows);

        setData(dataRows);
        setFilteredData(dataRows);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
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

  const generateNoCetak = () => {
    const now = new Date();
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `DO${day}${month}${year}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  };

  const handleExportPDF = async () => {
    try {
      // 1) Update stok barang terlebih dahulu (opsional)
      await updateStokBarangBatch(data);

      // 2) Insert packing list ke backend (opsional)
      const generatedNoCetak = generateNoCetak();
      setNoCetak(generatedNoCetak);

      // Dapatkan kumpulan unik dari id_header_pemesanan
      const uniqueIdHeaderPemesanan = [
        ...new Set(data.map((item) => item.id_header_pemesanan)),
      ];

      if (uniqueIdHeaderPemesanan.length > 0) {
        await insertPackingList({
          id_header_pemesanan: uniqueIdHeaderPemesanan,
        });

        setAlert({
          message: "Cetak berhasil!",
          type: "success",
          visible: true,
        });
      } else {
        setAlert({
          message: "ID Header Pemesanan tidak ditemukan!",
          type: "warning",
          visible: true,
        });
        return;
      }

      // 3) Generate PDF
      const doc = new jsPDF("p", "mm", "a4");
      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const leftMargin = 20;

      // Header PDF
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Packing List", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("SUPER ADMIN", leftMargin, 25);
      doc.text(`No Cetak: ${generatedNoCetak}`, leftMargin, 30);
      doc.text(`Tanggal: ${currentDate}`, 210 - leftMargin, 25, {
        align: "right",
      });

      // 4) Tabel PDF
      const tableData = filteredData.map((item, index) => [
        index + 1,
        item.kode_barang || "Data tidak ditemukan",
        item.namabarang || "Data tidak ditemukan",
        item.total_quantity || "0",
        item.besar + " " + item.satuanbesar || "0",
        item.sedang + " " + item.satuansedang || "0",
        item.kecil + " " + item.satuankecil|| "0",
      ]);

      doc.autoTable({
        head: [["No", "K. Barang", "Nama Barang", "Quantity (pcs)", "S. Besar", "S. Sedang", "S. Kecil",]],
        body: tableData,
        startY: 35,
        margin: { left: leftMargin },
        styles: {
          fontSize: 8,
          halign: "left",
          valign: "middle",
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 60 },
          3: { cellWidth: 25 },
          4 : { cellWidth: 25 },
          5 : { cellWidth: 25 },
          6 : { cellWidth: 25 },
        },
        tableWidth: "wrap",
      });

      // 5) Generate PDF Blob
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // 6) Buat iframe tersembunyi
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfUrl;

      // 7) Event ketika print selesai
      iframe.onload = () => {
        // Fokus ke iframe dan panggil print
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          handleRefresh();
        }, 15000);
        // Event onafterprint (TIDAK SELALU DIDUKUNG SEMPURNA OLEH SEMUA BROWSER)
        iframe.onafterprint = () => {
          console.log("Print selesai!");

          // Jalankan handleRefresh atau proses berikutnya

          // Bersihkan iframe dan URL blob
          URL.revokeObjectURL(pdfUrl);
          document.body.removeChild(iframe);
        };
      };

      document.body.appendChild(iframe);
    } catch (error) {
      console.error("Error saat mengekspor PDF dan mengupdate stok:", error);
      setAlert({
        message: "Gagal melakukan proses. Silakan coba lagi.",
        type: "warning",
        visible: true,
      });
    }
  };
  // Handle Search
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = data.filter((item) => {
      return (
        (item.kode_barang &&
          item.kode_barang.toLowerCase().includes(lowercasedFilter)) ||
        (item.namabarang &&
          item.namabarang.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, data]);

  // Apply Sorting
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];

        // Handle undefined or null
        aKey = aKey ? aKey.toString().toLowerCase() : "";
        bKey = bKey ? bKey.toString().toLowerCase() : "";

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

  // Close dropdown when clicking outside
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
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/master"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            Packing List
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Packing List</p>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPDF}
            className="cetakpdf h-8 w-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            <img src={LogoPDF} className="w-6 h-6" alt="Export PDF" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 space-y-4 md:space-y-0">
          {/* Search */}
          <div className="w-full md:w-1/2">
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ height: "26rem" }}>
          <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400 border">
            <thead className="text-xs text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 w-5 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 w-36 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_barang")}
                >
                  Kode Barang
                  {sortConfig.key === "kode_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 w-1/3 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang
                  {sortConfig.key === "namabarang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 w-48 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("total_quantity")}
                >
                  Total Quantity (pcs)
                  {sortConfig.key === "total_quantity" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 w-48 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("besar")}
                >
                  Satuan Besar
                  {sortConfig.key === "besar" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 w-48 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("sedang")}
                >
                  Satuan Sedang
                  {sortConfig.key === "sedang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 w-44 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10"
                  onClick={() => handleSort("kecil")}
                >
                  Satuan Kecil
                  {sortConfig.key === "kecil" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <td className="px-4 py-3 border border-gray-300">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.kode_barang || "Data tidak ditemukan"}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.namabarang || "Data tidak ditemukan"}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.total_quantity + " Pcs" || "0"}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.besar + " " + item.satuanbesar || "0"}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.sedang + " " + item.satuansedang || "0"}
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      {item.kecil + " " + item.satuankecil || "0"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
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
          <span className="text-xs font-normal text-gray-500">
            Showing
            <span className="font-semibold text-gray-900">
              {" "}
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, sortedData.length)}{" "}
            </span>
            of
            <span className="font-semibold text-gray-900">
              {" "}
              {sortedData.length}{" "}
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
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-50"
                    : ""
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
