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

    const deleteNotification = async (id, e) => {
        e.stopPropagation(); // Prevent triggering markAsRead
        console.log("Delete clicked for:", id);
        if (!window.confirm("Are you sure you want to delete this notification?")) return;

        try {
            console.log("Sending delete request...");
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
                headers: { Authorization: token }
            });
            console.log("Delete successful");
            // Update local state
            setNotifications(prev => {
                const updated = prev.filter(n => n.notification_id !== id);
                setUnreadCount(updated.filter(n => !n.is_read).length);
                return updated;
            });
        } catch (err) {
            console.error("Error deleting notification", err);
            alert("Failed to delete notification");
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
                                transition: 'background-color 0.2s',
                                position: 'relative',
                                paddingRight: '2.5rem' // Make space for the delete button
                            }}
                                onClick={() => !n.is_read && markAsRead(n.notification_id)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.is_read ? '#f8fafc' : 'rgba(34, 197, 94, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'rgba(34, 197, 94, 0.05)'}
                            >
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-color)' }}>{n.message}</p>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {new Date(n.created_at).toLocaleString()}
                                </span>
                                <button
                                    onClick={(e) => deleteNotification(n.notification_id, e)}
                                    title="Delete"
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '0.5rem',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#ef4444', // Red color
                                        padding: '0.4rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'background-color 0.2s',
                                        zIndex: 10 // Ensure it's above other elements
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    className='delete-btn'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div >
    );
};

export default NotificationBell;
