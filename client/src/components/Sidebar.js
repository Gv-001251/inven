import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineShoppingCart,
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineCube,
  HiOutlineLogout,
  HiOutlineQuestionMarkCircle
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { hasPermission, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { path: '/inventory', icon: HiOutlineClipboardList, label: 'Inventory', permission: 'viewInventory' },
    { path: '/finished-products', icon: HiOutlineCube, label: 'Finished Products', permission: 'viewFinishedProducts' },
    { path: '/attendance', icon: HiOutlineUsers, label: 'Attendance', permission: 'viewAttendance' },
    { path: '/invoice', icon: HiOutlineDocumentText, label: 'Invoice', permission: 'viewInvoices' },
    { path: '/purchase', icon: HiOutlineShoppingCart, label: 'Purchase', permission: 'createPurchaseRequest' },
    { path: '/notifications', icon: HiOutlineBell, label: 'Notification', permission: 'viewNotifications' },
    { path: '/settings', icon: HiOutlineCog, label: 'Settings', permission: 'manageRoles' }
  ].filter(item => !item.permission || hasPermission(item.permission));

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-primary text-white flex flex-col z-50 shadow-xl">
      {/* Header / Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
          <div className="h-4 w-4 bg-primary rounded-sm"></div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight">Breeze Techniques</h1>
          <span className="text-[10px] text-gray-400 font-medium">Inventory Management</span>
        </div>
      </div>

      {/* Menu List */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group
                ${active
                  ? 'bg-gradient-to-r from-emerald-custom/20 to-transparent text-emerald-custom border-l-4 border-emerald-custom'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className={`text-xl ${active ? 'text-emerald-custom' : 'text-gray-400 group-hover:text-white'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          to="/help"
          className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <HiOutlineQuestionMarkCircle className="text-xl" />
          <span className="text-sm font-medium">Help & Support</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left"
        >
          <HiOutlineLogout className="text-xl" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
