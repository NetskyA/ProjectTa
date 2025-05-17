import { useState, useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { useDispatch, useSelector } from "react-redux";
import { uploadStart, uploadSuccess, uploadFailure } from "../../../store";
import { uploadFile } from "../../../services/apiService";
import { Link } from "react-router-dom";
import IconDelete from "../../../image/icon/logo-delete.svg";
// import IconSucces from "../../../image/icon/logo-berhasil.svg";
import Alert from "../../component/Alert";
import Loading from "../../component/Loading"; // Komponen loading

export default function MenuImport() {
  const [file, setFile] = useState(null); // Mengubah dari array menjadi satu file
  const [fileData, setFileData] = useState(null); // Menyimpan data dari satu file
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const [showLoading, setShowLoading] = useState(false);
  const [refresh, setRefresh] = useState(true);

  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.upload);

  // Pilihan marketplace
  const marketplaceOptions = [
    { id: 1, kode: "MKP10000", nama: "Shopee" },
    { id: 2, kode: "MKP20000", nama: "Tokopedia" },
    { id: 3, kode: "MKP30000", nama: "Bukalapak" },
    { id: 4, kode: "MKP40000", nama: "Lazada" },
    { id: 5, kode: "MKP50000", nama: "Blibli" },
    { id: 6, kode: "MKP60000", nama: "Tiktok" },
  ];

  // Header kolom yang kita ekspektasikan dari file Excel
  const headers = [
    "No Pemesanan",
    "Kode Barang",
    "Quantity (PCS)",
    "Harga Jual",
    "Total Harga",
  ];

  /**
   * Handle ketika file di-upload:
   *  - Baca isi file (Excel) menggunakan ExcelJS
   *  - Simpan ke fileData untuk keperluan preview & upload ke backend
   */
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Validasi jumlah file (hanya 1 file yang diizinkan)
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
      const data = [];
      let previousValues = Array(headers.length).fill("");

      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        // Ambil data per kolom, isi nilai default jika kosong
        const rowData = headers.map((_, index) => {
          const cellValue = row.getCell(index + 1).text.trim();
          if (cellValue) {
            previousValues[index] = cellValue; // Update previous value
            return cellValue;
          }
          // Default values
          if (index === 0) return previousValues[index] || "UNKNOWN"; // No Pemesanan
          if (index === 1) return previousValues[index] || "UNKNOWN"; // Kode Barang
          return "0"; // Default untuk kolom lainnya
        });

        // Validasi: Tambahkan hanya jika setidaknya satu kolom memiliki data
        const isEmptyRow = rowData.every(
          (value) => value === "0" || value === "UNKNOWN"
        );
        if (!isEmptyRow) {
          data.push(rowData);
        }
      });

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
    setRefresh(true); // Tampilkan efek loading
    setTimeout(() => {
      window.location.reload();
    }, 500); // Tambahkan delay 0.5 detik
  };

  /**
   * Handle upload file ke backend
   */
  const handleUpload = async () => {
    if (!file || !selectedPlatform) {
      setAlert({
        message: "Pilih file dan platform marketplace terlebih dahulu.",
        type: "warning",
        visible: true,
      });
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 500);
      return;
    }

    const payload = {
      platform: selectedPlatform, // id_marketplace
      id_user: 2, // Sesuaikan dengan ID user yang login
      id_toko: 2, // Default id_toko
      headerData: fileData ? [fileData] : [], // Kirim array dengan satu objek
    };

    setShowLoading(true);
    dispatch(uploadStart());

    try {
      // Jalankan uploadFile dan penundaan 3 detik secara paralel
      const [response] = await Promise.all([
        uploadFile(payload), // Proses upload
        new Promise((resolve) => setTimeout(resolve, 3000)), // Penundaan 3 detik
      ]);

      dispatch(uploadSuccess(response.data));
      setAlert({
        message: "Upload berhasil!",
        type: "success",
        visible: true,
      });

      // Reset state setelah kedua proses selesai
      setFile(null);
      setFileData(null);
      setSelectedPlatform(null); // Reset pilihan marketplace
    } catch (error) {
      console.error("Upload gagal:", error);
      dispatch(uploadFailure(error));
      setAlert({
        message: "Upload gagal. Silakan coba lagi.",
        type: "error",
        visible: true,
      });
    } finally {
      setShowLoading(false); // Hapus loading setelah semua proses selesai
      setTimeout(() => setAlert((prev) => ({ ...prev, visible: false })), 500);
    }
  };

  /**
   * Menghapus file yang dipilih
   */
  const handleRemoveFile = () => {
    setFile(null);
    setFileData(null);
  };

  /**
   * Menggabungkan semua data dari file untuk keperluan preview
   */
  const combinedData = fileData ? fileData.data : [];

  // Search State for Preview Table
  const [searchTermPreview, setSearchTermPreview] = useState("");

  // Sorting State for Preview Table
  const [sortConfigPreview, setSortConfigPreview] = useState({
    key: null,
    direction: "asc",
  });

  // Pagination States for Preview Table
  const [currentPagePreview, setCurrentPagePreview] = useState(1);
  const itemsPerPagePreview = 10;

  // Handle Filter/Search for Preview Table
  useEffect(() => {
    setCurrentPagePreview(1);
  }, [searchTermPreview, sortConfigPreview]);

  // Apply Sorting for Preview Table
  const sortedPreviewData = useMemo(() => {
    let sortableData = [...combinedData];
    if (sortConfigPreview.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfigPreview.key];
        let bKey = b[sortConfigPreview.key];

        // Handle undefined or null
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

  // Apply Search Filter for Preview Table
  const filteredPreviewData = useMemo(() => {
    const lowercasedFilter = searchTermPreview.toLowerCase();
    if (!searchTermPreview) return sortedPreviewData;
    return sortedPreviewData.filter((item) => {
      return (
        (item[0] && item[0].toLowerCase().includes(lowercasedFilter)) || // No Pemesanan
        (item[1] && item[1].toLowerCase().includes(lowercasedFilter)) || // Kode Barang
        (item[2] && item[2].toLowerCase().includes(lowercasedFilter)) || // Quantity
        (item[3] && item[3].toLowerCase().includes(lowercasedFilter)) || // Harga Jual
        (item[4] && item[4].toLowerCase().includes(lowercasedFilter)) // Total Harga
      );
    });
  }, [searchTermPreview, sortedPreviewData]);

  // Calculate Pagination for Preview Table
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

  // Handler untuk Sorting Preview Table
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
            <Link to="/dashboard/etroli">Penjualan</Link>
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
          <div className="text-xs font-semibold text-gray-400">
            Import Pemesanan
          </div>
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
        {/* Bagian Upload dan Pilih Marketplace */}
        <div className="flex gap-3">
          {/* Kotak dropzone upload */}
          <div
            className={`w-fit border-dashed border-2 border-blue-600 bg-gray-200 rounded-md p-6 text-center shadow-md transition ${
              !selectedPlatform
                ? "pointer-events-none opacity-50"
                : "hover:bg-gray-50"
            }`}
          >
            <label
              htmlFor="file-upload"
              className="flex flex-col justify-center items-center cursor-pointer py-6 px-4 rounded-md"
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
              className="hidden"
              onChange={handleFileChange}
              disabled={!selectedPlatform} // Disable jika belum pilih platform
            />
          </div>

          {/* Kotak daftar file dan tombol upload */}
          <div className="w-full bg-white border border-gray-400 shadow-md rounded-md pl-1.5 pt-1">
            <div
              className="w-fit bg-gray-200 px-2 shadow-sm"
              style={{ borderRadius: "0.2rem" }}
            >
              <div className="platform flex gap-4 p-1">
                <p className="text-xs font-semibold text-blue-900">
                  Market Place :{" "}
                </p>
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
                    />
                    <label
                      htmlFor={`platform-${platform.id}`}
                      className="text-xs text-blue-800 font-semibold underline cursor-pointer underline-offset-2"
                    >
                      {platform.nama}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {!file ? (
              <p className="text-gray-500 text-center pt-12 text-xs italic">
                {!selectedPlatform
                  ? "Silakan pilih sumber / marketplace terlebih dahulu."
                  : "Tidak ada file yang dipilih, Upload file untuk melanjutkan."}
              </p>
            ) : (
              <div className="w-full flex justify-between items-center p-2">
                <p className="text-xs text-blue-900">
                  1. {file.name}
                </p>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  <img
                    className="w-5 mr-4"
                    src={IconDelete}
                    alt="icon-delete"
                  />
                </button>
              </div>
            )}

            {file && (
              <button
                onClick={handleUpload}
                className="mt-2 w-8 h-8 flex items-center justify-center py-1 m-2 bg-blue-950 float-end text-white font-xs text-xs rounded hover:bg-blue-900"
                disabled={loading || !selectedPlatform} // Juga disable jika belum pilih platform
              >
                {loading ? (
                  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bagian preview data */}
        <div className="w-full mt-2 bg-white rounded-lg shadow-md p-2 border-gray-200 border">
          <h3 className="text-xs font-semibold mb-2">Preview Data</h3>
          <div className="flex justify-start mb-2">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-gray-500"
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-8 p-2"
                placeholder="Search Preview Data"
                value={searchTermPreview}
                onChange={(e) => setSearchTermPreview(e.target.value)}
              />
            </div>
          </div>
          {/* Search for Preview Table */}
          {/* Preview Table */}
          <div className="overflow-y-auto" style={{ height: "45vh" }}>
            <table className="w-full table-fixed text-xs text-left text-gray-500 border-collapse border">
              <thead className="bg-gray-200 text-xs text-blue-900 uppercase">
                <tr>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className={`px-4 py-2 cursor-pointer sticky top-0 border border-gray-300 bg-gray-200 z-10 ${
                        // Adjust width if necessary
                        idx === 0 ? "w-52" : idx === 1 ? "w-52" : "w-52"
                      }`}
                      onClick={() => handleSortPreview(idx)}
                    >
                      <div className="flex items-center">
                        {header}
                        {/* Sort Indicator */}
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
                    <tr
                      key={rowIndex}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-2 border border-gray-300"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="px-4 py-4 text-center text-gray-500 border-b"
                    >
                      Tidak ada data yang tersedia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination for Preview Table */}
          <nav
            className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4"
            aria-label="Table navigation"
          >
            <span className="text-xs font-normal text-gray-500">
              Showing
              <span className="font-semibold text-gray-900">
                {" "}
                {indexOfFirstItemPreview + 1}-
                {Math.min(indexOfLastItemPreview, filteredPreviewData.length)}{" "}
              </span>
              of
              <span className="font-semibold text-gray-900">
                {" "}
                {filteredPreviewData.length}{" "}
              </span>
            </span>
            <ul className="inline-flex items-stretch -space-x-px">
              <li>
                <button
                  onClick={() => paginatePreview(currentPagePreview - 1)}
                  disabled={currentPagePreview === 1}
                  className={`flex items-center justify-center py-1 px-2 ml-0 text-gray-500 text-xs bg-white rounded-l-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                    currentPagePreview === 1
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <span className="">Previous</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => paginatePreview(currentPagePreview + 1)}
                  disabled={currentPagePreview === totalPagesPreview}
                  className={`flex items-center justify-center py-1 px-2 text-gray-500 text-xs bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                    currentPagePreview === totalPagesPreview
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <span className="">Next</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
