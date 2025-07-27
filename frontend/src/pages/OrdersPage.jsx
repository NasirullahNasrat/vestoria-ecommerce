import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders, clearOrderError } from '../redux/reducer/orderSlice';
import { FaSpinner, FaBoxOpen, FaSearch, FaArrowRight } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar'; // Import the Navbar component

const OrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { orders = [], loading, error } = useSelector(state => state.order);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchOrders());
  }, [dispatch, token, navigate]);
  
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
      <>
        <Navbar /> {/* Include Navbar even during loading */}
        <div className="container py-5 text-center">
          <FaSpinner className="fa-spin fs-1 my-5" />
          <p className="fs-5">Loading your orders...</p>
        </div>
      </>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const calculateOrderTotal = (items = []) => {
    const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const tax = subtotal * 0.1;
    const shipping = 5.99;
    return subtotal + tax + shipping;
  };

  return (
    <>
      <Navbar /> {/* Include Navbar at the top */}
      <div className="container py-5">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3 mb-0">My Orders</h1>
          </div>
          <div className="col-md-4">
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search orders..." 
              />
              <button className="btn btn-outline-secondary" type="button">
                <FaSearch />
              </button>
            </div>
          </div>
        </div>
        
        {!orders || orders.length === 0 ? (
          <div className="text-center py-5">
            <FaBoxOpen className="fs-1 text-muted mb-3" />
            <h3 className="h4">No orders found</h3>
            <p className="text-muted">You haven't placed any orders yet.</p>
            <button 
              onClick={() => navigate('/product')} 
              className="btn btn-primary"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="list-group">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                className="list-group-item list-group-item-action p-4 mb-3 rounded-3 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.005 }}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="h5 mb-0">Order #{order.id}</h3>
                  <span className={`badge bg-${getStatusColor(order.status)}`}>
                    {order.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <p className="text-muted small mb-2">
                  Placed on {order.created ? format(new Date(order.created), 'MMMM do, yyyy - h:mm a') : 'Date not available'}
                </p>
                <div className="d-flex justify-content-between">
                  <div>
                    <p className="mb-1">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-muted small mb-0">
                      Total: ${calculateOrderTotal(order.items).toFixed(2)}
                    </p>
                  </div>
                  <button className="btn btn-sm btn-outline-primary d-flex align-items-center">
                    View Details <FaArrowRight className="ms-2" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default OrdersPage;