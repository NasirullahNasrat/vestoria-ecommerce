// src/pages/OrderConfirmation.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const OrderConfirmation = () => {
  return (
    <div className="container my-5">
      <h2>Order Confirmation</h2>
      <div className="alert alert-success">
        Your order has been placed successfully!
      </div>
      <div className="mt-4">
        <Link to="/orders" className="btn btn-primary">
          View Your Orders
        </Link>
        <Link to="/" className="btn btn-outline-secondary ms-2">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;