import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createOrder, clearCart } from "../redux/reducer/orderSlice";
import { Footer, Navbar } from "../components";
// Add this with your other imports
import { fetchCart } from '../redux/reducer/cartSlice';
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheck, 
  FaCreditCard, 
  FaTruck, 
  FaMapMarkerAlt, 
  FaMoneyBillWave,
  FaPaypal,
  FaRegCreditCard
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Checkout = () => {
  // State initialization
  const cartItems = useSelector((state) => state.cart?.items || []);
  const authState = useSelector((state) => state.auth || {});
  const orderState = useSelector((state) => state.order || {});
  
  const token = authState.token || null;
  const user = authState.user || null;
  const orderLoading = orderState.loading || false;
  const orderError = orderState.error || null;
  const currentOrder = orderState.currentOrder || null;

  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState({
    type: "credit",
    details: {}
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    address2: "",
    city: "",
    country: "India",
    state: "",
    zip: "",
    sameBillingAddress: true,
    billingAddress: "",
    billingAddress2: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "India",
    saveAddress: true,
    saveBillingAddress: false,
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    orderNotes: ""
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fixed input handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateAndFormatPrice = (price, productId) => {
    if (price === undefined || price === null) {
      throw new Error(`Price is missing for product ${productId}`);
    }
    
    const priceString = typeof price === 'number' ? price.toString() : price;
    const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
    
    if (cleanedPrice === '') {
      throw new Error(`Price is empty for product ${productId}`);
    }
    
    if ((cleanedPrice.match(/\./g) || []).length > 1) {
      throw new Error(`Invalid price format (multiple decimals) for product ${productId}`);
    }

    const num = parseFloat(cleanedPrice);
    
    if (isNaN(num)) {
      throw new Error(`Invalid price format for product ${productId}: ${price}`);
    }
    
    if (num < 0) {
      throw new Error(`Negative price not allowed for product ${productId}`);
    }
    
    return num.toFixed(2);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    return parts.length ? parts.join(' ') : value;
  };

  const handleCardNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: formatCardNumber(value) 
    }));
  };

  const calculateTotals = () => {
    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const productId = item.id || item.product?.id || item.product_details?.id || 'unknown';
        const price = item.product_details?.current_price || 
                     item.product?.price || 
                     item.price;
        
        const validatedPrice = validateAndFormatPrice(price, productId);
        const quantity = item.quantity || 1;
        
        return sum + (parseFloat(validatedPrice) * quantity);
      }, 0);
      
      const shippingCost = shippingMethod === "express" ? 30 : 0;
      const total = subtotal + shippingCost;
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      
      return { 
        subtotal: parseFloat(subtotal.toFixed(2)), 
        shippingCost: parseFloat(shippingCost.toFixed(2)), 
        total: parseFloat(total.toFixed(2)), 
        totalItems 
      };
    } catch (error) {
      console.error('Error calculating totals:', error);
      toast.error('Error calculating order totals. Please check your cart items.');
      return { subtotal: 0, shippingCost: 0, total: 0, totalItems: 0 };
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const validateForm = (step) => {
    switch(step) {
      case 1: // Address
        if (!formData.firstName || !formData.lastName || !formData.email) {
          return false;
        }
        if (!formData.address || !formData.city || !formData.state || !formData.zip) {
          return false;
        }
        if (!formData.sameBillingAddress) {
          if (!formData.billingAddress || !formData.billingCity || 
              !formData.billingState || !formData.billingZip) {
            return false;
          }
        }
        return true;
      case 3: // Payment
        if (paymentMethod.type === 'paypal') return true;
        return formData.cardName && formData.cardNumber && 
               formData.cardExpiry && formData.cardCvv;
      default:
        return true;
    }
  };

  const AddressStep = () => (
    <div className="card-body">
      <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
        <div className="row g-3">
          <div className="col-sm-6 my-1">
            <label htmlFor="firstName" className="form-label">First name</label>
            <input
              type="text"
              className="form-control"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="col-sm-6 my-1">
            <label htmlFor="lastName" className="form-label">Last name</label>
            <input
              type="text"
              className="form-control"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="col-12 my-1">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="col-12 my-1">
            <label htmlFor="address" className="form-label">Address</label>
            <input
              type="text"
              className="form-control"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="1234 Main St"
              required
            />
          </div>

          <div className="col-12">
            <label htmlFor="address2" className="form-label">
              Address 2 <span className="text-muted">(Optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="address2"
              name="address2"
              value={formData.address2}
              onChange={handleInputChange}
              placeholder="Apartment or suite"
            />
          </div>

          <div className="col-md-4 my-1">
            <label htmlFor="city" className="form-label">City</label>
            <input
              type="text"
              className="form-control"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="col-md-4 my-1">
            <label htmlFor="country" className="form-label">Country</label>
            <select
              className="form-select"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
            >
              <option value="India">India</option>
              <option value="USA">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>

          <div className="col-md-4 my-1">
            <label htmlFor="state" className="form-label">State</label>
            <select
              className="form-select"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose...</option>
              <option value="Punjab">Punjab</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          <div className="col-md-6 my-1">
            <label htmlFor="zip" className="form-label">Zip</label>
            <input
              type="text"
              className="form-control"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="col-12 my-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="sameBillingAddress"
                name="sameBillingAddress"
                checked={formData.sameBillingAddress}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="sameBillingAddress">
                Billing address is the same as shipping address
              </label>
            </div>
          </div>

          {!formData.sameBillingAddress && (
            <>
              <h5 className="mt-4">Billing Address</h5>
              <div className="col-12 my-1">
                <label htmlFor="billingAddress" className="form-label">Billing Address</label>
                <input
                  type="text"
                  className="form-control"
                  id="billingAddress"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  required={!formData.sameBillingAddress}
                />
              </div>

              <div className="col-12">
                <label htmlFor="billingAddress2" className="form-label">
                  Billing Address 2 <span className="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="billingAddress2"
                  name="billingAddress2"
                  value={formData.billingAddress2}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4 my-1">
                <label htmlFor="billingCity" className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  id="billingCity"
                  name="billingCity"
                  value={formData.billingCity}
                  onChange={handleInputChange}
                  required={!formData.sameBillingAddress}
                />
              </div>

              <div className="col-md-4 my-1">
                <label htmlFor="billingCountry" className="form-label">Country</label>
                <select
                  className="form-select"
                  id="billingCountry"
                  name="billingCountry"
                  value={formData.billingCountry}
                  onChange={handleInputChange}
                  required={!formData.sameBillingAddress}
                >
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>

              <div className="col-md-4 my-1">
                <label htmlFor="billingState" className="form-label">State</label>
                <select
                  className="form-select"
                  id="billingState"
                  name="billingState"
                  value={formData.billingState}
                  onChange={handleInputChange}
                  required={!formData.sameBillingAddress}
                >
                  <option value="">Choose...</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>

              <div className="col-md-6 my-1">
                <label htmlFor="billingZip" className="form-label">Zip</label>
                <input
                  type="text"
                  className="form-control"
                  id="billingZip"
                  name="billingZip"
                  value={formData.billingZip}
                  onChange={handleInputChange}
                  required={!formData.sameBillingAddress}
                />
              </div>
            </>
          )}

          <div className="col-12 my-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="saveAddress"
                name="saveAddress"
                checked={formData.saveAddress}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="saveAddress">
                Save shipping address for future use
              </label>
            </div>
          </div>

          {!formData.sameBillingAddress && (
            <div className="col-12 my-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="saveBillingAddress"
                  name="saveBillingAddress"
                  checked={formData.saveBillingAddress}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="saveBillingAddress">
                  Save billing address for future use
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4">
          <Link to="/cart" className="btn btn-outline-dark">
            <FaArrowLeft className="me-2" /> Back to Cart
          </Link>
          <button 
            type="submit" 
            className="btn btn-dark"
            disabled={!validateForm(1)}
          >
            Continue to Shipping <FaArrowRight className="ms-2" />
          </button>
        </div>
      </form>
    </div>
  );

  const ShippingStep = () => {
    const { shippingCost } = calculateTotals();
    
    return (
      <div className="card-body">
        <h4 className="mb-3">Shipping Method</h4>
        <div className="my-3">
          <div className="form-check">
            <input
              id="standardShipping"
              name="shippingMethod"
              type="radio"
              className="form-check-input"
              checked={shippingMethod === "standard"}
              onChange={() => setShippingMethod("standard")}
            />
            <label className="form-check-label" htmlFor="standardShipping">
              Standard Shipping (Free) - 3-5 business days
            </label>
          </div>
          <div className="form-check">
            <input
              id="expressShipping"
              name="shippingMethod"
              type="radio"
              className="form-check-input"
              checked={shippingMethod === "express"}
              onChange={() => setShippingMethod("express")}
            />
            <label className="form-check-label" htmlFor="expressShipping">
              Express Shipping (${shippingCost.toFixed(2)}) - 1-2 business days
            </label>
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button onClick={prevStep} className="btn btn-outline-dark">
            <FaArrowLeft className="me-2" /> Back to Address
          </button>
          <button 
            onClick={nextStep} 
            className="btn btn-dark"
            disabled={!shippingMethod}
          >
            Continue to Payment <FaArrowRight className="ms-2" />
          </button>
        </div>
      </div>
    );
  };

  const PaymentStep = () => (
    <div className="card-body">
      <h4 className="mb-3">Payment Method</h4>
      
      <div className="my-3">
        <div className="form-check">
          <input
            id="credit"
            name="paymentMethod"
            type="radio"
            className="form-check-input"
            checked={paymentMethod.type === "credit"}
            onChange={() => setPaymentMethod({ type: "credit", details: {} })}
            required
          />
          <label className="form-check-label d-flex align-items-center" htmlFor="credit">
            <FaRegCreditCard className="me-2" /> Credit Card
          </label>
        </div>
        <div className="form-check">
          <input
            id="debit"
            name="paymentMethod"
            type="radio"
            className="form-check-input"
            checked={paymentMethod.type === "debit"}
            onChange={() => setPaymentMethod({ type: "debit", details: {} })}
          />
          <label className="form-check-label d-flex align-items-center" htmlFor="debit">
            <FaRegCreditCard className="me-2" /> Debit Card
          </label>
        </div>
        <div className="form-check">
          <input
            id="paypal"
            name="paymentMethod"
            type="radio"
            className="form-check-input"
            checked={paymentMethod.type === "paypal"}
            onChange={() => setPaymentMethod({ type: "paypal", details: {} })}
          />
          <label className="form-check-label d-flex align-items-center" htmlFor="paypal">
            <FaPaypal className="me-2" /> PayPal
          </label>
        </div>
      </div>

      {paymentMethod.type !== "paypal" && (
        <>
          <div className="row gy-3 mt-3">
            <div className="col-md-6">
              <label htmlFor="cardName" className="form-label">Name on card</label>
              <input
                type="text"
                className="form-control"
                id="cardName"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                required={paymentMethod.type !== "paypal"}
              />
              <small className="text-muted">Full name as displayed on card</small>
            </div>

            <div className="col-md-6">
              <label htmlFor="cardNumber" className="form-label">Card number</label>
              <input
                type="text"
                className="form-control"
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleCardNumberChange}
                required={paymentMethod.type !== "paypal"}
                maxLength="19"
                placeholder="0000 0000 0000 0000"
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="cardExpiry" className="form-label">Expiration</label>
              <input
                type="text"
                className="form-control"
                id="cardExpiry"
                name="cardExpiry"
                value={formData.cardExpiry}
                onChange={handleInputChange}
                placeholder="MM/YY"
                required={paymentMethod.type !== "paypal"}
                maxLength="5"
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="cardCvv" className="form-label">CVV</label>
              <input
                type="text"
                className="form-control"
                id="cardCvv"
                name="cardCvv"
                value={formData.cardCvv}
                onChange={handleInputChange}
                required={paymentMethod.type !== "paypal"}
                maxLength="4"
                placeholder="123"
              />
            </div>
          </div>
        </>
      )}

      <div className="col-12 my-3">
        <label htmlFor="orderNotes" className="form-label">Order Notes (Optional)</label>
        <textarea
          className="form-control"
          id="orderNotes"
          name="orderNotes"
          value={formData.orderNotes}
          onChange={handleInputChange}
          rows="3"
          placeholder="Special instructions, delivery notes, etc."
        ></textarea>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button onClick={prevStep} className="btn btn-outline-dark">
          <FaArrowLeft className="me-2" /> Back to Shipping
        </button>
        <button 
          onClick={nextStep} 
          className="btn btn-dark"
          disabled={!validateForm(3)}
        >
          Review Order <FaArrowRight className="ms-2" />
        </button>
      </div>
    </div>
  );

  const ReviewStep = () => {
    const { subtotal, shippingCost, total, totalItems } = calculateTotals();
    
    return (
      <div className="card-body">
        <h4 className="mb-3">Review Your Order</h4>
        
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header bg-light d-flex align-items-center">
                <FaMapMarkerAlt className="me-2" />
                <h5 className="mb-0">Shipping Address</h5>
              </div>
              <div className="card-body">
                <p>
                  {formData.firstName} {formData.lastName}<br />
                  {formData.address}<br />
                  {formData.address2 && <>{formData.address2}<br /></>}
                  {formData.city}, {formData.state} {formData.zip}<br />
                  {formData.country}
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header bg-light d-flex align-items-center">
                <FaTruck className="me-2" />
                <h5 className="mb-0">Shipping Method</h5>
              </div>
              <div className="card-body">
                <p>
                  {shippingMethod === "standard" 
                    ? "Standard Shipping (Free)" 
                    : `Express Shipping ($${shippingCost.toFixed(2)})`}
                </p>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header bg-light d-flex align-items-center">
                <FaCreditCard className="me-2" />
                <h5 className="mb-0">Payment Method</h5>
              </div>
              <div className="card-body">
                <p>
                  {paymentMethod.type === "credit" && "Credit Card"}
                  {paymentMethod.type === "debit" && "Debit Card"}
                  {paymentMethod.type === "paypal" && "PayPal"}
                  {paymentMethod.type !== "paypal" && formData.cardNumber && (
                    <>
                      <br />**** **** **** {formData.cardNumber.slice(-4)}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-light">
            <h5>Order Summary</h5>
          </div>
          <div className="card-body">
            <ul className="list-group list-group-flush">
              {cartItems.map(item => {
                const product = item.product_details || item.product || item;
                const price = product.current_price || product.price;
                return (
                  <li key={item.id} className="list-group-item d-flex justify-content-between">
                    <div>
                      {product.name} <small className="text-muted">x{item.quantity}</small>
                    </div>
                    <div>${(price * item.quantity).toFixed(2)}</div>
                  </li>
                );
              })}
              <li className="list-group-item d-flex justify-content-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </li>
            </ul>
          </div>
        </div>

        {formData.orderNotes && (
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h5>Order Notes</h5>
            </div>
            <div className="card-body">
              <p>{formData.orderNotes}</p>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between">
          <button onClick={prevStep} className="btn btn-outline-dark">
            <FaArrowLeft className="me-2" /> Back to Payment
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn btn-success"
            disabled={orderLoading}
          >
            {orderLoading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : (
              <FaCheck className="me-2" />
            )}
            Place Order
          </button>
        </div>
      </div>
    );
  };

  const ConfirmationStep = () => {
    const orderNumber = currentOrder?.order_number || Math.floor(Math.random() * 1000000);
    const estimatedDelivery = currentOrder?.estimated_delivery || 
                            new Date(Date.now() + (shippingMethod === "express" ? 2 : 5) * 24 * 60 * 60 * 1000);
    
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12 py-5 text-center">
            <div className="card border-success mb-3">
              <div className="card-header bg-success text-white">
                <h3 className="mb-0">Order Confirmed!</h3>
              </div>
              <div className="card-body">
                <div className="text-success mb-4" style={{ fontSize: "5rem" }}>
                  <FaCheck className="fa-check-circle" />
                </div>
                <h4 className="card-title">Thank you for your order!</h4>
                <p className="card-text">
                  Your order number is <strong>#{orderNumber}</strong>
                </p>
                <p>We've sent a confirmation email to <strong>{formData.email}</strong></p>
                <p>Estimated delivery: <strong>{new Date(estimatedDelivery).toLocaleDateString()}</strong></p>
                
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <Link to="/" className="btn btn-primary">
                    Continue Shopping
                  </Link>
                  {currentOrder?.id && (
                    <Link to={`/orders/${currentOrder.id}`} className="btn btn-outline-primary">
                      View Order Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show loading state
    toast.loading('Processing your order...', { id: 'order-submission' });
    
    try {
      console.log('Starting order submission...');
      console.log('Cart items:', JSON.parse(JSON.stringify(cartItems)));
    
      const { subtotal, shippingCost, total } = calculateTotals();
      
      // Prepare order items with stock validation
      const orderItems = cartItems.map((item, index) => {
        try {
          const productId = item.product_details?.id || item.product?.id || item.id;
          if (!productId) {
            throw new Error(`Missing product ID in cart item at position ${index}`);
          }
  
          const price = item.product_details?.current_price || 
                       item.product_details?.price ||
                       item.product?.price || 
                       item.price;
          
          if (price === undefined && price !== 0) {
            throw new Error(`Missing price for product ${productId}`);
          }
  
          const quantity = item.quantity || 1;
          
          return {
            product: productId,
            quantity: quantity,
            price: validateAndFormatPrice(price, productId)
          };
        } catch (itemError) {
          console.error(`Error processing cart item ${index}:`, {
            item: JSON.parse(JSON.stringify(item)),
            error: itemError
          });
          throw new Error(`Item ${index + 1}: ${itemError.message}`);
        }
      });
  
      console.log('Processed order items:', orderItems);
  
      // Prepare order data
      const orderData = {
        shipping_address: {
          street: formData.address,
          street2: formData.address2 || "",
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip,
          country: formData.country,
          save: formData.saveAddress
        },
        billing_address: formData.sameBillingAddress ? null : {
          street: formData.billingAddress,
          street2: formData.billingAddress2 || "",
          city: formData.billingCity,
          state: formData.billingState,
          zip_code: formData.billingZip,
          country: formData.billingCountry,
          save: formData.saveBillingAddress
        },
        same_billing_address: formData.sameBillingAddress,
        payment_method: paymentMethod.type,
        shipping_method: shippingMethod,
        shipping_cost: validateAndFormatPrice(shippingCost, 'shipping'),
        subtotal: validateAndFormatPrice(subtotal, 'subtotal'),
        total: validateAndFormatPrice(total, 'total'),
        note: formData.orderNotes || "",
        items: orderItems
      };
  
      console.log("Submitting order with data:", orderData);
  
      // Submit order to backend
      const response = await dispatch(createOrder(orderData)).unwrap();
      
      if (response?.id) {
        console.log('Order created successfully:', response);
        
        // Clear cart after successful order
        await dispatch(clearCart());
        
        // Update toast to success
        toast.success('Order placed successfully!', { id: 'order-submission' });
        
        // Move to confirmation step
        nextStep();
      } else {
        throw new Error(response?.message || "Order creation failed - no ID returned");
      }
    } catch (error) {
      console.error('Full order submission error:', {
        error: error.toString(),
        stack: error.stack,
        cartItems: JSON.parse(JSON.stringify(cartItems)),
        formData: JSON.parse(JSON.stringify(formData)),
        paymentMethod: JSON.parse(JSON.stringify(paymentMethod)),
        shippingMethod
      });
      
      // Handle specific error cases
      let errorMessage = "Order failed. Please try again.";
      
      if (error.message.includes('Not enough stock')) {
        errorMessage = error.message;
        // Refresh cart to get latest stock quantities
        await dispatch(fetchCart());
      } else if (error.message.includes('validation')) {
        errorMessage = "Please check your order details and try again.";
      } else if (error.message.includes('authentication')) {
        errorMessage = "Please login to complete your order.";
        navigate('/login', { state: { from: '/checkout' } });
      }
  
      // Update toast to show error
      toast.error(errorMessage, { id: 'order-submission' });
    }
  };
  const EmptyCart = () => (
    <div className="container">
      <div className="row">
        <div className="col-md-12 py-5 bg-light text-center">
          <h4 className="p-3 display-5">No items in Cart</h4>
          <Link to="/" className="btn btn-outline-dark mx-4">
            <FaArrowLeft className="me-2" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (!token) {
      toast.error("Please login to proceed to checkout");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
  
    if (cartItems.length === 0 && step < 5) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }
  }, [token, cartItems.length, navigate, step]);
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || ""
      }));
    }
  }, [user]);
  
  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">Checkout</h1>
        <hr />
        {cartItems.length > 0 ? (
          <div className="container py-5">
            <div className="checkout-progress mb-5">
              <div className="steps">
                <div className={`step ${step >= 1 ? "active" : ""}`}>
                  <span>1</span> Address
                </div>
                <div className={`step ${step >= 2 ? "active" : ""}`}>
                  <span>2</span> Shipping
                </div>
                <div className={`step ${step >= 3 ? "active" : ""}`}>
                  <span>3</span> Payment
                </div>
                <div className={`step ${step >= 4 ? "active" : ""}`}>
                  <span>4</span> Review
                </div>
                <div className={`step ${step >= 5 ? "active" : ""}`}>
                  <span>5</span> Confirmation
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-5 col-lg-4 order-md-last mb-4">
                <div className="card sticky-top" style={{ top: "20px" }}>
                  <div className="card-header py-3 bg-light">
                    <h5 className="mb-0">Order Summary</h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 pb-0">
                        Products ({calculateTotals().totalItems})<span>${calculateTotals().subtotal.toFixed(2)}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        Shipping<span>${calculateTotals().shippingCost.toFixed(2)}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 mb-3">
                        <div><strong>Total amount</strong></div>
                        <span><strong>${calculateTotals().total.toFixed(2)}</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col-md-7 col-lg-8">
                <div className="card mb-4">
                  <div className="card-header py-3">
                    <h4 className="mb-0">
                      {step === 1 && "Billing Address"}
                      {step === 2 && "Shipping Method"}
                      {step === 3 && "Payment Method"}
                      {step === 4 && "Review Your Order"}
                      {step === 5 && "Order Confirmation"}
                    </h4>
                  </div>
                  
                  {step === 1 && <AddressStep />}
                  {step === 2 && <ShippingStep />}
                  {step === 3 && <PaymentStep />}
                  {step === 4 && <ReviewStep />}
                  {step === 5 && <ConfirmationStep />}
                </div>
              </div>
            </div>
          </div>
        ) : <EmptyCart />}
      </div>
      <Footer />
    </>
  );
};

export default Checkout;