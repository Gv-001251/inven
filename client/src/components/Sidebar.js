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
  HiOutlineCube
} from 'react-icons/hi';

import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' }, // Always visible
    { path: '/inventory', icon: HiOutlineClipboardList, label: 'Inventory', permission: 'viewInventory' },
    { path: '/finished-products', icon: HiOutlineCube, label: 'Finished Products', permission: 'viewFinishedProducts' },
    { path: '/attendance', icon: HiOutlineUsers, label: 'Attendance', permission: 'viewAttendance' },
    { path: '/purchase', icon: HiOutlineShoppingCart, label: 'Purchase', permission: 'createPurchaseRequest' },
    { path: '/invoice', icon: HiOutlineDocumentText, label: 'Invoice', permission: 'viewInvoices' },
    { path: '/notifications', icon: HiOutlineBell, label: 'Notifications', permission: 'viewNotifications' },
    { path: '/settings', icon: HiOutlineCog, label: 'Settings', permission: 'manageRoles' }
  ].filter(item => !item.permission || hasPermission(item.permission));

  const isActive = (path) => location.pathname === path;

  const styles = {
    sidebar: {
      width: '260px',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    },
    logo: {
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '20px',
      fontWeight: '700'
    },
    logoText: {
      display: 'flex',
      flexDirection: 'column'
    },
    companyName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: 0
    },
    subtitle: {
      fontSize: '12px',
      color: '#666',
      margin: 0
    },
    menuSection: {
      flex: 1,
      padding: '20px 0',
      overflowY: 'auto'
    },
    sectionTitle: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '0 20px',
      marginBottom: '8px'
    },
    menuList: {
      listStyle: 'none',
      padding: 0,
      margin: '0 0 24px 0'
    },
    menuItem: {
      margin: '4px 12px',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    menuLink: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      color: active ? '#0d9488' : '#6b7280',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: active ? '600' : '500',
      background: active ? '#f0fdfa' : 'transparent',
      borderLeft: active ? '3px solid #0d9488' : '3px solid transparent',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }),
    icon: {
      fontSize: '20px',
      flexShrink: 0
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>BT</div>
        <div style={styles.logoText}>
          <h3 style={styles.companyName}>Breeze Techniques</h3>
          <p style={styles.subtitle}>Inventory Management</p>
        </div>
      </div>

      <div style={styles.menuSection}>
        <div style={styles.sectionTitle}>MENU</div>
        <ul style={styles.menuList}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path} style={styles.menuItem}>
                <Link to={item.path} style={styles.menuLink(active)}>
                  <Icon style={styles.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
