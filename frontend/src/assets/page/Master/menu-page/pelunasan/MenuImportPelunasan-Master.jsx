// src/assets/page/component/MenuImportPelunasan.jsx

import { useState, useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { useDispatch, useSelector } from "react-redux";
import { uploadStart, uploadSuccess, uploadFailure } from "../../../../store";
import { uploadFilePelunasan } from "../../../../services/apiService";
import { Link } from "react-router-dom";
import IconDelete from "../../../../image/icon/logo-delete.svg";
import Alert from "../../../component/Alert";
import Loading from "../../../component/Loading"; // Komponen loading

export default function MenuImport() {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const [showLoading, setShowLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  // State untuk pilihan platform marketplace dan toko online
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedTokoOnline, setSelectedTokoOnline] = useState(null);
  // Flag untuk mengetahui apakah marketplace terdeteksi otomatis
  const [isMarketplaceAutoDetected, setIsMarketplaceAutoDetected] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.upload);
  // Untuk user, kita tetap mengambil dari redux jika diperlukan
  const id_user = useSelector((state) => state.auth.id_user);
  // id_toko dari redux tidak akan dipakai karena user harus memilih toko melalui dropdown
  // const id_toko = useSelector((state) => state.auth.id_toko);

  // Pilihan Toko Online
  const tokoonlineOptions = [
    { id_toko: 2, kode_toko: "TK1000", nama_toko: "ETROLLY" },
    { id_toko: 3, kode_toko: "TK2000", nama_toko: "BEST TROLI" },
    { id_toko: 4, kode_toko: "TK3000", nama_toko: "KIUMART" },
    { id_toko: 5, kode_toko: "TK4000", nama_toko: "BIG TROLI" },
    { id_toko: 6, kode_toko: "TK5000", nama_toko: "NET TROLI" },
  ];

  // Pemetaan panjang No Pemesanan ke Marketplace
  const marketplaceLengthMap = {
    14: "Shopee",
    18: "TikTok",
    16: "Lazada",
    11: "Blibli",
  };

  // Pilihan marketplace
  const marketplaceOptions = [
    { id: 1, kode: "MKP10000", nama: "Shopee" },
    { id: 4, kode: "MKP40000", nama: "Lazada" },
    { id: 5, kode: "MKP50000", nama: "Blibli" },
    { id: 6, kode: "MKP60000", nama: "TikTok" },
  ];

  // Header kolom untuk preview dan backend: No Pemesanan dan Income
  const headers = ["No Pemesanan", "Income"];

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validasi jika file sudah ada
    if (file) {
      setAlert({
        message: "Anda hanya dapat mengupload satu file.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 3000);
      return;
    }
    setFile(selectedFile);

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await selectedFile.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      let data = [];
      let previousValues = Array(headers.length).fill("");
      let orderNumberLengths = new Set();
      const columnMapping = [1, 2];

      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        // Lewati header
        if (rowNumber === 1) return;
        const rowData = headers.map((_, index) => {
          const cellValue = row.getCell(columnMapping[index]).text.trim();
          if (cellValue) {
            previousValues[index] = cellValue;
            return cellValue;
          }
          if (index === 0) return previousValues[index] || "UNKNOWN";
          if (index === 1) return previousValues[index] || "0";
        });
        if (rowData[0] !== "UNKNOWN") {
          orderNumberLengths.add(rowData[0].length);
        }
        const isEmptyRow = rowData.every(
          (value) => value === "0" || value === "UNKNOWN"
        );
        if (!isEmptyRow) {
          data.push(rowData);
        }
      });

      console.log("Data yang diambil sebelum grouping:");
      data.forEach((row, index) => {
        console.log(`Row ${index + 1}: No Pemesanan = ${row[0]}, Income = ${row[1]}`);
      });

      let identifiedMarketplace = null;
      if (orderNumberLengths.size === 1) {
        const length = Array.from(orderNumberLengths)[0];
        identifiedMarketplace = marketplaceLengthMap[length] || null;
      } else {
        identifiedMarketplace = null;
      }

      // Jika marketplace adalah Lazada, lakukan grouping data berdasarkan No Pemesanan
      if (
        identifiedMarketplace &&
        identifiedMarketplace.toLowerCase() === "lazada"
      ) {
        const groupMap = {};
        data.forEach((row) => {
          const order = row[0];
          const incomeVal = parseFloat(row[1]) || 0;
          if (groupMap[order]) {
            groupMap[order] += incomeVal;
          } else {
            groupMap[order] = incomeVal;
          }
        });
        const groupedData = Object.keys(groupMap).map((order) => [
          order,
          groupMap[order].toString(),
        ]);
        console.log("Data yang telah digroup untuk Lazada:");
        groupedData.forEach((row, index) => {
          console.log(`Row ${index + 1}: No Pemesanan = ${row[0]}, Income = ${row[1]}`);
        });
        data = groupedData;
      }

      if (identifiedMarketplace) {
        const marketplace = marketplaceOptions.find(
          (mp) => mp.nama.toLowerCase() === identifiedMarketplace.toLowerCase()
        );
        if (marketplace) {
          setSelectedPlatform(marketplace.id);
          setIsMarketplaceAutoDetected(true);
        } else {
          setAlert({
            message: `Marketplace dengan panjang No Pemesanan ${Array.from(orderNumberLengths)} tidak dikenal.`,
            type: "warning",
            visible: true,
          });
          setSelectedPlatform(null);
          setIsMarketplaceAutoDetected(false);
        }
      } else {
        setSelectedPlatform(null);
        setIsMarketplaceAutoDetected(false);
        setAlert({
          message:
            "Tidak dapat mengidentifikasi marketplace secara otomatis. Silakan pilih secara manual.",
          type: "info",
          visible: true,
        });
      }
      setFileData({ fileName: selectedFile.name, data });
    } catch (error) {
      console.error(`Gagal memproses file ${selectedFile.name}:`, error);
      setAlert({
        message: `Gagal memproses file ${selectedFile.name}. Pastikan formatnya benar.`,
        type: "error",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 3000);
    }
  };

  const handleRefresh = () => {
    setRefresh(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleUpload = async () => {
    if (!file || !selectedPlatform || !selectedTokoOnline) {
      setAlert({
        message: "Pilih file, platform marketplace, dan toko online terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 5000);
      return;
    }

    const payload = {
      platform: selectedPlatform,
      id_user: id_user,
      id_toko: selectedTokoOnline, // Menggunakan id_toko dari pilihan dropdown
      // Untuk proses pelunasan, headerData berisi array data [no_pemesanan, income]
      headerData: fileData ? [fileData] : [],
      // Pastikan juga mengirimkan id_marketplace sesuai pilihan
      id_marketplace: selectedPlatform,
    };

    console.log("Payload yang dikirim:", payload);

    setShowLoading(true);
    dispatch(uploadStart());

    try {
      const [response] = await Promise.all([
        uploadFilePelunasan(payload),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      console.log("Response uploadFilePelunasan:", response);
      dispatch(uploadSuccess(response.data));
      setAlert({
        message: "Upload berhasil!",
        type: "success",
        visible: true,
      });
      // Reset state
      setFile(null);
      setFileData(null);
      setSelectedPlatform(null);
      setSelectedTokoOnline(null);
      setIsMarketplaceAutoDetected(false);
    } catch (error) {
      console.error("Upload gagal:", error);
      dispatch(uploadFailure(error));
      setAlert({
        message: "Upload gagal. Silakan coba lagi.",
        type: "error",
        visible: true,
      });
    } finally {
      setShowLoading(false);
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 5000);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileData(null);
    setSelectedPlatform(null);
    setIsMarketplaceAutoDetected(false);
  };

  const combinedData = fileData ? fileData.data : [];

  // Preview Data
  const [searchTermPreview, setSearchTermPreview] = useState("");
  const [sortConfigPreview, setSortConfigPreview] = useState({
    key: null,
    direction: "asc",
  });
  const [currentPagePreview, setCurrentPagePreview] = useState(1);
  // Ubah itemsPerPagePreview menjadi state agar dapat diubah melalui dropdown
  const [itemsPerPagePreview, setItemsPerPagePreview] = useState(25);

  useEffect(() => {
    setCurrentPagePreview(1);
  }, [searchTermPreview, sortConfigPreview, itemsPerPagePreview]);

  const sortedPreviewData = useMemo(() => {
    let sortableData = [...combinedData];
    if (sortConfigPreview.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfigPreview.key];
        let bKey = b[sortConfigPreview.key];
        aKey = aKey ? aKey.toString().toLowerCase() : "";
        bKey = bKey ? bKey.toString().toLowerCase() : "";
        if (aKey < bKey) {
          return sortConfigPreview.direction === "asc" ? -1 : 1;
        }
        if (aKey > bKey) {
          return sortConfigPreview.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [combinedData, sortConfigPreview]);

  const filteredPreviewData = useMemo(() => {
    const lowercasedFilter = searchTermPreview.toLowerCase();
    if (!searchTermPreview) return sortedPreviewData;
    return sortedPreviewData.filter((item) => {
      return (
        (item[0] && item[0].toLowerCase().includes(lowercasedFilter)) ||
        (item[1] && item[1].toLowerCase().includes(lowercasedFilter))
      );
    });
  }, [searchTermPreview, sortedPreviewData]);

  const indexOfLastItemPreview = currentPagePreview * itemsPerPagePreview;
  const indexOfFirstItemPreview = indexOfLastItemPreview - itemsPerPagePreview;
  const currentItemsPreview = filteredPreviewData.slice(
    indexOfFirstItemPreview,
    indexOfLastItemPreview
  );
  const totalPagesPreview = Math.ceil(
    filteredPreviewData.length / itemsPerPagePreview
  );

  const paginatePreview = (pageNumber) => setCurrentPagePreview(pageNumber);

  const handleSortPreview = (key) => {
    let direction = "asc";
    if (
      sortConfigPreview.key === key &&
      sortConfigPreview.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfigPreview({ key, direction });
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
      {showLoading && <Loading />}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <div className="text-xs font-semibold text-blue-900">
            <Link to="/dashboard/basetroli">Pelunasan</Link>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <div className="text-xs font-semibold text-gray-400">Import Pelunasan</div>
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

      <div className="mt-0">
        {/* Dropdown Toko Online dan file upload */}
        <div className="flex gap-3">
          {/* Dropdown Toko Online */}
          <div className="w-1/6 bg-gray-200 px-0.5 shadow-md rounded-md border border-gray-400">
            <div className="tokoonline flex flex-col gap-0 p-1">
              <label
                htmlFor="tokoonline-select"
                className="text-xs font-semibold text-blue-900"
              >
                Toko Online:
              </label>
              <select
                id="tokoonline-select"
                value={selectedTokoOnline || ""}
                onChange={(e) => setSelectedTokoOnline(Number(e.target.value))}
                className="bg-white border border-gray-300 uppercase text-xs rounded-md h-8"
              >
                <option value="" disabled>
                  Pilih Toko Online
                </option>
                {tokoonlineOptions.map((toko) => (
                  <option key={toko.id_toko} value={toko.id_toko}>
                    {toko.nama_toko}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Kotak dropzone untuk upload file */}
          <div
            className={`w-fit border-dashed border-2 border-blue-600 bg-gray-200 rounded-md p-6 text-center shadow-md transition hover:bg-gray-50 ${
              !selectedTokoOnline ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <label
              htmlFor="file-upload"
              className="flex flex-col justify-center items-center cursor-pointer py-6 px-4 rounded-md"
              style={!selectedTokoOnline ? { cursor: "not-allowed" } : {}}
              title={!selectedTokoOnline ? "Pilih Toko Online terlebih dahulu" : ""}
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
              accept=".xlsx, .xls"
              disabled={!selectedTokoOnline}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {/* Kotak daftar file dan marketplace selection */}
          <div className="w-full bg-white border border-gray-400 shadow-md rounded-md pl-1.5 pt-1">
            {/* Marketplace selection menggunakan radio button */}
            <div className="w-fit bg-gray-200 px-1 shadow-sm" style={{ borderRadius: "0.2rem" }}>
              <div className="platform flex gap-4 p-1">
                <p className="text-xs font-semibold text-blue-900">Market Place : </p>
                {marketplaceOptions.map((platform) => (
                  <div key={platform.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`platform-${platform.id}`}
                      name="platform"
                      value={platform.id}
                      checked={selectedPlatform === platform.id}
                      onChange={() => setSelectedPlatform(platform.id)}
                      className="mr-1.5"
                      disabled={isMarketplaceAutoDetected}
                    />
                    <label
                      htmlFor={`platform-${platform.id}`}
                      className={`text-xs text-blue-800 font-semibold underline cursor-pointer underline-offset-2 ${
                        isMarketplaceAutoDetected ? "cursor-not-allowed" : ""
                      }`}
                    >
                      {platform.nama}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {selectedPlatform && isMarketplaceAutoDetected && (
              <div className="mt-2 text-xs text-green-600">
                Marketplace terdeteksi secara otomatis:{" "}
                {marketplaceOptions.find((mp) => mp.id === selectedPlatform)?.nama}
              </div>
            )}
            {!file ? (
              <p className="text-gray-500 text-center pt-12 text-xs italic">
                {!selectedPlatform
                  ? "Silakan pilih file terlebih dahulu. Marketplace akan terdeteksi secara otomatis."
                  : "Tidak ada file yang dipilih, Upload file untuk melanjutkan."}
              </p>
            ) : (
              <div className="w-full flex justify-between items-center p-2">
                <p className="text-xs text-blue-900">1. {file.name}</p>
                <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 text-xs font-bold">
                  <img className="w-5 mr-4" src={IconDelete} alt="icon-delete" />
                </button>
              </div>
            )}
            {file && (
              <button
                onClick={handleUpload}
                className="mt-2 w-8 h-8 flex items-center justify-center py-1 m-2 bg-blue-950 float-end text-white font-xs text-xs rounded hover:bg-blue-900"
                disabled={loading || !selectedPlatform || !selectedTokoOnline}
              >
                {loading ? (
                  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Preview Data */}
        <div className="w-full mt-2 bg-white rounded-lg shadow-md p-2 border-gray-200 border">
          <h3 className="text-xs font-semibold mb-2">Preview Data</h3>
          <div className="flex justify-start mb-2">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg aria-hidden="true" className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-8 p-2"
                placeholder="Search Preview Data"
                value={searchTermPreview}
                onChange={(e) => setSearchTermPreview(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto w-1/2" style={{ height: "40vh" }}>
            <table className="w-full table-fixed text-xs text-left text-gray-500 border-collapse border">
              <thead className="bg-gray-200 text-xs text-blue-900 uppercase">
                <tr>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-1 py-1 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10 w-52"
                      onClick={() => handleSortPreview(idx)}
                    >
                      <div className="flex items-center">
                        {header}
                        {sortConfigPreview.key === idx && (
                          <span className="ml-1">
                            {sortConfigPreview.direction === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItemsPreview.length > 0 ? (
                  currentItemsPreview.map((row, rowIndex) => (
                    <tr key={rowIndex} className="bg-white border-b hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-1 py-1 border border-gray-300">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length} className="px-1 py-1 text-center text-gray-500 border-b">
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
            {/* Dropdown untuk memilih jumlah row per halaman */}
            <div className="flex items-center space-x-2 mb-2">
              <label htmlFor="itemsPerPage" className="text-xs text-gray-700">
                Tampilkan:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPagePreview}
                onChange={(e) => {
                  setItemsPerPagePreview(Number(e.target.value));
                  setCurrentPagePreview(1);
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
                {indexOfFirstItemPreview + 1}-{Math.min(indexOfLastItemPreview, filteredPreviewData.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">{filteredPreviewData.length}</span>
            </span>
            <ul className="inline-flex items-stretch -space-x-px">
              <li>
                <button
                  onClick={() => paginatePreview(currentPagePreview - 1)}
                  disabled={currentPagePreview === 1}
                  className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-500 text-xs bg-white rounded-l-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                    currentPagePreview === 1 ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <span>Previous</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => paginatePreview(currentPagePreview + 1)}
                  disabled={currentPagePreview === totalPagesPreview}
                  className={`flex items-center justify-center py-1 px-1 text-gray-500 text-xs bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                    currentPagePreview === totalPagesPreview ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <span>Next</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
