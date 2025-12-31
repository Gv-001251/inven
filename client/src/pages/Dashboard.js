import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { hasPermission, user } = useAuth();

  // Check if user is an Employee (limited access)
  const isEmployee = user?.permissions && !user.permissions.fullAccess && !hasPermission('viewAttendance');
  const [stats, setStats] = useState({
    totalInventory: 0,
    lowStockItems: 0,
    pendingRequests: 0,
    presentToday: 0,
    attendancePercentage: 0,
    totalEmployees: 0
  });

  const [inventoryMovement, setInventoryMovement] = useState({
    dates: [],
    inbound: [],
    outbound: []
  });

  const [topItems, setTopItems] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState({
    totalStock: 0,
    totalProducts: 0,
    readyForDispatch: 0,
    lowStockCount: 0,
    categoryStats: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    console.log('📊 Fetching dashboard data...');
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/inventory-movement'),
        api.get('/dashboard/top-items'),
        api.get('/dashboard/low-stock'),
        api.get('/dashboard/recent-transactions'),
        api.get('/finished-products/summary')
      ]);

      console.log('✅ Dashboard API calls completed');

      if (results[0].status === 'fulfilled') {
        const statsResponse = results[0].value.data;
        console.log('📊 Stats response:', statsResponse);

        if (statsResponse.success) {
          const statsData = statsResponse.data;
          console.log('✅ Setting stats:', statsData);
          setStats({
            totalInventory: statsData.totalInventory || 0,
            lowStockItems: statsData.lowStockItems || 0,
            pendingRequests: statsData.pendingRequests || 0,
            presentToday: statsData.presentToday || 0,
            totalEmployees: statsData.totalEmployees || 0,
            attendancePercentage: statsData.attendancePercentage || 0
          });
        }
      } else {
        console.error('❌ Stats request failed:', results[0].reason);
      }

      if (results[1].status === 'fulfilled' && results[1].value.data.success) {
        setInventoryMovement(results[1].value.data.data);
      }
      if (results[2].status === 'fulfilled' && results[2].value.data.success) {
        setTopItems(results[2].value.data.data || []);
      }
      if (results[3].status === 'fulfilled' && results[3].value.data.success) {
        setLowStockList(results[3].value.data.data || []);
      }
      if (results[4].status === 'fulfilled' && results[4].value.data.success) {
        setRecentTransactions(results[4].value.data.data || []);
      }
      if (results[5].status === 'fulfilled' && results[5].value.data.success) {
        const fpData = results[5].value.data.data;
        setFinishedProducts({
          totalStock: fpData?.totalStock || 0,
          totalProducts: fpData?.totalProducts || 0,
          readyForDispatch: fpData?.totalProducts || 0,
          lowStockCount: fpData?.lowStockCount || 0,
          categoryStats: fpData?.categories || [],
          topProducts: fpData?.recentlyAdded || []
        });
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show simplified Employee Dashboard for limited users (AFTER all hooks)
  if (isEmployee) {
    return <EmployeeDashboard />;
  }

  const statsData = [
    {
      title: 'TOTAL INVENTORY',
      value: loading ? '...' : stats.totalInventory.toString(),
      subtitle: 'Net movement trend over the last 7 days',
      icon: '📦',
      color: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
      iconBg: 'rgba(255,255,255,0.2)'
    },
    {
      title: 'LOW STOCK ITEMS',
      value: loading ? '...' : stats.lowStockItems.toString(),
      subtitle: stats.lowStockItems === 0 ? 'All items above threshold' : 'Need attention',
      icon: '⚠️',
      color: '#fff',
      textColor: '#333',
      iconBg: '#FFE5E5',
      borderColor: '#FFD6D6'
    },
    {
      title: 'PENDING REQUESTS',
      value: loading ? '...' : stats.pendingRequests.toString(),
      subtitle: 'Awaiting approval',
      icon: '📋',
      color: '#fff',
      textColor: '#333',
      iconBg: '#FFF4E5',
      borderColor: '#FFE5CC'
    },
    {
      title: 'PRESENT TODAY',
      value: loading ? '...' : stats.presentToday.toString(),
      subtitle: `${stats.attendancePercentage}% attendance today`,
      icon: '👥',
      color: '#fff',
      textColor: '#333',
      iconBg: '#E5F9F5',
      borderColor: '#CCF2E8'
    }
  ];

  const stockDistribution = (topItems || []).slice(0, 6).map(item => ({
    name: item?.name || 'N/A',
    value: Math.min(((item?.quantity || 0) / 100) * 100, 100)
  }));

  while (stockDistribution.length < 6) {
    stockDistribution.push({ name: 'N/A', value: 0 });
  }

  const styles = {
    container: {
      padding: '1rem 1.5rem',
      background: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      width: '100%',
    },
    header: {
      marginBottom: '1rem',
      textAlign: 'left',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: '0 0 0.3rem 0'
    },
    subtitle: {
      color: '#666',
      fontSize: '0.95rem',
      margin: 0
    },
    refreshBtn: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.9rem',
      transition: 'all 0.2s'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    statCard: (bgColor, textColor = '#fff', borderColor) => ({
      background: bgColor,
      padding: '1.25rem',
      borderRadius: '14px',
      boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
      position: 'relative',
      overflow: 'hidden',
      border: borderColor ? `1px solid ${borderColor}` : 'none',
      minHeight: '160px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'transform 0.3s ease',
      cursor: 'pointer',
      transform: 'translateY(0)',
    }),
    statHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '0.75rem'
    },
    statTitle: (textColor = '#fff') => ({
      fontSize: '0.7rem',
      fontWeight: '600',
      color: textColor === '#fff' ? 'rgba(255,255,255,0.9)' : '#666',
      letterSpacing: '0.5px',
      marginBottom: '0.3rem'
    }),
    statIcon: (bg) => ({
      width: '44px',
      height: '44px',
      borderRadius: '11px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.3rem'
    }),
    statValue: (textColor = '#fff') => ({
      fontSize: '2.5rem',
      fontWeight: '700',
      color: textColor,
      lineHeight: '1',
      marginBottom: '0.4rem'
    }),
    statSubtitle: (textColor = '#fff') => ({
      fontSize: '0.8rem',
      color: textColor === '#fff' ? 'rgba(255,255,255,0.85)' : '#666',
      lineHeight: '1.3'
    }),
    statProgress: () => ({
      width: '100%',
      height: '3px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '0.75rem'
    }),
    statProgressBar: (width) => ({
      width: `${width}%`,
      height: '100%',
      background: 'rgba(255,255,255,0.5)',
      borderRadius: '2px'
    }),
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem'
    },
    card: {
      background: 'white',
      borderRadius: '14px',
      padding: '1rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
    },
    cardHeader: {
      marginBottom: '0.75rem'
    },
    cardTitle: {
      fontSize: '1.05rem',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0 0 0.25rem 0'
    },
    cardSubtitle: {
      fontSize: '0.8rem',
      color: '#666',
      margin: 0
    },
    chartContainer: {
      height: '140px',
      position: 'relative'
    },
    movementChart: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: '100px',
      borderBottom: '1px solid #e0e0e0',
      borderLeft: '1px solid #e0e0e0',
      padding: '0.5rem 0',
      gap: '0.4rem',
      position: 'relative'
    },
    movementBar: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
      position: 'relative',
      height: '100%'
    },
    barGroup: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      width: '100%',
      height: '100%',
      justifyContent: 'flex-end'
    },
    bar: (height, color) => ({
      width: '100%',
      maxHeight: '85px',
      height: `${Math.min(height, 85)}px`,
      background: color,
      borderRadius: '3px 3px 0 0',
      transition: 'height 0.3s ease',
      minHeight: '2px'
    }),
    movementDate: {
      fontSize: '0.65rem',
      color: '#666',
      marginTop: '0.25rem',
      whiteSpace: 'nowrap'
    },
    chartLegend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1.5rem',
      marginTop: '0.75rem'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      fontSize: '0.8rem'
    },
    legendDot: (color) => ({
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: color
    }),
    radarContainer: {
      width: '100%',
      height: '140px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    },
    radarChart: {
      width: '140px',
      height: '140px',
      position: 'relative'
    },
    alertsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem'
    },
    alertCard: {
      background: 'white',
      borderRadius: '14px',
      padding: '1rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      minHeight: '100px'
    },
    alertTitle: {
      fontSize: '1.05rem',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '0.75rem'
    },
    alertMessage: {
      fontSize: '0.85rem',
      color: '#666',
      lineHeight: '1.5'
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '0.85rem'
    },
    stockWarning: {
      color: '#f59e0b',
      fontWeight: '600'
    },
    transactionType: (type) => ({
      color: type === 'in' ? '#10b981' : '#ef4444',
      fontWeight: '600'
    }),
    attendanceCard: {
      textAlign: 'center'
    },
    attendanceCircle: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      border: '6px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '1rem auto'
    },
    attendanceValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1a1a1a'
    },
    attendanceLabel: {
      fontSize: '0.75rem',
      color: '#666'
    },
    attendanceStats: {
      fontSize: '0.85rem',
      color: '#4A90E2',
      fontWeight: '600',
      marginTop: '0.75rem'
    }
  };

  const maxMovement = Math.max(
    ...(inventoryMovement?.inbound || []),
    ...(inventoryMovement?.outbound || []).map(val => Math.abs(val)),
    10
  );

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Monitor inventory, movements, and team activity at a glance.</p>
        </div>
        <button
          style={styles.refreshBtn}
          onClick={fetchDashboardData}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <div key={index} style={styles.statCard(stat.color, stat.textColor, stat.borderColor)}>
            <div style={styles.statHeader}>
              <div>
                <div style={styles.statTitle(stat.textColor || '#fff')}>{stat.title}</div>
              </div>
              <div style={styles.statIcon(stat.iconBg)}>{stat.icon}</div>
            </div>
            <div>
              <div style={styles.statValue(stat.textColor || '#fff')}>{stat.value}</div>
              <div style={styles.statSubtitle(stat.textColor || '#fff')}>{stat.subtitle}</div>
            </div>
            {index === 0 && (
              <div style={styles.statProgress()}>
                <div style={styles.statProgressBar(65)}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Inventory Movement (Last 7 Days)</h3>
            <p style={styles.cardSubtitle}>Track inbound vs outbound over time.</p>
          </div>
          <div style={styles.chartContainer}>
            <div style={styles.movementChart}>
              {(inventoryMovement?.dates || []).map((date, index) => {
                const inboundValue = inventoryMovement.inbound[index] || 0;
                const outboundValue = Math.abs(inventoryMovement.outbound[index] || 0);

                const inHeight = maxMovement > 0 ? (inboundValue / maxMovement) * 85 : 2;
                const outHeight = maxMovement > 0 ? (outboundValue / maxMovement) * 85 : 2;

                return (
                  <div key={index} style={styles.movementBar}>
                    <div style={styles.barGroup}>
                      <div style={styles.bar(inHeight, '#4A90E2')}></div>
                      <div style={styles.bar(outHeight, '#dc3545')}></div>
                    </div>
                    <div style={styles.movementDate}>{date}</div>
                  </div>
                );
              })}
            </div>
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <span style={styles.legendDot('#4A90E2')}></span>
                <span>Inbound</span>
              </div>
              <div style={styles.legendItem}>
                <span style={styles.legendDot('#dc3545')}></span>
                <span>Outbound</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Stock Distribution (Top Items)</h3>
            <p style={styles.cardSubtitle}>Top items by quantity in stock.</p>
          </div>
          <div style={styles.radarContainer}>
            <svg viewBox="0 0 200 200" style={styles.radarChart}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="#e0e0e0" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#e0e0e0" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="#e0e0e0" strokeWidth="1" />
              <circle cx="100" cy="100" r="20" fill="none" stroke="#e0e0e0" strokeWidth="1" />

              {stockDistribution.map((_, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180);
                const x2 = 100 + 80 * Math.cos(angle);
                const y2 = 100 + 80 * Math.sin(angle);
                return (
                  <line
                    key={index}
                    x1="100"
                    y1="100"
                    x2={x2}
                    y2={y2}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                );
              })}

              <polygon
                points={stockDistribution.map((item, index) => {
                  const angle = (index * 60 - 90) * (Math.PI / 180);
                  const radius = (item.value / 100) * 80;
                  const x = 100 + radius * Math.cos(angle);
                  const y = 100 + radius * Math.sin(angle);
                  return `${x},${y}`;
                }).join(' ')}
                fill="rgba(13, 148, 136, 0.3)"
                stroke="#0d9488"
                strokeWidth="2"
              />

              {stockDistribution.map((item, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180);
                const x = 100 + 95 * Math.cos(angle);
                const y = 100 + 95 * Math.sin(angle);
                return (
                  <text
                    key={index}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#666"
                  >
                    {item.name}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div style={styles.alertsGrid}>
        <div style={styles.alertCard}>
          <h3 style={styles.alertTitle}>Low Stock Alerts</h3>
          {!lowStockList || lowStockList.length === 0 ? (
            <p style={styles.alertMessage}>All items have sufficient stock.</p>
          ) : (
            <div>
              {lowStockList.map((item, index) => (
                <div key={item._id || index} style={styles.listItem}>
                  <span>{item.name}</span>
                  <span style={styles.stockWarning}>
                    {item.quantity}/{item.reorderLevel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.alertCard}>
          <h3 style={styles.alertTitle}>Recent Transactions</h3>
          {!recentTransactions || recentTransactions.length === 0 ? (
            <p style={styles.alertMessage}>No recent transactions.</p>
          ) : (
            <div>
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction._id || index} style={styles.listItem}>
                  <span>{transaction.itemId?.name || transaction.item_name || 'Unknown'}</span>
                  <span style={styles.transactionType(transaction.type || transaction.action)}>
                    {(transaction.type === 'in' || transaction.action === 'IN') ? '+' : '-'}{transaction.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: '0', maxWidth: '350px', margin: '0 auto 1rem auto' }}>
        <div style={styles.attendanceCard}>
          <h3 style={styles.alertTitle}>Attendance Rate</h3>
          <p style={styles.cardSubtitle}>Present percentage among recorded entries.</p>
          <div style={styles.attendanceCircle}>
            <span style={styles.attendanceValue}>{stats.attendancePercentage}%</span>
            <span style={styles.attendanceLabel}>present</span>
          </div>
          <p style={styles.attendanceStats}>
            {stats.presentToday} present / {stats.totalEmployees} total
          </p>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: '1rem', padding: '1.5rem' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>🏭 Finished Products Ready for Dispatch</h3>
          <p style={styles.cardSubtitle}>Complete assembled products available in stock</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '1rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem' }}>TOTAL STOCK</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{finishedProducts.totalStock}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>units ready</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            padding: '1rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem' }}>PRODUCT TYPES</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{finishedProducts.totalProducts}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>varieties</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            padding: '1rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem' }}>READY FOR DISPATCH</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{finishedProducts.readyForDispatch}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>products in stock</div>
          </div>

          <div style={{
            background: finishedProducts.lowStockCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            padding: '1rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem' }}>LOW STOCK</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{finishedProducts.lowStockCount}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>need production</div>
          </div>
        </div>

        {finishedProducts.categoryStats && finishedProducts.categoryStats.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
              Stock by Category
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {finishedProducts.categoryStats.map((cat, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '0.5rem'
                  }}>
                    {cat.category}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0d9488' }}>
                        {cat.totalStock}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '0.25rem' }}>
                        units
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                        {cat.productCount} types
                      </div>
                      {cat.lowStock > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#dc3545', fontWeight: '600' }}>
                          {cat.lowStock} low
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1a1a1a' }}>
            Top 5 Products in Stock
          </h4>
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e9ecef'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e9ecef' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#495057' }}>
                    PRODUCT NAME
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#495057' }}>
                    CATEGORY
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#495057' }}>
                    SPECIFICATION
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#495057' }}>
                    STOCK
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#495057' }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {!finishedProducts.topProducts || finishedProducts.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#6c757d', fontSize: '0.85rem' }}>
                      No finished products data available
                    </td>
                  </tr>
                ) : (
                  finishedProducts.topProducts.map((product, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #dee2e6',
                      background: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: '500' }}>
                        {product.name || product.product_name || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6c757d' }}>
                        {product.category || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6c757d', textAlign: 'center' }}>
                        {product.specification || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: product.stock > 0 ? '#10b981' : '#6c757d'
                        }}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {product.stock > (product.min_stock || 0) ? (
                          <span style={{
                            background: '#d1fae5',
                            color: '#065f46',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            ✓ Ready
                          </span>
                        ) : product.stock > 0 ? (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            ⚠ Low
                          </span>
                        ) : (
                          <span style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            ✗ Empty
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
