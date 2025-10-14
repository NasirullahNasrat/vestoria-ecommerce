import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import AdminNavbar from './AdminNavbar';
import { FaUsers, FaDollarSign, FaShoppingCart, FaTicketAlt } from 'react-icons/fa';
import { isAuthenticated, logout, getAccessToken } from '../utils/adminAuth';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { getApiUrl } from '../config/env'; // Import the environment utility

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    supportTickets: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        if (!isAuthenticated()) {
          toast.error('Please login to access the dashboard');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        setAuthChecked(true);
        fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use environment configuration for API URLs
      const statsApiUrl = getApiUrl('/api/admin/dashboard-stats/');
      const ordersApiUrl = getApiUrl('/api/orders/?limit=5');
      const activityApiUrl = getApiUrl('/api/admin/recent-activity/');

      // Fetch dashboard stats
      const statsResponse = await axios.get(statsApiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });
      
      setStats({
        totalUsers: statsResponse.data.total_users || 0,
        totalRevenue: statsResponse.data.total_revenue || 0,
        pendingOrders: statsResponse.data.pending_orders || 0,
        supportTickets: statsResponse.data.support_tickets || 0
      });

      // Fetch recent orders
      try {
        const ordersResponse = await axios.get(ordersApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 10000
        });
        
        const ordersData = ordersResponse.data;
        setRecentOrders(
          Array.isArray(ordersData) ? ordersData : 
          (ordersData.results || ordersData.data || [])
        );
      } catch (ordersError) {
        console.warn('Could not fetch orders:', ordersError);
        setRecentOrders([]);
      }

      // Fetch recent activity
      try {
        const activityResponse = await axios.get(activityApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 10000
        });
        
        setRecentActivity(
          Array.isArray(activityResponse.data) ? activityResponse.data : []
        );
      } catch (activityError) {
        console.warn('Could not fetch recent activity:', activityError);
        setRecentActivity([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Handle unauthorized access
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please login again');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      
      // Handle other errors
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to load dashboard data. Please try again later.';
      setError(errorMessage);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingStats(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Get order status badge
  const getOrderStatusBadge = (status) => {
    const statusMap = {
      'P': { variant: 'warning', text: 'Processing' },
      'C': { variant: 'success', text: 'Completed' },
      'X': { variant: 'danger', text: 'Cancelled' },
      'S': { variant: 'info', text: 'Shipped' },
      'D': { variant: 'primary', text: 'Delivered' }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', text: 'Unknown' };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return null;
  }

  return (
    <AdminNavbar activePage="dashboard">
      <div className="container-fluid py-4">
        {/* Page Header */}
        <div className="page-header mb-4">
          <h1 className="h2 fw-bold text-dark">Dashboard Overview</h1>
          <p className="text-muted">Welcome back, Administrator! Here's what's happening with your store today.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
              <Button variant="outline-danger" size="sm" onClick={fetchDashboardData}>
                <i className="fas fa-redo me-1"></i>
                Try Again
              </Button>
            </div>
          </Alert>
        )}

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} lg={6} md={6} className="mb-3">
            <Card className="stat-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2 fw-semibold">Total Users</h6>
                    <h3 className="mb-0 fw-bold">
                      {loadingStats ? <Spinner animation="border" size="sm" /> : stats.totalUsers.toLocaleString()}
                    </h3>
                    <small className="text-muted">Registered customers</small>
                  </div>
                  <div className="stat-icon bg-primary">
                    <FaUsers className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} className="mb-3">
            <Card className="stat-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2 fw-semibold">Total Revenue</h6>
                    <h3 className="mb-0 fw-bold">
                      {loadingStats ? <Spinner animation="border" size="sm" /> : formatCurrency(stats.totalRevenue)}
                    </h3>
                    <small className="text-muted">Lifetime sales</small>
                  </div>
                  <div className="stat-icon bg-success">
                    <FaDollarSign className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} className="mb-3">
            <Card className="stat-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2 fw-semibold">Pending Orders</h6>
                    <h3 className="mb-0 fw-bold">
                      {loadingStats ? <Spinner animation="border" size="sm" /> : stats.pendingOrders}
                    </h3>
                    <small className="text-muted">Awaiting processing</small>
                  </div>
                  <div className="stat-icon bg-warning">
                    <FaShoppingCart className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} className="mb-3">
            <Card className="stat-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2 fw-semibold">Support Tickets</h6>
                    <h3 className="mb-0 fw-bold">
                      {loadingStats ? <Spinner animation="border" size="sm" /> : stats.supportTickets}
                    </h3>
                    <small className="text-muted">Requiring attention</small>
                  </div>
                  <div className="stat-icon bg-danger">
                    <FaTicketAlt className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Orders */}
        <Row className="mb-4">
          <Col xl={8} lg={7}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-semibold">Recent Orders</h5>
                <Button variant="primary" size="sm" onClick={() => navigate('/admin/orders-list')}>
                  <i className="fas fa-eye me-1"></i>
                  View All
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                {loadingStats ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading orders...</p>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-shopping-cart fa-2x text-muted mb-3"></i>
                    <p className="text-muted">No recent orders found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0">Order ID</th>
                          <th className="border-0">Customer</th>
                          <th className="border-0">Date</th>
                          <th className="border-0">Amount</th>
                          <th className="border-0">Status</th>
                          <th className="border-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="fw-semibold">#{order.order_number || order.id}</td>
                            <td>{order.user?.username || order.user?.email || 'Guest'}</td>
                            <td>{formatDate(order.created)}</td>
                            <td className="fw-semibold">{order.total ? formatCurrency(order.total) : 'N/A'}</td>
                            <td>{getOrderStatusBadge(order.status)}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                              >
                                <i className="fas fa-eye me-1"></i>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Activity */}
          <Col xl={4} lg={5}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className="bg-transparent border-0 py-3">
                <h5 className="mb-0 fw-semibold">Recent Activity</h5>
              </Card.Header>
              <Card.Body>
                {loadingStats ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading activity...</p>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-history fa-2x text-muted mb-3"></i>
                    <p className="text-muted">No recent activity</p>
                  </div>
                ) : (
                  <div className="activity-feed">
                    {recentActivity.slice(0, 6).map((activity, index) => (
                      <div className="feed-item d-flex align-items-start mb-3" key={index}>
                        <div className={`feed-icon me-3 rounded-circle d-flex align-items-center justify-content-center bg-${activity.type || 'primary'}-subtle`} style={{ width: '40px', height: '40px' }}>
                          <i className={`fas fa-${activity.icon || 'circle'} text-${activity.type || 'primary'}`}></i>
                        </div>
                        <div className="feed-content flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <span className={`fw-semibold text-${activity.type || 'primary'}`}>
                              {activity.title || 'Activity'}
                            </span>
                            <small className="text-muted">
                              {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Now'}
                            </small>
                          </div>
                          <p className="mb-0 text-muted small">{activity.description || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminNavbar>
  );
};

export default Dashboard;