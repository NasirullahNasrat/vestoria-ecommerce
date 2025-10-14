import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaShoppingBag, 
  FaMoneyBillWave, 
  FaMapMarkerAlt,
  FaTruck,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaClock,
  FaEdit,
  FaPrint,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaBox,
  FaCreditCard,
  FaShippingFast,
  FaHome,
  FaCity,
  FaGlobe
} from 'react-icons/fa';
import { toast } from "react-hot-toast";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { 
  Card, 
  Table, 
  Button, 
  Badge,
  Spinner,
  Row,
  Col,
  Modal,
  Form,
  ListGroup,
  Alert
} from 'react-bootstrap';
import AdminNavbar from "./AdminNavbar";
import { logout } from "../redux/reducer/authSlice";
import { getAccessToken, isAuthenticated, isAdmin, logout as adminLogout } from "../utils/adminAuth";
import { getApiUrl } from "../config/env";

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    tracking_number: '',
    shipping_carrier: ''
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

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
        fetchOrder();
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
  }, [navigate, dispatch, id]);

  const fetchOrder = async () => {
    try {
      setError(null);
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const apiUrl = getApiUrl(`/api/orders/admin/${id}/`);
      const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Order API Response:", data);
      
      // Normalize order data
      const normalizedOrder = {
        id: data.id || data._id,
        order_number: data.order_number || data.id || `ORD-${data.id}`,
        created_at: data.created_at || data.created || data.date_created,
        updated_at: data.updated_at || data.updated || data.date_updated,
        status: data.status || 'pending',
        total_amount: data.total_amount || data.total || data.amount || 0,
        subtotal: data.subtotal || 0,
        tax: data.tax || data.tax_amount || 0,
        shipping: data.shipping || data.shipping_cost || 0,
        discount: data.discount || data.discount_amount || 0,
        items: Array.isArray(data.items) ? data.items : [],
        customer: data.customer || data.user || null,
        shipping_address: data.shipping_address || data.address || null,
        billing_address: data.billing_address || null,
        payment_method: data.payment_method || 'unknown',
        payment_status: data.payment_status || 'pending',
        tracking_number: data.tracking_number || '',
        shipping_carrier: data.shipping_carrier || '',
        notes: data.notes || data.customer_notes || ''
      };
      
      setOrder(normalizedOrder);
      setStatusForm({
        status: normalizedOrder.status,
        tracking_number: normalizedOrder.tracking_number,
        shipping_carrier: normalizedOrder.shipping_carrier
      });
      
      // Fetch customer details if customer ID is available
      if (normalizedOrder.customer?.id) {
        fetchCustomer(normalizedOrder.customer.id);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.message);
      if (error.message.includes('401') || error.message.includes('authentication')) {
        dispatch(logout());
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async (customerId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const apiUrl = getApiUrl(`/api/admin/customers/${customerId}/`);
      const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
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
      
      setUpdating(true);
      
      const apiUrl = getApiUrl(`/api/orders/admin/${id}/`);
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusForm)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again');
        }
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrder(prev => ({ ...prev, ...updatedOrder }));
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.message);
      
      if (error.message.includes('401') || error.message.includes('authentication')) {
        dispatch(logout());
        navigate('/admin/login');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = () => {
    fetchOrder();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'warning', text: 'Pending' },
      'processing': { variant: 'info', text: 'Processing' },
      'shipped': { variant: 'primary', text: 'Shipped' },
      'delivered': { variant: 'success', text: 'Delivered' },
      'cancelled': { variant: 'danger', text: 'Cancelled' },
      'completed': { variant: 'success', text: 'Completed' },
      'refunded': { variant: 'secondary', text: 'Refunded' }
    };
    
    const normalizedStatus = status?.toLowerCase() || 'unknown';
    const config = statusConfig[normalizedStatus] || { variant: 'secondary', text: normalizedStatus };
    return <Badge bg={config.variant} className="fs-6">{config.text}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'warning', text: 'Pending' },
      'paid': { variant: 'success', text: 'Paid' },
      'failed': { variant: 'danger', text: 'Failed' },
      'refunded': { variant: 'secondary', text: 'Refunded' }
    };
    
    const normalizedStatus = status?.toLowerCase() || 'unknown';
    const config = statusConfig[normalizedStatus] || { variant: 'secondary', text: normalizedStatus };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') return 'No address available';
    
    if (typeof address === 'string') {
      return address;
    }
    
    const parts = [
      address.street_address,
      address.apartment_address,
      address.city,
      address.state,
      address.zip_code,
      address.country
    ].filter(part => part && part.trim() !== '');
    
    return parts.length > 0 ? parts.join(', ') : 'No address details';
  };

  const calculateItemTotal = (item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return (price * quantity).toFixed(2);
  };

  const handlePrint = () => {
    window.print();
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

  if (loading) {
    return (
      <AdminNavbar activePage="orders">
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <Spinner animation="border" variant="primary" />
            <span className="ms-3">Loading order details...</span>
          </div>
        </div>
      </AdminNavbar>
    );
  }

  if (error) {
    return (
      <AdminNavbar activePage="orders">
        <div className="container-fluid py-4">
          <Alert variant="danger">
            <h4>Error Loading Order</h4>
            <p>{error}</p>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" onClick={() => navigate('/admin/orders')} className="me-2">
                Back to Orders
              </Button>
              <Button variant="outline-primary" onClick={handleRefresh}>
                <FaSync /> Retry
              </Button>
            </div>
          </Alert>
        </div>
      </AdminNavbar>
    );
  }

  if (!order) {
    return (
      <AdminNavbar activePage="orders">
        <div className="container-fluid py-4">
          <Alert variant="warning">
            <h4>Order Not Found</h4>
            <p>The requested order could not be found.</p>
            <Button variant="primary" onClick={() => navigate('/admin/orders')}>
              Back to Orders
            </Button>
          </Alert>
        </div>
      </AdminNavbar>
    );
  }

  return (
    <AdminNavbar activePage="orders">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" onClick={() => navigate('/admin/orders-list')} className="me-3">
              <FaArrowLeft /> Back to Orders
            </Button>
            <div>
              <h2 className="mb-0">Order #{order.order_number}</h2>
              <p className="text-muted mb-0">Placed on {formatDateTime(order.created_at)}</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={handleRefresh}>
              <FaSync />
            </Button>
            <Button variant="outline-primary" onClick={() => setShowStatusModal(true)}>
              <FaEdit /> Update Status
            </Button>
            <Button variant="outline-success" onClick={handlePrint}>
              <FaPrint /> Print
            </Button>
          </div>
        </div>

        <Row>
          {/* Left Column - Order Summary */}
          <Col lg={8}>
            {/* Order Status Card */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaShoppingBag className="me-2" />
                  Order Status
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{getStatusBadge(order.status)}</h4>
                    <p className="text-muted mb-0">
                      Last updated: {formatDateTime(order.updated_at)}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="mb-1">Payment Status: {getPaymentStatusBadge(order.payment_status)}</p>
                    <p className="text-muted mb-0">Method: {order.payment_method}</p>
                  </div>
                </div>
                
                {order.tracking_number && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="mb-2">
                      <FaTruck className="me-2" />
                      Tracking Information
                    </h6>
                    <p className="mb-1">
                      <strong>Carrier:</strong> {order.shipping_carrier || 'Unknown'}
                    </p>
                    <p className="mb-0">
                      <strong>Tracking #:</strong> {order.tracking_number}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Order Items Card */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaBox className="me-2" />
                  Order Items ({order.items.length})
                </h5>
              </Card.Header>
              <Card.Body>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                className="rounded me-3"
                              />
                            )}
                            <div>
                              <h6 className="mb-0">{item.name || `Product ${index + 1}`}</h6>
                              {item.sku && (
                                <small className="text-muted">SKU: {item.sku}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                        <td>{item.quantity || 1}</td>
                        <td>${calculateItemTotal(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Order Notes */}
            {order.notes && (
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    <FaEdit className="me-2" />
                    Order Notes
                  </h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-0">{order.notes}</p>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Right Column - Customer & Payment Info */}
          <Col lg={4}>
            {/* Customer Information */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaUser className="me-2" />
                  Customer Information
                </h5>
              </Card.Header>
              <Card.Body>
                {customer ? (
                  <>
                    <h6 className="mb-2">{customer.first_name} {customer.last_name}</h6>
                    <p className="mb-1">
                      <FaEnvelope className="me-2 text-muted" />
                      {customer.email}
                    </p>
                    {customer.phone && (
                      <p className="mb-0">
                        <FaPhone className="me-2 text-muted" />
                        {customer.phone}
                      </p>
                    )}
                    <hr />
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/admin/customers/${customer.id}`)}
                    >
                      View Customer Profile
                    </Button>
                  </>
                ) : (
                  <p className="text-muted">Customer information not available</p>
                )}
              </Card.Body>
            </Card>

            {/* Shipping Address */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaShippingFast className="me-2" />
                  Shipping Address
                </h5>
              </Card.Header>
              <Card.Body>
                {order.shipping_address ? (
                  <div className="small">
                    <p className="mb-2">
                      <FaUser className="me-2 text-muted" />
                      <strong>{order.shipping_address.first_name} {order.shipping_address.last_name}</strong>
                    </p>
                    <p className="mb-2">
                      <FaHome className="me-2 text-muted" />
                      {order.shipping_address.street_address}
                    </p>
                    {order.shipping_address.apartment_address && (
                      <p className="mb-2">
                        <FaHome className="me-2 text-muted" />
                        {order.shipping_address.apartment_address}
                      </p>
                    )}
                    <p className="mb-2">
                      <FaCity className="me-2 text-muted" />
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                    </p>
                    <p className="mb-0">
                      <FaGlobe className="me-2 text-muted" />
                      {order.shipping_address.country}
                    </p>
                    {order.shipping_address.phone && (
                      <p className="mb-0 mt-2">
                        <FaPhone className="me-2 text-muted" />
                        {order.shipping_address.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">No shipping address provided</p>
                )}
              </Card.Body>
            </Card>

            {/* Billing Address */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaCreditCard className="me-2" />
                  Billing Address
                </h5>
              </Card.Header>
              <Card.Body>
                {order.billing_address ? (
                  <div className="small">
                    <p className="mb-2">
                      <FaUser className="me-2 text-muted" />
                      <strong>{order.billing_address.first_name} {order.billing_address.last_name}</strong>
                    </p>
                    <p className="mb-2">
                      <FaHome className="me-2 text-muted" />
                      {order.billing_address.street_address}
                    </p>
                    {order.billing_address.apartment_address && (
                      <p className="mb-2">
                        <FaHome className="me-2 text-muted" />
                        {order.billing_address.apartment_address}
                      </p>
                    )}
                    <p className="mb-2">
                      <FaCity className="me-2 text-muted" />
                      {order.billing_address.city}, {order.billing_address.state} {order.billing_address.zip_code}
                    </p>
                    <p className="mb-0">
                      <FaGlobe className="me-2 text-muted" />
                      {order.billing_address.country}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted">Same as shipping address</p>
                )}
              </Card.Body>
            </Card>

            {/* Order Summary */}
            <Card>
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaMoneyBillWave className="me-2" />
                  Order Summary
                </h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Subtotal:</span>
                    <span>${(parseFloat(order.subtotal) || 0).toFixed(2)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Shipping:</span>
                    <span>${(parseFloat(order.shipping) || 0).toFixed(2)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Tax:</span>
                    <span>${(parseFloat(order.tax) || 0).toFixed(2)}</span>
                  </ListGroup.Item>
                  {order.discount > 0 && (
                    <ListGroup.Item className="d-flex justify-content-between px-0 text-danger">
                      <span>Discount:</span>
                      <span>-${(parseFloat(order.discount) || 0).toFixed(2)}</span>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="d-flex justify-content-between px-0 fw-bold fs-5">
                    <span>Total:</span>
                    <span>${(parseFloat(order.total_amount) || 0).toFixed(2)}</span>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStatusUpdate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusForm.status}
                onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                required
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Shipping Carrier</Form.Label>
              <Form.Control
                type="text"
                value={statusForm.shipping_carrier}
                onChange={(e) => setStatusForm({...statusForm, shipping_carrier: e.target.value})}
                placeholder="e.g., UPS, FedEx, USPS"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tracking Number</Form.Label>
              <Form.Control
                type="text"
                value={statusForm.tracking_number}
                onChange={(e) => setStatusForm({...statusForm, tracking_number: e.target.value})}
                placeholder="Enter tracking number"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={updating}>
              {updating ? <Spinner animation="border" size="sm" /> : 'Update Status'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .btn, .modal, .navbar {
            display: none !important;
          }
          .container-fluid {
            padding: 0 !important;
          }
          .card {
            border: 1px solid #000 !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </AdminNavbar>
  );
};

export default OrderDetail;