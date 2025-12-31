import React, { useEffect, useState } from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineLogin,
  HiOutlineLogout,
} from 'react-icons/hi';
import api from '../utils/axios'; // ✅ Changed from 'axios' to '../utils/axios'
import { useAuth } from '../context/AuthContext';


const Attendance = () => {
  const { hasPermission } = useAuth();
  const [attendance, setAttendance] = useState({
    records: [],
    summary: { present: 0, absent: 0, late: 0 },
    attendancePercentage: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ employeeId: '', status: 'Present', note: '' });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  // Clock In/Out state for employees
  const [clockStatus, setClockStatus] = useState({
    clockedIn: false,
    clockedOut: false,
    clockInTime: null,
    clockOutTime: null,
    status: null
  });
  const [clocking, setClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState(null);

  const loadAttendance = async () => {
    try {
      // ✅ Removed manual token headers - interceptor handles it
      // ✅ Changed to relative URL since baseURL is in axios.js
      const { data } = await api.get('/attendance');
      setAttendance(data);
    } catch (error) {
      console.error('Failed to load attendance', error);
    } finally {
      setLoading(false);
    }
  };


  const loadEmployees = async () => {
    try {
      // ✅ Removed manual token headers - interceptor handles it
      const { data } = await api.get('/employees');
      setEmployees(data || []);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  // Load clock status for employee self-service
  const loadClockStatus = async () => {
    try {
      const { data } = await api.get('/attendance/my-status');
      setClockStatus(data);
    } catch (error) {
      console.error('Failed to load clock status', error);
    }
  };

  // Handle clock in/out action
  const handleClock = async (action) => {
    setClocking(true);
    setClockMessage(null);
    try {
      const { data } = await api.post('/attendance/clock', { action });
      setClockMessage({ type: 'success', text: data.message });
      loadClockStatus();
      loadAttendance();
    } catch (error) {
      setClockMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to record clock action.'
      });
    } finally {
      setClocking(false);
    }
  };


  useEffect(() => {
    loadAttendance();
    loadEmployees();
    loadClockStatus();
  }, []);


  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage(null);
    try {
      // ✅ Removed manual token headers - interceptor handles it
      await api.post('/attendance', form);
      setMessage({ type: 'success', text: 'Attendance recorded successfully.' });
      setForm({ employeeId: '', status: 'Present', note: '' });
      loadAttendance();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to record attendance.',
      });
    } finally {
      setProcessing(false);
    }
  };


  const statusIcon = (status) => {
    const s = status.toLowerCase();
    if (s === 'present') return <HiOutlineCheckCircle style={{ fontSize: '20px', color: '#16a34a' }} />;
    if (s === 'absent') return <HiOutlineXCircle style={{ fontSize: '20px', color: '#dc2626' }} />;
    if (s === 'late') return <HiOutlineClock style={{ fontSize: '20px', color: '#ca8a04' }} />;
    return null;
  };


  const filteredRecords = dateFilter
    ? attendance.records.filter((record) => {
      const recordDate = new Date(record.timestamp).toISOString().slice(0, 10);
      return recordDate === dateFilter;
    })
    : attendance.records;


  const handleExportAttendance = () => {
    const exportData = filteredRecords.map((record) => ({
      Employee: record.employeeName,
      Status: record.status,
      Date: new Date(record.timestamp).toLocaleDateString(),
      Time: new Date(record.timestamp).toLocaleTimeString(),
      Note: record.note || '',
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
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
    summaryCard: {
      background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
      borderRadius: '16px',
      padding: '24px',
      color: 'white',
      marginBottom: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
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
      marginBottom: '16px'
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
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'white',
      background: '#0d9488',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
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
    }
  };


  if (loading) {
    return <div style={styles.container}>Loading attendance data...</div>;
  }


  const canManageAttendance = hasPermission && hasPermission('manageAttendance');
  const totalMarked = attendance.summary.present + attendance.summary.absent + attendance.summary.late;


  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          {canManageAttendance ? 'Employee Attendance' : 'My Attendance'}
        </h1>
        <p style={styles.subtitle}>
          {canManageAttendance
            ? 'Monitor and manage daily attendance of all team members.'
            : 'View your attendance records and performance.'}
        </p>
      </div>


      {/* Summary Card for non-admin */}
      {!canManageAttendance && (
        <div style={styles.summaryCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Your Attendance Rate</h2>
              <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>Based on all recorded attendance</p>
              <div style={{ marginTop: '16px', display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '14px' }}>
                {attendance.summary.present} present / {totalMarked} total
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '48px', fontWeight: '700' }}>{attendance.attendancePercentage}%</div>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>Attendance</p>
            </div>
          </div>
        </div>
      )}

      {/* Clock In/Out Card for employees */}
      {!canManageAttendance && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Today's Clock Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Clock In Status */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: clockStatus.clockedIn ? '#dcfce7' : '#f3f4f6',
              border: clockStatus.clockedIn ? '1px solid #86efac' : '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HiOutlineLogin style={{ fontSize: '20px', color: clockStatus.clockedIn ? '#16a34a' : '#9ca3af' }} />
                <span style={{ fontWeight: '600', color: clockStatus.clockedIn ? '#16a34a' : '#6b7280' }}>Clock In</span>
              </div>
              {clockStatus.clockedIn ? (
                <div>
                  <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                    {new Date(clockStatus.clockInTime).toLocaleTimeString()}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    borderRadius: '12px',
                    background: clockStatus.status === 'Late' ? '#fef3c7' : '#dcfce7',
                    color: clockStatus.status === 'Late' ? '#ca8a04' : '#16a34a'
                  }}>
                    {clockStatus.status}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Not clocked in yet</p>
              )}
            </div>

            {/* Clock Out Status */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: clockStatus.clockedOut ? '#dbeafe' : '#f3f4f6',
              border: clockStatus.clockedOut ? '1px solid #93c5fd' : '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HiOutlineLogout style={{ fontSize: '20px', color: clockStatus.clockedOut ? '#2563eb' : '#9ca3af' }} />
                <span style={{ fontWeight: '600', color: clockStatus.clockedOut ? '#2563eb' : '#6b7280' }}>Clock Out</span>
              </div>
              {clockStatus.clockedOut ? (
                <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                  {new Date(clockStatus.clockOutTime).toLocaleTimeString()}
                </p>
              ) : (
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Not clocked out yet</p>
              )}
            </div>
          </div>

          {/* Clock Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleClock('in')}
              disabled={clocking || clockStatus.clockedIn}
              style={{
                ...styles.button,
                background: clockStatus.clockedIn ? '#9ca3af' : '#16a34a',
                cursor: clockStatus.clockedIn ? 'not-allowed' : 'pointer',
                opacity: clockStatus.clockedIn ? 0.6 : 1
              }}
            >
              <HiOutlineLogin style={{ marginRight: '6px' }} />
              {clocking ? 'Processing...' : clockStatus.clockedIn ? 'Already Clocked In' : 'Clock In'}
            </button>
            <button
              onClick={() => handleClock('out')}
              disabled={clocking || !clockStatus.clockedIn || clockStatus.clockedOut}
              style={{
                ...styles.button,
                background: (!clockStatus.clockedIn || clockStatus.clockedOut) ? '#9ca3af' : '#2563eb',
                cursor: (!clockStatus.clockedIn || clockStatus.clockedOut) ? 'not-allowed' : 'pointer',
                opacity: (!clockStatus.clockedIn || clockStatus.clockedOut) ? 0.6 : 1
              }}
            >
              <HiOutlineLogout style={{ marginRight: '6px' }} />
              {clocking ? 'Processing...' : clockStatus.clockedOut ? 'Already Clocked Out' : 'Clock Out'}
            </button>
          </div>

          {/* Clock Message */}
          {clockMessage && (
            <p style={{ marginTop: '16px', fontSize: '14px', color: clockMessage.type === 'success' ? '#16a34a' : '#dc2626' }}>
              {clockMessage.text}
            </p>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '12px', background: '#dcfce7', color: '#16a34a', borderRadius: '12px' }}>
              <HiOutlineCheckCircle style={{ fontSize: '28px' }} />
            </div>
            <div style={{ marginLeft: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', margin: 0, textTransform: 'uppercase' }}>Present</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', margin: '4px 0 0 0' }}>
                {attendance.summary.present}
              </p>
            </div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px' }}>
              <HiOutlineXCircle style={{ fontSize: '28px' }} />
            </div>
            <div style={{ marginLeft: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', margin: 0, textTransform: 'uppercase' }}>Absent</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', margin: '4px 0 0 0' }}>
                {attendance.summary.absent}
              </p>
            </div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '12px', background: '#fef3c7', color: '#ca8a04', borderRadius: '12px' }}>
              <HiOutlineClock style={{ fontSize: '28px' }} />
            </div>
            <div style={{ marginLeft: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', margin: 0, textTransform: 'uppercase' }}>Late</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', margin: '4px 0 0 0' }}>
                {attendance.summary.late}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Record Attendance Form (Admin) */}
      {canManageAttendance && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Record Attendance</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Employee</label>
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  style={styles.select}
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Note</label>
                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Optional note"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button type="submit" disabled={processing} style={styles.button}>
                {processing ? 'Recording…' : 'Record attendance'}
              </button>
            </div>
          </form>
          {message && (
            <p style={{ marginTop: '16px', fontSize: '14px', color: message.type === 'success' ? '#16a34a' : '#dc2626' }}>
              {message.text}
            </p>
          )}
        </div>
      )}


      {/* Attendance Records Table */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...styles.cardTitle, margin: 0 }}>
            {canManageAttendance ? 'Attendance Records' : 'My Attendance Records'}
          </h2>
          <button onClick={handleExportAttendance} style={{ ...styles.button, background: '#6b7280', padding: '8px 12px', fontSize: '13px' }}>
            <HiOutlineDownload style={{ marginRight: '6px' }} /> Export
          </button>
        </div>


        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '300px' }}>
            <HiOutlineCalendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '20px' }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ ...styles.input, paddingLeft: '40px', marginTop: 0 }}
            />
          </div>
          {dateFilter && (
            <>
              <button onClick={() => setDateFilter('')} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', border: 'none', background: 'none' }}>
                Clear filter
              </button>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Showing {filteredRecords.length} of {attendance.records.length} records
              </span>
            </>
          )}
        </div>


        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Recorded By</th>
                <th style={styles.th}>Note</th>
                <th style={styles.th}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                    No attendance records found.
                  </td>
                </tr>
              )}
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td style={{ ...styles.td, fontWeight: '500', color: '#1a1a1a' }}>
                    {record.employeeName}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {statusIcon(record.status)}
                      <span>{record.status}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{record.recordedBy}</td>
                  <td style={{ ...styles.td, color: '#9ca3af' }}>{record.note || '—'}</td>
                  <td style={{ ...styles.td, color: '#9ca3af' }}>
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default Attendance;

