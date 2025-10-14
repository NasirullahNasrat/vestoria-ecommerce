import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, login } from '../utils/adminAuth';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './dashboard.css';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../config/env'; // Import the environment utility

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (isAuthenticated()) {
          console.log('User already authenticated, redirecting to dashboard');
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.log('Authentication check failed:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Small delay to prevent race conditions
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!username || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Use environment configuration for API URL
      const apiUrl = getApiUrl('/api/admin_token/');
      
      // Make login request to backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Invalid username or password';
        throw new Error(errorMessage);
      }

      // Check if user is admin
      if (!data.is_admin) {
        throw new Error('Access denied. Only administrator accounts can login.');
      }

      // Store tokens and user data
      login(
        {
          access: data.access,
          refresh: data.refresh,
        },
        {
          isAdmin: true,
          username: username,
        }
      );

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Show success message and redirect
      toast.success('Login successful! Redirecting to dashboard...');
      
      // Use timeout to ensure state updates complete before navigation
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1000);

    } catch (err) {
      // Handle errors
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page bg-light min-vh-100">
      <Container className="h-100 py-5">
        <Row className="h-100 justify-content-center align-items-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="login-card shadow-lg border-0">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="fas fa-lock fa-3x text-primary"></i>
                  </div>
                  <h2 className="font-weight-bold text-dark">Admin Portal</h2>
                  <p className="text-muted">Sign in to access the administrator dashboard</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="mb-4">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Username</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-user text-muted"></i>
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                        className="border-start-0"
                        disabled={loading}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-start-0"
                        disabled={loading}
                      />
                    </div>
                  </Form.Group>

                  <Row className="mb-4">
                    <Col>
                      <Form.Check
                        type="checkbox"
                        id="rememberMe"
                        label="Remember me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                      />
                    </Col>
                    <Col className="text-end">
                      <a href="#forgot-password" className="text-decoration-none text-primary">
                        Forgot password?
                      </a>
                    </Col>
                  </Row>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 fw-semibold"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                {/* Footer */}
                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted small">
                    <i className="fas fa-shield-alt me-1"></i>
                    Secure admin access only
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;