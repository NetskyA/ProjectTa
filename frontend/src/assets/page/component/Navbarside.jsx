// import { useState, useEffect } from "react";
// import { Link, useLocation } from "react-router-dom";
// import "aos/dist/aos.css";
// import AOS from "aos";

// export default function Navbarside ({ role }) {
//   const [isMasterOpen, setIsMasterOpen] = useState(false);
//   const location = useLocation();

//   const toggleMasterMenu = () => {
//     setIsMasterOpen(!isMasterOpen);
//   };

//   useEffect(() => {
//     AOS.init({ duration: 1000, once: true });
//   }, []);

//   return (
//     <div className="w-38" style={{ fontFamily: "sans-serif" }}>
//       <ul>
//         {/* Menu Utama Penjualan */}
//         <li className="mt-14 pt-1 m-2">
//           <div className="group">
//             <button
//               onClick={toggleMasterMenu}
//               className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
//                 isMasterOpen
//                   ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
//                   : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
//               }`}
//             >
//               <span className="ml-2 text-sm font-medium">Penjualan</span>
//             </button>
//           </div>

//           {/* Submenu */}
//           {isMasterOpen && (
//             <ul className="mt-1 pl-2 relative">
//               {/*Laporan */}
//               <li className="m-1" data-aos="fade-right">
//                 <Link
//                   to="menu/laporan"
//                   className={`block py-1 px-2 text-xs text-white rounded-sm ${
//                     location.pathname === "/dashboard/menu/laporan" ||
//                     location.pathname === "/dashboard/master-admin/menu/laporan"
//                       ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
//                       : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
//                   }`}
//                 >
//                   Menu Laporan
//                 </Link>
//               </li>

//               {/*Import */}
//               <li className="m-1" data-aos="fade-right">
//                 <Link
//                   to="menu/import"
//                   className={`block py-1 px-2 text-xs text-white rounded-sm ${
//                     location.pathname === "/dashboard/menu/import" ||
//                     location.pathname === "/dashboard/master-admin/menu/import"
//                       ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
//                       : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
//                   }`}
//                 >
//                   Menu Import
//                 </Link>
//               </li>

//               {/* Master User (Hanya untuk role 1 - Master Admin) */}
//               {role === 1 && (
//                 <li className="m-1" data-aos="fade-right">
//                   <Link
//                     to="menu/master-user"
//                     className={`block py-1 px-2 text-xs text-white rounded-sm ${
//                       location.pathname ===
//                       "/dashboard/master-admin/menu/master-user"
//                         ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
//                         : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
//                     }`}
//                   >
//                     Master User
//                   </Link>
//                 </li>
//               )}
//             </ul>
//           )}
//         </li>
//       </ul>
//     </div>
//   );
// };
