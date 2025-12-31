import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    console.log('🔄 AuthContext initializing...');

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    console.log('📦 Stored token:', storedToken ? 'EXISTS' : 'NULL');
    console.log('📦 Stored user:', storedUser ? 'EXISTS' : 'NULL');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('✅ User loaded:', parsedUser);
      } catch (error) {
        console.error('❌ Failed to parse user, clearing session:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
      }
    } else if (storedToken && !storedUser) {
      console.warn('⚠️ Token found without user data. Clearing session.');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      // Optional: Redirect to login if needed, but App.js handles it if token is null
    }

    setLoading(false);
    console.log('✅ AuthContext initialized');
  }, []);

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    if (user.permissions.fullAccess) return true;
    return !!user.permissions[permission];
  };


  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    token,
    user,
    loading,
    hasPermission,
    logout,
    setToken,
    setUser
  };

  console.log('🔄 AuthContext render - Token:', !!token, 'User:', user?.name);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
