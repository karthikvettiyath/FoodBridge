import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: token }
            });
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error("Error fetching notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 10 seconds for new notifications
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: token }
            });
            // Update local state
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking read", err);
        }
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={toggleOpen}
                className="btn"
                style={{
                    position: 'relative',
                    padding: '0.5rem',
                    background: 'transparent',
                    color: 'var(--text-color)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Simple Bell Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        backgroundColor: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        transform: 'translate(25%, -25%)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--surface, #fff)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    zIndex: 1000,
                    border: '1px solid var(--border, #e2e8f0)',
                    marginTop: '0.5rem'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border, #e2e8f0)', fontWeight: 'bold' }}>Notifications</div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '1.5rem', color: 'gray', textAlign: 'center' }}>No notifications</div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.notification_id} style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--border, #f1f5f9)',
                                backgroundColor: n.is_read ? 'transparent' : 'rgba(34, 197, 94, 0.05)',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                                onClick={() => !n.is_read && markAsRead(n.notification_id)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.is_read ? '#f8fafc' : 'rgba(34, 197, 94, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'rgba(34, 197, 94, 0.05)'}
                            >
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-color)' }}>{n.message}</p>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {new Date(n.created_at).toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
