import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaSearch, 
  FaFilter, 
  FaTimes,
  FaEye,
  FaPrint,
  FaSync
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AdminNavbar from "./AdminNavbar";
import { logout } from "../redux/reducer/authSlice";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup, 
  Badge,
  Spinner,
  Dropdown,
  Pagination,
  Alert
} from 'react-bootstrap';
import { getAccessToken, isAuthenticated, isAdmin } from "../utils/adminAuth";
import { getApiUrl } from "../config/env";

const AdminOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    date_from: '',
    date_to: ''
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Use isAuthenticated instead of verifyToken
        if (!isAuthenticated()) {
          toast.error('Please login to access this page');
          dispatch(logout());
          navigate('/admin/login', { replace: true });
          return;
        }
        
        // Additional check for admin role
        if (!isAdmin()) {
          toast.error('Admin access required');
          dispatch(logout());
          navigate('/admin/login', { replace: true });
          return;
        }
        
        setAuthChecked(true);
        fetchAllOrders();
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please login again');
        toast.error('Authentication failed. Please login again');
        dispatch(logout());
        navigate('/admin/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, dispatch]);

  const fetchAllOrders = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use environment configuration for API URL
      const apiUrl = getApiUrl('/api/orders/admin/');
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again');
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      let data = await response.json();
      
      // Ensure we're working with an array
      if (!Array.isArray(data)) {
        if (data.results) {
          // Handle paginated response
          data = data.results;
        } else if (data.orders) {
          // Handle nested orders response
          data = data.orders;
        } else {
          throw new Error('Invalid orders data format');
        }
      }
      
      const formattedOrders = data.map(order => ({
        ...order,
        total: Number(order.total),
        created: order.created || new Date().toISOString()
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message);
      toast.error("Failed to load orders");
      
      if (error.message.includes('401') || error.message.includes('authentication')) {
        dispatch(logout());
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'P': { text: 'Pending', variant: 'warning' },
      'C': { text: 'Complete', variant: 'success' },
      'F': { text: 'Failed', variant: 'danger' },
    };
    return <Badge bg={statusMap[status]?.variant || 'secondary'}>
      {statusMap[status]?.text || 'Unknown'}
    </Badge>;
  };

  const getPaymentMethodBadge = (method) => {
    const methodMap = {
      'credit': { text: 'Credit Card', variant: 'info' },
      'paypal': { text: 'PayPal', variant: 'primary' },
      'bank': { text: 'Bank Transfer', variant: 'success' },
      'cod': { text: 'Cash on Delivery', variant: 'warning' },
    };
    return <Badge bg={methodMap[method]?.variant || 'secondary'}>
      {methodMap[method]?.text || 'Unknown'}
    </Badge>;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Check authentication before proceeding
      if (!isAuthenticated()) {
        toast.error('Please login to continue');
        dispatch(logout());
        navigate('/admin/login');
        return;
      }
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      confirmAlert({
        title: 'Confirm Status Change',
        message: `Change order status to ${newStatus}?`,
        buttons: [
          {
            label: 'Yes',
            onClick: async () => {
              try {
                // Use environment configuration for API URL
                const apiUrl = getApiUrl(`/api/orders/admin/${orderId}/`);
                
                const response = await fetch(apiUrl, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) {
                  if (response.status === 401) {
                    throw new Error('Authentication failed. Please login again');
                  }
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(
                    errorData.detail || 
                    errorData.message || 
                    `Failed with status ${response.status}`
                  );
                }

                const updatedOrder = await response.json();
                setOrders(orders.map(order => 
                  order.id === orderId ? { 
                    ...order, 
                    status: updatedOrder.status 
                  } : order
                ));
                toast.success(`Order status updated to ${newStatus}`);
              } catch (error) {
                console.error('Update error:', error);
                toast.error(`Failed to update status: ${error.message}`);
                
                if (error.message.includes('401') || error.message.includes('authentication')) {
                  dispatch(logout());
                  navigate('/admin/login');
                }
              }
            }
          },
          {
            label: 'No',
            onClick: () => {}
          }
        ]
      });
    } catch (error) {
      console.error('Authentication check error:', error);
      toast.error('Authentication failed. Please login again');
      dispatch(logout());
      navigate('/admin/login');
    }
  };

  const Loading = () => (
    <div className="table-responsive">
      <Table hover>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(10)].map((_, index) => (
            <tr key={index}>
              <td><Skeleton width={80} /></td>
              <td><Skeleton width={120} /></td>
              <td><Skeleton width={100} /></td>
              <td><Skeleton width={80} /></td>
              <td><Skeleton width={80} /></td>
              <td><Skeleton width={60} /></td>
              <td><Skeleton width={100} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      payment_method: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    fetchAllOrders();
  };

  const filteredOrders = orders.filter(order => {
    const searchFields = [
      order.order_number?.toLowerCase(),
      order.user?.username?.toLowerCase(),
      order.user?.email?.toLowerCase(),
      order.id?.toString()
    ].filter(Boolean);

    const matchesSearch = searchTerm === '' || 
      searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filters.status || order.status === filters.status;
    const matchesPayment = !filters.payment_method || order.payment_method === filters.payment_method;
    const orderDate = new Date(order.created);
    const fromDate = filters.date_from ? new Date(filters.date_from) : null;
    const toDate = filters.date_to ? new Date(filters.date_to + 'T23:59:59') : null;
    
    const matchesDateFrom = !fromDate || orderDate >= fromDate;
    const matchesDateTo = !toDate || orderDate <= toDate;
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDateFrom && matchesDateTo;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
    <AdminNavbar activePage="orders">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>All Customer Orders</h2>
            <p className="text-muted">
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={fetchAllOrders}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spin' : ''} />
            <span className="ms-2">Refresh</span>
          </Button>
        </div>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Order Management</h5>
            <div className="d-flex">
              <Form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); }} className="me-3">
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <Button variant="outline-secondary" type="submit">
                    Search
                  </Button>
                </InputGroup>
              </Form>
              
              <Button 
                variant={showFilters ? "primary" : "outline-secondary"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" /> 
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </Card.Header>
          
          {showFilters && (
            <Card.Body className="border-top">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="P">Pending</option>
                    <option value="C">Complete</option>
                    <option value="F">Failed</option>
                  </Form.Select>
                </div>
                
                <div className="col-md-3 mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select 
                    name="payment_method"
                    value={filters.payment_method}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Methods</option>
                    <option value="credit">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cod">Cash on Delivery</option>
                  </Form.Select>
                </div>
                
                <div className="col-md-3 mb-3">
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="col-md-3 mb-3">
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="col-12 d-flex justify-content-end gap-2">
                  <Button 
                    variant="outline-danger"
                    size="sm"
                    onClick={resetFilters}
                  >
                    <FaTimes className="me-1" /> Reset All
                  </Button>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Card.Body>
          )}
          
          <Card.Body>
            {error ? (
              <Alert variant="danger">
                <h4>Error Loading Orders</h4>
                <p>{error}</p>
                <div className="d-flex gap-2 mt-3">
                  <Button variant="primary" onClick={fetchAllOrders}>
                    Try Again
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </Alert>
            ) : loading ? (
              <Loading />
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <h4>No orders found</h4>
                <p className="text-muted">Try adjusting your filters or search term</p>
                <Button 
                  variant="primary"
                  className="mt-3"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover striped>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <Link to={`/admin/orders/${order.id}`} className="text-decoration-none">
                              #{order.order_number || order.id}
                            </Link>
                          </td>
                          <td>
                            {order.user ? (
                              <Link to={`/admin/customers/${order.user.id}`}>
                                {order.user.username || order.user.email || 'Guest'}
                              </Link>
                            ) : 'Guest'}
                          </td>
                          <td>{formatDate(order.created)}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>{getPaymentMethodBadge(order.payment_method)}</td>
                          <td>${order.total.toFixed(2)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                                title="View Details"
                              >
                                <FaEye />
                              </Button>
                              
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                title="Print Invoice"
                                onClick={() => window.print()}
                              >
                                <FaPrint />
                              </Button>
                              
                              <Dropdown>
                                <Dropdown.Toggle 
                                  variant="outline-info" 
                                  size="sm" 
                                  id={`dropdown-status-${order.id}`}
                                >
                                  Update Status
                                </Dropdown.Toggle>
                                
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => handleStatusChange(order.id, 'P')}>
                                    Pending
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleStatusChange(order.id, 'C')}>
                                    Complete
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleStatusChange(order.id, 'F')}>
                                    Failed
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.First 
                        onClick={() => paginate(1)} 
                        disabled={currentPage === 1} 
                      />
                      <Pagination.Prev 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1} 
                      />
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => paginate(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      
                      <Pagination.Next 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages} 
                      />
                      <Pagination.Last 
                        onClick={() => paginate(totalPages)} 
                        disabled={currentPage === totalPages} 
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminNavbar>
  );
};

export default AdminOrdersList;