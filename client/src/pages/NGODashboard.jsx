import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const NGODashboard = () => {
    const { logout } = useContext(AuthContext);
    const [donations, setDonations] = useState([]);
    const [acceptedDonations, setAcceptedDonations] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);

    useEffect(() => {
        fetchNearbyDonations();
        fetchAcceptedDonations();
        fetchVolunteers();
    }, []);

    const fetchNearbyDonations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/ngo/nearby', {
                headers: { Authorization: token }
            });
            setDonations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAcceptedDonations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/ngo/my-accepted', {
                headers: { Authorization: token }
            });
            setAcceptedDonations(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchVolunteers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/ngo-activity/volunteers', {
                headers: { Authorization: token }
            });
            setVolunteers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleRequest = async (id, quantity) => {
        if (!quantity || quantity <= 0) {
            setMsg('Please enter a valid quantity');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/ngo/donations/${id}/request`, { quantity }, {
                headers: { Authorization: token }
            });
            setMsg('Request Sent!');
            setTimeout(() => setMsg(''), 3000);
            fetchNearbyDonations(); // Refresh list
            fetchAcceptedDonations(); // Add to accepted list
        } catch (err) {
            console.error(err);
            setMsg(err.response?.data?.msg || 'Error sending request');
        }
    };



    return (
        <div className="container">
            <header className="flex-center" style={{ justifyContent: 'space-between', padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 0 }}>NGO Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NotificationBell />
                    <button onClick={logout} className="btn" style={{ backgroundColor: 'var(--surface-hover)', fontSize: '0.875rem' }}>Logout</button>
                </div>
            </header>

            <main style={{ padding: '2rem 0' }}>
                {msg && <div style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', backgroundColor: msg.includes('Error') ? 'var(--error)' : 'var(--primary)', color: 'white' }}>{msg}</div>}

                {/* Section 1: My Requests */}
                <h3 className="mb-4">My Requests & Status</h3>
                {acceptedDonations.length === 0 ? (
                    <p className="text-muted mb-8">No active requests.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        {acceptedDonations.map(donation => (
                            <div key={donation.donation_id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--text)' }}>{donation.food_name}</h4>
                                    <span style={{
                                        fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px',
                                        backgroundColor: donation.status === 'APPROVED' ? '#d1fae5' : donation.status === 'ASSIGNED' ? '#bfdbfe' : '#fef3c7',
                                        color: donation.status === 'APPROVED' ? '#065f46' : donation.status === 'ASSIGNED' ? '#1e40af' : '#b45309',
                                        fontWeight: 'bold'
                                    }}>
                                        {donation.status}
                                    </span>
                                </div>
                                <p className="text-sm text-muted mb-4">
                                    <strong>Requested Qty:</strong> {donation.requested_quantity} <br />
                                    <strong>Status:</strong> {donation.status === 'REQUESTED' ? 'Waiting for Donor Approval' : donation.status === 'APPROVED' ? 'Waiting for Volunteer' : 'Volunteer Assigned'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Section 2: Nearby Donations */}
                <h3 className="mb-4">Nearby Pending Donations</h3>

                {loading ? <p>Loading...</p> : donations.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p className="text-muted">No pending donations nearby.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {donations.map(donation => (
                            <div key={donation.donation_id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{donation.food_name}</h4>
                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 'bold' }}>
                                        {donation.distance ? `${donation.distance} km` : 'Unknown Dist.'}
                                    </span>
                                </div>

                                <p className="text-sm text-muted mb-4">
                                    <strong>Available Qty:</strong> {donation.quantity} <br />
                                    <strong>Type:</strong> {donation.food_type} <br />
                                    <strong>Expires:</strong> {new Date(donation.expiry_time).toLocaleString()}
                                </p>

                                <div className="mb-4">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Quantity Needed:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={donation.quantity}
                                        placeholder={`Max ${donation.quantity}`}
                                        className="form-control"
                                        id={`qty-${donation.donation_id}`}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                                    />
                                </div>

                                <button onClick={() => {
                                    const qtyInput = document.getElementById(`qty-${donation.donation_id}`);
                                    const qty = qtyInput ? parseInt(qtyInput.value) : 0;
                                    handleRequest(donation.donation_id, qty);
                                }} className="btn btn-primary btn-block">
                                    Send Request
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default NGODashboard;
