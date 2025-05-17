// src/assets/page/Kiutroli/dashboard-page/DashboardAdmin-Kiutroli.jsx

import React from "react";
import Navbarside from "../../Kiutroli/navbar/Navbarside-Kiutroli";
import NavbarUp from "../../Kiutroli/navbar/NavbarUp-Kiutroli";
import Footer from "../../component/Footer";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function DashboardAdminKiuTroli() { // Nama fungsi unik
  const location = useLocation();
  const { role, id_toko } = useSelector((state) => state.auth); // Tambahkan id_toko jika diperlukan

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


  const isMainPath = location.pathname === "/dashboard/kiutroli"; // Perbaiki path

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
              {greeting}, Selamat Datang di Dashboard Kiu Mart
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
