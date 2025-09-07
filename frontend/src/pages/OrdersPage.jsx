import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchOrders, 
  clearOrderError 
} from '../redux/reducer/orderSlice';
import { 
  FaSpinner, 
  FaBoxOpen, 
  FaSearch, 
  FaArrowRight,
  FaExclamationTriangle
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const OrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { orders: ordersData = [], loading, error } = useSelector(state => state.order);
  const { token } = useSelector(state => state.auth);

  // Memoized normalized orders data
  const orders = useMemo(() => {
    return Array.isArray(ordersData) 
      ? ordersData.map(order => ({
          ...order,
          created: order.created || order.created_at,
          items: Array.isArray(order.items) ? order.items : [],
          status: order.status?.toLowerCase() || 'unknown'
        }))
      : [];
  }, [ordersData]);

  
  // Fetch orders on mount and when token changes
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    const fetchData = async () => {
      await dispatch(fetchOrders());
    };
    
    fetchData();
    
    return () => {
      dispatch(clearOrderError());
    };
  }, [dispatch, token, navigate]);

  // Display error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(
        typeof error === 'string' 
          ? error 
          : 'Failed to load orders',
        { id: 'order-fetch-error' }
      );
    }
  }, [error]);

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
    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item?.price) || 0;
      const quantity = parseInt(item?.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    const tax = subtotal * 0.1;
    const shipping = 5.99;
    return (subtotal + tax + shipping).toFixed(2);
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      return format(parseISO(dateString), 'MMMM do, yyyy - h:mm a');
    } catch {
      return 'Date not available';
    }
  };

  if (!token) {
    return null;
  }

  if (loading && orders.length === 0) {
    return (
      <>
        <Navbar />
        <LoadingSpinner 
          message="Loading your orders..."
          fullHeight
        />
      </>
    );
  }

  if (error && orders.length === 0) {
    return (
      <>
        <Navbar />
        <ErrorAlert 
          message={typeof error === 'string' ? error : 'Failed to load orders'}
          retry={() => dispatch(fetchOrders())}
          fullHeight
        />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row mb-4 align-items-center">
          <div className="col-md-8">
            <h1 className="h3 mb-0">My Orders</h1>
            {orders.length > 0 && (
              <p className="text-muted small mb-0">
                Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="col-md-4">
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search orders..." 
                disabled={orders.length === 0}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                disabled={orders.length === 0}
              >
                <FaSearch />
              </button>
            </div>
          </div>
        </div>
        
        {orders.length === 0 ? (
          <EmptyState
            icon={<FaBoxOpen className="text-muted" size={48} />}
            title="No orders found"
            subtitle="You haven't placed any orders yet."
            action={
              <button 
                onClick={() => navigate('/products')} 
                className="btn btn-primary mt-3"
              >
                Start Shopping
              </button>
            }
          />
        ) : (
          <div className="list-group">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                className="list-group-item list-group-item-action p-4 mb-3 rounded-3 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h3 className="h5 mb-0">
                      Order #{order.order_number || order.id.slice(0, 8)}
                    </h3>
                    <p className="text-muted small mb-0">
                      Placed on {formatOrderDate(order.created)}
                    </p>
                  </div>
                  <span 
                    className={`badge bg-${getStatusColor(order.status)} px-3 py-2`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <p className="mb-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-muted small mb-0">
                      Total: ${calculateOrderTotal(order.items)}
                    </p>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-primary d-flex align-items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}`);
                    }}
                  >
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