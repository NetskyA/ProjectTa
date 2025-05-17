// src/assets/page/Etrolly/dashboard-page/DashboardAdmin-Etroli.jsx

import React from "react";
import Navbarside from "../../Etrolly/navbar/Navbarside-Etroli";
import NavbarUp from "../../Etrolly/navbar/NavbarUp-Etroli";
import Footer from "../../component/Footer";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearAuth } from "../../../store/index.js"; // Pastikan path benar
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DashboardAdminEtroli() { // Nama fungsi unik
  const location = useLocation();
  const { role, id_toko } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Mendapatkan jam sekarang dan menentukan pesan sambutan
// Pesan sambutan berdasarkan waktu
const currentHour = new Date().getHours();
let greeting;

if (currentHour >= 5 && currentHour < 11) {
  // 05:00–10:59
  greeting = "Selamat pagi";
} else if (currentHour >= 11 && currentHour < 15) {
  // 11:00–14:59
  greeting = "Selamat siang";
} else if (currentHour >= 15 && currentHour < 19) {
  // 15:00–18:59
  greeting = "Selamat sore";
} else {
  // 19:00–04:59
  greeting = "Selamat malam";
}


  const isMainPath = location.pathname === "/dashboard/etroli";

  // Fungsi handleLogout
  const handleLogout = () => {
    // Jika ada endpoint logout di backend, panggil di sini
    // Contoh:
    // logoutService().then(() => { ... });

    // Hapus data dari localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("id_toko");

    // Hapus data dari Redux state
    dispatch(clearAuth());

    // Hapus header Authorization dari Axios
    delete axios.defaults.headers.common["Authorization"];

    // Arahkan pengguna kembali ke halaman login
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <div className="fixed w-full z-10">
        <NavbarUp />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="navbarside w-36 bg-blue-950 shadow-2xl fixed h-screen overflow-y-auto">
          <Navbarside role={role} />
        </div>

        {/* Main content */}
        <div className="outlet ml-40 mr-2 overflow-y-auto w-full">
          {isMainPath ? (
            <div className="text-2xl font-normal text-center mt-20">
              {greeting}, Selamat Datang di Dashboard Etroli
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      {/* Tombol Logout */}
      {/* <div className="fixed bottom-4 right-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div> */}

      <Footer />
    </div>
  );
}
