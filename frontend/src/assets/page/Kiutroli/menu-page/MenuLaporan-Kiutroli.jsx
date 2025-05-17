import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDataBarang } from "../../../services/apiService";
import { useSelector } from "react-redux";

import Loading from "../../component/Loading"; // Import komponen Loading
import Error from "../../component/Error"; // Import komponen Error

export default function MenuLaporan() {
  const [data, setData] = useState([]); // Menyimpan data laporan
  const [filteredData, setFilteredData] = useState([]); // Menyimpan data yang difilter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kodePembelian, setKodePembelian] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [noPembeli, setNoPembeli] = useState("");
  const [tanggalBeli, setTanggalBeli] = useState("");
  const [harga, setHarga] = useState("");

  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getDataBarang(token);
        const laporanArray = Object.values(laporanData);
        setData(laporanArray);
        setFilteredData(laporanArray);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setLoading(false);
    }
  }, [token]);

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const handleFilterChange = (kode) => {
    setKodePembelian(kode);
    if (kode) {
      const filtered = data.filter((item) => item.kode_pembelian === kode);
      setFilteredData(filtered);

      if (filtered.length > 0) {
        setNamaBarang(filtered[0].nama_barang);
        setNoPembeli(filtered[0].no_pembeli);
        setTanggalBeli(formatDate(filtered[0].tanggal_beli));
        setHarga(filtered[0].harga);
      }
    } else {
      resetFilters();
    }
  };

  const resetFilters = () => {
    setKodePembelian("");
    setNamaBarang("");
    setNoPembeli("");
    setTanggalBeli("");
    setHarga("");
    setFilteredData(data);
  };

  const handleRefresh = () => {
    setLoading(true); // Tampilkan efek loading
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Tambahkan delay 1 detik
  };

  const uniqueKodePembelian = [
    ...new Set(data.map((item) => item.kode_pembelian)),
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
          <div className="text-sm font-semibold text-blue-900">
            <Link to="/dashboard/kiutroli">Menu</Link>
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
          <div className="text-sm font-semibold text-gray-400">Laporan</div>
        </div>
        <div className="flex items-center">
          {/* <Link className="m-1 text-base" to="/dashboard/admin/master/produk">
            <button className="w-16 h-8 rounded-md border-2 font-xs text-gray-100 bg-blue-950">
              Back
            </button>
          </Link> */}
          <button
            onClick={handleRefresh}
            className="w-16 h-8 rounded-md border-2 font-xs text-gray-100 bg-green-500 hover:bg-green-400 transition duration-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-md shadow-md">
        <div className="p-2">
          <div>
              <p className="text-xl font-semibold">Hasil Import</p>
            <div className="flex space-x-4 mb-2 mt-4">
              <div className="row text-xs">
                <p className="text-sm text-gray-500">Kode Barang</p>
                <select
                  className="border border-gray-300 w-32 h-8 px-4 py-2 rounded-sm"
                  value={kodePembelian}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="" className="text-gray-100">
                    --
                  </option>
                  {uniqueKodePembelian.map((kode, index) => (
                    <option key={index} value={kode} className="text-gray-700">
                      {kode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row text-xs">
                <p className="text-sm text-gray-500">Nama Barang</p>
                <input
                  type="text"
                  className="border border-gray-300 h-8 px-4 py-1 text-xs rounded-sm"
                  placeholder="Nama Barang"
                  value={namaBarang}
                  readOnly
                />
              </div>
              <div className="row text-xs">
                <p className="text-sm text-gray-500">No Pembeli</p>
                <input
                  type="text"
                  className="border border-gray-300 h-8 px-4 py-1 text-xs rounded-sm"
                  placeholder="No Pembeli"
                  value={noPembeli}
                  readOnly
                />
              </div>
              <div className="row text-xs">
                <p className="text-sm text-gray-500">Tanggal Beli</p>
                <input
                  type="text"
                  className="border border-gray-300 h-8 px-4 py-1 text-xs rounded-sm"
                  placeholder="Tanggal Beli"
                  value={tanggalBeli}
                  readOnly
                />
              </div>
              <div className="row text-xs">
                <p className="text-sm text-gray-500">Harga</p>
                <input
                  type="text"
                  className="border border-gray-300 px-4 h-8 py-1 text-xs rounded-sm"
                  placeholder="Harga"
                  value={
                    harga
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(Number(harga))
                      : ""
                  }
                  readOnly
                />
              </div>
              <div className="row mt-5">
                {/* <button
            onClick={resetFilters}
            className="w-20 h-8 rounded-md border-2 font-xs text-gray-700 bg-gray-300 hover:bg-red-500 hover:text-white transition duration-300"
          >
            Reset
          </button> */}
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-y-auto" style={{ height: "62vh" }}>
            <table className="table-auto border-collapse border text-sm border-gray-300 w-full">
              <thead className="">
                <tr>
                  <th className="py-2 px-4 border-b bg-gray-100 text-left sticky -top-1 z-10">
                    ID
                  </th>
                  <th className="py-2 px-4 border-b bg-gray-100 text-left sticky -top-1 z-10">
                    Nama Barang
                  </th>
                  <th className="py-2 px-4 border-b bg-gray-100 text-left sticky -top-1 z-10">
                    Jumlah
                  </th>
                  <th className="py-2 px-4 border-b bg-gray-100 text-left sticky -top-1 z-10">
                    Harga
                  </th>
                  <th className="py-2 px-4 border-b bg-gray-100 text-left sticky -top-1 z-10">
                    Kode. Pem.
                  </th>
                  <th className="py-2 px-4 border-b bg-gray-100 text-left sticky -top-1 z-10">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 text-sm">
                    <td className="py-2 px-4 border-b">{item.id}</td>
                    <td className="py-2 px-4 border-b">{item.nama_barang}</td>
                    <td className="py-2 px-4 border-b">{item.jumlah}</td>
                    <td className="py-2 px-4 border-b">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(Number(item.harga))}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {item.kode_pembelian}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {formatDate(item.tanggal_beli)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
