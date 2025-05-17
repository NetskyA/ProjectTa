// src/assets/page/component/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({
  requiredRole,
  requiredKodeToko,
  requiredIdToko,
  requiredIdUser,
  children,
}) {
  const { role, token, kode_toko, id_toko, id_user } = useSelector(
    (state) => state.auth
  );

  // Jika user belum login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Cek role
  if (requiredRole !== undefined && role !== requiredRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">
          Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.
        </h1>
      </div>
    );
  }

  // Cek kode toko
  if (requiredKodeToko !== undefined && kode_toko !== requiredKodeToko) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">
          Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.
        </h1>
      </div>
    );
  }

  // Cek id toko
  if (requiredIdToko !== undefined && id_toko !== requiredIdToko) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">
          Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.
        </h1>
      </div>
    );
  }

  // Cek id user
  if (requiredIdUser !== undefined && id_user !== requiredIdUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">
          Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.
        </h1>
      </div>
    );
  }

  return children || <Outlet />;
}
