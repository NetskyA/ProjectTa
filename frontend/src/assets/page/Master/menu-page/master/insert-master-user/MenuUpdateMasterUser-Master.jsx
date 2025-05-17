import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getMasterUser,
  getMasterMenusUser,
  getMasterRole,
  getMasterTokoOnlyMaster,
  updateMasterUser,
} from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuUpdateMasterUser() {
  const { id_user } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [formData, setFormData] = useState({
    id_user: "",
    kode_role: "",
    kode_toko: "",
    nama_user: "",
    no_hp: "",
    alamat: "",
    password: "",
    status: 0, // Default: 0 (Aktif)
  });
  const [roles, setRoles] = useState([]);
  const [tokos, setTokos] = useState([]);
  const [groupedMenus, setGroupedMenus] = useState([]);

  // ------------------------------------------------------------------
  // Auto‐lock dan pilihan menu
  // ------------------------------------------------------------------
  const [lockedMenuIds, setLockedMenuIds] = useState([1, 2]);
  const [selectedMenus, setSelectedMenus] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const [showHakAkses, setShowHakAkses] = useState(false);

  // ---------------------------------------------------------------
  // Mengelompokkan menu berdasar group_menu
  // ---------------------------------------------------------------
  const groupMenusByGroup = (menusArray) => {
    const temp = {};
    menusArray.forEach((menuItem) => {
      const { group_menu, kode_menu, nama_group } = menuItem;
      if (!temp[group_menu]) {
        temp[group_menu] = {
          group_menu,
          nama_group: nama_group || "",
          parent: [],
          children: [],
        };
      }
      if (kode_menu.startsWith(group_menu) && kode_menu.length === 4) {
        temp[group_menu].parent.push(menuItem);
      } else {
        temp[group_menu].children.push(menuItem);
      }
    });
    return Object.values(temp);
  };

  // ---------------------------------------------------------------
  // Fetch data master user, role, toko, menu
  // ---------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Master user
        const masterUserData = await getMasterUser(token);
        const user = masterUserData.find(
          (u) => u.id_user === parseInt(id_user, 10)
        );
        if (!user) throw new Error("User tidak ditemukan.");

        // 2) Master role (exclude id_role=3 & kode_role=2)
        const masterRoleData = (await getMasterRole(token)) || [];
        const filteredRoles = masterRoleData.filter(
          (r) => r.id_role !== 3 && parseInt(r.kode_role, 10) !== 2
        );
        const matchedRole = filteredRoles.find(
          (role) => parseInt(role.kode_role, 10) === parseInt(user.id_role, 10)
        );
        setRoles(filteredRoles);

        // 3) Master toko
        const masterTokoData = await getMasterTokoOnlyMaster(token);
        setTokos(masterTokoData || []);

        // 4) Isi formData
        setFormData({
          id_user: user.id_user,
          kode_role: matchedRole ? matchedRole.kode_role : "",
          kode_toko: user.kode_toko,
          nama_user: user.nama_user,
          no_hp: user.no_hp,
          alamat: user.alamat,
          password: "",
          status: user.status || 0,
        });

        // 5) Daftar menu awal dari user
        let initialMenus = [];
        if (user.list_id_menu) {
          initialMenus = user.list_id_menu
            .split(",")
            .map((s) => parseInt(s.trim(), 10));
        }

        // 6) Master menu
        const menusData = await getMasterMenusUser(token);
        let menusArray = [];
        if (
          Array.isArray(menusData) &&
          menusData.length > 0 &&
          typeof menusData[0] === "object" &&
          !Array.isArray(menusData[0])
        ) {
          menusArray = Object.values(menusData[0]);
        } else if (Array.isArray(menusData)) {
          menusArray = menusData;
        } else {
          menusArray = Object.values(menusData);
        }

        // 7) Tambah extra lock DH01 & DHS01
        const extraLocked = menusArray
          .filter((m) => m.kode_menu === "DH01" || m.kode_menu === "DHS01")
          .map((m) => m.id_menu);
        setLockedMenuIds((prev) => Array.from(new Set([...prev, ...extraLocked])));

        // 8) Gabungkan initialMenus + locked
        setSelectedMenus((prev) =>
          Array.from(new Set([...initialMenus, ...prev, ...extraLocked]))
        );

        // 9) Grouping
        setGroupedMenus(groupMenusByGroup(menusArray));
      } catch (err) {
        setError(err.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_user, token]); // eslint-disable-line

  // ---------------------------------------------------------------
  // Tampilkan kolom hak akses hanya jika role & toko valid
  // ---------------------------------------------------------------
  useEffect(() => {
    if (formData.kode_role && formData.kode_toko) {
      setShowHakAkses(
        !(formData.kode_role === "1" && formData.kode_toko === "TK0000")
      );
    } else {
      setShowHakAkses(false);
    }
  }, [formData.kode_role, formData.kode_toko]);

  // ---------------------------------------------------------------
  // Handler input biasa (nama, hp, dll)
  // ---------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
  };

  const getFilteredMenuIds = (kodeToko) => {
  if (kodeToko === "TK2000") return [...Array(10).keys()].map(i => i + 1).concat([17, 18, 19]);
  if (kodeToko === "TK4000") return [1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  if (kodeToko === "TK0000") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  return null;
};

const filteredGroupedMenus = useMemo(() => {
  const allowedIds = getFilteredMenuIds(formData.kode_toko);
  if (!allowedIds) return groupedMenus;

  return groupedMenus
    .map((group) => ({
      ...group,
      parent: group.parent.filter((menu) => allowedIds.includes(menu.id_menu)),
      children: group.children.filter((menu) => allowedIds.includes(menu.id_menu)),
    }))
    .filter((group) => group.parent.length > 0 || group.children.length > 0);
}, [groupedMenus, formData.kode_toko]);


  // ---------------------------------------------------------------
  // Handler menu: parent & children otomatis
  // ---------------------------------------------------------------
  const handleMenuCheckboxChange = (menuItem, isParent, group_menu) => {
    const { id_menu } = menuItem;
    if (lockedMenuIds.includes(id_menu)) return;

    setSelectedMenus((prev) => {
      const updated = new Set(prev);
      // cari grup
      const grp = groupedMenus.find((g) => g.group_menu === group_menu) || {};
      const parentId = grp.parent?.[0]?.id_menu;
      const childIds = grp.children?.map((c) => c.id_menu) || [];

      if (isParent) {
        if (updated.has(id_menu)) {
          // uncheck parent + semua child
          updated.delete(id_menu);
          childIds.forEach((c) => updated.delete(c));
        } else {
          // check parent + semua child
          updated.add(id_menu);
          childIds.forEach((c) => updated.add(c));
        }
      } else {
        if (updated.has(id_menu)) {
          // uncheck child
          updated.delete(id_menu);
          // jika tak ada child lain yang terpilih, uncheck parent
          const stillChild = childIds.some((c) => updated.has(c));
          if (!stillChild && parentId) updated.delete(parentId);
        } else {
          // check child
          updated.add(id_menu);
          // auto-check parent
          if (parentId) updated.add(parentId);
        }
      }

      return Array.from(updated);
    });
  };

  // ---------------------------------------------------------------
  // Submit update user
  // ---------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id_user: uid, kode_role, kode_toko, nama_user, no_hp, alamat, password, status } =
      formData;

    if (!kode_role || !kode_toko || !nama_user || !no_hp || !alamat) {
      setAlert({ message: "Semua field harus diisi.", type: "error", visible: true });
      setTimeout(() => setAlert({ message: "", type: "", visible: false }), 1000);
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        id_user: parseInt(uid, 10),
        kode_role,
        kode_toko,
        nama_user,
        no_hp,
        alamat,
        status: parseInt(status, 10),
        ...(password && { password }),
        id_menu: kode_role === "1" && kode_toko === "TK0000" ? [] : selectedMenus,
      };

      const res = await updateMasterUser(payload, token);
      if (res.success) {
        setAlert({ message: "User berhasil diperbarui.", type: "success", visible: true });
        setTimeout(() => navigate("/dashboard/master/menu/user"), 2000);
      } else {
        throw new Error(res.message || "Gagal memperbarui user.");
      }
    } catch (err) {
      setAlert({ message: err.message || "Gagal memperbarui user.", type: "error", visible: true });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14 mb-24" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, visible: false })} />
      )}

      {/* Breadcrumb & Refresh */}
      <div className="head flex justify-between items-center mb-0.5">
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">Master</Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
               className="w-4 h-4 text-gray-500 mx-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link to="/dashboard/master/menu/user" className="text-xs font-semibold text-blue-900">
            Master User
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
               className="w-4 h-4 text-gray-500 mx-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-xs font-semibold text-gray-400">Update User</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition"
        >
          Refresh
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-2">Detail User</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 items-start">
            {/* Kolom Kiri */}
            <div className="w-1/2">
              {/* Role & Toko */}
              <div className="mb-4 flex gap-4">
                <div className="w-1/2">
                  <label htmlFor="kode_role" className="block text-sm font-semibold text-blue-800 mb-1">
                    Role
                  </label>
                  <select
                    id="kode_role"
                    name="kode_role"
                    value={formData.kode_role}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 capitalize"
                    required
                  >
                    <option value="">Pilih Role</option>
                    {roles.map((r) => (
                      <option key={r.kode_role} value={r.kode_role}>
                        {r.nama_role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label htmlFor="kode_toko" className="block text-sm font-semibold text-blue-800 mb-1">
                    Toko
                  </label>
                  <select
                    id="kode_toko"
                    name="kode_toko"
                    value={formData.kode_toko}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 capitalize"
                    required
                  >
                    <option value="">Pilih Toko</option>
                    {tokos.map((t) => (
                      <option key={t.kode_toko} value={t.kode_toko}>
                        {t.nama_toko}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Pribadi */}
              <div className="mb-4">
                <label htmlFor="nama_user" className="block text-sm font-semibold text-blue-800 mb-1">
                  Nama User
                </label>
                <input
                  type="text"
                  id="nama_user"
                  name="nama_user"
                  value={formData.nama_user}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-semibold text-blue-800 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Kosongkan jika tidak ingin diubah"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="no_hp" className="block text-sm font-semibold text-blue-800 mb-1">
                  No HP
                </label>
                <input
                  type="text"
                  id="no_hp"
                  name="no_hp"
                  value={formData.no_hp}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="alamat" className="block text-sm font-semibold text-blue-800 mb-1">
                  Alamat
                </label>
                <textarea
                  id="alamat"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-semibold text-blue-800 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                >
                  <option value="">Pilih Status</option>
                  <option value={0}>Aktif</option>
                  <option value={1}>Non-Aktif</option>
                </select>
              </div>
            </div>

            {/* Garis */}
            <div className="border-l-2 border-gray-300"></div>

            {/* Kolom Kanan: Hak Akses */}
            {showHakAkses && (
              <div className="w-1/2 bg-white overflow-y-auto" style={{ maxHeight: "48vh" }}>
                <h2 className="text-lg font-semibold mb-2">Hak Akses</h2>
                {filteredGroupedMenus.map((group) => (
                  <div key={group.group_menu} className="border-b border-gray-200 py-2">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">
                      {group.nama_group}
                    </h3>
                    {/* Parent */}
                    {group.parent.map((menu) => {
                      const isChecked = selectedMenus.includes(menu.id_menu);
                      const isLocked = lockedMenuIds.includes(menu.id_menu);
                      return (
                        <div key={menu.id_menu} className="flex items-center ml-2 mb-1">
                          <input
                            type="checkbox"
                            id={`menu_${menu.id_menu}`}
                            checked={isChecked}
                            disabled={isLocked}
                            onChange={() =>
                              handleMenuCheckboxChange(menu, true, group.group_menu)
                            }
                            className="mr-1 rounded-sm"
                          />
                          <label htmlFor={`menu_${menu.id_menu}`} className="text-sm text-blue-800">
                            {menu.nama_menu}
                          </label>
                        </div>
                      );
                    })}
                    {/* Children */}
                    <div className="flex flex-wrap ml-2 mt-1 gap-x-2">
                      {group.children.map((menu) => {
                        const isChecked = selectedMenus.includes(menu.id_menu);
                        const isLocked = lockedMenuIds.includes(menu.id_menu);
                        return (
                          <div key={menu.id_menu} className="flex items-center ml-4 mb-1">
                            <input
                              type="checkbox"
                              id={`menu_${menu.id_menu}`}
                              checked={isChecked}
                              disabled={isLocked}
                              onChange={() =>
                                handleMenuCheckboxChange(menu, false, group.group_menu)
                              }
                              className="mr-1 rounded-sm"
                            />
                            <label htmlFor={`menu_${menu.id_menu}`} className="text-sm text-blue-800">
                              {menu.nama_menu}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-600 transition ${
                submitLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitLoading}
            >
              {submitLoading ? <Loading /> : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
