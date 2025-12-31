import React, { useState } from 'react';
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from '../services/api';

const Profile = () => {
  const { employee, role, authLoading } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New passwords do not match',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);
    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({
        type: 'success',
        text: 'Password updated successfully',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Failed to update password',
      });
    } finally {
      setLoading(false);
    }
  };

  // while auth context is still fetching profile
  if (authLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  // if something went wrong and we still have no employee
  if (!employee) {
    return (
      <div className="p-6 text-sm text-red-600">
        Unable to load profile details.
      </div>
    );
  }

  const displayName = employee.name || 'User';
  const username = employee.username || employee.email || '';
  const designation = employee.designation || 'N/A';
  const department = employee.department || 'N/A';
  const roleName = role?.name || 'Unknown role';

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left card – avatar & summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                <HiOutlineUser className="h-12 w-12 text-teal-700" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {displayName}
              </h2>
              {username && (
                <p className="mt-1 text-sm text-gray-500">@{username}</p>
              )}
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                <HiOutlineShieldCheck className="h-4 w-4 mr-1" />
                {roleName}
              </div>
            </div>
          </div>
        </div>

        {/* Right side – details + password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <dl className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <HiOutlineUser className="h-5 w-5 mr-2" />
                  Full Name
                </dt>
                <dd className="text-sm text-gray-900">{displayName}</dd>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <HiOutlineBriefcase className="h-5 w-5 mr-2" />
                  Designation
                </dt>
                <dd className="text-sm text-gray-900">{designation}</dd>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <HiOutlineOfficeBuilding className="h-5 w-5 mr-2" />
                  Department
                </dt>
                <dd className="text-sm text-gray-900">{department}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <HiOutlineShieldCheck className="h-5 w-5 mr-2" />
                  Role
                </dt>
                <dd className="text-sm text-gray-900">{roleName}</dd>
              </div>
            </dl>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h3>
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <HiOutlineLockClosed className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    required
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <HiOutlineLockClosed className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    required
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <HiOutlineLockClosed className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-5 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-xl shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-60"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
