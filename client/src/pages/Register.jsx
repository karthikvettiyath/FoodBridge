import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'DONOR',
        address: '',
        organization_name: '',
    });
    const [error, setError] = useState('');

    const { name, email, password, phone, role, address, organization_name } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        const res = await register(formData);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.msg);
        }
    };

    return (
        <div className="page-wrapper flex-center" style={{ backgroundImage: 'radial-gradient(circle at bottom left, #1e293b 0%, #0f172a 100%)', padding: '2rem 0' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <h2 className="text-center mb-4" style={{ color: 'var(--primary)', fontSize: '2rem' }}>FoodBridge</h2>
                <h3 className="text-center mb-8 text-muted">Create Account</h3>

                {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>I am a...</label>
                        <select name="role" value={role} onChange={onChange} style={{ cursor: 'pointer' }}>
                            <option value="DONOR">Donor (Restaurant/Individual)</option>
                            <option value="NGO">NGO (Charity Organization)</option>
                            <option value="VOLUNTEER">Volunteer</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                        <input type="text" name="name" value={name} onChange={onChange} required placeholder="John Doe" />
                    </div>

                    <div className="mb-4">
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                        <input type="email" name="email" value={email} onChange={onChange} required placeholder="name@example.com" />
                    </div>

                    <div className="mb-4">
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input type="password" name="password" value={password} onChange={onChange} required placeholder="Create a strong password" />
                    </div>

                    <div className="mb-4">
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                        <input type="text" name="phone" value={phone} onChange={onChange} required placeholder="+91 9876543210" />
                    </div>

                    {/* Conditional Fields */}
                    {role === 'NGO' && (
                        <div className="mb-4">
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Organization Name</label>
                            <input type="text" name="organization_name" value={organization_name} onChange={onChange} required placeholder="Food for All Foundation" />
                        </div>
                    )}

                    {(role === 'DONOR' || role === 'NGO') && (
                        <div className="mb-4">
                            <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Address</label>
                            <textarea name="address" value={address} onChange={onChange} rows="3" required placeholder="Full street address..." style={{ resize: 'none' }}></textarea>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-block mt-4">
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-muted">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
