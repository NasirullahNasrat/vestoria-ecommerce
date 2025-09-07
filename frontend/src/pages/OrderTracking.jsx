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
  FaExclamationTriangle
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

  // Enhanced status configuration
  const statusConfig = {
    'P': {
      label: 'Pending',
      icon: <FaSpinner className="text-warning" />,
      color: 'warning',
      progress: 25,
      description: 'Your order has been received and is being processed'
    },
    'C': {
      label: 'Complete',
      icon: <FaCheckCircle className="text-success" />,
      color: 'success',
      progress: 100,
      description: 'Your order has been successfully completed'
    },
    'F': {
      label: 'Failed',
      icon: <FaTimesCircle className="text-danger" />,
      color: 'danger',
      progress: 0,
      description: 'Your order could not be processed'
    },
    // Fallback for unknown status
    'unknown': {
      label: 'Unknown',
      icon: <FaExclamationTriangle className="text-secondary" />,
      color: 'secondary',
      progress: 0,
      description: 'Order status could not be determined'
    }
  };

  // Robust status determination with debugging
  const getCurrentStatus = () => {
    if (!currentOrder || !currentOrder.status) {
      console.warn('No order or status found, using unknown status');
      return statusConfig['unknown'];
    }
    
    // Normalize status to uppercase
    const statusKey = String(currentOrder.status).toUpperCase().trim();
    
    if (!statusConfig[statusKey]) {
      console.warn(`Unknown status received: "${currentOrder.status}", normalized to "${statusKey}"`);
    }
    
    return statusConfig[statusKey] || statusConfig['unknown'];
  };

  const currentStatus = getCurrentStatus();

  // Debugging output
  useEffect(() => {
    if (currentOrder) {
      console.group('Order Tracking Debug');
      console.log('Raw order data:', currentOrder);
      console.log('Status from API:', currentOrder.status);
      console.log('Normalized status:', String(currentOrder.status).toUpperCase().trim());
      console.log('Determined status:', currentStatus);
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
      <address>
        {address.street && <>{address.street}<br /></>}
        {address.street2 && <>{address.street2}<br /></>}
        {address.city && <>{address.city}, {address.state} {address.zip_code}<br /></>}
        {address.country && <>{address.country}</>}
      </address>
    );
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
      {/* Debugging output - remove in production */}
     
      
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
            {/* Order Header */}
            <div className="card-header bg-dark text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">
                  Order #{currentOrder.order_number || currentOrder.id.slice(0, 8).toUpperCase()}
                </h2>
                <span className={`badge bg-${currentStatus.color} fs-6`}>
                  {currentStatus.icon} {currentStatus.label}
                </span>
              </div>
              <p className="mb-0 text-muted">Placed on {createdDate}</p>
              {currentOrder.updated && currentOrder.updated !== currentOrder.created && (
                <small className="text-muted">Last updated: {updatedDate}</small>
              )}
            </div>
            
            {/* Order Progress */}
            <div className="p-4 border-bottom">
              <div className="progress" style={{ height: '10px' }}>
                <div 
                  className={`progress-bar bg-${currentStatus.color}`} 
                  role="progressbar" 
                  style={{ width: `${currentStatus.progress}%` }}
                ></div>
              </div>
              
              <div className="d-flex justify-content-between mt-2">
                <small className="text-muted">Order Placed</small>
                <small className="text-muted">Processing</small>
                <small className="text-muted">Shipped</small>
                <small className="text-muted">Delivered</small>
              </div>
              
              <div className={`alert alert-${currentStatus.color} mt-3 mb-0`}>
                <strong>{currentStatus.label}:</strong> {currentStatus.description}
              </div>
            </div>
            
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
                            <tr className="fw-bold">
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