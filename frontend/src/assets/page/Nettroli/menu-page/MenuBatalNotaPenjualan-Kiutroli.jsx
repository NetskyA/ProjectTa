import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getNotaPenjualanBesttroli } from "../../../services/apiService";
import { useSelector } from "react-redux";
import LogoSave from "../../../image/icon/save-item.svg"

import Loading from "../../component/Loading"; // Komponen loading
import Error from "../../component/Error"; // Komponen error

export default function MenuNotaPenjualanBesttroli() {
  const [data, setData] = useState([]); // Data laporan
  const [filteredData, setFilteredData] = useState([]); // Data yang difilter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kodePemesanan, setKodePemesanan] = useState(""); // Filter berdasarkan kode_pemesanan
  const [toko, setToko] = useState(""); // Filter berdasarkan toko
  const [marketplace, setMarketplace] = useState(""); // Filter berdasarkan marketplace
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getNotaPenjualanBesttroli(token);
        // console.log("laporanData:", laporanData);

        // Akses data dari results[0]
        const dataRows = laporanData[0] ? Object.values(laporanData[0]) : [];
        // console.log("dataRows:", dataRows);

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

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Handler untuk filter Kode Pemesanan
  const handleKodePemesananChange = (kode) => {
    setKodePemesanan(kode);
    setToko("");
    setMarketplace("");
    if (kode) {
      const filtered = data.filter((item) => item.kode_pemesanan === kode);
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  };

  // Handler untuk filter Toko
  const handleTokoChange = (tokoSelected) => {
    setToko(tokoSelected);
    setKodePemesanan("");
    setMarketplace("");
    if (tokoSelected) {
      const filtered = data.filter((item) => item.nama_toko === tokoSelected);
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  };

  // Handler untuk filter Marketplace
  const handleMarketplaceChange = (marketplaceSelected) => {
    setMarketplace(marketplaceSelected);
    setKodePemesanan("");
    setToko("");
    if (marketplaceSelected) {
      const filtered = data.filter(
        (item) => item.nama_marketplace === marketplaceSelected
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  };

  const handleRefresh = () => {
    setLoading(true); // Tampilkan efek loading
    setTimeout(() => {
      window.location.reload();
    }, 500); // Tambahkan delay 1 detik
  };

  // Mengambil nilai unik untuk setiap filter
  const uniqueKodePemesanan = [
    ...new Set(data.map((item) => item.kode_pemesanan)),
  ];
  const uniqueToko = [...new Set(data.map((item) => item.nama_toko))];
  const uniqueMarketplace = [
    ...new Set(data.map((item) => item.nama_marketplace)),
  ];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <div className="text-xs font-semibold text-blue-900">
            <Link to="/dashboard/nettroli">Penjualan</Link>
          </div>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4 text-gray-500 justify-center mx-auto items-center stroke-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <div className="text-xs font-semibold text-gray-400">
            Batal Nota Penjualan
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

      {/* Filter Section */}
      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          {/* Filter Kode Pemesanan */}
          <div className="flex flex-col text-xs">
            <label className="block mb-2 text-xs text-gray-500">
              Filter Kode Pemesanan
            </label>
            <select
              className="border border-gray-300 w-64 h-8 px-4 rounded-sm"
              value={kodePemesanan}
              onChange={(e) => handleKodePemesananChange(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueKodePemesanan.map((kode, index) => (
                <option key={index} value={kode}>
                  {kode}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toko */}
          <div className="flex flex-col text-xs">
            <label className="block mb-2 text-xs text-gray-500">
              Filter Toko
            </label>
            <select
              className="border border-gray-300 w-64 h-8 px-4 rounded-sm"
              value={toko}
              onChange={(e) => handleTokoChange(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueToko.map((tokoName, index) => (
                <option key={index} value={tokoName}>
                  {tokoName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Marketplace */}
          <div className="flex flex-col text-xs">
            <label className="block mb-2 text-xs text-gray-500">
              Filter Marketplace
            </label>
            <select
              className="border border-gray-300 w-64 h-8 px-4 rounded-sm"
              value={marketplace}
              onChange={(e) => handleMarketplaceChange(e.target.value)}
            >
              <option value="">Semua</option>
              {uniqueMarketplace.map((marketplaceName, index) => (
                <option key={index} value={marketplaceName}>
                  {marketplaceName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tombol Simpan & Cetak */}
        <div className="simpan mt-3">
  <Link to="/dashboard/basetroli/menu/notapenjualan/detail">
    <button className="h-10 w-10 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
      <img src={LogoSave} className="w-8 h-8 p-1" alt="" />
    </button>
  </Link>
</div>

      </div>

      {/* Table Section */}
      <div
        className="overflow-y-auto bg-white rounded-md shadow-md mt-4"
        style={{ height: "62vh" }}
      >
        <table className="table-auto border-collapse border text-xs border-gray-300 w-full">
  <thead>
    <tr>
      <th className="py-2 px-4 border-b bg-gray-100 text-left">No</th>
      <th className="py-2 px-4 border-b bg-gray-100 text-left">ID Header</th>
      <th className="py-2 px-4 border-b bg-gray-100 text-left">Kode Pemesanan</th>
      <th className="py-2 px-4 border-b bg-gray-100 text-left">ID Toko</th>
      <th className="py-2 px-4 border-b bg-gray-100 text-left">ID Marketplace</th>
      <th className="py-2 px-4 border-b bg-gray-100 text-left">Tanggal</th>
    </tr>
  </thead>
  <tbody>
    {filteredData.length > 0 ? (
      filteredData.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="py-2 px-4 border-b">{index + 1}</td>
          <td className="py-2 px-4 border-b">
            {item.id_header_pemesanan || (
              <p className="text-red-900 text-xs">data tidak ditemukan</p>
            )}
          </td>
          <td className="py-2 px-4 border-b">
            {item.kode_pemesanan || (
              <p className="text-red-900 text-xs">data tidak ditemukan</p>
            )}
          </td>
          <td className="py-2 px-4 border-b">
            {item.nama_toko || (
              <p className="text-red-900 text-xs">data tidak ditemukan</p>
            )}
          </td>
          <td className="py-2 px-4 border-b">
            {item.nama_marketplace || (
              <p className="text-red-900 text-xs">data tidak ditemukan</p>
            )}
          </td>
          <td className="py-2 px-4 border-b">
            {item.createAt ? formatDate(item.createAt) : "Data tidak tersedia"}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td
          colSpan={6}
          className="py-4 px-4 text-center text-gray-500 border-b"
        >
          Tidak ada data yang tersedia
        </td>
      </tr>
    )}
  </tbody>
</table>

      </div>
    </div>
  );
}
