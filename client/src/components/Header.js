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
    <header className="flex items-center justify-between mb-8">
      {/* Search - styled like the image (pill shape, outlined) */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-primary/20 focus:outline-none focus:ring-2 focus:ring-emerald-custom/50 focus:border-emerald-custom text-sm text-primary placeholder:text-primary/40 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 text-primary hover:bg-emerald-custom/10 rounded-full transition-colors"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <HiOutlineBell className="h-7 w-7" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-mint" />
        </button>

        {/* User Profile */}
        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/profile')}>
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Header;
