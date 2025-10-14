// src/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  FaCog, 
  FaSave,
  FaTimes,
  FaSync,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaCreditCard,
  FaLink
} from 'react-icons/fa';
import { toast } from "react-hot-toast";
import { 
  Card, 
  Button, 
  Form, 
  InputGroup,
  Spinner,
  Tab,
  Tabs,
  Alert,
  Row,
  Col
} from 'react-bootstrap';
import AdminNavbar from "./AdminNavbar";
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin
} from "../utils/adminAuth";
import { getApiUrl } from "../config/env";

const Settings = () => {
  const [settings, setSettings] = useState({
    page_name: '',
    logo: null,
    logoPreview: '',
    ai_api_key: '',
    public_key: '',
    ap_api_url: '',
    stripe_secret_key: '',
    stripe_public_key: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [authChecked, setAuthChecked] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    ai_api_key: false,
    public_key: false,
    stripe_secret_key: false,
    stripe_public_key: false
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        if (!isAuthenticated()) {
          toast.error('Please login to access this page');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        if (!isAdmin()) {
          toast.error('Admin access required');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        setAuthChecked(true);
        fetchSettings();
      } catch (err) {
        console.error('Authentication error:', err);
        toast.error('Authentication failed. Please login again');
        logout();
        navigate('/admin/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchSettings = async () => {
    try {
      setError(null);
      setValidationErrors({});
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = getApiUrl('/api/system-settings/');
      const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/admin/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data) {
        setSettings(prev => ({
          ...prev,
          page_name: data.page_name || '',
          logoPreview: data.logo || '',
          ai_api_key: data.ai_api_key || '',
          public_key: data.public_key || '',
          ap_api_url: data.ap_api_url || '',
          stripe_secret_key: data.stripe_secret_key || '',
          stripe_public_key: data.stripe_public_key || ''
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError(error.message);
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  const handleSave = async (section) => {
    try {
      setSaving(true);
      setError(null);
      setValidationErrors({});
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = getApiUrl('/api/system-settings/');
      
      // Prepare data for the specific section
      let requestData = {};
      
      if (section === 'general') {
        requestData = {
          page_name: settings.page_name
        };
        
        // Handle logo upload separately with FormData
        if (settings.logo) {
          const formData = new FormData();
          formData.append('page_name', settings.page_name);
          formData.append('logo', settings.logo);
          
          const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.details) {
              setValidationErrors(errorData.details);
              throw new Error('Validation error');
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
          
          toast.success('General settings saved successfully');
          fetchSettings();
          setSaving(false);
          return;
        }
      } 
      else if (section === 'api') {
        requestData = {
          ai_api_key: settings.ai_api_key,
          public_key: settings.public_key,
          ap_api_url: settings.ap_api_url
        };
      } 
      else if (section === 'payment') {
        requestData = {
          stripe_secret_key: settings.stripe_secret_key,
          stripe_public_key: settings.stripe_public_key
        };
      }

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          setValidationErrors(errorData.details);
          throw new Error('Validation error');
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
      
      // Refresh settings after save
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      setError(error.message);
      if (error.message === 'Validation error') {
        toast.error('Please fix the validation errors below');
      } else {
        toast.error(`Failed to save settings: ${error.message}`);
      }
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          logo: file,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleShowKey = (key) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRefresh = () => {
    fetchSettings();
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
    <AdminNavbar activePage="settings">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>System Settings</h2>
            <p className="text-muted">
              Configure your application settings
            </p>
          </div>
          <Button variant="outline-primary" onClick={handleRefresh}>
            <FaSync />
            <span className="ms-2">Refresh</span>
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Card>
          <Card.Body>
            <Tabs defaultActiveKey="general" className="mb-4">
              {/* General Settings Tab */}
              <Tab eventKey="general" title={
                <span>
                  <FaCog className="me-2" />
                  General
                </span>
              }>
                <h4 className="mb-4">General Settings</h4>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Page Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.page_name}
                          onChange={(e) => handleInputChange('page_name', e.target.value)}
                          placeholder="Enter your page name"
                          isInvalid={!!validationErrors.page_name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.page_name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Logo</Form.Label>
                    <div className="d-flex align-items-center">
                      {settings.logoPreview && (
                        <div className="me-4">
                          <img 
                            src={settings.logoPreview} 
                            alt="Logo preview" 
                            style={{ maxWidth: '100px', maxHeight: '100px' }}
                            className="img-thumbnail"
                          />
                        </div>
                      )}
                      <div>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ maxWidth: '300px' }}
                          isInvalid={!!validationErrors.logo}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.logo}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Recommended size: 200x60 pixels
                        </Form.Text>
                      </div>
                    </div>
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        page_name: '',
                        logo: null,
                        logoPreview: ''
                      }))}
                    >
                      <FaTimes className="me-2" />
                      Reset
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => handleSave('general')}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save General Settings
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Tab>

              {/* API Settings Tab */}
              <Tab eventKey="api" title={
                <span>
                  <FaKey className="me-2" />
                  API Keys
                </span>
              }>
                <h4 className="mb-4">API Configuration</h4>
                <Form>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>AI API Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showApiKeys.ai_api_key ? "text" : "password"}
                            value={settings.ai_api_key}
                            onChange={(e) => handleInputChange('ai_api_key', e.target.value)}
                            placeholder="Enter your AI API key"
                            isInvalid={!!validationErrors.ai_api_key}
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => toggleShowKey('ai_api_key')}
                          >
                            {showApiKeys.ai_api_key ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.ai_api_key}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Public API Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showApiKeys.public_key ? "text" : "password"}
                            value={settings.public_key}
                            onChange={(e) => handleInputChange('public_key', e.target.value)}
                            placeholder="Enter your public API key"
                            isInvalid={!!validationErrors.public_key}
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => toggleShowKey('public_key')}
                          >
                            {showApiKeys.public_key ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.public_key}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-4">
                        <Form.Label>AP API URL</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaLink />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            value={settings.ap_api_url}
                            onChange={(e) => handleInputChange('ap_api_url', e.target.value)}
                            placeholder="Enter your AP API URL (e.g., https://api.example.com)"
                            isInvalid={!!validationErrors.ap_api_url}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.ap_api_url}
                          </Form.Control.Feedback>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Enter the full URL for the AP API endpoint
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        ai_api_key: '',
                        public_key: '',
                        ap_api_url: ''
                      }))}
                    >
                      <FaTimes className="me-2" />
                      Clear
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => handleSave('api')}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save API Settings
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Tab>

              {/* Payment Settings Tab */}
              <Tab eventKey="payment" title={
                <span>
                  <FaCreditCard className="me-2" />
                  Payment
                </span>
              }>
                <h4 className="mb-4">Payment Gateway Configuration</h4>
                <Form>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stripe Secret Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showApiKeys.stripe_secret_key ? "text" : "password"}
                            value={settings.stripe_secret_key}
                            onChange={(e) => handleInputChange('stripe_secret_key', e.target.value)}
                            placeholder="Enter your Stripe secret key"
                            isInvalid={!!validationErrors.stripe_secret_key}
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => toggleShowKey('stripe_secret_key')}
                          >
                            {showApiKeys.stripe_secret_key ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.stripe_secret_key}
                          </Form.Control.Feedback>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Should start with "sk_"
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-4">
                        <Form.Label>Stripe Public Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showApiKeys.stripe_public_key ? "text" : "password"}
                            value={settings.stripe_public_key}
                            onChange={(e) => handleInputChange('stripe_public_key', e.target.value)}
                            placeholder="Enter your Stripe public key"
                            isInvalid={!!validationErrors.stripe_public_key}
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => toggleShowKey('stripe_public_key')}
                          >
                            {showApiKeys.stripe_public_key ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.stripe_public_key}
                          </Form.Control.Feedback>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Should start with "pk_"
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        stripe_secret_key: '',
                        stripe_public_key: ''
                      }))}
                    >
                      <FaTimes className="me-2" />
                      Clear
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => handleSave('payment')}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save Payment Settings
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>
    </AdminNavbar>
  );
};

export default Settings;