import React, { useEffect, useState } from 'react';
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineBell,
} from 'react-icons/hi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { hasPermission } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(data?.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const openDialog = (notification) => {
    setSelected(notification);
    setMessage(null);
    if (!notification.read) {
      handleMarkRead(notification.id);
    }
  };

  const closeDialog = () => {
    if (!processing) {
      setSelected(null);
      setMessage(null);
    }
  };

  const canReviewPurchase = hasPermission && hasPermission('reviewPurchaseRequests');

  const handleReview = async (decision) => {
    if (!selected || !selected.meta?.purchaseRequestId) return;
    setProcessing(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/purchase-requests/${selected.meta.purchaseRequestId}/review`,
        { decision },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setMessage({
        type: 'success',
        text: `Purchase request ${decision.toLowerCase()}ed.`,
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to review purchase request', error);
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to update purchase request status.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const styles = {
    container: {
      padding: '24px',
      background: '#f8f9fa',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 12px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    banner: {
      background: '#eef2ff',
      border: '1px solid #c7d2fe',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px',
      color: '#3730a3',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6',
      overflow: 'hidden'
    },
    notificationItem: (read) => ({
      width: '100%',
      textAlign: 'left',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px',
      background: read ? 'white' : '#eef2ff',
      border: 'none',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      transition: 'background 0.2s'
    }),
    iconWrapper: (severity) => ({
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: severity === 'error' ? '#fee2e2' : severity === 'warning' ? '#fef3c7' : '#dbeafe',
      color: severity === 'error' ? '#dc2626' : severity === 'warning' ? '#ca8a04' : '#2563eb',
      flexShrink: 0
    }),
    dialog: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      padding: '16px'
    },
    dialogContent: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '500px',
      overflow: 'hidden'
    },
    dialogHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    dialogBody: {
      padding: '20px'
    },
    dialogFooter: {
      padding: '12px 20px',
      borderTop: '1px solid #f3f4f6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    actionButton: (variant = 'default') => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 12px',
      fontSize: '13px',
      fontWeight: '500',
      border: variant === 'approve' ? 'none' : '1px solid',
      borderColor: variant === 'reject' ? '#fca5a5' : '#ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      background: variant === 'approve' ? '#0d9488' : variant === 'reject' ? 'white' : 'white',
      color: variant === 'approve' ? 'white' : variant === 'reject' ? '#dc2626' : '#374151'
    })
  };

  if (loading) {
    return <div style={styles.container}>Loading notifications...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Notifications Center</h1>
          <p style={styles.subtitle}>Real-time system alerts and operational updates.</p>
        </div>
        {notifications.length > 0 && (
          <button type="button" onClick={handleMarkAllRead} style={styles.button}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Unread Banner */}
      {unreadCount > 0 && (
        <div style={styles.banner}>
          <span>
            You have <span style={{fontWeight: '600'}}>{unreadCount}</span> unread
            notification{unreadCount > 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {/* Notifications List */}
      <div style={styles.card}>
        {notifications.length === 0 && (
          <div style={{padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af'}}>
            <HiOutlineBell style={{fontSize: '32px', marginBottom: '8px', color: '#d1d5db'}} />
            <p style={{fontSize: '14px', margin: 0}}>No notifications yet.</p>
          </div>
        )}

        {notifications.map((notification) => {
          const isPurchase = notification.meta && notification.meta.type === 'purchaseRequest';
          const canShowActions = isPurchase && canReviewPurchase && notification.meta.purchaseRequestId;

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => openDialog(notification)}
              style={styles.notificationItem(notification.read)}
              onMouseEnter={(e) => e.currentTarget.style.background = notification.read ? '#f9fafb' : '#e0e7ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = notification.read ? 'white' : '#eef2ff'}
            >
              <div style={{display: 'flex', gap: '12px', flex: 1}}>
                <div style={styles.iconWrapper(notification.severity)}>
                  <HiOutlineBell style={{fontSize: '16px'}} />
                </div>
                <div style={{flex: 1}}>
                  <p style={{fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 4px 0'}}>
                    {notification.title}
                  </p>
                  <p style={{fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0'}}>
                    {notification.message}
                  </p>
                  <p style={{fontSize: '12px', color: '#9ca3af', margin: 0}}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                {!notification.read && (
                  <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6'}} />
                )}
                {canShowActions && (
                  <span style={{fontSize: '12px', color: '#9ca3af'}}>Click to review</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dialog */}
      {selected && (
        <div style={styles.dialog}>
          <div style={styles.dialogContent}>
            <div style={styles.dialogHeader}>
              <div>
                <h3 style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: 0}}>
                  {selected.title}
                </h3>
                <p style={{fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0'}}>
                  {new Date(selected.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                style={{background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%'}}
              >
                <HiOutlineX style={{fontSize: '20px', color: '#9ca3af'}} />
              </button>
            </div>

            <div style={styles.dialogBody}>
              <p style={{fontSize: '14px', color: '#374151', marginBottom: '12px'}}>{selected.message}</p>

              {selected.meta?.type === 'purchaseRequest' && (
                <div style={{marginTop: '16px'}}>
                  <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px'}}>
                    Purchase Request Details
                  </p>
                  <div style={{fontSize: '14px', color: '#374151'}}>
                    <p style={{margin: '4px 0'}}>
                      Request ID: <span style={{fontWeight: '500'}}>
                        {selected.meta.purchaseRequestCode || selected.meta.purchaseRequestId}
                      </span>
                    </p>
                    {selected.meta.requestedBy && (
                      <p style={{margin: '4px 0'}}>Requested by: {selected.meta.requestedBy}</p>
                    )}
                    {selected.meta.neededBy && (
                      <p style={{margin: '4px 0'}}>
                        Needed by: {new Date(selected.meta.neededBy).toLocaleDateString()}
                      </p>
                    )}
                    {selected.meta.items && (
                      <p style={{margin: '4px 0'}}>
                        Items: {(selected.meta.items || []).map((i) => `${i.name} x ${i.quantity}`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {message && (
                <p style={{fontSize: '13px', marginTop: '12px', color: message.type === 'success' ? '#16a34a' : '#dc2626'}}>
                  {message.text}
                </p>
              )}
            </div>

            <div style={styles.dialogFooter}>
              <p style={{fontSize: '12px', color: '#9ca3af'}}>
                Only authorised roles can approve or reject.
              </p>
              {selected.meta?.type === 'purchaseRequest' && canReviewPurchase && (
                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleReview('REJECT')}
                    style={styles.actionButton('reject')}
                  >
                    <HiOutlineX style={{marginRight: '4px'}} />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleReview('APPROVE')}
                    style={styles.actionButton('approve')}
                  >
                    <HiOutlineCheck style={{marginRight: '4px'}} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
