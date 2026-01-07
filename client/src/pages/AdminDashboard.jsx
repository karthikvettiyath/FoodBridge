import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [donations, setDonations] = useState([]);
    const [view, setView] = useState('STATS'); // STATS, USERS, DONATIONS
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/stats', {
                headers: { Authorization: token }
            });
            setStats(res.data);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: token }
            });
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchDonations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/donations', {
                headers: { Authorization: token }
            });
            setDonations(res.data);
        } catch (err) { console.error(err); }
    };

    const handleTabChange = (tab) => {
        setView(tab);
        if (tab === 'USERS') fetchUsers();
        if (tab === 'DONATIONS') fetchDonations();
    };

    return (
        <div className="container">
            <header className="flex-center" style={{ justifyContent: 'space-between', padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 0 }}>Admin Panel</h1>
                <button onClick={logout} className="btn" style={{ backgroundColor: 'var(--surface-hover)', fontSize: '0.875rem' }}>Logout</button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                    onClick={() => handleTabChange('STATS')}
                    className={`btn ${view === 'STATS' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, backgroundColor: view !== 'STATS' ? 'var(--surface)' : undefined }}
                >
                    Overview
                </button>
                <button
                    onClick={() => handleTabChange('USERS')}
                    className={`btn ${view === 'USERS' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, backgroundColor: view !== 'USERS' ? 'var(--surface)' : undefined }}
                >
                    Manage Users
                </button>
                <button
                    onClick={() => handleTabChange('DONATIONS')}
                    className={`btn ${view === 'DONATIONS' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, backgroundColor: view !== 'DONATIONS' ? 'var(--surface)' : undefined }}
                >
                    All Donations
                </button>
            </div>

            <main style={{ padding: '2rem 0' }}>
                {loading ? <p>Loading...</p> : (
                    <>
                        {view === 'STATS' && stats && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <StatCard title="Total Users" value={stats.totalUsers} color="var(--primary)" />
                                <StatCard title="Total Donations" value={stats.totalDonations} color="var(--secondary)" />
                                <StatCard title="Delivered Meals" value={stats.deliveredDonations} color="#10b981" />
                                <StatCard title="Active NGOs" value={stats.ngos} color="#f59e0b" />
                                <StatCard title="Volunteers" value={stats.volunteers} color="#8b5cf6" />
                            </div>
                        )}

                        {view === 'USERS' && (
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>{u.name}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#334155', color: 'white' }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{u.email}</td>
                                                <td style={{ padding: '1rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {view === 'DONATIONS' && (
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Food</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Donor</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>NGO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donations.map(d => (
                                            <tr key={d.donation_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>{d.food_name} <br /> <span className="text-muted text-sm">{d.quantity}</span></td>
                                                <td style={{ padding: '1rem' }}>{d.donors?.users?.name || 'Unknown'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        fontWeight: 'bold',
                                                        color: d.status === 'DELIVERED' ? '#10b981' :
                                                            d.status === 'PENDING' ? '#f59e0b' :
                                                                'var(--primary)'
                                                    }}>
                                                        {d.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{d.ngos?.organization_name || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

const StatCard = ({ title, value, color }) => (
    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: `4px solid ${color}` }}>
        <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{value}</h3>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>{title}</p>
    </div>
);

export default AdminDashboard;
