import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaShoppingCart, 
  FaUserPlus, 
  FaSignInAlt, 
  FaHome, 
  FaBoxOpen, 
  FaInfoCircle, 
  FaEnvelope, 
  FaTimes, 
  FaBars,
  FaUserCircle,
  FaSignOutAlt,
  FaHistory,
  FaStore,
  FaUserCog,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { logout } from '../redux/reducer/authSlice';
import { clearCart } from '../redux/reducer/cartSlice';
import toast from 'react-hot-toast';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get state from Redux
    const cartItems = useSelector(state => 
        Array.isArray(state.cart?.items) ? state.cart.items : []
    );
    const { user, token } = useSelector(state => state.auth || {});
    const isAuthenticated = !!token;
    
    // Local state
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    // Calculate cart items count
    const cartItemCount = cartItems.reduce(
        (total, item) => total + (item.quantity || item.qty || 0),
        0
    );

    // Close mobile menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Add scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await Promise.all([
                dispatch(logout()),
                dispatch(clearCart())
            ]);
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout. Please try again.');
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Animation variants
    const navItemVariants = {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95 }
    };

    const cartBadgeVariants = {
        initial: { scale: 1 },
        pulse: {
            scale: [1, 1.2, 1],
            transition: {
                duration: 0.5,
                repeat: cartItemCount > 0 ? Infinity : 0,
                repeatDelay: 2
            }
        }
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className={`navbar navbar-expand-lg navbar-dark py-3 sticky-top shadow-sm ${scrolled ? 'bg-dark scrolled' : 'bg-dark'}`}>
            <div className="container">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <NavLink 
                        className="navbar-brand fw-bold fs-4 px-2 d-flex align-items-center" 
                        to="/"
                    >
                        <span className="text-gradient">Vestoria</span>
                    </NavLink>
                </motion.div>

                <button 
                    className="navbar-toggler border-0" 
                    type="button" 
                    onClick={toggleMenu}
                    aria-label="Toggle navigation"
                    aria-expanded={isOpen}
                >
                    {isOpen ? (
                        <FaTimes className="fs-4" />
                    ) : (
                        <FaBars className="fs-4" />
                    )}
                </button>

                <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                        {[
                            { path: "/", icon: <FaHome />, text: "Home" },
                            { path: "/products", icon: <FaBoxOpen />, text: "Products" },
                            { path: "/about", icon: <FaInfoCircle />, text: "About" },
                            { path: "/contact", icon: <FaEnvelope />, text: "Contact" }
                        ].map((link) => (
                            <motion.li 
                                key={link.path} 
                                className="nav-item mx-1"
                                variants={navItemVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <NavLink 
                                    className={({ isActive }) => 
                                        `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
                                    }
                                    to={link.path}
                                >
                                    <span className="me-1">{link.icon}</span> {link.text}
                                </NavLink>
                            </motion.li>
                        ))}
                    </ul>
                    
                    <div className="d-flex flex-column flex-lg-row align-items-center">
                        {isAuthenticated ? (
                            <>
                                <div className="dropdown me-3 mb-2 mb-lg-0">
                                    <button 
                                        className="btn btn-outline-light dropdown-toggle d-flex align-items-center" 
                                        type="button"
                                        id="userDropdown"
                                        onClick={toggleDropdown}
                                        aria-expanded={dropdownOpen}
                                    >
                                        <FaUserCircle className="me-1" /> 
                                        <span className="d-none d-lg-inline">
                                            {user?.username || 'Account'}
                                        </span>
                                    </button>
                                    <ul 
                                        className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}
                                        aria-labelledby="userDropdown"
                                    >
                                        <li>
                                            <NavLink 
                                                className="dropdown-item d-flex align-items-center" 
                                                to="/profile"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <FaUserCog className="me-2" /> Profile
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink 
                                                className="dropdown-item d-flex align-items-center" 
                                                to="/orders"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <FaHistory className="me-2" /> My Orders
                                            </NavLink>
                                        </li>
                                        <li>
                                            {/* <NavLink 
                                                className="dropdown-item d-flex align-items-center" 
                                                to="/order-tracking"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <FaMapMarkerAlt className="me-2" /> Track Order
                                            </NavLink> */}
                                        </li>
                                        {user?.is_vendor && (
                                            <li>
                                                <NavLink 
                                                    className="dropdown-item d-flex align-items-center" 
                                                    to="/vendor-dashboard"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <FaStore className="me-2" /> Vendor Dashboard
                                                </NavLink>
                                            </li>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button 
                                                className="dropdown-item d-flex align-items-center" 
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                            >
                                                <FaSignOutAlt className="me-2" /> Logout
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <>
                                <motion.div 
                                    variants={navItemVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="me-2 mb-2 mb-lg-0"
                                >
                                    <NavLink 
                                        to="/login" 
                                        className="btn btn-outline-light d-flex align-items-center"
                                    >
                                        <FaSignInAlt className="me-1" /> 
                                        <span className="d-none d-lg-inline">Login</span>
                                    </NavLink>
                                </motion.div>
                                <motion.div 
                                    variants={navItemVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="me-2 mb-2 mb-lg-0"
                                >
                                    <NavLink 
                                        to="/register" 
                                        className="btn btn-outline-light d-flex align-items-center"
                                    >
                                        <FaUserPlus className="me-1" /> 
                                        <span className="d-none d-lg-inline">Register</span>
                                    </NavLink>
                                </motion.div>
                            </>
                        )}
                        {/* Cart button */}
                        <motion.div 
                            variants={navItemVariants}
                            whileHover="hover"
                            whileTap="tap"
                        >
                            <NavLink 
                                to="/cart" 
                                className="btn btn-primary position-relative d-flex align-items-center"
                            >
                                <FaShoppingCart className="me-1" /> 
                                <span className="d-none d-lg-inline">Cart</span>
                                {cartItemCount > 0 && (
                                    <motion.span 
                                        className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle"
                                        variants={cartBadgeVariants}
                                        animate={cartItemCount > 0 ? "pulse" : "initial"}
                                        initial="initial"
                                    >
                                        {cartItemCount}
                                    </motion.span>
                                )}
                            </NavLink>
                        </motion.div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;