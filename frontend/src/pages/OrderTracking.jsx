import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchOrderById, 
  clearCurrentOrder,
  clearOrderError 
} from '../redux/reducer/orderSlice';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaTruck, 
  FaBoxOpen, 
  FaCreditCard,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaShippingFast,
  FaClipboardCheck
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, parseISO, isValid } from 'date-fns';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentOrder, loading, error } = useSelector(state => state.order);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (orderId) {
      dispatch(clearCurrentOrder()); // Clear before fetching fresh data
      dispatch(fetchOrderById(orderId));
    }
    
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, orderId, token, navigate]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearOrderError());
    }
  }, [error, dispatch]);

  // Enhanced status configuration with multiple possible values
  const statusConfig = {
    // Pending status variations
    'P': { label: 'Pending', icon: <FaSpinner className="text-warning" />, color: 'warning', progress: 25 },
    'pending': { label: 'Pending', icon: <FaSpinner className="text-warning" />, color: 'warning', progress: 25 },
    'PENDING': { label: 'Pending', icon: <FaSpinner className="text-warning" />, color: 'warning', progress: 25 },
    
    // Complete status variations
    'C': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    'complete': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    'COMPLETE': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    'completed': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    'COMPLETED': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    'delivered': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    'DELIVERED': { label: 'Complete', icon: <FaCheckCircle className="text-success" />, color: 'success', progress: 100 },
    
    // Failed status variations
    'F': { label: 'Failed', icon: <FaTimesCircle className="text-danger" />, color: 'danger', progress: 0 },
    'failed': { label: 'Failed', icon: <FaTimesCircle className="text-danger" />, color: 'danger', progress: 0 },
    'FAILED': { label: 'Failed', icon: <FaTimesCircle className="text-danger" />, color: 'danger', progress: 0 },
    'cancelled': { label: 'Failed', icon: <FaTimesCircle className="text-danger" />, color: 'danger', progress: 0 },
    'CANCELLED': { label: 'Failed', icon: <FaTimesCircle className="text-danger" />, color: 'danger', progress: 0 },
    'canceled': { label: 'Failed', icon: <FaTimesCircle className="text-danger" />, color: 'danger', progress: 0 },
    
    // Fallback for unknown status
    'unknown': { label: 'Unknown', icon: <FaExclamationTriangle className="text-secondary" />, color: 'secondary', progress: 0 }
  };

  // Enhanced status determination with comprehensive debugging
  const getCurrentStatus = () => {
    if (!currentOrder) {
      console.warn('❌ No currentOrder found');
      return statusConfig['unknown'];
    }
    
    const rawStatus = currentOrder.status;
    console.log('🔍 Raw status from API:', rawStatus, typeof rawStatus);
    
    if (!rawStatus) {
      console.warn('❌ No status found in order data');
      return statusConfig['unknown'];
    }
    
    // Convert to string and normalize
    const statusString = String(rawStatus).trim();
    const normalizedStatus = statusString.toLowerCase();
    
    console.log('🔄 Normalized status:', normalizedStatus);
    
    // Find matching status
    const matchedStatus = Object.keys(statusConfig).find(key => 
      key.toLowerCase() === normalizedStatus
    );
    
    if (matchedStatus) {
      console.log('✅ Matched status:', matchedStatus, statusConfig[matchedStatus]);
      return statusConfig[matchedStatus];
    }
    
    // Try partial matching for more flexibility
    const partialMatch = Object.keys(statusConfig).find(key => 
      normalizedStatus.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedStatus)
    );
    
    if (partialMatch) {
      console.log('🔍 Partial match found:', partialMatch, statusConfig[partialMatch]);
      return statusConfig[partialMatch];
    }
    
    console.warn('❌ No status match found for:', normalizedStatus);
    console.log('📋 Available status keys:', Object.keys(statusConfig));
    return statusConfig['unknown'];
  };

  const currentStatus = getCurrentStatus();

  // Enhanced progress tracking with step indicators
  const renderProgressSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: <FaClipboardCheck size={14} /> },
      { status: 'processing', label: 'Processing', icon: <FaSpinner size={14} /> },
      { status: 'shipped', label: 'Shipped', icon: <FaShippingFast size={14} /> },
      { status: 'delivered', label: 'Delivered', icon: <FaCheckCircle size={14} /> }
    ];

    const getStepCompletion = (stepIndex) => {
      const statusProgress = {
        'pending': [true, false, false, false],
        'processing': [true, true, false, false],
        'shipped': [true, true, true, false],
        'complete': [true, true, true, true],
        'delivered': [true, true, true, true]
      };
      
      const currentStatusKey = Object.keys(statusConfig).find(key => 
        statusConfig[key] === currentStatus
      );
      
      const progressMap = statusProgress[currentStatusKey?.toLowerCase()] || [false, false, false, false];
      return progressMap[stepIndex] || false;
    };

    return (
      <div className="progress-steps mt-4">
        <div className="d-flex justify-content-between position-relative">
          {/* Progress line */}
          <div 
            className="progress-line position-absolute"
            style={{
              top: '15px',
              left: '30px',
              right: '30px',
              height: '3px',
              backgroundColor: '#e9ecef',
              zIndex: 1
            }}
          ></div>
          <div 
            className="progress-line-active position-absolute"
            style={{
              top: '15px',
              left: '30px',
              width: `${currentStatus.progress}%`,
              height: '3px',
              backgroundColor: `var(--bs-${currentStatus.color})`,
              zIndex: 2,
              transition: 'width 0.5s ease'
            }}
          ></div>
          
          {steps.map((step, index) => {
            const completed = getStepCompletion(index);
            return (
              <div key={step.status} className="text-center position-relative" style={{ zIndex: 3 }}>
                <div 
                  className={`step-icon rounded-circle d-inline-flex align-items-center justify-content-center ${
                    completed ? 'bg-success' : 'bg-secondary'
                  }`}
                  style={{
                    width: '30px',
                    height: '30px',
                    color: 'white'
                  }}
                >
                  {step.icon}
                </div>
                <div className="mt-2">
                  <small className="d-block fw-medium">{step.label}</small>
                  <small className={`text-${completed ? 'success' : 'muted'}`}>
                    {completed ? '✓' : '○'}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Enhanced debugging effect
  useEffect(() => {
    if (currentOrder) {
      console.group('🔍 ORDER TRACKING DEBUG INFO');
      console.log('📦 Full order data:', currentOrder);
      console.log('🏷️ Raw status:', currentOrder.status, typeof currentOrder.status);
      console.log('🔄 Current status config:', currentStatus);
      console.log('📊 Status progress:', currentStatus.progress + '%');
      console.groupEnd();
    }
  }, [currentOrder, currentStatus]);

  // Safe date formatting with multiple fallbacks
  const formatDateSafe = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      let date = parseISO(dateString);
      
      if (!isValid(date)) {
        date = new Date(dateString);
      }
      
      if (!isValid(date)) {
        return 'Date not available';
      }
      
      return format(date, 'MMMM do, yyyy - h:mm a');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date not available';
    }
  };

  const formatPrice = (price) => {
    const num = typeof price === 'string' 
      ? parseFloat(price.replace(/[^0-9.-]/g, '')) 
      : Number(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const calculateOrderTotals = (order) => {
    if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };
    
    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item?.price) || 0;
      const quantity = parseInt(item?.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    
    const tax = parseFloat(order?.tax) || 0;
    const shipping = parseFloat(order?.shipping_cost) || 0;
    const total = parseFloat(order?.total) || subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
  };

  const { subtotal, tax, shipping, total } = calculateOrderTotals(currentOrder);

  const formatPaymentMethod = (method) => {
    if (!method) return 'Not specified';
    
    const methods = {
      'credit': 'Credit/Debit Card',
      'paypal': 'PayPal',
      'cod': 'Cash on Delivery',
      'stripe': 'Stripe',
      'bank': 'Bank Transfer'
    };
    
    return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') {
      return (
        <div className="text-muted">
          <FaExclamationTriangle className="me-1" />
          Address not available
        </div>
      );
    }
    
    return (
      <address className="mb-0">
        {address.street && <>{address.street}<br /></>}
        {address.street2 && <>{address.street2}<br /></>}
        {address.city && <>{address.city}, {address.state} {address.zip_code}<br /></>}
        {address.country && <>{address.country}</>}
      </address>
    );
  };

  // Action buttons based on status
  const renderActionButtons = () => {
    const status = currentOrder?.status?.toUpperCase();
    
    switch (status) {
      case 'P':
      case 'PENDING':
        return (
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-dark">
              Contact Support
            </button>
            <button className="btn btn-outline-danger">
              Cancel Order
            </button>
          </div>
        );
      case 'C':
      case 'COMPLETE':
      case 'COMPLETED':
      case 'DELIVERED':
        return (
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-success">
              Download Invoice
            </button>
            <button className="btn btn-outline-dark">
              Buy Again
            </button>
            <button className="btn btn-outline-primary">
              Leave Review
            </button>
          </div>
        );
      case 'F':
      case 'FAILED':
      case 'CANCELLED':
        return (
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary">
              Try Again
            </button>
            <button className="btn btn-outline-dark">
              Contact Support
            </button>
          </div>
        );
      default:
        return (
          <div className="alert alert-warning mt-3">
            <small>Unknown order status. Please contact support.</small>
          </div>
        );
    }
  };

  if (!token) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <FaSpinner className="fa-spin fs-1 my-5" />
        <p className="fs-5">Loading order details...</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="container py-5 text-center">
        <FaTimesCircle className="fs-1 text-danger my-5" />
        <p className="fs-5">Order not found</p>
        <button 
          onClick={() => navigate('/orders')}
          className="btn btn-outline-dark"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  const createdDate = formatDateSafe(currentOrder.created);
  const updatedDate = formatDateSafe(currentOrder.updated);

  return (
    <div className="container py-5">
      {/* Enhanced Debugging output - remove in production */}
      {/* {process.env.NODE_ENV === 'development' && currentOrder && (
        <div className="alert alert-info small">
          <strong>🔍 Debug Info:</strong><br />
          <strong>Raw Status:</strong> "{currentOrder.status}" (type: {typeof currentOrder.status})<br />
          <strong>Normalized:</strong> "{String(currentOrder.status).toLowerCase()}"<br />
          <strong>Matched Config:</strong> {currentStatus.label} ({currentStatus.progress}%)<br />
          <strong>Order ID:</strong> {currentOrder.id}
        </div>
      )} */}
      
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
            {/* Order Header */}
            <div className="card-header bg-dark text-white py-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h4 mb-0">
                  Order #{currentOrder.order_number || currentOrder.id.slice(0, 8).toUpperCase()}
                </h2>
                <span className={`badge bg-${currentStatus.color} fs-6 p-2`}>
                  {currentStatus.icon} {currentStatus.label}
                </span>
              </div>
              <p className="mb-1 text-light">Placed on {createdDate}</p>
              {currentOrder.updated && currentOrder.updated !== currentOrder.created && (
                <small className="text-light opacity-75">Last updated: {updatedDate}</small>
              )}
            </div>
            
            {/* Order Progress */}
            <div className="p-4 border-bottom">
              <div className="progress mb-3" style={{ height: '8px' }}>
                <div 
                  className={`progress-bar bg-${currentStatus.color}`} 
                  role="progressbar" 
                  style={{ width: `${currentStatus.progress}%` }}
                  aria-valuenow={currentStatus.progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              
              {renderProgressSteps()}
              
              <div className={`alert alert-${currentStatus.color} mt-4 mb-0`}>
                <div className="d-flex align-items-center">
                  {currentStatus.icon}
                  <div className="ms-3">
                    <strong className="d-block">{currentStatus.label}</strong>
                    <span>{currentStatus.description}</span>
                  </div>
                </div>
              </div>

              {renderActionButtons()}
            </div>
            
            {/* Rest of the component remains the same */}
            {/* Order Items */}
            <div className="p-4 border-bottom">
              <h3 className="h5 mb-3 d-flex align-items-center">
                <FaBoxOpen className="me-2" /> Items in this order
              </h3>
              {currentOrder.items?.length > 0 ? (
                <div className="row g-3">
                  {currentOrder.items.map((item, index) => {
                    const itemPrice = formatPrice(item.price);
                    const itemTotal = formatPrice(item.price * (item.quantity || 1));
                    
                    return (
                      <motion.div 
                        key={index}
                        className="col-12"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="card border-0 shadow-sm">
                          <div className="row g-0">
                            <div className="col-md-2 p-3">
                              <img 
                                src={item.product?.thumbnail_image || '/placeholder-product.jpg'} 
                                alt={item.product?.name || 'Product'} 
                                className="img-fluid rounded-3"
                                style={{ maxHeight: '100px', objectFit: 'contain' }}
                                onError={(e) => {
                                  e.target.src = '/placeholder-product.jpg';
                                }}
                              />
                            </div>
                            <div className="col-md-6">
                              <div className="card-body">
                                <h4 className="h6 mb-1">{item.product?.name || 'Product'}</h4>
                                <p className="text-muted small mb-1">SKU: {item.product?.sku || 'N/A'}</p>
                                <p className="text-muted small mb-0">Qty: {item.quantity || 1}</p>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="card-body text-end">
                                <p className="mb-0 fw-bold">${itemTotal}</p>
                                <small className="text-muted">${itemPrice} each</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-3">
                  <FaBoxOpen className="fs-1 text-muted mb-2" />
                  <p className="text-muted">No items found in this order</p>
                </div>
              )}
            </div>
            
            {/* Shipping and Payment Info */}
            <div className="p-4 border-bottom">
              <div className="row">
                <div className="col-md-6 mb-4 mb-md-0">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-light">
                      <h4 className="h6 mb-0 d-flex align-items-center">
                        <FaMapMarkerAlt className="me-2" /> Shipping Information
                      </h4>
                    </div>
                    <div className="card-body">
                      <h5 className="h6">Shipping Address</h5>
                      {formatAddress(currentOrder.shipping_address)}
                      
                      <h5 className="h6 mt-3">Shipping Method</h5>
                      <p className="text-muted">
                        <FaTruck className="me-2" />
                        {currentOrder.shipping_method === 'express' ? 
                          'Express Shipping' : 'Standard Shipping'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-light">
                      <h4 className="h6 mb-0 d-flex align-items-center">
                        <FaCreditCard className="me-2" /> Payment Information
                      </h4>
                    </div>
                    <div className="card-body">
                      <h5 className="h6">Payment Method</h5>
                      <p className="text-muted mb-4">
                        {formatPaymentMethod(currentOrder.payment_method)}
                        <span className={`badge ms-2 bg-${currentOrder.paid ? 'success' : 'danger'}`}>
                          {currentOrder.paid ? 'Paid' : 'Not Paid'}
                        </span>
                      </p>
                      
                      <h5 className="h6">Billing Address</h5>
                      {currentOrder.same_billing_address ? (
                        <p className="text-muted">
                          <em>Same as shipping address</em>
                        </p>
                      ) : (
                        formatAddress(currentOrder.billing_address)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="p-4">
              <div className="row justify-content-end">
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light">
                      <h4 className="h6 mb-0 d-flex align-items-center">
                        <FaMoneyBillWave className="me-2" /> Order Summary
                      </h4>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <th>Subtotal:</th>
                              <td className="text-end">${formatPrice(subtotal)}</td>
                            </tr>
                            <tr>
                              <th>Shipping:</th>
                              <td className="text-end">${formatPrice(shipping)}</td>
                            </tr>
                            <tr>
                              <th>Tax:</th>
                              <td className="text-end">${formatPrice(tax)}</td>
                            </tr>
                            <tr className="fw-bold fs-5">
                              <th>Total:</th>
                              <td className="text-end">${formatPrice(total)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Back Button */}
          <div className="text-center mt-4">
            <button 
              onClick={() => navigate('/orders')}
              className="btn btn-outline-dark d-flex align-items-center mx-auto"
            >
              <FaArrowLeft className="me-2" /> Back to My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;