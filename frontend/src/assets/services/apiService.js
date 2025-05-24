// services/apiService.js

import axios from "axios";

const BASE_URL = "http://localhost:3000"; // Sesuaikan dengan URL backend Anda
// const BASE_URL = "https://doubleobakery.online";

// Fungsi login
export const login = async (nama_user, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      nama_user,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Login gagal" };
  }
};

export const getAkseMenusUser = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masteraksesuser/listdataakses`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterMenusUser = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastermenu/listdatamenu`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// Fungsi untuk insert packing list
export const insertPackingList = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/packinglist`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Packing List Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Packing List gagal" };
  }
};

export const updateStokBarangBatch = async (items) => {
  try {
    // 'items' adalah array object yang isinya { kode_toko, kode_barang, total_quantity, ... }
    const response = await axios.post(`${BASE_URL}/databarang/update-stok-batch`, items, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Stok Batch Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Stok Batch gagal" };
  }
};

// Fungsi upload file (menggunakan JSON, bukan form-data)
export const uploadFile = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/upload`, data, {
      headers: { "Content-Type": "application/json" },
      maxContentLength: Infinity,   // browser limit
      maxBodyLength: Infinity,      // node ssr (jaga-jaga)
    });
    return response.data;
  } catch (error) {
    console.error("Upload File Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Upload gagal" };
  }
};

export const uploadFilePelunasan = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/uploadpelunasan/pelunasan`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Upload File Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Upload gagal" };
  }
};

export const insertPembelianBarang = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/pembelianbarang/insert/pembelian`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Pembelian Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert pembelian gagal" };
  }
};

export const getHeaderNotaPembelianBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/pembelianbarang/data/header/pembelianbarang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getDetailNotaPembelianBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/pembelianbarang/data/detail/pembelianbarang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertReturPembelianBarang = async (userData, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/returpembelian/insertretur/notapembelian`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Insert Retur Pembelian Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Retur Pembelian gagal." };
  }
};


export const getHeaderNotaReturPembelianBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/returpembelian/headerretur/pembelian`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getDetailNotaReturPembelianBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/returpembelian/detailretur/pembelian`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


export const getPelunasanPenjualanAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/pelunasanpenjualan/pelunasan/penjualan/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getPelunasanPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/pelunasanpenjualan/pelunasan/penjualan/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getPelunasanPenjualanBigroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/pelunasanpenjualan/pelunasan/penjualan/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


export const returNotaPenjualan = async (kode_retur, status, createBy, items) => {
  try {
    const payload = {
      kode_retur,
      status,
      createBy,
      items,
    };
    const response = await axios.post(`${BASE_URL}/retur/insertretur/notapenjualan`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Stok Batch Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Stok Batch gagal" };
  }
};
// Fungsi mengambil data barang (contoh)
export const getDataBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/databarang/get-data`);
    return response.data;
  } catch (error) {
    console.error("Get Data Barang error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data Barang gagal" };
  }
};

// Fungsi logout (opsional)
export const logout = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/logout`);
    return response.data;
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Logout gagal" };
  }
};
//=======================================================
// Fungsi untuk mendapatkan nota penjualan Besttroli
export const getNotaPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

// Fungsi untuk mendapatkan detail ota penjualan Besttroli
export const getDetailNotaPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/besttroli`);
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getDetailNotaPenjualanCetakPackingBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/packinglist/cetak/packinglist/besttroli`);
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getReturDetailNotaPenjualanAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/notapenjualan/retur/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getReturDetailNotaPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/notapenjualan/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getReturDetailNotaPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/notapenjualan/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};
export const getReturAddNotaPenjualanAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/notapenjualan/add/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};
export const getReturAddNotaPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/notapenjualan/add/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};
export const getReturAddNotaPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/notapenjualan/add/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getResultReturDetailNotaPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/result/retur/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getResultReturDetailNotaPenjualanAll= async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/result/retur/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getResultReturDetailNotaPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/result/retur/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getResultReturBfrDetailNotaPenjualanAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/result/before/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

export const getResultReturBfrDetailNotaPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/result/before/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};


export const getResultReturBfrDetailNotaPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/retur/result/before/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};
//=======================================================

// Fungsi untuk mendapatkan all toko nota penjualan
export const getNotaPenjualanAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};
// Fungsi untuk mendapatkan all toko nota penjualan

export const getNotaPenjualanDetailAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};


// Fungsi untuk mendapatkan nota penjualan Bigtroli
export const getNotaPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};
export const getDetailNotaPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getDetailNotaPenjualanCetakPackingAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/packinglist/cetak/packinglist/all`);
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getDetailNotaPenjualanCetakPackingBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/packinglist/cetak/packinglist/bigtroli`);
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


// Fungsi untuk mendapatkan nota penjualan Etroli
export const getNotaPenjualanEtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/etrolly`); 
    console.log( "hallo ", response.data);
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

// Fungsi untuk mendapatkan detail ota penjualan Besttroli
export const getDetailNotaPenjualanEtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/etrolly`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// Fungsi untuk mendapatkan nota penjualan Kiumart
export const getNotaPenjualanKiumart = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/kiumart`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

// Fungsi untuk mendapatkan detail ota penjualan Besttroli
export const getDetailNotaPenjualanKiumart = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/kiumart`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// Fungsi untuk mendapatkan nota penjualan Etroli
export const getNotaPenjualanNettroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/nettroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

// Fungsi untuk mendapatkan detail ota penjualan Netroli
export const getDetailNotaPenjualanNettroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/nettroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// Fungsi untuk mendapatkan nota penjualan Master
export const getNotaPenjualanMaster = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/notapenjualan/master`); 
    return response.data;
  } catch (error) {
    console.error("Get data NJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data NJ best gagal" };
  }
};

// Fungsi untuk mendapatkan detail nota penjualan Master
export const getDetailNotaPenjualanMaster = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/detailnotapenjualan/master`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


//==========================================================================
//Fungsi untuk mendapatkan laporan penjualan Besttroli
export const getLaporanPenjualanBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


//Fungsi untuk mendapatkan laporan penjualan Bigtroli
export const getLaporanPenjualanBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk mendapatkan laporan penjualan Etroli
export const getLaporanPenjualanEtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/etrolly`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk mendapatkan laporan penjualan Kiumart
export const getLaporanPenjualanKiumart = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/kiumart`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk mendapatkan laporan penjualan Nettroli
export const getLaporanPenjualanNettroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/nettroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk mendapatkan laporan penjualan Master
export const getLaporanPenjualanMaster = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/master`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
//Fungsi untuk mendapatkan laporan penjualan Master
export const getLaporanPenjualanMasterProgress = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/master/penjualan/progres`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


//Fungsi untuk mendapatkan laporan penjualan Master
export const getLaporanPenjualanDetailMasterAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/master/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk mendapatkan laporan penjualan Master
export const getLaporanPenjualanDetailed = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/master/penjualan/detailed`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk mendapatkan laporan penjualan Master
export const getAnalisaPenjualanDetailed = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporanpenjualan/toko/master/penjualan/analisa/detailed`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};


//==========================================================================
//Fungsi untuk mendapatkan laporan Master User
export const getMasterRole = async (token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/role/getmasterrole`,
      {}, // Mengirim body kosong jika tidak diperlukan
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Menyertakan token dalam header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Master Role error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Master Role gagal" };
  }
};

// Fungsi untuk mendapatkan Master Toko
export const getMasterToko = async (token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/toko/getmastertoko`,
      {}, // Mengirim body kosong jika tidak diperlukan
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Menyertakan token dalam header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Master Toko error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Master Toko gagal" };
  }
};

// Fungsi untuk mendapatkan Master Toko
export const getMasterTokoOnlyMaster = async (token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/toko/getmastertokoonlymaster`,
      {}, // Mengirim body kosong jika tidak diperlukan
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Menyertakan token dalam header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get Master Toko error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Master Toko gagal" };
  }
};

export const getMasterUser = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/data/getmasteruser`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// **Fungsi untuk menghapus (soft delete) Master User**
export const deleteMasterUser = async (id_user, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/data/deletemasteruser`,
      { id_user }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};

export const insertMasterUser = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/data/insertmasteruser`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master User gagal" };
  }
};

export const updateMasterUser = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/data/updatemasteruser`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // If authentication is required
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Master User gagal" };
  }
};

// Fungsi untuk mendapatkan Master Akun

export const getMasterAkun = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterakun/dataakun`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterAkuntansi = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterakuntansi/data/akuntansi`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const deleteMasterAkun = async (id_master_akun, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterakun/deletemasterakun`,
      { id_master_akun }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};
export const deleteMasterAkuntansi = async (id_master_akun_akuntansi, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterakuntansi/deletemaster/akuntansi`,
      { id_master_akun_akuntansi }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};

export const insertMasterAkun = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterakun/insertmasterakun`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master User gagal" };
  }
};

export const insertMasterAkuntansi = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterakuntansi/insertmaster/akuntansi`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master User gagal" };
  }
};

export const updateMasterAkun = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterakun/updatemasterakun`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // If authentication is required
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Master User gagal" };
  }
};

export const updateMasterAkuntansi = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterakuntansi/updatemaster/akuntansi`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // If authentication is required
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Master User gagal" };
  }
};


///==========================================================================
export const getLaporanStokBarangAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokbarang/liststok`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokbarang/liststok/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokbarang/liststok/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanKartuStokBarangAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporankartustok/kartu/stok/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanKartuStokBarangBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporankartustok/kartu/stok/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanKartuStokBarangBigroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/laporankartustok/kartu/stok/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangRetur = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/liststokretur`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const updateStokReturJual = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/updatestokreturjual`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master Kategori Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Kategori" };
  }
};

export const getTransaksiPelunasan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterhistorytransaksi/listdatahistorytransaksi`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangReturBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/liststokretur/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangReturBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/liststokretur/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangReturOnlyBsAll = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/liststokretur/onlybs/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangReturOnlyBsBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/liststokretur/onlybs/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanStokBarangReturOnlyBsBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/stokretur/liststokretur/onlybs/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// Fungsi untuk mendapatkan Master Market Place
export const getLaporanMasterMarketPlace = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastermarketplace/listmarketplace`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertMasterMarketplace = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastermarketplace/insertmastermarketplace`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Gudang" };
  }
};

export const updateMasterMarketPlace = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastermarketplace/updatemastermarketplace`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master Kategori Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Kategori" };
  }
};

export const deleteMasterMarketPlace = async (id_marketplace, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/mastermarketplace/deletemastermarketplace`,
      { id_marketplace }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master Kategori error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master Marketplace gagal" };
  }
};

// Fungsi untuk mendapatkan Master Kategori
export const getLaporanMasterKategori = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterkategori/listdatakategori`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertMasterKategori = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterkategori/insertmasterkategori`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Gudang" };
  }
};

export const updateMasterKategori = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterkategori/updatemasterkategori`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master Kategori Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Kategori" };
  }
};

export const deleteMasterKategori = async (id_kategori, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterkategori/deletemasterkategori`,
      { id_kategori }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master Kategori error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master Kategori gagal" };
  }
};

//fungsi untuk mendapatkan master satuan
export const getLaporanMasterSatuan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersatuan/satuanbarang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanMasterSatuanKategori = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersatuankategori/satuankategoribarang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertMasterSatuan = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersatuan/insertmastersatuan`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Gudang" };
  }
};

export const updateMasterSatuan = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersatuan/updatemastersatuan`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master Kategori Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Kategori" };
  }
};

export const deleteMasterSatuan= async (id_satuan, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/mastersatuan/deletemastersatuan`,
      { id_satuan }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master Kategori error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master Role gagal" };
  }
};


// Fungsi untuk mendapatkan Master Role
export const getLaporanMasterRole = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterrole/listdatarole`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertMasterRole = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterrole/insertmasterrole`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Gudang" };
  }
};

export const updateMasterRole = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterrole/updatemasterrole`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master Kategori Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Kategori" };
  }
};

export const deleteMasterRole = async (id_role, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterrole/deletemasterrole`,
      { id_role }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master Kategori error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master Role gagal" };
  }
};

export const getLaporanMasterToko = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastertoko/listdatatoko`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanMasterTokoInsertDataBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastertoko/listdatatoko/insertmasterdatabarang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

// master depo/supplier
export const getLaporanMasterDepo = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdepo/listdatadepo`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertMasterDepo = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdepo/insertmastersupplier`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master depo/supplier" };
  }
};

export const updateMasterDepo = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdepo/updatemastersupplier`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // If authentication is required
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Master Data Barang gagal" };
  }
};

export const deleteMasterDepo = async (id_depo, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterdepo/deletemasterdepo`,
      { id_depo }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master Depo error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master Depo gagal" };
  }
};

export const getMasterGudang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergudang/listdatagudang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertMasterGudang = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergudang/insertmastergudang`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Gudang" };
  }
};

export const updateMasterGudang = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergudang/updatemastergudang`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Gudang" };
  }
};

export const deleteMasterGudang = async (id_gudang, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/mastergudang/deletemastergudang`,
      { id_gudang }, // Mengirim id_user dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master Depo error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master Depo gagal" };
  }
};


//fungsi insert master stok barang
export const insertMasterStokBarang = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/stokbarang/insertmasterstokbarang`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Stok" };
  }
};

//Fungsi untuk insert master data barang
export const insertMasterDataBarang = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdatabarang/insertmasterdatabarang`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Jika otentikasi diperlukan
      },
    });
    return response.data;
  } catch (error) {
    console.error("Insert Master User Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Insert Master Barang" };
  }
};

export const getLaporanMasterDataBarang = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdatabarang/listdatabarang`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanMasterDataBarangBesttroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdatabarang/listdatabarang/besttroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getLaporanMasterDataBarangBigtroli = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdatabarang/listdatabarang/bigtroli`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const deleteMasterDataBarang = async (idproduk, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterdatabarang/deletemasterdatabarang`,
      { idproduk }, // Mengirim idproduk dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};
export const hardDeleteHargaBarang = async (
  { id_master_hargabarang, id_toko, id_marketplace, kode_barang },
  token
) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterhargabarang/harddeletemasterhargabarang`,
      { id_master_hargabarang, id_toko, id_marketplace, kode_barang },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Hard Delete Harga Barang error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Hard Delete Harga Barang gagal" };
  }
};


export const getLaporanMasterOnlyKategori = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterkategori/listdataonlykategori`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const updateMasterDataBarang = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterdatabarang/updatemasterdatabarang`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // If authentication is required
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Master Data Barang gagal" };
  }
};

export const updateMasterStokBarang = async (userData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/stokbarang/updatemasterstokbarang`, userData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // If authentication is required
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Update Master Data Barang gagal" };
  }
};


export const getMasterKategoriProduk = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterkategoriproduk/listdatakategoriproduk`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterKategoriBahanBaku = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterkategoribahanbaku/master/kategori/bahan/baku`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};



export const getMasterJenisTransaksi = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterjenistransaksi/listdatajenistransaksi`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterJenisPembayaran = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterjenispembayaran/listdatajenispembayaran`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterJenisPesanan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterjenispesanan/listdatajenispesanan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterLokasi = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterlokasi/listdatalokasi`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterLokasiStore = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterlokasi/listdatalokasi/store`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterLokasiKitchen = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterlokasi/listdatalokasi/kitchen`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterPelanggan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/data/pelanggan/external`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk insert master data barang
export const insertMasterPelangganExternal= async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/data/insert/master/pelangganexternal`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master Pesanan Pembelian Error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

export const updateMasterPelangganExternal = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/data/update/master/pelangganexternal`, payload,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteMasterPelangganExternal = async (id_master_pelanggan_external, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/data/delete/master/pelangganexternal`,
      { id_master_pelanggan_external }, // Mengirim id_master_pelanggan_external dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};

export const getMasterPesananPembelian = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterpesananpembelian/data/all`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterPesananPembelianDetail = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterpesananpembelian/data/all/detailed`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk insert master data barang
export const insertMasterPesananPembelian = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterpesananpembelian/insert/pesanan/pembelian`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master Pesanan Pembelian Error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

// services/apiService.js
export const updateJumlahPembelian = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterpesananpembelian/updatejumlahpembelian`, payload,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};
export const updateStatusPesananPembelian = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterpesananpembelian/updatestatuspesananpembelian`, payload,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

// export const updateSoTanggalVerPesananPembelian = async (userData, token) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/masterpesananpembelian/updatesotanggalverpemesanan`, userData, {
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`, // If authentication is required
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Update Master Data Barang Error:", error.response?.data || error.message);
//     throw error.response?.data || { message: "Update Master Data Barang gagal" };
//   }
// };


export const updateSoTanggalVerPesananPembelian = async (token, userData) => {
  try {

const response = await axios.post(`${BASE_URL}/masterpesananpembelian/updatesotanggalverpemesanan`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getMasterAdonan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masteradonanproduk/listadonan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterDetailAdonan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masteradonanproduk/listdetailadonan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterAdonanProduk = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masteradonanproduk/listadonanproduk`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterBahanBakuProduk = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterbahanbakuproduk/listbahanbakuproduk`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getInsertMasterBahanBakuProduk = async (token, payload)  => {
    try {
    const response = await axios.post(
      `${BASE_URL}/masterbahanbakuproduk/insert/master/bahanbaku`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master Pesanan Pembelian Error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

export const updateMasterBahanBaku = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterbahanbakuproduk/updatemasterbahanbaku`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update Master Bahan Baku Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Gagal update data." };
  }
};

export const updateMasterStokHargaBahanBaku = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterbahanbakuproduk/updatemasterstokhargabahanbaku`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update Master Bahan Baku Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Gagal update data." };
  }
};

export const deleteMasterBahanBaku = async (idbahanbaku, token) => {
  try {
    const response = await axios.post(
  `${BASE_URL}/masterbahanbakuproduk/deletemasterbahanbaku`,
  { idbahanbaku }, // <- HARUS pastikan value ini tidak undefined/null
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};


export const getMasterPengcekanPembelianSO = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersalesorder/data/sales/order`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterSalesOrder = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersalesorder/pengecekan/pembelian/so`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterSalesOrderKitchen = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersalesorder/pengecekan/pembelian/so/kitchen`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};
export const getMasterDetailSalesOrder = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersalesorder/data/detail/sales/order`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

//Fungsi untuk insert master data barang
export const insertMasterSalesOrder = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/mastersalesorder/insert/sales/order`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master Pesanan Pembelian Error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

export const updateStatusSoPembelian = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/mastersalesorder/updatestatussopembelian`, payload,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

export const updateQuantityAll = async (token, userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastersalesorder/updatequantityall`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};


//Fungsi untuk insert master data barang
export const insertMasterGabunganPermintaan = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/mastergabunganpermintaan/insert/gabungan/permintaan`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master Pesanan Pembelian Error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

export const getMasterGabunganPermintaan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergabunganpermintaan/master/gabungan/permintaan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterDetailGabunganPermintaan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergabunganpermintaan/detail/gabungan/permintaan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterPengecekanGabunganPermintaan = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergabunganpermintaan/pengecekan/gabungan/permintaan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const updateGpTanggalVerifikasi = async (token, userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/mastergabunganpermintaan/updategptanggalverifikasi`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};


//Fungsi untuk insert master data barang
export const insertMasterProduksiProduk = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masterproduksiproduk/insert/produksi/produk`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master Pesanan Pembelian Error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

export const getMasterProduksiProduk = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterproduksiproduk/data/produksi/produk`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterDetailProduksiProduk = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterproduksiproduk/detail/produksi/produk`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const updatePrTanggalVerifikasi = async (token, userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterproduksiproduk/updateprtanggalverifikasi`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getMasterBuktiPengeluaran = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterbuktipengeluaran/data/bukti/pengeluaran`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const getMasterDetailBuktiPengeluaran = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterbuktipengeluaran/detail/bukti/pengeluaran`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const updateBuktiStatusKode = async (token, userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/masterbuktipengeluaran/updatebkstatuskode`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getMasterHistoryTerpenuhi = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masterbuktipengeluaran/detail/bukti/pengeluaran`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const insertDetailAdonan = async (token, payload) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masteradonanproduk/insertmasteradonan`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Insert Master adonan terjadi kesalahan:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Gagal menyimpan pemesanan." };
  }
};

export const updateDetailAdonan = async (token, userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/masteradonanproduk/updateadonanbahanbaku`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteMasterKategoriAdonan = async (idkategoriadonanproduk, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masteradonanproduk/deletemasterkategoriadonan`,
      { idkategoriadonanproduk }, // Mengirim idkategoriadonanproduk dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};

export const deleteMasterAdonanProduk = async (idadonanproduk, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/masteradonanproduk/deletemasteradonanproduk`,
      { idadonanproduk }, // Mengirim idadonanproduk dalam body
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Sesuaikan format token jika berbeda
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete Master User error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Delete Master User gagal" };
  }
};

export const getMasterNotaPenjualan= async () => {
  try {
    const response = await axios.post(`${BASE_URL}/masternotapenjualan/nota/penjualan`); 
    return response.data;
  } catch (error) {
    console.error("Get data DNJ best error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Get Data DNJ best gagal" };
  }
};

export const updateCetakNotaPenjualan = async (token, userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/masternotapenjualan/updatecetaknotapenjualan`, userData,{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error) {
    console.error("Update Master Data Barang Error:", error.response?.data || error.message);
    throw error;
  }
};
