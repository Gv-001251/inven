import React from 'react';
import {
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineSearch,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (employee?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-5 lg:px-8 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search inventory, items, or employees…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-breeze-blue focus:border-transparent text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 lg:gap-4 ml-4">
        {/* Notifications */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-breeze-blue hover:border-breeze-blue/40 transition-colors"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <HiOutlineBell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </button>

        {/* User chip */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 rounded-full bg-slate-50 border border-slate-200 px-2.5 lg:px-3 py-1.5 hover:bg-white hover:border-breeze-blue/40 shadow-sm hover:shadow transition-all"
          title={`View Profile - ${employee?.name || 'User'}`}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#4f46e5] text-white flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-slate-900 leading-tight">
              {employee?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {employee?.email || 'inventory@breeze.tech'}
            </p>
          </div>
        </button>

        {/* Logout */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <HiOutlineLogout className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
