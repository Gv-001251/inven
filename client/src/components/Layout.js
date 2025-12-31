import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const styles = {
    layoutContainer: {
      display: 'flex',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: '#f8f9fa'
    },
    mainContent: {
      marginLeft: '260px', // Match sidebar width
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    },
    contentWrapper: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden'
    }
  };

  return (
    <div style={styles.layoutContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Header />
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
