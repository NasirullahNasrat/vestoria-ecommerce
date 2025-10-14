import React, { useState, useEffect } from 'react';
import { 
  Container,
  Card,
  ListGroup,
  Badge,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Dropdown
} from 'react-bootstrap';
import { 
  FaBell, 
  FaCheck, 
  FaTrash, 
  FaBellSlash,
  FaExclamationCircle,
  FaShoppingCart,
  FaUserPlus,
  FaServer,
  FaBox,
  FaQuestionCircle,
  FaFilter,
  FaSync
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin,
  getRefreshToken,
  setTokens,
  clearTokens
} from '../utils/adminAuth';
import AdminNavbar from './AdminNavbar';
import { getApiUrl } from '../config/env'; // Import the environment utility


const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Create axios instance with interceptors for token refresh
  const createApiClient = () => {
    const api = axios.create({
      baseURL: getApiUrl(), // Use environment-based base URL
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshTokenValue = getRefreshToken();
            if (!refreshTokenValue) {
              throw new Error('No refresh token available');
            }

            const refreshResponse = await axios.post(
              getApiUrl('/api/token/refresh/'), // Use environment-based URL
              { refresh: refreshTokenValue }
            );
            
            // Store the new tokens
            setTokens(refreshResponse.data.access, refreshResponse.data.refresh);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            clearTokens();
            logout();
            navigate('/admin/login');
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return api;
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if we have a token first
        const token = getAccessToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Verify token with backend
        try {
          const api = createApiClient();
          await api.post('/api/token/verify/', { token });
        } catch (verifyError) {
          // Token is invalid, try to refresh
          console.log('Token invalid, attempting refresh...');
          const refreshTokenValue = getRefreshToken();
          if (refreshTokenValue) {
            const refreshResponse = await axios.post(
              getApiUrl('/api/token/refresh/'), // Use environment-based URL
              { refresh: refreshTokenValue }
            );
            setTokens(refreshResponse.data.access, refreshResponse.data.refresh);
          } else {
            throw new Error('No refresh token available');
          }
        }
        
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
        fetchNotifications();
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

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const token = getAccessToken();
      console.log('Current token:', token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const api = createApiClient();
      const response = await api.get(getApiUrl('/api/notifications/')); // Use environment-based URL
      console.log('Notifications response:', response);
      
      // Handle different response formats
      let notificationsData = [];
      if (Array.isArray(response.data)) {
        // If response is already an array
        notificationsData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // If response is paginated (has results array)
        notificationsData = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        // If response is an object but not paginated, try to extract array
        notificationsData = Object.values(response.data).find(Array.isArray) || [];
      }
      
      console.log('Processed notifications:', notificationsData);
      
      setNotifications(notificationsData);
      setError(null);
      updateUnreadCount(notificationsData);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      console.error('Error details:', err.response?.data);
      
      setError('Failed to load notifications');
      setNotifications([]);
      
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch unread count separately
  const fetchUnreadCount = async () => {
    try {
      const api = createApiClient();
      const response = await api.get(getApiUrl('/api/notifications/unread-count/')); // Use environment-based URL
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  // Update unread count from local data
  const updateUnreadCount = (notifs) => {
    try {
      const notificationsArray = Array.isArray(notifs) ? notifs : [];
      const count = notificationsArray.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
      setUnreadCount(0);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const api = createApiClient();
      await api.post(getApiUrl(`/api/notifications/${id}/read/`)); // Use environment-based URL
      const updatedNotifications = notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      );
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      toast.success('Marked as read');
    } catch (err) {
      console.error('Error marking as read:', err);
      toast.error('Failed to mark as read');
      
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const api = createApiClient();
      await api.post(getApiUrl('/api/notifications/read-all/')); // Use environment-based URL
      const updatedNotifications = notifications.map(notification => 
        ({ ...notification, is_read: true })
      );
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all as read');
      
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      const api = createApiClient();
      await api.delete(getApiUrl(`/api/notifications/${id}/`)); // Use environment-based URL
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
      
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  // Get appropriate icon for notification type
  const getNotificationIcon = (type) => {
    const icons = {
      'order': <FaShoppingCart className="text-success" />,
      'user': <FaUserPlus className="text-primary" />,
      'system': <FaServer className="text-warning" />,
      'product': <FaBox className="text-info" />,
      'support': <FaQuestionCircle className="text-secondary" />
    };
    return icons[type] || <FaBell className="text-muted" />;
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read when clicked if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type and related object ID
    if (notification.related_object_id) {
      const routes = {
        'order': `/admin/orders-list/${notification.related_object_id}`,
        'user': `/admin/users-list/${notification.related_object_id}`,
        'product': `/admin/products-list/${notification.related_object_id}`
      };
      
      if (routes[notification.notification_type]) {
        navigate(routes[notification.notification_type]);
      }
    }
  };

  // Apply filters to notifications
  useEffect(() => {
    let filtered = notifications;
    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.is_read);
    } else if (filter !== 'all') {
      filtered = notifications.filter(n => n.notification_type === filter);
    }
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  // Set up polling for unread count
  useEffect(() => {
    if (!authChecked) return;
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [authChecked]);

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
    <AdminNavbar activePage="notifications">
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col md={6}>
            <h2 className="mb-0">
              <FaBell className="me-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge pill bg="danger" className="ms-2">
                  {unreadCount} new
                </Badge>
              )}
            </h2>
          </Col>
          <Col md={6} className="text-end">
            <Dropdown className="d-inline-block me-2">
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <FaFilter className="me-1" /> {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilter('all')}>All</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilter('unread')}>Unread</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setFilter('order')}>Orders</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilter('user')}>Users</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilter('product')}>Products</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilter('system')}>System</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilter('support')}>Support</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || refreshing}
            >
              <FaCheck className="me-1" /> Mark all as read
            </Button>
            
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={fetchNotifications}
              disabled={refreshing}
            >
              <FaSync className={refreshing ? 'fa-spin' : ''} />
            </Button>
          </Col>
        </Row>

        {refreshing ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading notifications...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <FaExclamationCircle className="me-2" />
            {error}
            <Button variant="link" onClick={fetchNotifications} className="ms-2">
              Try again
            </Button>
          </Alert>
        ) : (
          <Card>
            <ListGroup variant="flush">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <ListGroup.Item 
                    key={notification.id}
                    action
                    onClick={() => handleNotificationClick(notification)}
                    className={!notification.is_read ? 'bg-light' : ''}
                  >
                    <Row className="align-items-center">
                      <Col xs={1} className="text-center">
                        {getNotificationIcon(notification.notification_type)}
                      </Col>
                      <Col xs={8}>
                        <h5 className={`mb-1 ${!notification.is_read ? 'fw-bold' : ''}`}>
                          {notification.title}
                        </h5>
                        <p className="mb-1 text-muted">{notification.message}</p>
                        <small className="text-muted">{notification.time_since}</small>
                      </Col>
                      <Col xs={3} className="text-end">
                        {!notification.is_read && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            title="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-success"
                          >
                            <FaCheck />
                          </Button>
                        )}
                        <Button 
                          variant="link" 
                          size="sm" 
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-danger"
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-center py-5">
                  <FaBellSlash size={40} className="text-muted mb-3" />
                  <h4>No notifications found</h4>
                  <p className="text-muted">
                    {filter === 'all' 
                      ? "You're all caught up!" 
                      : `No ${filter} notifications found`}
                  </p>
                  {filter !== 'all' && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => setFilter('all')}
                    >
                      Show all notifications
                    </Button>
                  )}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        )}
      </Container>
    </AdminNavbar>
  );
};

export default NotificationsPage;