// FILE: MenuInsertMasterSatuan-Basetroli.jsx

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  getLaporanStokBarangAll,
  getInsertMasterBahanBakuProduk,
  getMasterLokasiKitchen,
  getMasterKategoriBahanBaku,
  getLaporanMasterSatuan,
  updateMasterBahanBaku,
  updateMasterStokHargaBahanBaku,
} from "../../../../../services/apiService"; // Pastikan fungsi API ini benar
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterSatuan() {
  const { id_bahan_baku } = useParams();
  // console.log("id_bahan_baku", id_bahan_baku);
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko); // Jika memang dibutuhkan di backend
  const navigate = useNavigate();

  // Field form
  const [stokBahanBaku, setStokBahanBaku] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");

  const [nama_satuan, setNamaSatuan] = useState("");
  const [id_satuan_kategori, setIdSatuanKategori] = useState(""); // state untuk menyimpan id kategori

  // State untuk dropdown kategori
  const [kategoriOptions, setKategoriOptions] = useState([]);

  // State untuk loading, error, dan alert
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [satuanOptions, setSatuanOptions] = useState([]);

  const [id_lokasi, setIdLokasi] = useState("");
  const [id_kategori_bahan_baku, setIdKategoriBahanBaku] = useState("");
  const [id_satuan, setIdSatuan] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const lokasiData = await getMasterLokasiKitchen();
        const kategoriData = await getMasterKategoriBahanBaku();
        const satuanData = await getLaporanMasterSatuan();

        // Pastikan semua data adalah array
        setLokasiOptions(
          Array.isArray(lokasiData)
            ? lokasiData
            : Object.values(lokasiData || {})
        );
        setKategoriOptions(
          Array.isArray(kategoriData)
            ? kategoriData
            : Object.values(kategoriData || {})
        );
        setSatuanOptions(
          Array.isArray(satuanData)
            ? satuanData
            : Object.values(satuanData || {})
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "Gagal memuat data dropdown. Pastikan API merespons dengan benar."
        );
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchBahanBaku = async () => {
      try {
        if (!id_bahan_baku) return; // jika tidak ada id, abaikan
        const allData = await getLaporanStokBarangAll(token);
        const dataArray = Array.isArray(allData)
          ? allData
          : Object.values(allData || {});
        const found = dataArray.find(
          (item) => item.id_bahan_baku === parseInt(id_bahan_baku)
        );
        if (found) {
          setSelectedData(found);
          setIdLokasi(found.id_lokasi);
          setIdKategoriBahanBaku(found.id_kategori_bahan_baku);
          setNamaSatuan(found.nama_bahan_baku);
          setIdSatuan(found.id_satuan);
          setStokBahanBaku(found.stok_bahan_baku);
          setHargaBeli(found.harga_beli_barang);
        }
      } catch (err) {
        console.error("Gagal memuat data bahan baku:", err);
      }
    };

    fetchBahanBaku();
  }, [id_bahan_baku, token]);

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validasi input
  if (!stokBahanBaku || !hargaBeli || parseInt(stokBahanBaku) < 1 || parseInt(hargaBeli) < 1) {
    setAlert({
      message: "Stok dan harga beli harus diisi dengan angka minimal 1.",
      type: "error",
      visible: true,
    });
    return;
  }

  setLoading(true);
  try {
    if (id_bahan_baku) {
      const payload = {
        id_bahan_baku: parseInt(id_bahan_baku),
        stok_bahan_baku: parseFloat(stokBahanBaku),
        harga_beli_barang: parseFloat(hargaBeli),
        total_harga: parseFloat(stokBahanBaku) * parseFloat(hargaBeli),
      };

      const result = await updateMasterStokHargaBahanBaku(token, payload);

      setAlert({
        message: result.message || "Data berhasil diperbarui.",
        type: "success",
        visible: true,
      });
    } else {
      // Handle insert jika diperlukan (tidak diubah)
    }

    setTimeout(() => {
      navigate("/dashboard/master/menu/masterstokbarang");
    }, 2000);
  } catch (err) {
    setAlert({
      message: err.message || "Gagal menyimpan data.",
      type: "error",
      visible: true,
    });
  } finally {
    setLoading(false);
  }
};

const formatRupiahInput = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/master"
            className="text-xs font-semibold text-blue-900"
          >
            Master
          </Link>
          <div className="ml-1 mr-1">
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
            to="/dashboard/master/menu/masterstokbarang"
            className="text-xs font-semibold text-blue-900"
          >
            Master Stok Bahan Baku
          </Link>
          <div className="ml-1 mr-1">
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
            Update Stok Bahan Baku
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>
      <div className="bg-white flex rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-1">
        <p className="text-xl font-semibold text-blue-900">Master Bahan Baku</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/masterstokbarang">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>
      {/* Form Insert Master Bahan Baku */}
      <div className="w-full overflow-x-auto">
        <div className="p-2 bg-white rounded-md shadow-md border border-gray-300 w-fit">
          <form onSubmit={handleSubmit}>
            <div className="flex-row gap-1.5">
              <fieldset className=" border border-blue-400 rounded-md p-2 shadow-sm">
                <legend className="text-sm font-bold text-blue-900">
                  Info Bahan Baku
                </legend>

                <div className="flex text-xs gap-2">
                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Kode Bahan Baku:
                    </label>
                    <input
                      type="text"
                      id="kodebarang"
                      name="kodebarang"
                      value={selectedData ? selectedData.kode_bahan_baku : ""}
                      disabled
                      className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 bg-gray-200"
                      placeholder="Auto Generate"
                    />
                  </div>
                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Lokasi Bahan Baku:
                    </label>
                    <select
                      value={id_lokasi}
                      onChange={(e) => setIdLokasi(e.target.value)}
                      disabled={selectedData?.id_lokasi}
                      className="mt-1 w-52 border text-xs cursor-not-allowed border-gray-300 rounded p-1 bg-gray-200"
                    >
                      <option value="">Pilih Lokasi</option>
                      {lokasiOptions.map((lokasi) => (
                        <option key={lokasi.id_lokasi} value={lokasi.id_lokasi}>
                          {lokasi.nama_lokasi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Kategori Bahan Baku:
                    </label>
                    <select
                      value={id_kategori_bahan_baku}
                      onChange={(e) => setIdKategoriBahanBaku(e.target.value)}
                      disabled={selectedData?.id_kategori_bahan_baku}
                      className="mt-1 w-52 border text-xs border-gray-300  cursor-not-allowed rounded p-1 bg-gray-200"
                    >
                      <option value="">Pilih Kategori</option>
                      {kategoriOptions.map((kategori) => (
                        <option
                          key={kategori.id_kategori_bahan_baku}
                          value={kategori.id_kategori_bahan_baku}
                        >
                          {kategori.nama_kategori}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex text-xs gap-2 mt-2">
                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Nama Bahan Baku:
                    </label>
                    <input
                      type="text"
                      id="namabarang"
                      name="namabarang"
                      disabled={selectedData?.nama_bahan_baku}
                      className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 cursor-not-allowed bg-gray-200"
                      placeholder="Nama Bahan Baku"
                      value={nama_satuan}
                      onChange={(e) => setNamaSatuan(e.target.value)}
                    />
                  </div>
                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Satuan Bahan Baku:
                    </label>
                    <select
                      value={id_satuan}
                      onChange={(e) => setIdSatuan(e.target.value)}
                      disabled={selectedData?.id_satuan}
                      className="mt-1 w-52 border text-xs border-gray-300 rounded p-1 cursor-not-allowed bg-gray-200"
                    >
                      <option value="">Pilih Satuan</option>
                      {satuanOptions.map((satuan) => (
                        <option key={satuan.id_satuan} value={satuan.id_satuan}>
                          {satuan.nama_satuan}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex text-xs gap-2 mt-2">
                  <div>
                    <label className="block font-medium text-blue-900">
                      Stok Bahan Baku:
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        className="mt-1 w-44 border text-xs border-gray-300 rounded-l p-1"
                        value={stokBahanBaku}
                        onChange={(e) => {
                          const value = e.target.value;
                          // hanya angka, tidak boleh semua nol, dan minimal 1
                          if (
                            /^\d*$/.test(value) &&
                            (value === "" ||
                              (parseInt(value) >= 1 && !/^0+$/.test(value)))
                          ) {
                            setStokBahanBaku(value);
                          }
                        }}
                      />
                      <span className="mt-1 w-8 border text-xs border-gray-300 bg-gray-200 rounded-r p-1">
                        {selectedData?.nama_satuan || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Harga Beli:
                    </label>
                    <div className="flex items-center">
                    <span className="mt-1 w-8 border text-xs border-gray-300 bg-gray-200 rounded-l p-1">
                      Rp
                      </span>
    <input
      type="text"
      className="mt-1 w-44 border text-xs border-gray-300 rounded-r p-1"
      value={formatRupiahInput(hargaBeli)}
      onChange={(e) => {
        const raw = e.target.value.replace(/,/g, ""); // hapus koma
        if (
          /^\d*$/.test(raw) &&
          (raw === "" ||
            (parseInt(raw) >= 1 &&
              parseInt(raw) <= 100000000 &&
              !/^0+$/.test(raw)))
        ) {
          setHargaBeli(raw);
        }
      }}
    />
                    </div>
                  </div>
                  <div className="">
                    <label className="block font-medium text-blue-900">
                      Total Harga
                    </label>
                    <div className="flex items-center">
                      <span className="mt-1 w-8 border text-xs border-gray-300 bg-gray-200 rounded-l p-1">
                      Rp
                      </span>
                    <input
                      type="text"
                      className="mt-1 w-44 border text-xs border-gray-300 cursor-not-allowed bg-gray-50 rounded-r p-1"
                      value={
                        stokBahanBaku && hargaBeli
                          ? (
                              parseFloat(stokBahanBaku) * parseFloat(hargaBeli)
                            ).toFixed(2)
                          : ""
                      }
                      disabled
                    />
                    </div>
                  </div>
                </div>
                <div className="mt-1" style={{ fontSize: "9px" }}>
                  <p className="block italic text-red-500">
                    *Gunakan satuan Gr untuk setiap bahan baku yang berbentuk
                  </p>
                </div>
              </fieldset>
            </div>
            <div className="flex justify-end text-xs mt-4">
              <button
                type="submit"
                className="bg-blue-800 text-white h-8 w-20 p-2 rounded-md hover:bg-blue-950 transition duration-300"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
