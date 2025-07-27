import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../redux/reducer/orderSlice";
import { 
  fetchCart, 
  removeFromCart, 
  updateCartItem,
  clearCart
} from "../redux/reducer/cartSlice";
import { logout } from "../redux/reducer/authSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FaTrash, FaMinus, FaPlus, FaShoppingBag } from "react-icons/fa";

const Cart = () => {
    const cartState = useSelector((state) => ({
        items: Array.isArray(state.cart?.items) ? state.cart.items : [],
        loading: state.cart?.loading || false,
        error: state.cart?.error || null,
    }));
    
    const { items: cartItems, loading, error } = cartState;
    const { token, user } = useSelector((state) => state.auth || {});
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/300x300?text=No+Image';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        return `http://localhost:8000${imagePath}`;
    };

    const getProductData = (item) => {
        const product = item?.product_details || item?.product || item;
        
        console.log("Product Data:", product);

        if (!product?.id) {
            console.error("Invalid product structure detected:", item);
            return {
                id: 'unknown',
                name: 'Unknown Product',
                price: 0,
                image: getImageUrl(null),
                qty: Number(item?.quantity || item?.qty || 1),
                stock: 0
            };
        }

        return {
            id: product.id,
            name: product?.name || 'Unnamed Product',
            price: Number(product?.current_price || product?.price || 0),
            image: getImageUrl(product.images?.[0]?.image || product.thumbnail_image),
            qty: Number(item?.quantity || item?.qty || 1),
            stock: product?.stock || 0
        };
    };

    useEffect(() => {
        if (!token) {
            toast.error('Please login to view your cart');
            navigate('/login');
            return;
        }

        dispatch(fetchCart())
            .catch(error => {
                const errorMessage = error?.message || error.toString();
                if (errorMessage.includes('expired') || errorMessage.includes('Authentication')) {
                    toast.error('Session expired. Please login again.');
                    dispatch(logout());
                    navigate('/login');
                } else {
                    toast.error(errorMessage);
                }
            });
    }, [token, dispatch, navigate]);

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        
        const item = cartItems.find(item => item.id === itemId);
        if (!item) return;
        
        const product = getProductData(item);
        
        if (product.stock > 0 && newQuantity > product.stock) {
            toast.error(`Only ${product.stock} items available in stock`);
            return;
        }

        try {
            setIsLoading(true);
            const response = await dispatch(updateCartItem({ 
                id: itemId,
                qty: newQuantity
            })).unwrap();
            
            if (response.success) {
                toast.success("Quantity updated successfully");
                dispatch(fetchCart());
            } else {
                throw new Error(response.message || "Update failed");
            }
        } catch (error) {
            console.error('Update error:', error);
            const errorMessage = error?.message || error.toString();
            toast.error(errorMessage.includes('product') ? 
                errorMessage : "Failed to update quantity");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRemoveFromCart = async (itemId) => {
        try {
            setIsLoading(true);
            await dispatch(removeFromCart(itemId)).unwrap();
            toast.success("Item removed from cart");
            dispatch(fetchCart());
        } catch (error) {
            const errorMessage = error?.message || error.toString();
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!Array.isArray(cartItems)) return "0.00";
        
        return cartItems.reduce((total, item) => {
            const product = getProductData(item);
            return total + (product.price * product.qty);
        }, 0).toFixed(2);
    };

    const validateCartBeforeCheckout = () => {
        if (!Array.isArray(cartItems)) return false;
        if (cartItems.length === 0) return false;
        
        return cartItems.every(item => {
            const product = getProductData(item);
            if (!product.id || product.id === 'unknown') {
                console.warn("Invalid item found:", item);
                return false;
            }
            return (
                product.qty > 0 &&
                !isNaN(product.price) &&
                product.price > 0
            );
        });
    };

    const handleProceedToCheckout = () => {
        if (!token) {
            toast.error("Please login to proceed to checkout");
            navigate("/login", { state: { from: "/cart" } });
            return;
        }

        if (!validateCartBeforeCheckout()) {
            toast.error("Your cart contains invalid items");
            return;
        }

        navigate("/checkout");
    };

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return (
            <div className="cart-empty">
                <Navbar />
                <div className="container py-5 text-center">
                    <div className="empty-cart-message">
                        <img
                            src="https://cdni.iconscout.com/illustration/free/thumb/free-empty-cart-4085814-3385483.png"
                            alt="Empty Cart"
                            className="img-fluid"
                            style={{ maxWidth: "400px" }}
                        />
                        <h2 className="mt-4">Your cart is empty</h2>
                        <p className="text-muted mb-4">
                            Looks like you haven't added anything to your cart yet
                        </p>
                        <Link to="/products" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const canCheckout = validateCartBeforeCheckout();

    return (
        <div className="cart-page">
            <Navbar />
            <div className="container py-5">
                <h1 className="mb-4">Your Shopping Cart</h1>
                <div className="row">
                    <div className="col-lg-8">
                        <div className="cart-items">
                            {cartItems.map((item) => {
                                try {
                                    const product = getProductData(item);
                                    const cartItemId = item.id;
                                    
                                    return (
                                        <div key={cartItemId} className="cart-item card mb-3">
                                            <div className="row g-0">
                                                <div className="col-md-3">
                                                    <img
                                                        src={product.image}
                                                        className="img-fluid rounded-start"
                                                        alt={product.name}
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-md-9">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between">
                                                            <h5 className="card-title">{product.name}</h5>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleRemoveFromCart(cartItemId)}
                                                                disabled={isLoading}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                        <p className="card-text">${product.price.toFixed(2)}</p>
                                                        {product.stock > 0 && (
                                                            <p className={`stock-status ${product.stock < 5 ? 'text-warning' : 'text-success'}`}>
                                                                {product.stock < 5 
                                                                    ? `Only ${product.stock} left in stock` 
                                                                    : 'In stock'}
                                                            </p>
                                                        )}
                                                        <div className="quantity-control d-flex align-items-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => handleQuantityChange(cartItemId, product.qty - 1)}
                                                                disabled={product.qty <= 1 || isLoading}
                                                            >
                                                                <FaMinus />
                                                            </button>
                                                            <span className="quantity mx-2">{product.qty}</span>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => handleQuantityChange(cartItemId, product.qty + 1)}
                                                                disabled={(product.stock > 0 && product.qty >= product.stock) || isLoading}
                                                            >
                                                                <FaPlus />
                                                            </button>
                                                        </div>
                                                        <p className="item-total mt-2">
                                                            Total: <strong>${(product.price * product.qty).toFixed(2)}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (error) {
                                    console.error('Error rendering cart item:', error);
                                    return null;
                                }
                            })}
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="cart-summary card sticky-top">
                            <div className="card-body">
                                <h5 className="card-title">Order Summary</h5>
                                <div className="summary-row d-flex justify-content-between">
                                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + getProductData(item).qty, 0)} items)</span>
                                    <span>${calculateTotal()}</span>
                                </div>
                                <div className="summary-row d-flex justify-content-between">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <hr />
                                <div className="summary-row total d-flex justify-content-between fw-bold">
                                    <span>Total</span>
                                    <span>${calculateTotal()}</span>
                                </div>
                                <button
                                    className="btn btn-primary w-100 mt-3"
                                    onClick={handleProceedToCheckout}
                                    disabled={loading || isLoading || !canCheckout}
                                >
                                    {loading || isLoading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <FaShoppingBag className="me-2" />
                                    )}
                                    Proceed to Checkout
                                </button>
                                <Link to="/products" className="btn btn-outline-secondary w-100 mt-2">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;