import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaEye, FaTimesCircle, FaCheckCircle, FaTruck } from 'react-icons/fa';
import { fetchOrders } from '../redux/reducer/orderSlice';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const OrderHistory = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { orders, loading, error } = useSelector(state => state.order);
    const { token } = useSelector(state => state.auth);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (token) {
            dispatch(fetchOrders());
        }
    }, [dispatch, token]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'P':
                return <Badge bg="warning" className="text-dark">Pending</Badge>;
            case 'C':
                return <Badge bg="success">Completed</Badge>;
            case 'F':
                return <Badge bg="danger">Failed</Badge>;
            default:
                return <Badge bg="secondary">Unknown</Badge>;
        }
    };

    const getPaymentStatus = (paid) => {
        return paid ? (
            <span className="text-success">
                <FaCheckCircle /> Paid
            </span>
        ) : (
            <span className="text-danger">
                <FaTimesCircle /> Unpaid
            </span>
        );
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const handleTrackOrder = (orderId) => {
        navigate(`/orders/track/${orderId}`);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="my-5">
                Error loading orders: {error}
            </Alert>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center my-5 py-5">
                <h4>No orders found</h4>
                <p>You haven't placed any orders yet.</p>
                <Button variant="primary" onClick={() => navigate('/product')}>
                    Shop Now
                </Button>
            </div>
        );
    }

    return (
        <div className="container my-5">
            <h2 className="mb-4">Order History</h2>
            
            <Table striped bordered hover responsive className="align-middle">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <React.Fragment key={order.id}>
                            <motion.tr 
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <td>{order.order_number}</td>
                                <td>{format(new Date(order.created), 'MMM dd, yyyy HH:mm')}</td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td>{getPaymentStatus(order.paid)}</td>
                                <td>${order.total.toFixed(2)}</td>
                                <td>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        onClick={() => toggleOrderDetails(order.id)}
                                        className="me-2"
                                    >
                                        <FaEye /> Details
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        onClick={() => handleTrackOrder(order.id)}
                                    >
                                        <FaTruck /> Track
                                    </Button>
                                </td>
                            </motion.tr>
                            
                            {expandedOrder === order.id && (
                                <tr>
                                    <td colSpan="6">
                                        <div className="p-3 bg-light rounded">
                                            <h5>Order Details</h5>
                                            <Table borderless size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Price</th>
                                                        <th>Quantity</th>
                                                        <th>Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.product?.name || 'Product not available'}</td>
                                                            <td>${item.price.toFixed(2)}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                            
                                            <div className="row mt-3">
                                                <div className="col-md-6">
                                                    <h6>Shipping Address</h6>
                                                    {order.shipping_address ? (
                                                        <address>
                                                            {order.shipping_address.street}<br />
                                                            {order.shipping_address.city}, {order.shipping_address.state}<br />
                                                            {order.shipping_address.zip_code}, {order.shipping_address.country}
                                                        </address>
                                                    ) : (
                                                        <p>No shipping address provided</p>
                                                    )}
                                                </div>
                                                <div className="col-md-6 text-md-end">
                                                    <div className="mb-2">
                                                        <strong>Subtotal:</strong> ${(order.total - order.shipping_cost - order.tax).toFixed(2)}
                                                    </div>
                                                    <div className="mb-2">
                                                        <strong>Shipping:</strong> ${order.shipping_cost.toFixed(2)}
                                                    </div>
                                                    <div className="mb-2">
                                                        <strong>Tax:</strong> ${order.tax.toFixed(2)}
                                                    </div>
                                                    <div className="mb-2">
                                                        <strong>Total:</strong> ${order.total.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default OrderHistory;