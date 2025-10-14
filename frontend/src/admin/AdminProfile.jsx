import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  Spinner, 
  Alert,
  Row,
  Col,
  Image,
  Badge
} from 'react-bootstrap';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaSave, 
  FaEdit,
  FaStore,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import AdminNavbar from './AdminNavbar';
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin 
} from '../utils/adminAuth';
import { getApiUrl } from '../config/env';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    profile_picture: null,
    is_vendor: false,
    vendor_details: {
      business_name: '',
      description: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        setLoading(true);
        
        // Use isAuthenticated instead of verifyToken
        if (!isAuthenticated()) {
          toast.error('Please login to access this page');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        // Additional check for admin role
        if (!isAdmin()) {
          toast.error('Admin access required');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        setAuthChecked(true);
        fetchProfile();
      } catch (err) {
        console.error('Authentication error:', err);
        toast.error('Authentication failed. Please login again');
        logout();
        navigate('/admin/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      // Use environment configuration for API URL
      const apiUrl = getApiUrl('/api/user/profile/');
      
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      });
      
      const userData = response.data;
      setProfile({
        username: userData.username || '',
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        profile_picture: userData.profile_picture || null,
        is_vendor: userData.is_vendor || false,
        vendor_details: userData.vendor_details || {
          business_name: '',
          description: ''
        }
      });

      if (userData.profile_picture) {
        // Use environment configuration for image URLs
        const baseUrl = getApiUrl();
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const cleanImagePath = userData.profile_picture.replace(/^\//, '');
        
        setImagePreview(
          userData.profile_picture.startsWith('http') ? 
          userData.profile_picture : 
          `${cleanBaseUrl}/${cleanImagePath}`
        );
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
      
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('vendor_')) {
      const vendorField = name.replace('vendor_', '');
      setProfile(prev => ({
        ...prev,
        vendor_details: {
          ...prev.vendor_details,
          [vendorField]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile(prev => ({
        ...prev,
        profile_picture: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profile.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!profile.first_name) {
      newErrors.first_name = 'First name is required';
    }
    
    if (profile.is_vendor && !profile.vendor_details.business_name) {
      newErrors.vendor_business_name = 'Business name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('username', profile.username);
      formData.append('email', profile.email);
      formData.append('first_name', profile.first_name);
      formData.append('last_name', profile.last_name);
      formData.append('phone', profile.phone);
      formData.append('address', profile.address);
      
      if (profile.profile_picture instanceof File) {
        formData.append('profile_picture', profile.profile_picture);
      }
      
      if (profile.is_vendor) {
        formData.append('vendor_details[business_name]', profile.vendor_details.business_name);
        formData.append('vendor_details[description]', profile.vendor_details.description);
      }

      // Use environment configuration for API URL
      const apiUrl = getApiUrl('/api/user/profile/');
      
      const response = await axios.put(
        apiUrl,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response) {
        if (error.response.data) {
          setErrors(error.response.data);
        }
        toast.error(error.response.data.detail || 'Failed to update profile');
        
        if (error.response.status === 401) {
          logout();
          navigate('/admin/login');
        }
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Checking authentication...</span>
      </div>
    );
  }

  if (!authChecked) {
    return null;
  }

  return (
    <AdminNavbar activePage="profile">
      <Container fluid className="py-4 px-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Profile Management</h2>
            <p className="text-muted mb-0">View and update your profile information</p>
          </div>
          {!isEditing && (
            <Button 
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="d-flex align-items-center"
            >
              <FaEdit className="me-2" /> Edit Profile
            </Button>
          )}
        </div>

        <Row>
          <Col lg={4}>
            {/* Profile Card */}
            <Card className="shadow-sm mb-4">
              <Card.Body className="text-center">
                <div className="position-relative d-inline-block">
                  <Image
                    src={imagePreview || `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=random`}
                    roundedCircle
                    width={150}
                    height={150}
                    className="border border-3 border-primary mb-3"
                    alt="Profile"
                  />
                  {isEditing && (
                    <div className="position-absolute bottom-0 end-0">
                      <label htmlFor="profile-upload" className="btn btn-sm btn-primary rounded-circle">
                        <FaEdit />
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <h4 className="mb-1">{profile.first_name} {profile.last_name}</h4>
                <p className="text-muted mb-2">{profile.email}</p>
                
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <Badge bg={profile.is_vendor ? "success" : "primary"}>
                    {profile.is_vendor ? "Vendor" : "Admin"}
                  </Badge>
                  {profile.is_vendor && (
                    <Badge bg="info">
                      <FaStore className="me-1" /> {profile.vendor_details.business_name}
                    </Badge>
                  )}
                </div>

                <div className="text-start mt-4">
                  <h6 className="text-uppercase text-muted mb-3">Account Details</h6>
                  <div className="d-flex align-items-center mb-2">
                    <FaUser className="text-muted me-2" />
                    <span>{profile.username}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaEnvelope className="text-muted me-2" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="d-flex align-items-center mb-2">
                      <FaPhone className="text-muted me-2" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            {/* Profile Form */}
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaUser className="me-2" />
                  {isEditing ? 'Edit Profile Information' : 'Profile Information'}
                </h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="first_name"
                          value={profile.first_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          isInvalid={!!errors.first_name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.first_name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="last_name"
                          value={profile.last_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaPhone className="me-2" />
                      Phone Number
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaMapMarkerAlt className="me-2" />
                      Address
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="address"
                      value={profile.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  {/* Vendor Section */}
                  {profile.is_vendor && (
                    <>
                      <hr className="my-4" />
                      <div className="d-flex align-items-center mb-3">
                        <FaStore className="text-primary me-2" />
                        <h5 className="mb-0">Business Information</h5>
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Business Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="vendor_business_name"
                          value={profile.vendor_details.business_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          isInvalid={!!errors.vendor_business_name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.vendor_business_name}
                        </Form.Control.Feedback>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Business Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="vendor_description"
                          value={profile.vendor_details.description}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        <Form.Text className="text-muted">
                          <FaInfoCircle className="me-1" />
                          Tell customers about your business
                        </Form.Text>
                      </Form.Group>
                    </>
                  )}

                  {/* Form Actions */}
                  {isEditing && (
                    <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setErrors({});
                          fetchProfile();
                        }}
                        disabled={loading}
                      >
                        Discard Changes
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        className="px-4"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" /> Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminNavbar>
  );
};

export default ProfilePage;