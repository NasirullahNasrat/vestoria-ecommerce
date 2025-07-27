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
  FaArrowLeft
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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
  
  const statusConfig = {
    'P': {
      label: 'Pending',
      icon: <FaSpinner className="text-warning" />,
      color: 'warning',
      progress: 25
    },
    'C': {
      label: 'Complete',
      icon: <FaCheckCircle className="text-success" />,
      color: 'success',
      progress: 100
    },
    'F': {
      label: 'Failed',
      icon: <FaTimesCircle className="text-danger" />,
      color: 'danger',
      progress: 0
    }
  };
  
  const currentStatus = statusConfig[currentOrder.status] || statusConfig.P;
  const createdDate = format(new Date(currentOrder.created), 'MMMM do, yyyy - h:mm a');
  const updatedDate = format(new Date(currentOrder.updated), 'MMMM do, yyyy - h:mm a');
  
  // Calculate order totals
  const items = Array.isArray(currentOrder.items) ? currentOrder.items : [];
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);
  
  const tax = parseFloat(currentOrder.tax) || 0;
  const shipping = parseFloat(currentOrder.shipping_cost) || 0;
  const total = parseFloat(currentOrder.total) || subtotal + tax + shipping;
  
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
            <div className="card-header bg-dark text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Order #{currentOrder.order_number}</h2>
                <span className={`badge bg-${currentStatus.color} fs-6`}>
                  {currentStatus.icon} {currentStatus.label}
                </span>
              </div>
              <p className="mb-0 text-muted">Placed on {createdDate}</p>
              {currentOrder.updated !== currentOrder.created && (
                <small className="text-muted">Last updated: {updatedDate}</small>
              )}
            </div>
            
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
                <small className="text-muted">Completed</small>
              </div>
            </div>
            
            <div className="p-4 border-bottom">
              <h3 className="h6 mb-3">Items in this order</h3>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <motion.div 
                    key={index}
                    className="row g-3 mb-3 align-items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="col-md-2">
                      <img 
                        src={item.product?.thumbnail_image || '/placeholder-product.jpg'} 
                        alt={item.product?.name || 'Product'} 
                        className="img-fluid rounded-3"
                      />
                    </div>
                    <div className="col-md-6">
                      <h4 className="h6 mb-1">{item.product?.name || 'Product'}</h4>
                      <p className="text-muted small mb-1">SKU: {item.product?.sku || 'N/A'}</p>
                      <p className="text-muted small mb-0">Qty: {item.quantity || 1}</p>
                    </div>
                    <div className="col-md-4 text-end">
                      <p className="mb-0 fw-bold">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                      <small className="text-muted">${(item.price || 0).toFixed(2)} each</small>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-3">
                  <FaBoxOpen className="fs-1 text-muted mb-2" />
                  <p className="text-muted">No items found in this order</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-bottom">
              <h3 className="h6 mb-3">Order Summary</h3>
              <div className="row">
                <div className="col-md-6">
                  <h4 className="h6">Shipping Address</h4>
                  <address className="text-muted">
                    {currentOrder.shipping_address?.user?.get_full_name() || 'Not specified'}<br />
                    {currentOrder.shipping_address?.street || ''}<br />
                    {currentOrder.shipping_address?.city || ''}, {currentOrder.shipping_address?.state || ''}<br />
                    {currentOrder.shipping_address?.zip_code || ''}<br />
                    {currentOrder.shipping_address?.country || ''}
                  </address>
                </div>
                <div className="col-md-6">
                  <h4 className="h6">Payment Method</h4>
                  <p className="text-muted">
                    <FaCreditCard className="me-2" />
                    {currentOrder.payment_method || 'Not specified'}
                  </p>
                  <p className="text-muted">
                    Status: {currentOrder.paid ? 'Paid' : 'Not Paid'}
                  </p>
                  <h4 className="h6">Billing Address</h4>
                  <address className="text-muted">
                    {currentOrder.billing_address?.user?.get_full_name() || currentOrder.shipping_address?.user?.get_full_name() || 'Not specified'}<br />
                    {currentOrder.billing_address?.street || currentOrder.shipping_address?.street || ''}<br />
                    {currentOrder.billing_address?.city || currentOrder.shipping_address?.city || ''}, {currentOrder.billing_address?.state || currentOrder.shipping_address?.state || ''}<br />
                    {currentOrder.billing_address?.zip_code || currentOrder.shipping_address?.zip_code || ''}<br />
                    {currentOrder.billing_address?.country || currentOrder.shipping_address?.country || ''}
                  </address>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="row justify-content-end">
                <div className="col-md-6">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th>Subtotal:</th>
                          <td className="text-end">${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Tax:</th>
                          <td className="text-end">${tax.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Shipping:</th>
                          <td className="text-end">${shipping.toFixed(2)}</td>
                        </tr>
                        <tr className="fw-bold">
                          <th>Total:</th>
                          <td className="text-end">${total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
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