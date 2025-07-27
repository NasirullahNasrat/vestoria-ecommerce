import React, { useState, useEffect } from 'react';
import { Navbar, Footer } from '../components';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaUserEdit, FaSave, FaLock, FaEnvelope, FaPhone, FaUser, FaStore } from 'react-icons/fa';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token } = useSelector(state => state.auth || {});
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        is_vendor: false
    });
    const [loading, setLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                is_vendor: user.is_vendor || false
            });
        }
    }, [user, token, navigate]);

    const handleProfileChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm({
            ...passwordForm,
            [name]: value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.put(
                'http://localhost:8000/api/profile/',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            toast.success('Profile updated successfully');
            setIsEditing(false);
            // You might want to dispatch an action to update user in Redux store here
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error("New passwords don't match");
            setLoading(false);
            return;
        }

        try {
            await axios.post(
                'http://localhost:8000/api/password/change/',
                {
                    old_password: passwordForm.current_password,
                    new_password1: passwordForm.new_password,
                    new_password2: passwordForm.confirm_password
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            toast.success('Password changed successfully');
            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            console.error('Password change error:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container my-5 py-3">
                <div className="row">
                    <div className="col-md-3 mb-4">
                        <div className="card shadow-sm">
                            <div className="card-body text-center">
                                <div className="d-flex justify-content-center mb-3">
                                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                        <FaUser className="text-white" size={40} />
                                    </div>
                                </div>
                                <h5 className="card-title">{user?.username}</h5>
                                <p className="text-muted">{user?.email}</p>
                                {user?.is_vendor && (
                                    <span className="badge bg-success">
                                        <FaStore className="me-1" /> Vendor
                                    </span>
                                )}
                            </div>
                            <div className="list-group list-group-flush">
                                <button 
                                    className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <FaUser className="me-2" /> Profile
                                </button>
                                <button 
                                    className={`list-group-item list-group-item-action ${activeTab === 'password' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('password')}
                                >
                                    <FaLock className="me-2" /> Change Password
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-9">
                        {activeTab === 'profile' ? (
                            <div className="card shadow-sm">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Profile Information</h5>
                                    {!isEditing ? (
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <FaUserEdit className="me-1" /> Edit Profile
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                <div className="card-body">
                                    {isEditing ? (
                                        <form onSubmit={handleProfileSubmit}>
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <FaUser className="me-2" /> Username
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleProfileChange}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <FaEnvelope className="me-2" /> Email
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleProfileChange}
                                                    required
                                                    disabled
                                                />
                                                <small className="text-muted">Email cannot be changed</small>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <FaPhone className="me-2" /> Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>
                                            <div className="mb-3 form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    name="is_vendor"
                                                    checked={formData.is_vendor}
                                                    onChange={handleProfileChange}
                                                    disabled
                                                />
                                                <label className="form-check-label">
                                                    Vendor Account
                                                </label>
                                            </div>
                                            <div className="d-grid gap-2">
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-primary"
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Saving...' : (
                                                        <>
                                                            <FaSave className="me-1" /> Save Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div>
                                            <div className="mb-3">
                                                <h6><FaUser className="me-2" /> Username</h6>
                                                <p>{user?.username}</p>
                                            </div>
                                            <div className="mb-3">
                                                <h6><FaEnvelope className="me-2" /> Email</h6>
                                                <p>{user?.email}</p>
                                            </div>
                                            <div className="mb-3">
                                                <h6><FaPhone className="me-2" /> Phone</h6>
                                                <p>{user?.phone || 'Not provided'}</p>
                                            </div>
                                            <div className="mb-3">
                                                <h6><FaStore className="me-2" /> Account Type</h6>
                                                <p>{user?.is_vendor ? 'Vendor' : 'Customer'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card shadow-sm">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Change Password</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handlePasswordSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">
                                                <FaLock className="me-2" /> Current Password
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="current_password"
                                                value={passwordForm.current_password}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">
                                                <FaLock className="me-2" /> New Password
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="new_password"
                                                value={passwordForm.new_password}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">
                                                <FaLock className="me-2" /> Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="confirm_password"
                                                value={passwordForm.confirm_password}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </div>
                                        <div className="d-grid gap-2">
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary"
                                                disabled={loading}
                                            >
                                                {loading ? 'Updating...' : 'Change Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Profile;