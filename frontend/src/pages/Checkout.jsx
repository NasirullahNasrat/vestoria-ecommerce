import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder, clearOrderError, resetOrderState } from '../redux/reducer/orderSlice';
import { clearCart, resetCartError } from '../redux/reducer/cartSlice';
import { formatCurrency } from './formatCurrency';
import './Checkout.css';
import { Footer, Navbar } from "../components";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get state from Redux
  const { items } = useSelector((state) => state.cart);
  const { loading, error, checkoutStatus, currentOrder } = useSelector((state) => state.order);
  const { user, token } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    shipping_first_name: user?.first_name || '',
    shipping_last_name: user?.last_name || '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
    billing_first_name: user?.first_name || '',
    billing_last_name: user?.last_name || '',
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_country: 'US',
    use_shipping_for_billing: true,
    payment_method: 'credit_card',
    card_number: '',
    card_expiry: '',
    card_cvc: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Debug cart items
  useEffect(() => {
    console.log('Current cart items:', items);
  }, [items]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Shipping address validation
    if (!formData.shipping_first_name.trim()) {
      errors.shipping_first_name = 'First name is required';
    }
    if (!formData.shipping_last_name.trim()) {
      errors.shipping_last_name = 'Last name is required';
    }
    if (!formData.shipping_address.trim()) {
      errors.shipping_address = 'Address is required';
    }
    if (!formData.shipping_city.trim()) {
      errors.shipping_city = 'City is required';
    }
    if (!formData.shipping_state.trim()) {
      errors.shipping_state = 'State is required';
    }
    if (!formData.shipping_zip.trim()) {
      errors.shipping_zip = 'ZIP code is required';
    }
    if (!formData.shipping_country.trim()) {
      errors.shipping_country = 'Country is required';
    }

    // Billing address validation if not using shipping address
    if (!formData.use_shipping_for_billing) {
      if (!formData.billing_first_name.trim()) {
        errors.billing_first_name = 'First name is required';
      }
      if (!formData.billing_last_name.trim()) {
        errors.billing_last_name = 'Last name is required';
      }
      if (!formData.billing_address.trim()) {
        errors.billing_address = 'Address is required';
      }
      if (!formData.billing_city.trim()) {
        errors.billing_city = 'City is required';
      }
      if (!formData.billing_state.trim()) {
        errors.billing_state = 'State is required';
      }
      if (!formData.billing_zip.trim()) {
        errors.billing_zip = 'ZIP code is required';
      }
      if (!formData.billing_country.trim()) {
        errors.billing_country = 'Country is required';
      }
    }

    // Payment validation
    if (formData.payment_method === 'credit_card') {
      if (!formData.card_number.trim() || formData.card_number.replace(/\s/g, '').length !== 16) {
        errors.card_number = 'Valid card number is required';
      }
      if (!formData.card_expiry.trim() || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(formData.card_expiry)) {
        errors.card_expiry = 'Valid expiry date (MM/YY) is required';
      }
      if (!formData.card_cvc.trim() || formData.card_cvc.length < 3) {
        errors.card_cvc = 'Valid CVC is required';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Show confirmation popup instead of submitting directly
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    setShowConfirmation(false);
    
    // Prepare order items in correct format for backend
    const orderItems = items.map(item => {
      const product = item.product_details || item.product || item;
      return {
        product_id: product.id,
        quantity: item.quantity || 1,
        price: product.current_price || product.price
      };
    });

    console.log('Prepared order items:', orderItems);

    const orderData = {
      shipping_address: {
        first_name: formData.shipping_first_name,
        last_name: formData.shipping_last_name,
        street: formData.shipping_address,
        city: formData.shipping_city,
        state: formData.shipping_state,
        zip_code: formData.shipping_zip,
        country: formData.shipping_country,
        address_type: 'S',
        default: true,
      },
      billing_address: formData.use_shipping_for_billing 
        ? {
            first_name: formData.shipping_first_name,
            last_name: formData.shipping_last_name,
            street: formData.shipping_address,
            city: formData.shipping_city,
            state: formData.shipping_state,
            zip_code: formData.shipping_zip,
            country: formData.shipping_country,
            address_type: 'B',
            default: true,
          }
        : {
            first_name: formData.billing_first_name,
            last_name: formData.billing_last_name,
            street: formData.billing_address,
            city: formData.billing_city,
            state: formData.billing_state,
            zip_code: formData.billing_zip,
            country: formData.billing_country,
            address_type: 'B',
            default: true,
          },
      payment_method: formData.payment_method,
      notes: formData.notes,
      items: orderItems
    };

    try {
      console.log('Submitting order with data:', orderData);
      
      const result = await dispatch(createOrder(orderData));
      
      if (createOrder.fulfilled.match(result)) {
        console.log('Order created successfully:', result.payload);
        await dispatch(clearCart());
        navigate(`/order-confirmation/${result.payload.id}`);
      } else if (createOrder.rejected.match(result)) {
        console.error('Order creation failed:', result.error);
      }
    } catch (error) {
      console.error('Error in order submission:', error);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const price = item.product_details?.current_price || item.product_details?.price || item.price;
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  useEffect(() => {
    return () => {
      dispatch(clearOrderError());
      dispatch(resetCartError());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(resetOrderState());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error('Order error:', error);
      dispatch(clearOrderError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (items.length === 0 && !loading && checkoutStatus !== 'success') {
      navigate('/cart');
    }
  }, [items, loading, checkoutStatus, navigate]);

  return (
    <>
      <Navbar />
      <div className="checkout-page-container">
        <div className="checkout-container">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Shipping Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="shipping_first_name">First Name</label>
                <input
                  type="text"
                  id="shipping_first_name"
                  name="shipping_first_name"
                  value={formData.shipping_first_name}
                  onChange={handleChange}
                  required
                  className={errors.shipping_first_name ? 'error' : ''}
                />
                {errors.shipping_first_name && <p className="error-message">{errors.shipping_first_name}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="shipping_last_name">Last Name</label>
                <input
                  type="text"
                  id="shipping_last_name"
                  name="shipping_last_name"
                  value={formData.shipping_last_name}
                  onChange={handleChange}
                  required
                  className={errors.shipping_last_name ? 'error' : ''}
                />
                {errors.shipping_last_name && <p className="error-message">{errors.shipping_last_name}</p>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="shipping_address">Address</label>
              <input
                type="text"
                id="shipping_address"
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                required
                className={errors.shipping_address ? 'error' : ''}
              />
              {errors.shipping_address && <p className="error-message">{errors.shipping_address}</p>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="shipping_city">City</label>
                <input
                  type="text"
                  id="shipping_city"
                  name="shipping_city"
                  value={formData.shipping_city}
                  onChange={handleChange}
                  required
                  className={errors.shipping_city ? 'error' : ''}
                />
                {errors.shipping_city && <p className="error-message">{errors.shipping_city}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="shipping_state">State/Province</label>
                <input
                  type="text"
                  id="shipping_state"
                  name="shipping_state"
                  value={formData.shipping_state}
                  onChange={handleChange}
                  required
                  className={errors.shipping_state ? 'error' : ''}
                />
                {errors.shipping_state && <p className="error-message">{errors.shipping_state}</p>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="shipping_zip">ZIP/Postal Code</label>
                <input
                  type="text"
                  id="shipping_zip"
                  name="shipping_zip"
                  value={formData.shipping_zip}
                  onChange={handleChange}
                  required
                  className={errors.shipping_zip ? 'error' : ''}
                />
                {errors.shipping_zip && <p className="error-message">{errors.shipping_zip}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="shipping_country">Country</label>
                <select
                  id="shipping_country"
                  name="shipping_country"
                  value={formData.shipping_country}
                  onChange={handleChange}
                  required
                  className={errors.shipping_country ? 'error' : ''}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                </select>
                {errors.shipping_country && <p className="error-message">{errors.shipping_country}</p>}
              </div>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="use_shipping_for_billing"
                  checked={formData.use_shipping_for_billing}
                  onChange={handleChange}
                />
                Use shipping address for billing
              </label>
            </div>
            
            {!formData.use_shipping_for_billing && (
              <>
                <h2>Billing Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billing_first_name">First Name</label>
                    <input
                      type="text"
                      id="billing_first_name"
                      name="billing_first_name"
                      value={formData.billing_first_name}
                      onChange={handleChange}
                      required
                      className={errors.billing_first_name ? 'error' : ''}
                    />
                    {errors.billing_first_name && <p className="error-message">{errors.billing_first_name}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="billing_last_name">Last Name</label>
                    <input
                      type="text"
                      id="billing_last_name"
                      name="billing_last_name"
                      value={formData.billing_last_name}
                      onChange={handleChange}
                      required
                      className={errors.billing_last_name ? 'error' : ''}
                    />
                    {errors.billing_last_name && <p className="error-message">{errors.billing_last_name}</p>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="billing_address">Address</label>
                  <input
                    type="text"
                    id="billing_address"
                    name="billing_address"
                    value={formData.billing_address}
                    onChange={handleChange}
                    required
                    className={errors.billing_address ? 'error' : ''}
                  />
                  {errors.billing_address && <p className="error-message">{errors.billing_address}</p>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billing_city">City</label>
                    <input
                      type="text"
                      id="billing_city"
                      name="billing_city"
                      value={formData.billing_city}
                      onChange={handleChange}
                      required
                      className={errors.billing_city ? 'error' : ''}
                    />
                    {errors.billing_city && <p className="error-message">{errors.billing_city}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="billing_state">State/Province</label>
                    <input
                      type="text"
                      id="billing_state"
                      name="billing_state"
                      value={formData.billing_state}
                      onChange={handleChange}
                      required
                      className={errors.billing_state ? 'error' : ''}
                    />
                    {errors.billing_state && <p className="error-message">{errors.billing_state}</p>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="billing_zip">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="billing_zip"
                      name="billing_zip"
                      value={formData.billing_zip}
                      onChange={handleChange}
                      required
                      className={errors.billing_zip ? 'error' : ''}
                    />
                    {errors.billing_zip && <p className="error-message">{errors.billing_zip}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="billing_country">Country</label>
                    <select
                      id="billing_country"
                      name="billing_country"
                      value={formData.billing_country}
                      onChange={handleChange}
                      required
                      className={errors.billing_country ? 'error' : ''}
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                    </select>
                    {errors.billing_country && <p className="error-message">{errors.billing_country}</p>}
                  </div>
                </div>
              </>
            )}
            
            <h2>Payment Method</h2>
            
            <div className="form-group">
              <label htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            
            {formData.payment_method === 'credit_card' && (
              <>
                <div className="form-group">
                  <label htmlFor="card_number">Card Number</label>
                  <input
                    type="text"
                    id="card_number"
                    name="card_number"
                    value={formData.card_number}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    className={errors.card_number ? 'error' : ''}
                  />
                  {errors.card_number && <p className="error-message">{errors.card_number}</p>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="card_expiry">Expiry Date</label>
                    <input
                      type="text"
                      id="card_expiry"
                      name="card_expiry"
                      value={formData.card_expiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className={errors.card_expiry ? 'error' : ''}
                    />
                    {errors.card_expiry && <p className="error-message">{errors.card_expiry}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="card_cvc">CVC</label>
                    <input
                      type="text"
                      id="card_cvc"
                      name="card_cvc"
                      value={formData.card_cvc}
                      onChange={handleChange}
                      placeholder="123"
                      className={errors.card_cvc ? 'error' : ''}
                    />
                    {errors.card_cvc && <p className="error-message">{errors.card_cvc}</p>}
                  </div>
                </div>
              </>
            )}
            
            <div className="form-group">
              <label htmlFor="notes">Order Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>
            
            <button 
              type="submit" 
              className="checkout-button"
              disabled={loading || items.length === 0}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
          
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            {items.length === 0 ? (
              <p className="empty-cart-message">Your cart is empty</p>
            ) : (
              <>
                {items.map((item) => {
                  const product = item.product_details || item.product || item;
                  const price = product.current_price || product.price;
                  const quantity = item.quantity || 1;
                  
                  return (
                    <div className="cart-item" key={item.id || product.id}>
                      <div className="cart-item-info">
                        <h4>{product.name}</h4>
                        <p>{quantity} × {formatCurrency(price)}</p>
                      </div>
                      <div className="cart-item-price">
                        {formatCurrency(price * quantity)}
                      </div>
                    </div>
                  );
                })}
                
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                
                <div className="total-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                
                <div className="total-row">
                  <span>Tax:</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <div className="total-row grand-total">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="confirmation-popup">
          <div className="confirmation-content">
            <h3>Confirm Your Order</h3>
            <p>Are you sure you want to place this order?</p>
            <p>Total: {formatCurrency(calculateTotal())}</p>
            
            <div className="confirmation-buttons">
              <button 
                type="button" 
                className="confirm-button"
                onClick={confirmOrder}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Yes, Place Order'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;