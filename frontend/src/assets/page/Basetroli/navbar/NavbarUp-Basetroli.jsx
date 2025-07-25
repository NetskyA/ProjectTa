// NavbarUp.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../../../store/index.js";
import axios from "axios";
import "aos/dist/aos.css";
import AOS from "aos";
import LogoProfile from "../../../image/icon/logo-profile.svg";
import LogoExit from "../../../image/icon/logo-exit.svg";
import BackgroundHeader from "../../../image/background/header.png";

export default function NavbarUp() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Ambil username dari Redux state
  const username = useSelector((state) => state.auth.username);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    // Hapus token, role, dan username dari localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    // Hapus header Authorization dari Axios
    delete axios.defaults.headers.common["Authorization"];

    // Clear Redux state
    dispatch(clearAuth());

    // Arahkan ke halaman login
    navigate("/");
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="BackgroundHeader flex justify-between items-center px-4 py-1 h-10 shadow-md" style={{ backgroundImage: `url(${BackgroundHeader})` }}>
      <div className="flex items-center">
        <Link
          to="/dashboard/adminpembelian"
          className="text-xs font-semibold text-white"
        >
          <p className="text-white font-semibold capitalize text-xl">
            Double O Bakery - Admin Pembelian
          </p>
        </Link>
      </div>
      <div className="relative flex items-center">
        {/* Tampilkan username di sebelah kiri ikon profil */}
        {username && (
          <span className="mr-2 text-white font-semibold capitalize">
            Hello, {username}
          </span>
        )}
        <button onClick={toggleDropdown} className="focus:outline-none">
          <img src={LogoProfile} className="w-5 h-5" alt="logo-profile" />
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 mt-20 w-24 bg-gray-700 text-white rounded shadow-lg"
            data-aos="fade-left"
          >
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 hover:bg-gray-600 rounded"
            >
              <img src={LogoExit} alt="Exit Icon" className="w-6 h-6 mr-2" />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
