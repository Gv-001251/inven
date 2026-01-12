import React, { useEffect, useState } from 'react';
import { HiOutlineUserAdd, HiOutlineShieldCheck } from 'react-icons/hi';
import api from '../utils/axios';

const Settings = () => {
  const [roles, setRoles] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermissions, setRolePermissions] = useState({});
  const [form, setForm] = useState({
    name: '',
    roleId: '',
    designation: '',
    department: '',
    username: '',
    password: '',
  });

  const [processing, setProcessing] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      const [rolesRes, employeesRes] = await Promise.all([
        api.get('/roles'),
        api.get('/employees'),
      ]);

      setRoles(rolesRes.data.roles || []);
      setPermissionsCatalog(rolesRes.data.permissionsCatalog || {});
      setEmployees(employeesRes.data.employees || []);
    } catch (error) {
      console.error('Unable to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    const role = roles.find((item) => item.id === selectedRoleId);
    if (role) {
      setRolePermissions(
        role.permissions?.fullAccess
          ? { fullAccess: true }
          : { ...(role.permissions || {}) },
      );
    }
  }, [selectedRoleId, roles]);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage(null);
    try {
      await api.post('/employees', form);

      setMessage({ type: 'success', text: 'Employee added successfully.' });
      setForm({
        name: '',
        roleId: '',
        designation: '',
        department: '',
        username: '',
        password: '',
      });
      loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to add employee.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const togglePermission = (key) => {
    setRolePermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingRole(true);
    setMessage(null);
    try {
      const permissionsToSave = { ...(rolePermissions || {}) };
      delete permissionsToSave.fullAccess;

      const { data } = await api.put(
        `/roles/${selectedRoleId}/permissions`,
        { permissions: permissionsToSave }
      );

      setRoles((prev) =>
        prev.map((role) =>
          role.id === selectedRoleId ? data.role : role,
        ),
      );
      setMessage({
        type: 'success',
        text: 'Role permissions updated successfully.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to update role permissions.',
      });
    } finally {
      setSavingRole(false);
    }
  };

  const styles = {
    container: {
      padding: '24px',
      background: '#f8f9fa',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '14px',
      color: '#666'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginTop: '4px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginTop: '4px',
      boxSizing: 'border-box'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'white',
      background: '#0d9488',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#666',
      textTransform: 'uppercase',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb'
    },
    td: {
      padding: '16px 12px',
      fontSize: '14px',
      borderBottom: '1px solid #f3f4f6'
    },
    permissionBox: {
      background: '#f9fafb',
      border: '1px solid #f3f4f6',
      borderRadius: '12px',
      padding: '16px',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    checkbox: {
      width: '16px',
      height: '16px',
      cursor: 'pointer',
      accentColor: '#0d9488'
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading settings…</div>;
  }

  const editableRoles = roles.filter((role) => !role.permissions?.fullAccess);
  const permissionsList = Object.entries(permissionsCatalog || {});

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>
          Manage employees and configure role-based access across the platform.
        </p>
      </div>

      {/* Role Permissions */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={styles.cardTitle}>
            <HiOutlineShieldCheck style={{ marginRight: '8px', color: '#0d9488', fontSize: '20px' }} />
            Role Permissions
          </h2>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            Only non-executive roles can be modified.
          </span>
        </div>

        {editableRoles.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            No roles available for editing.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '24px' }}>
            {/* Role Selector */}
            <div>
              <label style={styles.label}>Select Role</label>
              <select
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                style={styles.select}
              >
                <option value="">Choose role</option>
                {editableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                Permissions update instantly and apply to all employees in the selected role.
              </p>
            </div>

            {/* Permissions List */}
            <div>
              {selectedRoleId ? (
                <div style={styles.permissionBox}>
                  {permissionsList.map(([key, description]) => (
                    <label
                      key={key}
                      style={{ display: 'flex', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={Boolean(rolePermissions[key])}
                        onChange={() => togglePermission(key)}
                      />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>
                          {description}
                        </p>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={savingRole}
                    style={{ ...styles.button, marginTop: '12px' }}
                  >
                    {savingRole ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              ) : (
                <div style={{ padding: '24px', fontSize: '14px', color: '#9ca3af', background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '12px', textAlign: 'center' }}>
                  Select a role to review and update its permissions.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Employee */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <HiOutlineUserAdd style={{ marginRight: '8px', color: '#0d9488', fontSize: '20px' }} />
          Add Employee
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Role</label>
              <select
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Designation</label>
              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Department</label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button type="submit" disabled={processing} style={styles.button}>
              {processing ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>

      {/* All Employees Table */}
      <div style={styles.card}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ ...styles.cardTitle, marginBottom: 0 }}>All Employees</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Designation</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const role = roles.find((r) => r.id === employee.roleId);
                return (
                  <tr key={employee.id}>
                    <td style={{ ...styles.td, fontWeight: '500', color: '#1a1a1a' }}>
                      {employee.name}
                    </td>
                    <td style={styles.td}>{employee.designation}</td>
                    <td style={styles.td}>{employee.department}</td>
                    <td style={styles.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: '#dbeafe',
                        color: '#1e40af'
                      }}>
                        {role?.name || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Message */}
      {message && (
        <div style={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: message.type === 'success' ? '#86efac' : '#fca5a5',
          padding: '12px 16px',
          fontSize: '14px',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#15803d' : '#dc2626'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default Settings;
