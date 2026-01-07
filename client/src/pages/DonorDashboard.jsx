import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const DonorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        food_name: '',
        food_type: 'VEG',
        quantity: '',
        prepared_time: '',
        expiry_time: '',
        latitude: '',
        longitude: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchDonations();
        getCurrentLocation();

        // Auto-fill current time for convenience
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setFormData(prev => ({ ...prev, prepared_time: now.toISOString().slice(0, 16) }));

    }, []);

    const fetchDonations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/donations/my', {
                headers: { Authorization: token }
            });
            setDonations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                },
                (error) => console.error("Error getting location: ", error)
            );
        }
    };

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/donations', formData, {
                headers: { Authorization: token }
            });
            setMessage('Donation posted successfully!');
            fetchDonations(); // Refresh list
            setFormData({
                food_name: '',
                food_type: 'VEG',
                quantity: '',
                prepared_time: '',
                expiry_time: '',
                latitude: formData.latitude, // Keep location
                longitude: formData.longitude // Keep location
            });
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error posting donation');
        }
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/donations/${id}/approve`, {}, {
                headers: { Authorization: token }
            });
            setMessage('Request Approved! Waiting for Volunteer.');
            fetchDonations();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error approving request');
        }
    };

    return (
        <div className="container">
            <header className="flex-center" style={{ justifyContent: 'space-between', padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 0 }}>Donor Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NotificationBell />
                    <button onClick={logout} className="btn" style={{ backgroundColor: 'var(--surface-hover)', fontSize: '0.875rem' }}>Logout</button>
                </div>
            </header>

            <main style={{ padding: '2rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Donation Form */}
                <section>
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 className="mb-4">Donate Food</h3>
                        {message && <div style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', backgroundColor: message.includes('Error') ? 'var(--error)' : 'var(--primary)', color: 'white' }}>{message}</div>}

                        <form onSubmit={onSubmit}>
                            <div className="mb-4">
                                <label className="text-sm text-muted">Food Name</label>
                                <input type="text" name="food_name" value={formData.food_name} onChange={onChange} required placeholder="e.g. Rice and Curry" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                                <div>
                                    <label className="text-sm text-muted">Food Type</label>
                                    <select name="food_type" value={formData.food_type} onChange={onChange}>
                                        <option value="VEG">Veg</option>
                                        <option value="NON_VEG">Non-Veg</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-muted">Quantity (Servings/Kg)</label>
                                    <input type="text" name="quantity" value={formData.quantity} onChange={onChange} required placeholder="e.g. 10 people" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                                <div>
                                    <label className="text-sm text-muted">Prepared Time</label>
                                    <input type="datetime-local" name="prepared_time" value={formData.prepared_time} onChange={onChange} required />
                                </div>
                                <div>
                                    <label className="text-sm text-muted">Expiry Time</label>
                                    <input type="datetime-local" name="expiry_time" value={formData.expiry_time} onChange={onChange} required />
                                </div>
                            </div>

                            {/* Hidden Location Inputs */}
                            <input type="hidden" name="latitude" value={formData.latitude} />
                            <input type="hidden" name="longitude" value={formData.longitude} />

                            <button type="submit" className="btn btn-primary btn-block">Post Donation</button>
                        </form>
                    </div>
                </section>

                {/* Donation History */}
                <section>
                    <h3 className="mb-4">My Donations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? <p>Loading...</p> : donations.length === 0 ? <p className="text-muted">No donations yet.</p> :
                            donations.map(donation => (
                                <div key={donation.donation_id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, color: 'var(--secondary)' }}>{donation.food_name}</h4>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px',
                                            backgroundColor: donation.status === 'PENDING' ? '#fef3c7' : '#d1fae5',
                                            color: donation.status === 'PENDING' ? '#d97706' : '#065f46',
                                            fontWeight: 'bold'
                                        }}>
                                            {donation.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted">Q: {donation.quantity} | Type: {donation.food_type}</p>

                                    {donation.status === 'REQUESTED' && (
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--secondary)' }}>
                                            <p className="text-sm" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Request Received!</p>
                                            <p className="text-sm text-muted mb-2">An NGO requested <strong>{donation.requested_quantity}</strong> units.</p>
                                            <button onClick={() => handleApprove(donation.donation_id)} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                                                Approve Request
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                        <p className="text-sm text-muted" style={{ fontSize: '0.75rem' }}>Expires: {new Date(donation.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DonorDashboard;
