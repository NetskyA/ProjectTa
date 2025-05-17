import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMasterRole,
  getMasterTokoOnlyMaster,
  insertMasterUser,
  getMasterMenusUser,
} from "../../../../../services/apiService"; // Pastikan fungsi diimpor dengan benar
import { useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

export default function MenuInsertMasterUserMaster() {
  const [roles, setRoles] = useState([]);
  const [tokos, setTokos] = useState([]);
  // State untuk daftar menu, grouping menu, dan checkbox yang dipilih
  const [lockedMenuIds, setLockedMenuIds] = useState([1, 2]);
  const [menus, setMenus] = useState([]);
  const [groupedMenus, setGroupedMenus] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);

  const [formData, setFormData] = useState({
    id_role: "",
    kode_role: "",
    kode_toko: "",
    nama_user: "",
    password: "",
    no_hp: "",
    alamat: "",
  });

  // State untuk mengontrol tampilan form hak akses
  const [showHakAkses, setShowHakAkses] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);
  const roleAuth = useSelector((state) => state.auth.role);
  const kode_toko_auth = useSelector((state) => state.auth.kode_toko);
  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);
  console.log("role:", roleAuth);
  console.log("kode_toko:", kode_toko_auth);


// ------------------------------------------------------------------
  // 1. Ambil data Role & Toko
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mengambil Master Role
        const masterRoleData = await getMasterRole(token);
        const rolesData = (masterRoleData || []).filter(
          (r) => r.id_role !== 3 && r.kode_role !== 2
        );
        setRoles(rolesData);

        // Mengambil Master Toko
        const masterTokoData = await getMasterTokoOnlyMaster(token);
        setTokos(masterTokoData || []);
      } catch (err) {
        console.error("Error dalam mengambil data roles atau tokos:", err);
        setError(err.message || "Gagal mengambil data roles atau tokos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // ------------------------------------------------------------------
  // 2. Ambil data menu (getMasterMenusUser) + Grouping + Auto‐lock
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const menusData = await getMasterMenusUser(token);

        // flatten dari { "0": {...}, ... }
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
        setMenus(menusArray);

        // cari id_menu untuk kode_menu DH01 & DHS01
        const extraLocked = menusArray
          .filter((m) => m.kode_menu === "DH01" || m.kode_menu === "DHS01")
          .map((m) => m.id_menu);

        // gabungkan dengan yang sudah di‐lock (1,2)
        const allLocked = Array.from(new Set([...lockedMenuIds, ...extraLocked]));
        setLockedMenuIds(allLocked);

        // langsung centang semua locked
        setSelectedMenus(allLocked);

        // grouping
        const grouped = groupMenusByGroup(menusArray);
        setGroupedMenus(grouped);
      } catch (err) {
        console.error("Error fetching menus:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ------------------------------------------------------------------
  // 2a. Fungsi bantu: grouping data menu
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 3. Handle Refresh
  // ------------------------------------------------------------------
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setAlert({ message: "", type: "", visible: false });
    setFormData({
      id_role: "",
      kode_role: "",
      kode_toko: "",
      nama_user: "",
      password: "",
      no_hp: "",
      alamat: "",
    });
    setSelectedMenus([]);
    setShowHakAkses(false);
    // (Anda bisa memanggil ulang fetchData di atas jika perlu)
  };

  // ------------------------------------------------------------------
  // 4. Handle Form
  // ------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler khusus untuk Role
  const handleRoleChange = (e) => {
    const selectedId = e.target.value;
    const selectedRole = roles.find(
      (role) => role.id_role === parseInt(selectedId, 10)
    );
    setFormData((prev) => ({
      ...prev,
      id_role: selectedId,
      kode_role: selectedRole ? selectedRole.kode_role : "",
    }));
  };

  // ------------------------------------------------------------------
  // 4a. Handler checkbox menu + auto‐check parent on child select
  // ------------------------------------------------------------------
  const handleMenuCheckboxChange = (id_menu, isParent, group_menu) => {
    // jika ini id ter‐lock, abaikan
    if (lockedMenuIds.includes(id_menu)) return;

    setSelectedMenus((prev) => {
      let updated = [...prev];
      const isChecked = updated.includes(id_menu);

      if (isParent) {
        // parent toggle seperti biasa
        const grp = groupedMenus.find((g) => g.group_menu === group_menu);
        const childIds = grp ? grp.children.map((c) => c.id_menu) : [];
        if (isChecked) {
          updated = updated.filter((m) => m !== id_menu && !childIds.includes(m));
        } else {
          updated = Array.from(new Set([...updated, id_menu, ...childIds]));
        }
      } else {
        // child toggling: jika menge‐check child, auto‐check parent(s)
        const grp = groupedMenus.find((g) => g.group_menu === group_menu);
        const parentIds = grp ? grp.parent.map((p) => p.id_menu) : [];

        if (isChecked) {
          // uncheck child saja
          updated = updated.filter((m) => m !== id_menu);
        } else {
          // check child + ensure parents are checked
          updated = Array.from(new Set([...updated, id_menu, ...parentIds]));
        }
      }
      return updated;
    });
  };

  // ------------------------------------------------------------------
  // 4b. Logging setiap kali selectedMenus berubah
  // ------------------------------------------------------------------
  useEffect(() => {
    console.log("Menus yang di-checklist:", selectedMenus);
  }, [selectedMenus]);

  // ------------------------------------------------------------------
  // 4c. Cek kondisi untuk menampilkan form hak akses
  // ------------------------------------------------------------------
  useEffect(() => {
    if (formData.kode_role && formData.kode_toko) {
      if (formData.kode_role === "1" && formData.kode_toko === "TK0000") {
        setShowHakAkses(false);
      } else {
        setShowHakAkses(true);
      }
    } else {
      setShowHakAkses(false);
    }
  }, [formData.kode_role, formData.kode_toko]);

  // ------------------------------------------------------------------
  // 4d. Validasi kombinasi dropdown
  // ------------------------------------------------------------------
  useEffect(() => {
    if (formData.kode_role) {
      const validTokos =
        formData.kode_role === "1"
          ? tokos.filter((t) => t.kode_toko === "TK0000")
          : tokos.filter((t) => t.kode_toko !== "TK0000");
      if (
        formData.kode_toko &&
        !validTokos.some((t) => t.kode_toko === formData.kode_toko)
      ) {
        setFormData((prev) => ({ ...prev, kode_toko: "" }));
      }
    }
  }, [formData.kode_role, tokos]);

  useEffect(() => {
    if (formData.kode_toko) {
      const validRoles =
        formData.kode_toko === "TK0000"
          ? roles.filter((r) => r.kode_role === "1")
          : roles.filter((r) => r.kode_role !== "1");
      if (
        formData.kode_role &&
        !validRoles.some((r) => r.kode_role === formData.kode_role)
      ) {
        setFormData((prev) => ({ ...prev, id_role: "", kode_role: "" }));
      }
    }
  }, [formData.kode_toko, roles]);

  // ------------------------------------------------------------------
  // 4e. Filter dropdown options
  // ------------------------------------------------------------------
  const filteredRoles = formData.kode_toko
    ? formData.kode_toko === "TK0000"
      ? roles.filter((r) => r.kode_role === "1")
      : roles.filter((r) => r.kode_role !== "1")
    : roles;
  const filteredTokos = formData.kode_role
    ? formData.kode_role === "1"
      ? tokos.filter((t) => t.kode_toko === "TK0000")
      : tokos.filter((t) => t.kode_toko !== "TK0000")
    : tokos;

  // ------------------------------------------------------------------
  // 5. Handle Submit
  // ------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id_role, kode_role, kode_toko, nama_user, password, no_hp, alamat } =
      formData;
    if (!id_role || !kode_role || !kode_toko || !nama_user || !password || !no_hp || !alamat) {
      setAlert({
        message: "Semua field harus diisi.",
        type: "error",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        handleRefresh();
      }, 1000);
      return;
    }

    setSubmitLoading(true);
    setAlert({ message: "", type: "", visible: false });

    try {
      const payload = {
        id_role,
        kode_role,
        kode_toko,
        nama_user,
        password,
        no_hp,
        alamat,
        id_menu:
          kode_role === "1" && kode_toko === "TK0000" ? [] : selectedMenus,
      };

      const response = await insertMasterUser(payload, token);
      if (response.success) {
        setAlert({
          message: "Master User berhasil ditambahkan.",
          type: "success",
          visible: true,
        });
        setTimeout(() => {
          setAlert({ message: "", type: "", visible: false });
          handleRefresh();
        }, 2000);
      } else {
        throw new Error(response.message || "Gagal menambahkan Master User.");
      }
    } catch (error) {
      setAlert({
        message: error.message || "Gagal menambahkan Master User.",
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

// Mapping kode_toko → id_toko
const getFilteredMenuIds = (kodeToko) => {
  if (kodeToko === "TK2000") return [...Array(10).keys()].map(i => i + 1).concat([17, 18, 19]); // 1-10, 17-19
  if (kodeToko === "TK4000") return [1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 17, 18, 19];
   if (kodeToko === "TK0000") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  return null; // default: tampilkan semua
};

// Ambil hanya menu yg termasuk dalam daftar menu tertentu
const filteredGroupedMenus = useMemo(() => {
  const allowedIds = getFilteredMenuIds(formData.kode_toko);
  if (!allowedIds) return groupedMenus;

  // Filter parent & child per group
  return groupedMenus.map((group) => ({
    ...group,
    parent: group.parent.filter((menu) => allowedIds.includes(menu.id_menu)),
    children: group.children.filter((menu) => allowedIds.includes(menu.id_menu)),
  })).filter((group) => group.parent.length > 0 || group.children.length > 0);
}, [groupedMenus, formData.kode_toko]);


  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <Link to="/dashboard/master/menu/user">
            <span className="text-xs font-semibold text-blue-900">
              Master User
            </span>
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <Link to="/dashboard/master/menu/user/insert">
            <span className="text-xs font-semibold text-gray-400">
              Tambah User
            </span>
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
        <p className="text-xl font-semibold text-blue-900">Tambah User</p>
        <div className="flex space-x-2">
          <Link to="/dashboard/master/menu/user">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center font-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Back</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Form Insert Master User dan Hak Akses */}
      <div className="flex gap-4 mt-2">
        <div className="flex-1 p-4 bg-white rounded-md shadow-md border border-gray-300">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4 items-stretch">
              {/* Kolom kiri: Detail User */}
              <div className="w-1/2 bg-white">
                <div className="tambahaccount h-full">
                  <h2 className="text-lg font-semibold mb-4">Detail User</h2>
                  <div className="mb-2 flex gap-4">
                    {/* Dropdown Role */}
                    <div className="w-1/2">
                      <label
                        htmlFor="id_role"
                        className="block text-sm font-semibold text-blue-800 mb-1"
                      >
                        Role
                      </label>
                      <select
                        id="id_role"
                        name="id_role"
                        value={formData.id_role}
                        onChange={handleRoleChange}
                        className="w-full border capitalize border-gray-300 rounded-md p-2"
                        required
                      >
                        <option value="">Pilih Role</option>
                        {filteredRoles.map((role) => (
                          <option key={role.id_role} value={role.id_role}>
                            {role.nama_role}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Dropdown Toko */}
                    <div className="w-1/2">
                      <label
                        htmlFor="kode_toko"
                        className="block text-sm font-semibold text-blue-800 mb-1"
                      >
                        Toko
                      </label>
                      <select
                        id="kode_toko"
                        name="kode_toko"
                        value={formData.kode_toko}
                        onChange={handleChange}
                        className="w-full border border-gray-300 capitalize rounded-md p-2"
                        required
                      >
                        <option value="">Pilih Toko</option>
                        {filteredTokos.map((toko) => (
                          <option key={toko.kode_toko} value={toko.kode_toko}>
                            {toko.nama_toko}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Input Nama User */}
                  <div className="mb-4">
                    <label
                      htmlFor="nama_user"
                      className="block text-sm font-semibold text-blue-800 mb-1"
                    >
                      Nama User
                    </label>
                    <input
                      type="text"
                      id="nama_user"
                      name="nama_user"
                      value={formData.nama_user}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      placeholder="Masukkan nama user"
                      required
                    />
                  </div>
                  {/* Input Password */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-blue-800 mb-1"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      placeholder="Masukkan password"
                      required
                    />
                  </div>
                  {/* Input No HP */}
                  <div className="mb-4">
                    <label
                      htmlFor="no_hp"
                      className="block text-sm font-semibold text-blue-800 mb-1"
                    >
                      No HP
                    </label>
                    <input
                      type="text"
                      id="no_hp"
                      name="no_hp"
                      value={formData.no_hp}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      placeholder="Masukkan nomor handphone"
                      required
                    />
                  </div>
                  {/* Input Alamat */}
                  <div className="mb-4">
                    <label
                      htmlFor="alamat"
                      className="block text-sm font-semibold text-blue-800 mb-1"
                    >
                      Alamat
                    </label>
                    <textarea
                      id="alamat"
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      placeholder="Masukkan alamat"
                      required
                    />
                  </div>
                </div>
              </div>

             {/* Hak Akses */}
            {showHakAkses && (
              <div className="w-1/2 bg-white overflow-y-auto" style={{ maxHeight: "48vh" }}>
                <h2 className="text-lg font-semibold mb-2">Hak Akses</h2>
                {filteredGroupedMenus.map((group) => (
                  <div key={group.group_menu} className="border-b border-gray-200 pb-2 pt-3">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">{group.nama_group}</h3>
                    {/* Parent */}
                    {group.parent.map((menu) => {
                      const isChecked = selectedMenus.includes(menu.id_menu);
                      const isLocked = lockedMenuIds.includes(menu.id_menu);
                      return (
                        <div key={menu.id_menu} className="flex items-center mb-1 ml-2">
                          <input
                            type="checkbox"
                            id={`menu_${menu.id_menu}`}
                            checked={isChecked}
                            disabled={isLocked}
                            onChange={() => handleMenuCheckboxChange(menu.id_menu, true, group.group_menu)}
                            className="mr-1 rounded-sm"
                          />
                          <label htmlFor={`menu_${menu.id_menu}`} className="text-sm text-blue-800">
                            {menu.nama_menu}
                          </label>
                        </div>
                      );
                    })}
                    {/* Children */}
                    {group.children.length > 0 && (
                      <div className="ml-2 flex">
                        {group.children.map((menu) => {
                          const isChecked = selectedMenus.includes(menu.id_menu);
                          const isLocked = lockedMenuIds.includes(menu.id_menu);
                          return (
                            <div key={menu.id_menu} className="flex items-center mb-1 ml-4">
                              <input
                                type="checkbox"
                                id={`menu_${menu.id_menu}`}
                                checked={isChecked}
                                disabled={isLocked}
                                onChange={() => handleMenuCheckboxChange(menu.id_menu, false, group.group_menu)}
                                className="mr-1 rounded-sm"
                              />
                              <label htmlFor={`menu_${menu.id_menu}`} className="text-sm text-blue-800">
                                {menu.nama_menu}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            </div>

            {/* Tombol Submit */}
            <div className="flex justify-start mt-2">
              <button
                type="submit"
                className={`bg-blue-800 text-white p-2 w-24 rounded-md hover:bg-blue-950 transition duration-300 ${
                  submitLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={submitLoading}
              >
                {submitLoading ? <Loading /> : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
