// store/index.js
import { configureStore, createSlice } from "@reduxjs/toolkit";

// State awal untuk upload
const initialUploadState = {
  loading: false,
  error: null,
};

// Slice upload
const uploadSlice = createSlice({
  name: "upload",
  initialState: initialUploadState,
  reducers: {
    uploadStart(state) {
      state.loading = true;
      state.error = null;
    },
    uploadSuccess(state) {
      state.loading = false;
      state.error = null;
    },
    uploadFailure(state, action) {
      state.loading = false;
      state.error = action.payload || "Error saat upload";
    },
  },
});

const uploadReducer = uploadSlice.reducer;

// Inisialisasi state auth dari localStorage (contoh)
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const username = localStorage.getItem("username");
const kode_toko = localStorage.getItem("kode_toko");
const id_toko = localStorage.getItem("id_toko");
const id_user = localStorage.getItem("id_user"); // Tambahkan ini

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: token ? token : null,
    role: role ? parseInt(role) : null,
    username: username ? username : null,
    kode_toko: kode_toko ? kode_toko : null,
    id_toko: id_toko ?? null,
    id_user: id_user ? parseInt(id_user) : null, // Parsing sebagai integer
  },
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.username = action.payload.username;
      state.kode_toko = action.payload.kode_toko;
      state.id_toko = action.payload.id_toko;
      state.id_user = action.payload.id_user;
    },
    clearAuth: (state) => {
      state.token = null;
      state.role = null;
      state.username = null;
      state.kode_toko = null;
      state.id_toko = null;
      state.id_user = null;
    },
  },
});

const authReducer = authSlice.reducer;

// Ekspor actions
export const { uploadStart, uploadSuccess, uploadFailure } = uploadSlice.actions;
export const { setAuth, clearAuth } = authSlice.actions;

// Konfigurasi store
const store = configureStore({
  reducer: {
    upload: uploadReducer,
    auth: authReducer,
  },
});

export default store;
