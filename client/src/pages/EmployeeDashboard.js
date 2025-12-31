import React, { useState, useEffect } from 'react';
import {
    HiOutlineClipboardList,
    HiOutlineShoppingCart,
    HiOutlineCheckCircle,
    HiOutlineClock
} from 'react-icons/hi';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        presentToday: false,
        streak: 0,
        scansToday: 0,
        pendingRequests: 0
    });
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployeeStats = async () => {
            try {
                // Fetch personalized stats
                // Note: In a real app, we'd have a specific endpoint or process this from existing ones
                // Here we simulate/fetch from existing endpoints

                // 1. Attendance
                const { data: attendanceData } = await api.get('/attendance');
                const myAttendance = attendanceData?.records || [];
                const today = new Date().toISOString().split('T')[0];
                const isPresent = myAttendance.some(r => r.timestamp.startsWith(today));

                // 2. Scans (Transactions) - Backend usually filters, but for now we might get all or limited
                // Ideally: GET /api/inventory/my-transactions
                // Workaround: We'll assume we don't have this endpoint yet, so placeholder or use transactions from inventory if available
                // For now, let's use placeholder for Scans as we didn't update backend to filter transactions by user yet

                // 3. Purchase Requests
                const { data: requestData } = await api.get('/purchase-requests');
                const myRequests = requestData?.requests || [];
                const pendingCount = myRequests.filter(r => r.status.includes('pending')).length;

                setStats({
                    presentToday: isPresent,
                    streak: 5, // Mock data
                    scansToday: 0, // Mock or fetch if available
                    pendingRequests: pendingCount
                });

                setLoading(false);
            } catch (error) {
                console.error('Error loading employee dashboard:', error);
                setLoading(false);
            }
        };

        fetchEmployeeStats();
    }, []);

    const styles = {
        container: { padding: '24px' },
        welcomeSection: {
            marginBottom: '32px',
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        welcomeText: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '4px'
        },
        dateText: { color: '#6B7280' },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
        },
        statCard: {
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        },
        iconBox: (color) => ({
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            marginBottom: '16px'
        }),
        value: { fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' },
        label: { color: '#6B7280', fontSize: '14px' },
        actionsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
        },
        actionBtn: {
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none',
            color: 'inherit'
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.welcomeSection}>
                <div>
                    <h1 style={styles.welcomeText}>Welcome back, {user?.name || 'Employee'}! 👋</h1>
                    <p style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: stats.presentToday ? '#DEF7EC' : '#FDE8E8',
                    color: stats.presentToday ? '#03543F' : '#9B1C1C',
                    fontWeight: '600'
                }}>
                    {stats.presentToday ? 'Checked In' : 'Not Checked In'}
                </div>
            </div>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.iconBox('#3B82F6')}>
                        <HiOutlineClipboardList />
                    </div>
                    <div style={styles.value}>{stats.pendingRequests}</div>
                    <div style={styles.label}>Pending Requests</div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.iconBox('#10B981')}>
                        <HiOutlineCheckCircle />
                    </div>
                    <div style={styles.value}>{stats.streak}</div>
                    <div style={styles.label}>Day Streak</div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.iconBox('#F59E0B')}>
                        <HiOutlineShoppingCart />
                    </div>
                    <div style={styles.value}>{stats.scansToday}</div>
                    <div style={styles.label}>Items Scanned Today</div>
                </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Quick Actions</h3>
            <div style={styles.actionsGrid}>
                <Link to="/inventory" style={styles.actionBtn}>
                    <HiOutlineClipboardList size={24} color="#4B5563" />
                    <span style={{ fontWeight: '500' }}>Scan Item</span>
                </Link>
                <Link to="/purchase" style={styles.actionBtn}>
                    <HiOutlineShoppingCart size={24} color="#4B5563" />
                    <span style={{ fontWeight: '500' }}>New Request</span>
                </Link>
                <Link to="/attendance" style={styles.actionBtn}>
                    <HiOutlineClock size={24} color="#4B5563" />
                    <span style={{ fontWeight: '500' }}>Mark Attendance</span>
                </Link>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
