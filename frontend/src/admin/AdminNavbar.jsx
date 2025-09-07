import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { 
  Navbar, 
  Nav, 
  Dropdown, 
  Badge,
  Container,
  Row,
  Col,
  Spinner
} from 'react-bootstrap';
import { 
  FaBell, 
  FaUserCircle,
  FaTachometerAlt,
  FaUsers,
  FaBoxes,
  FaShoppingCart,
  FaCog,
  FaChartBar,
  FaCheck,
  FaTrash
} from 'react-icons/fa';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { logout, getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/adminAuth';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_BASE_URL = 'http://localhost:8000';

const AdminNavbar = ({ children, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Create axios instance with interceptors for token refresh
  const createApiClient = () => {
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    api.interceptors.request.use(
      (config) => {
        const currentToken = getAccessToken();
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshTokenValue = getRefreshToken();
            if (!refreshTokenValue) {
              throw new Error('No refresh token available');
            }

            const refreshResponse = await axios.post(
              `${API_BASE_URL}/api/token/refresh/`,
              { refresh: refreshTokenValue }
            );
            
            setTokens(refreshResponse.data.access, refreshResponse.data.refresh);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            clearTokens();
            handleLogout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return api;
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const api = createApiClient();
      const response = await api.get('/api/notifications/?limit=5');
      
      // Handle different response formats
      let notificationsData = [];
      if (Array.isArray(response.data)) {
        notificationsData = response.data;
      } else if (response.data.results) {
        notificationsData = response.data.results;
      } else {
        notificationsData = response.data;
      }
      
      setNotifications(notificationsData);
      
      // Calculate unread count
      const count = notificationsData.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (err.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch only unread count
  const fetchUnreadCount = async () => {
    try {
      const api = createApiClient();
      const response = await api.get('/api/notifications/unread-count/');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const api = createApiClient();
      await api.post(`/api/notifications/${id}/read/`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const api = createApiClient();
      await api.delete(`/api/notifications/${id}/`);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  // Get notification icon by type
  const getNotificationIcon = (type) => {
    const icons = {
      'order': <FaShoppingCart className="text-success" />,
      'user': <FaUsers className="text-primary" />,
      'system': <FaCog className="text-warning" />,
      'product': <FaBoxes className="text-info" />,
      'support': <FaChartBar className="text-secondary" />
    };
    return icons[type] || <FaBell className="text-muted" />;
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="top-navbar">
        <Container fluid>
          <Navbar.Brand as={Link} to="/admin/dashboard">Admin Dashboard</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="ml-auto">
              <Dropdown alignRight onToggle={(isOpen) => isOpen && fetchNotifications()}>
                <Dropdown.Toggle variant="dark" id="dropdown-notification">
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge pill variant="danger" className="notification-badge">
                      {unreadCount}
                    </Badge>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-lg dropdown-menu-right p-0">
                  <Dropdown.Header className="bg-light">
                    <strong>Notifications</strong>
                    <div className="float-right">
                      <small>
                        <Link to="/admin/notifications">View All</Link>
                      </small>
                    </div>
                  </Dropdown.Header>
                  
                  {loadingNotifications ? (
                    <Dropdown.Item className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </Dropdown.Item>
                  ) : notifications.length > 0 ? (
                    <>
                      {notifications.map(notification => (
                        <Dropdown.Item 
                          key={notification.id}
                          className="d-flex align-items-center py-2 border-bottom"
                          onClick={() => navigate(`/admin/notifications`)}
                        >
                          <div className="mr-2">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                          <div className="flex-grow-1">
                            <div className="font-weight-bold">
                              {notification.title}
                              {!notification.is_read && (
                                <span className="float-right">
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-0 text-success"
                                    onClick={(e) => markAsRead(notification.id, e)}
                                  >
                                    <FaCheck size={12} />
                                  </Button>
                                </span>
                              )}
                            </div>
                            <small className="text-muted d-block">
                              {notification.message}
                            </small>
                            <small className="text-muted">
                              {notification.time_since}
                            </small>
                          </div>
                        </Dropdown.Item>
                      ))}
                    </>
                  ) : (
                    <Dropdown.Item className="text-center py-3 text-muted">
                      No new notifications
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    className="text-center text-primary"
                    onClick={() => navigate('/admin/notifications')}
                  >
                    See all notifications
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Dropdown alignRight>
                <Dropdown.Toggle variant="dark" id="dropdown-profile">
                  <FaUserCircle /> Admin User
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/admin/profile">Profile</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/admin/settings">Settings</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content with Sidebar */}
      <Container fluid className="main-content">
        <Row>
          {/* Sidebar */}
          <Col md={2} className="sidebar bg-light p-0">
            <Nav className="flex-column">
              <Nav.Link 
                as={NavLink} 
                to="/admin/dashboard" 
                active={activePage === 'dashboard'}
              >
                <FaTachometerAlt className="mr-2" /> Dashboard
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/admin/users-list" 
                active={activePage === 'customers'}
              >
                <FaUsers className="mr-2" /> Customers
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/admin/products-list" 
                active={activePage === 'products'}
              >
                <FaBoxes className="mr-2" /> Products
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/admin/orders-list" 
                active={activePage === 'orders'}
              >
                <FaShoppingCart className="mr-2" /> Orders
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/admin/notifications" 
                active={activePage === 'notifications'}
              >
                <FaBell className="mr-2" /> Notifications
                {unreadCount > 0 && (
                  <Badge pill variant="danger" className="float-right mt-1">
                    {unreadCount}
                  </Badge>
                )}
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/admin/settings" 
                active={activePage === 'settings'}
              >
                <FaCog className="mr-2" /> Settings
              </Nav.Link>
              <Nav.Link 
                as={NavLink} 
                to="/admin/reports" 
                active={activePage === 'reports'}
              >
                <FaChartBar className="mr-2" /> Reports
              </Nav.Link>
            </Nav>
          </Col>

          {/* Page Content */}
          <Col md={10} className="content-area">
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminNavbar;