import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const VolunteerDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [pickups, setPickups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPickups();
        fetchInvitations();
    }, []);

    const fetchPickups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/volunteer/my-pickups', {
                headers: { Authorization: token }
            });
            setPickups(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/volunteer/invitations', {
                headers: { Authorization: token }
            });
            setInvitations(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAccept = async (donationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/volunteer/accept', { donationId }, {
                headers: { Authorization: token }
            });
            fetchPickups();
            fetchInvitations();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Error accepting invitation');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/volunteer/pickups/${id}/status`, { status: newStatus }, {
                headers: { Authorization: token }
            });
            fetchPickups(); // Refresh list to update UI
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        }
    };

    const renderActionButton = (pickup) => {
        const { status, pickup_id } = pickup;
        switch (status) {
            case 'ACCEPTED_OFFER':
                return (
                    <button onClick={() => updateStatus(pickup_id, 'ACCEPTED_PASSAGE')} className="btn btn-primary btn-block" style={{ gridColumn: 'span 2' }}>
                        Accept Passage (Confirm Pickup)
                    </button>
                );
            case 'ACCEPTED_PASSAGE':
                return (
                    <button onClick={() => updateStatus(pickup_id, 'OUT_FOR_DELIVERY')} className="btn btn-primary btn-block" style={{ gridColumn: 'span 2' }}>
                        Go Out For Delivery
                    </button>
                );
            case 'OUT_FOR_DELIVERY':
                return (
                    <button onClick={() => updateStatus(pickup_id, 'NEAR_LOCATION')} className="btn btn-primary btn-block" style={{ gridColumn: 'span 2', backgroundColor: '#eab308' }}>
                        Reached Near Location
                    </button>
                );
            case 'NEAR_LOCATION':
                return (
                    <button onClick={() => updateStatus(pickup_id, 'DELIVERED')} className="btn btn-primary btn-block" style={{ gridColumn: 'span 2', backgroundColor: '#10b981' }}>
                        Mark as Delivered
                    </button>
                );
            case 'DELIVERED':
                return (
                    <button disabled className="btn btn-block" style={{ gridColumn: 'span 2', opacity: 0.5, cursor: 'not-allowed' }}>
                        Completed
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container">
            <header className="flex-center" style={{ justifyContent: 'space-between', padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 0 }}>Volunteer Dashboard</h1>
                <button onClick={logout} className="btn" style={{ backgroundColor: 'var(--surface-hover)', fontSize: '0.875rem' }}>Logout</button>
            </header>

            <main style={{ padding: '2rem 0' }}>

                {/* Invitations Section */}
                <h3 className="mb-4">Available Invitations</h3>
                {invitations.length === 0 ? (
                    <div className="glass-panel mb-8" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p className="text-muted">No new invitations right now.</p>
                    </div>
                ) : (
                    <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {invitations.map(invitation => (
                            <div key={invitation.donation_id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                                <h4 style={{ margin: 0 }}>{invitation.food_name}</h4>
                                <p className="text-sm text-muted mb-2">Ready for pickup at <strong>{invitation.donors?.users?.name}</strong></p>
                                <p className="text-sm text-muted mb-4">Deliver to: <strong>{invitation.ngos?.organization_name}</strong></p>
                                <button onClick={() => handleAccept(invitation.donation_id)} className="btn btn-primary btn-block">
                                    Accept Job
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* My Pickups Section */}
                <h3 className="mb-4">My Assigned Pickups</h3>

                {loading ? <p>Loading...</p> : pickups.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p className="text-muted">No active pickups assigned.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {pickups.map(pickup => {
                            const { donations } = pickup;
                            const donor = donations.donors;
                            const ngo = donations.ngos;

                            return (
                                <div key={pickup.pickup_id} className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${pickup.status === 'DELIVERED' ? 'var(--primary)' : 'var(--secondary)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{donations.food_name}</span>
                                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#334155', color: 'white' }}>
                                            {pickup.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="mb-4 text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pick Up From</p>
                                        <p style={{ fontWeight: 500 }}>{donor.users.name} <span className="text-muted">({donor.users.phone})</span></p>
                                        <p>{donor.address}</p>
                                    </div>

                                    <div className="mb-4 text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deliver To</p>
                                        <p style={{ fontWeight: 500 }}>{ngo ? ngo.organization_name : 'NGO Center'}</p>
                                        <p>{ngo ? ngo.address : 'Main Warehouse'}</p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {renderActionButton(pickup)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default VolunteerDashboard;
