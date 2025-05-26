// src/assets/page/login-all/Login.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import "aos/dist/aos.css";
import AOS from "aos";
import LogoUsername from "../../image/icon/logo-username.svg";
import LogoPassword from "../../image/icon/logo-password.svg";
import LogoHidePassword from "../../image/icon/hide-password.svg"; // Ikon "Hide"
import LogoClosePassword from "../../image/icon/eye-closed.svg"; // Ikon "Show"
import LogoBackground from "../../image/background/background-login4.jpg";
import Netskya from "../../image/icon/logos.png";
import "../../../index.css"; // Pastikan path ini benar

import { setAuth, clearAuth } from "../../store/index.js";
import axios from "axios";
import {jwtDecode} from "jwt-decode"; // Perbaiki impor

// Service API untuk login / logout
import { login as loginService, logout as logoutService } from "../../services/apiService.js";

import "../../../index.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Periksa token (dan data lain) di localStorage saat komponen dimuat
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const storedUsername = localStorage.getItem("username");
    const storedKodeToko = localStorage.getItem("kode_toko");
    const storedIdToko = localStorage.getItem("id_toko");
    const storedIdUser = localStorage.getItem("id_user"); // Tambahkan ini

    if (token && role && storedUsername && storedKodeToko && storedIdToko && storedIdUser) {
      // Set token di header Axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update Redux state
      dispatch(
        setAuth({
          token,
          role: parseInt(role),
          username: storedUsername,
          kode_toko: storedKodeToko,
          id_toko: storedIdToko,
          id_user: parseInt(storedIdUser),
        })
      );

      // Arahkan ke dashboard sesuai role dan kode_toko
      if (parseInt(role) === 0) {
        // Routing berdasarkan kode_toko
        switch (storedKodeToko) { // Use storedKodeToko
          case "TK1000":
            navigate("/dashboard/etroli");
            break;
          case "TK2000":
            navigate("/dashboard/adminpembelian");
            break;
          case "TK3000":
            navigate("/dashboard/kiutroli");
            break;
          case "TK4000":
            navigate("/dashboard/adminkitchen");
            break;
          case "TK5000":
            navigate("/dashboard/nettroli");
            break;
          default:
            // Jika Kode toko tidak valid
            setError("Kode toko tidak valid.");
        }
      } else if (parseInt(role) === 1 || parseInt(role) === 2) {
        // Master Admin
        navigate("/dashboard/master");
      }
    }
  }, [dispatch, navigate]);

  // Fungsi untuk menangani login
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginService(username, password);

      // Decode JWT
      const decodedToken = jwtDecode(response.token);
      // console.log("Decoded JWT Token:", decodedToken);

      const role = decodedToken.role; 
      const usernameFromToken = decodedToken.nama_user;
      const kodeTokoFromToken = decodedToken.kode_toko;
      const idTokoFromToken = decodedToken.id_toko;
      const idUserFromToken = decodedToken.id_user; // Tambahkan ini

      if (!usernameFromToken || !kodeTokoFromToken || !idTokoFromToken || !idUserFromToken) {
        throw new Error("Username, Kode Toko, ID Toko, atau ID User tidak ditemukan dalam token.");
      }

      // Simpan di localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", usernameFromToken);
      localStorage.setItem("kode_toko", kodeTokoFromToken);
      localStorage.setItem("id_toko", idTokoFromToken);
      localStorage.setItem("id_user", idUserFromToken);

      // Set header Authorization di Axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.token}`;

      // Simpan ke Redux state
      dispatch(
        setAuth({
          token: response.token,
          role,
          username: usernameFromToken,
          kode_toko: kodeTokoFromToken,
          id_toko: idTokoFromToken,
          id_user: idUserFromToken,
        })
      );

      // Routing sesuai role + toko
      if (role === 0) {
        switch (kodeTokoFromToken) { // Use kode_toko, bukan id_toko
          case "TK1000":
            navigate("/dashboard/etroli");
            break;
          case "TK2000":
            navigate("/dashboard/adminpembelian");
            break;
          case "TK3000":
            navigate("/dashboard/kiutroli");
            break;
          case "TK4000":
            navigate("/dashboard/adminkitchen");
            break;
          case "TK5000":
            navigate("/dashboard/nettroli");
            break;
          default:
            setError("Kode toko tidak valid.");
        }
      } else if (role === 1 || role === 2) {
        navigate("/dashboard/master");
      } else {
        setError("Peran pengguna tidak valid.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login gagal. Periksa kembali username dan password.");
    }
  };

  // Toggle visibilitas password
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  // (Opsional) Fungsi untuk logout
  // const handleLogout = async () => {
  //   try {
  //     await logoutService();
  //     localStorage.removeItem("token");
  //     localStorage.removeItem("role");
  //     localStorage.removeItem("username");
  //     localStorage.removeItem("kode_toko");
  //     localStorage.removeItem("id_toko");
  //     localStorage.removeItem("id_user");
  //     dispatch(clearAuth());
  //     delete axios.defaults.headers.common["Authorization"];
  //     navigate("/");
  //   } catch (err) {
  //     console.error("Logout error:", err);
  //     setError("Logout gagal. Silakan coba lagi.");
  //   }
  // };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <>
      <div
        className="h-screen flex items-center justify-center mx-auto cursor-pointer"
        style={{
          backgroundImage: `url(${LogoBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // fontFamily: "CustomFont",
        }}
      >
        {/* Bagian Kiri (Info / Branding) */}
        <div
          className="relative overflow-hidden h-full md:flex lg:w-11/12 md:w-1/2 justify-around items-center hidden"
        >
          <div className="w-2/3">
            <div className="flex">
              <img
                src={Netskya}
                className="lg:w-14 lg:h-20 md:h-12 md:w-8 logologin"
                alt=""
                data-aos="fade-down"
                data-aos-duration="2200"
              />
              <h1
                className="lg:text-6xl md:text-2xl text-center font-sans font-bold bg-gradient-to-r pt-2 pl-2 from-white to-blue-100 bg-clip-text text-transparent"
                data-aos="fade-right"
              >
                Portal NSA
              </h1>
            </div>
            <p className="text-white text-xl mt-1" data-aos="fade-up">
              Menghubungkan Ide dengan Teknologi
            </p>
            <p className="text-white text-sm mt-4" data-aos="fade-up" data-aos-duration="2500">
              {/* DOUBLE O BAKERY */}
            </p>
          </div>
        </div>

        {/* Bagian Kanan (Form Login) */}
        <div className="flex md:w-1/2 w-full mx-auto justify-center h-full py-10 items-center bg-white bg-opacity-40 lg:bg-gray-100 lg:bg-opacity-45">
          <form
            onSubmit={handleLogin}
            className="lg:w-2/3 w-5/6"
            data-aos="zoom-out"
          >
            {/* Judul Form */}
            <div className="lg:text-white text-white text-center font-semibold mt-2 text-3xl">
              Selamat datang silahkan
            </div>
            <div className="lg:text-white text-white capitalize text-center font-semibold mt-2 text-6xl">
              Login
            </div>

            {/* Input Username */}
            <div className="flex items-center shadow-xl h-12 py-2 px-3 rounded-lg mt-10 bg-white relative">
              <img src={LogoUsername} className="w-7 h-7" alt="Username Icon" />
              <input
                className="pl-2 ms-3 outline-none h-10 border-none font-medium text-lg text-gray-600 rounded-lg w-full"
                type="text"
                name="username"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Input Password dengan Toggle */}
            <div className="flex items-center shadow-xl h-12 py-2 px-3 rounded-lg mt-4 bg-white relative">
              <img src={LogoPassword} className="w-7 h-7" alt="Password Icon" />
              <input
                className="pl-2 ms-3 outline-none h-10 border-none font-medium text-lg text-gray-600 rounded-lg w-full"
                type={showPassword ? "text" : "password"} 
                name="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Ikon Toggle Password */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              >
                <img
                  src={showPassword ? LogoHidePassword : LogoClosePassword}
                  alt={showPassword ? "Hide Password" : "Show Password"}
                  className="w-5 h-5 mr-2"
                />
              </button>
            </div>

            {/* Pesan Error */}
            {error && (
              <p className="text-white absolute mt-1 text-sm" data-aos="zoom-in">
                {error}
              </p>
            )}

            {/* Tombol Login */}
            <div className="flex mt-6">
              <button
                className="block w-full h-12 text-lg uppercase bg-blue-700 shadow-lg mt-4 py-2 rounded-lg text-white hover:bg-blue-500 font-semibold"
                type="submit"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Versi */}
      <div
        className="text-center justify-center mx-auto bg-white w-32 py-1.5 mb-2 rounded-lg bg-opacity-50"
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <p className="text-gray-700 text-center justify-center text-xs font-semibold">
          Version 1.0.0
        </p>
      </div>
    </>
  );
}
