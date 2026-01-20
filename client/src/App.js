import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Attendance from './pages/Attendance';
import Purchase from './pages/Purchase';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import Invoice from './pages/Invoice';
import DeliveryChallan from './pages/DeliveryChallan';
import FinishedProducts from './pages/FinishedProducts';
import GSTUpload from './pages/GSTUpload';
import EInvoice from './pages/EInvoice';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import MailConfirmation from './pages/MailConfirmation';
import Bills from './pages/Bills';
import Upload from './pages/Upload';

const ProtectedRoute = ({ children, permission }) => {
  const { token, hasPermission } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Allow access if no specific permission required OR if user has permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={token ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route
        path="/mail-confirmation"
        element={token ? <Navigate to="/dashboard" replace /> : <MailConfirmation />}
      />
      <Route
        path="/forgot-password"
        element={token ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={token ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
      />
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      {/* Dashboard - accessible to all logged-in users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Other routes with permissions */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute permission="viewAttendance">
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase"
        element={
          <ProtectedRoute permission="createPurchaseRequest">
            <Layout>
              <Purchase />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute permission="viewNotifications">
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute permission="manageRoles">
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bills"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <Bills />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <Upload />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoice"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <Invoice />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery-challan"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <DeliveryChallan />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finished-products"
        element={
          <ProtectedRoute permission="viewFinishedProducts">
            <Layout>
              <FinishedProducts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gst-upload"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <GSTUpload />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/einvoice"
        element={
          <ProtectedRoute permission="viewInventory">
            <Layout>
              <EInvoice />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
