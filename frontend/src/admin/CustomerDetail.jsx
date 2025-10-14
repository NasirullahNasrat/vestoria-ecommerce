import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Badge, 
  Tab, 
  Nav, 
  Spinner,
  Alert,
  Modal,
  Form
} from 'react-bootstrap';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaShoppingBag,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaUserShield,
  FaCalendar,
  FaClock
} from 'react-icons/fa';
import { toast } from "react-hot-toast";
import AdminNavbar from "./AdminNavbar";
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin
} from "../utils/adminAuth";
import { getApiUrl } from "../config/env"; // Add this import

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCustomerOrders = async (userId) => {
    try {
      const token = getAccessToken();
      console.log("Fetching orders for user ID:", userId);
      
      // Use environment configuration for API URL
      const apiUrl = getApiUrl('/api/orders/admin/');
      
      // First try to fetch with user_id parameter
      const response = await fetch(`${apiUrl}?user_id=${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Orders API response:", data);
        
        let ordersData = Array.isArray(data) ? data : 
                        data.results || data.orders || data.data || [];
        
        // If we got all orders instead of filtered ones, filter client-side
        if (ordersData.length > 0 && 
            (ordersData[0].user !== userId && 
             ordersData[0].user_id !== userId &&
             !(ordersData[0].user && ordersData[0].user.id === userId))) {
          console.log("Server didn't filter by user_id, filtering client-side");
          ordersData = ordersData.filter(order => 
            order.user === userId || 
            order.user_id === userId || 
            (order.user && order.user.id === userId)
          );
        }
        
        setOrders(ordersData);
      } else {
        console.error("Orders API error:", response.status, response.statusText);
        // If parameter filtering fails, fetch all orders and filter client-side
        const allOrdersResponse = await fetch(apiUrl, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (allOrdersResponse.ok) {
          const allData = await allOrdersResponse.json();
          const allOrders = Array.isArray(allData) ? allData : 
                          allData.results || allData.orders || allData.data || [];
          
          // Filter orders by user ID client-side
          const filteredOrders = allOrders.filter(order => 
            order.user === userId || 
            order.user_id === userId || 
            (order.user && order.user.id === userId)
          );
          
          console.log("Filtered orders client-side:", filteredOrders);
          setOrders(filteredOrders);
        }
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    }
  };

  const fetchCustomerDetails = async () => {
    try {
      setError(null);
      const token = getAccessToken();
      
      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/admin/customers/${id}/`);
      
      const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Customer details response:", data);
      setCustomer(data);
      
      setEditData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        is_active: data.is_active || false,
        is_staff: data.is_staff || false
      });

      // Fetch orders for this user
      if (data.id) {
        await fetchCustomerOrders(data.id);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setError(error.message);
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
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
        await fetchCustomerDetails();
      } catch (err) {
        console.error('Authentication error:', err);
        toast.error('Authentication failed. Please login again');
        logout();
        navigate('/admin/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate, id]);

  const handleSave = async () => {
    try {
      const token = getAccessToken();
      
      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/admin/customers/${id}/`);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      setEditing(false);
      toast.success('Customer updated successfully');
      
      // Refresh the data
      await fetchCustomerDetails();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const token = getAccessToken();
      
      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/admin/customers/${id}/`);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      toast.success('Customer deleted successfully');
      navigate('/admin/customers');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = getAccessToken();
      
      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/admin/customers/${id}/`);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: newStatus === 'active' })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      toast.success('Status updated successfully');
      
      // Refresh the data
      await fetchCustomerDetails();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error && !customer) {
    return (
      <AdminNavbar activePage="customers">
        <div className="container-fluid py-4">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Customer</Alert.Heading>
            <p>{error}</p>
            <div className="mt-3">
              <p>Possible issues:</p>
              <ul>
                <li>The customer ID {id} might not exist</li>
                <li>Check if the API endpoint is correct</li>
                <li>Verify your Django view implementation</li>
              </ul>
            </div>
            <Button onClick={() => navigate('/admin/users-list')} variant="outline-danger">
              <FaArrowLeft className="me-2" />
              Back to Customers
            </Button>
          </Alert>
        </div>
      </AdminNavbar>
    );
  }

  return (
    <AdminNavbar activePage="customers">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/admin/users-list')}
              className="me-3"
            >
              <FaArrowLeft />
            </Button>
            <div>
              <h2 className="mb-0">Customer Details</h2>
              <p className="text-muted mb-0">ID: {id}</p>
            </div>
          </div>
          <div>
            <Button 
              variant="outline-danger" 
              className="me-2"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Customer
            </Button>
            {editing ? (
              <>
                <Button 
                  variant="outline-secondary" 
                  className="me-2"
                  onClick={() => setEditing(false)}
                >
                  <FaTimes className="me-1" /> Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleSave}
                >
                  <FaSave className="me-1" /> Save Changes
                </Button>
              </>
            ) : (
              <Button 
                variant="primary"
                onClick={() => setEditing(true)}
              >
                <FaEdit className="me-1" /> Edit Customer
              </Button>
            )}
          </div>
        </div>

        {customer ? (
          <Tab.Container defaultActiveKey="profile">
            <Row>
              <Col lg={4}>
                <Card className="mb-4">
                  <Card.Body className="text-center">
                    <div className="d-flex justify-content-center mb-3">
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                           style={{ width: '100px', height: '100px' }}>
                        {customer.is_staff ? (
                          <FaUserShield size={40} className="text-white" />
                        ) : (
                          <FaUser size={40} className="text-white" />
                        )}
                      </div>
                    </div>
                    
                    <h4>{customer.first_name || 'No Name'} {customer.last_name || ''}</h4>
                    <p className="text-muted mb-2">
                      {customer.is_staff ? 'Administrator' : 'Customer'}
                    </p>
                    
                    <div className="d-flex justify-content-center mb-3">
                      <Badge bg={customer.is_active ? "success" : "secondary"}>
                        {customer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-center gap-2 mb-3">
                      <Button 
                        size="sm" 
                        variant={customer.is_active ? "outline-secondary" : "outline-success"}
                        onClick={() => handleStatusChange(customer.is_active ? 'inactive' : 'active')}
                      >
                        {customer.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                    
                    <hr />
                    
                    <div className="text-start">
                      <div className="d-flex align-items-center mb-2">
                        <FaEnvelope className="text-muted me-2" />
                        <span>{customer.email || 'N/A'}</span>
                      </div>
                      
                      {customer.phone && (
                        <div className="d-flex align-items-center mb-2">
                          <FaPhone className="text-muted me-2" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      
                      <div className="d-flex align-items-center mb-2">
                        <FaCalendar className="text-muted me-2" />
                        <span>Joined: {formatDate(customer.date_joined)}</span>
                      </div>
                      
                      <div className="d-flex align-items-center">
                        <FaClock className="text-muted me-2" />
                        <span>Last login: {customer.last_login ? formatDateTime(customer.last_login) : 'Never'}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Quick Stats</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Orders:</span>
                      <strong>{orders.length}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Active Status:</span>
                      <Badge bg={customer.is_active ? "success" : "secondary"}>
                        {customer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Account Type:</span>
                      <Badge bg={customer.is_staff ? "primary" : "secondary"}>
                        {customer.is_staff ? "Admin" : "Customer"}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={8}>
                <Card>
                  <Card.Header>
                    <Nav variant="tabs" className="card-header-tabs">
                      <Nav.Item>
                        <Nav.Link eventKey="profile">Profile Information</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="orders">Order History</Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Card.Header>
                  
                  <Card.Body>
                    <Tab.Content>
                      <Tab.Pane eventKey="profile">
                        {editing ? (
                          <Form>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>First Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="first_name"
                                    value={editData.first_name || ''}
                                    onChange={handleInputChange}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Last Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="last_name"
                                    value={editData.last_name || ''}
                                    onChange={handleInputChange}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Email Address</Form.Label>
                              <Form.Control
                                type="email"
                                name="email"
                                value={editData.email || ''}
                                onChange={handleInputChange}
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Phone Number</Form.Label>
                              <Form.Control
                                type="text"
                                name="phone"
                                value={editData.phone || ''}
                                onChange={handleInputChange}
                                placeholder="Add phone number"
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="checkbox"
                                label="Administrator privileges"
                                name="is_staff"
                                checked={editData.is_staff || false}
                                onChange={handleInputChange}
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="checkbox"
                                label="Active Account"
                                name="is_active"
                                checked={editData.is_active || false}
                                onChange={handleInputChange}
                              />
                            </Form.Group>
                          </Form>
                        ) : (
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>First Name:</strong>
                                <p>{customer.first_name || 'Not provided'}</p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Last Name:</strong>
                                <p>{customer.last_name || 'Not provided'}</p>
                              </div>
                            </Col>
                            
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Email Address:</strong>
                                <p>{customer.email || 'N/A'}</p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Phone Number:</strong>
                                <p>{customer.phone || 'Not provided'}</p>
                              </div>
                            </Col>
                            
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Account Status:</strong>
                                <p>
                                  <Badge bg={customer.is_active ? "success" : "secondary"}>
                                    {customer.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>User Role:</strong>
                                <p>
                                  <Badge bg={customer.is_staff ? "primary" : "secondary"}>
                                    {customer.is_staff ? "Administrator" : "Customer"}
                                  </Badge>
                                </p>
                              </div>
                            </Col>
                            
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Date Joined:</strong>
                                <p>{formatDate(customer.date_joined)}</p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Last Login:</strong>
                                <p>{customer.last_login ? formatDateTime(customer.last_login) : 'Never'}</p>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </Tab.Pane>
                      
                      <Tab.Pane eventKey="orders">
                        <h5>Order History</h5>
                        
                        {loading ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Loading orders...</p>
                          </div>
                        ) : orders.length === 0 ? (
                          <div className="text-center py-4">
                            <FaShoppingBag size={48} className="text-muted mb-3" />
                            <p>This customer hasn't placed any orders yet.</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Order ID</th>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Total</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map(order => (
                                  <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{formatDate(order.created_at || order.created)}</td>
                                    <td>
                                      <Badge bg={
                                        order.status === 'completed' ? 'success' : 
                                        order.status === 'pending' ? 'warning' : 
                                        order.status === 'cancelled' ? 'danger' : 'secondary'
                                      }>
                                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                      </Badge>
                                    </td>
                                    <td>${order.total_amount?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</td>
                                    <td>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                                      >
                                        View
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Container>
        ) : (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete this customer? This action cannot be undone and will also delete the associated user account.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Customer
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminNavbar>
  );
};

export default CustomerDetails;