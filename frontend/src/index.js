import React from "react";
import ReactDOM from "react-dom/client";
import "../node_modules/font-awesome/css/font-awesome.min.css";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import { Toaster } from "react-hot-toast";

import {
  Home,
  Product,
  Products,
  AboutPage,
  ContactPage,
  Cart,
  Login,
  Register,
  Checkout,
  PageNotFound,
  OrdersPage,
  OrderTracking,
  Profile,
  OrderConfirmation
} from "./pages";
import ScrollToTop from "./components/ScrollToTop";
import InitializeAuth from "./components/InitializeAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute"; // Add this import
import { Dashboard, AdminLogin } from "./admin";
import { UsersList, AdminProductsList, EditProduct, ProfilePage, AdminOrdersList, NotificationsPage, AdminProductAdd, CustomerDetails, OrderDetail } from "./admin";

// Admin layout wrapper
const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Outlet />
    </div>
  );
};

// Render application
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <InitializeAuth />
        <ScrollToTop>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderTracking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/product/*" element={<PageNotFound />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected admin routes - use AdminProtectedRoute */}
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users-list" element={<UsersList />} />
                <Route path="products-list" element={<AdminProductsList />} />
                <Route path="products/edit/:id" element={<EditProduct />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="orders-list" element={<AdminOrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="add-product" element={<AdminProductAdd />} />
              </Route>
            </Route>

            {/* Customer protected routes - use regular ProtectedRoute */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/user-profile" element={<Profile />} />
              <Route path="/user-orders" element={<OrdersPage />} />
              {/* Add other customer-only routes here */}
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </ScrollToTop>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);