// src/pages/VendorDashboard.js
import React from 'react';

const VendorDashboard = () => {
  return (
    <div className="container my-5">
      <h2>Vendor Dashboard</h2>
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Products</h5>
              <p className="card-text">Manage your products</p>
              <a href="/vendor/products" className="btn btn-primary">
                View Products
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Orders</h5>
              <p className="card-text">View customer orders</p>
              <a href="/vendor/orders" className="btn btn-primary">
                View Orders
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Analytics</h5>
              <p className="card-text">View sales analytics</p>
              <a href="/vendor/analytics" className="btn btn-primary">
                View Analytics
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;