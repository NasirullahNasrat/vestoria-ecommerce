import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/reducer/cartSlice";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaStar, FaShoppingCart, FaEye, FaSearch, FaFilter, FaTimes } from "react-icons/fa";
import './Product.css';
import { logout } from "../redux/reducer/authSlice";
import { getApiUrl } from "../config/env";

const Products = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: '',
    inStock: false,
    featured: false
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  // Get unique categories from products
  const categories = [...new Set((data || []).map(product => product.category?.name).filter(Boolean))];
  
  const addProduct = async (product) => {
    try {
      if (!token) {
        toast.error('Please login to add items to cart');
        navigate('/login', { state: { from: '/products' } });
        return;
      }
  
      const productData = {
        id: product.id,
        name: product.name,
        price: product.current_price,
        image: product.images?.[0]?.image || 'https://via.placeholder.com/300x300?text=No+Image',
        qty: 1
      };
  
      const result = await dispatch(addToCart(productData)).unwrap();
      
      toast.success(`${product.name} added to cart!`, {
        icon: '🛒',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      
      if (error?.product) {
        toast.error(error.product[0]);
      } else {
        const errorMessage = typeof error === 'string' ? error 
                         : error?.message 
                         || error?.payload?.toString() 
                         || 'Failed to add to cart';
      
        if (typeof errorMessage === 'string' && 
            (/expired/i.test(errorMessage) || /authentication/i.test(errorMessage))) {
          toast.error('Session expired. Please login again.');
          dispatch(logout());
          navigate('/login');
        } else {
          toast.error(errorMessage.toString().substring(0, 100));
        }
      }
    }
  };

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use environment configuration for API URL
        const apiUrl = getApiUrl('/api/products/');
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Handle different API response structures
        const products = Array.isArray(responseData) ? responseData : 
                        responseData.results ? responseData.results : 
                        responseData.data ? responseData.data : 
                        responseData.products ? responseData.products : 
                        [];
        
        if (!Array.isArray(products)) {
          throw new Error("Invalid products data format");
        }
        
        setData(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  const Loading = () => {
    return (
      <div className="row">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div className="card h-100">
              <Skeleton height={200} />
              <div className="card-body">
                <Skeleton count={2} />
                <Skeleton width={100} />
              </div>
              <div className="card-footer">
                <Skeleton width={120} height={40} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Use environment configuration for image URLs
    const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: '',
    inStock: false,
    featured: false
    });
    setSearchTerm('');
  };

  const filteredProducts = (data || []).filter(product => {
    // Search filter
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = 
      !filters.category || 
      (product.category?.name === filters.category);
    
    // Price range filter - updated to use minPrice and maxPrice
    const matchesPrice = (
      (filters.minPrice === '' || product.current_price >= parseFloat(filters.minPrice)) &&
      (filters.maxPrice === '' || product.current_price <= parseFloat(filters.maxPrice))
    );
    
    // Rating filter
    const productRating = product.reviews?.length > 0 
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;
    const matchesRating = !filters.rating || productRating >= parseInt(filters.rating);
    
    // Stock filter
    const matchesStock = !filters.inStock || product.stock > 0;
    
    // Featured filter
    const matchesFeatured = !filters.featured || product.featured;
    
    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesRating &&
      matchesStock &&
      matchesFeatured
    );
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === 'price-low-high') {
      return a.current_price - b.current_price;
    } else if (filters.sortBy === 'price-high-low') {
      return b.current_price - a.current_price;
    } else if (filters.sortBy === 'rating') {
      const ratingA = a.reviews?.length > 0 
        ? a.reviews.reduce((sum, review) => sum + review.rating, 0) / a.reviews.length 
        : 0;
      const ratingB = b.reviews?.length > 0 
        ? b.reviews.reduce((sum, review) => sum + review.rating, 0) / b.reviews.length 
        : 0;
      return ratingB - ratingA;
    } else if (filters.sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });

  const ShowProducts = () => {
    if (error) {
      return (
        <div className="col-12 py-5 text-center">
          <div className="alert alert-danger">{error}</div>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      );
    }

    if (sortedProducts.length === 0 && !loading) {
      return (
        <div className="col-12 py-5 text-center">
          <div className="empty-state">
            <img 
              src="https://cdn.dribbble.com/users/204955/screenshots/4930541/media/e92b58e2f8f357e09022f7cf7e03e5b5.gif" 
              alt="No products found" 
              className="img-fluid mb-4"
              style={{ maxWidth: '300px' }}
            />
            <h4 className="mt-4">No products found</h4>
            <p className="text-muted">Try adjusting your filters or search term</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="row">
        {sortedProducts.map((product) => {
          const productImage = getImageUrl(product.images?.[0]?.image);
          const rating = product.reviews?.length > 0 
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : 0;

          return (
            <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
              <div className="card h-100 product-card">
                <div className="badge-container">
                  {product.discount_price && product.discount_price !== product.current_price && (
                    <span className="discount-badge">
                      {Math.round(((product.price - product.current_price) / product.price * 100))}% OFF
                    </span>
                  )}
                  {product.featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                  {product.stock <= 0 && (
                    <span className="out-of-stock-badge">Out of Stock</span>
                  )}
                </div>
                <div className="product-image-container">
                  <img
                    className="product-image"
                    src={productImage}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                  <div className="product-actions">
                    <button
                      className="btn btn-sm btn-dark action-btn"
                      onClick={() => addProduct(product)}
                      disabled={product.stock <= 0}
                    >
                      <FaShoppingCart />
                    </button>
                    <Link
                      to={`/product/${product.id}`}
                      className="btn btn-sm btn-dark action-btn"
                    >
                      <FaEye />
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="price-section">
                      <span className="current-price">${product.current_price}</span>
                      {product.discount_price && product.discount_price !== product.current_price && (
                        <span className="original-price">${product.price}</span>
                      )}
                    </div>
                    <div className="rating">
                      <FaStar className="text-warning" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                  {product.category?.name && (
                    <div className="product-category mb-2">
                      <span className="badge bg-secondary">{product.category.name}</span>
                    </div>
                  )}
                </div>
                <div className="card-footer bg-transparent border-top-0">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => addProduct(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3">Shop Our Collection</h1>
        <p className="lead text-muted mb-4">Discover quality products at unbeatable prices</p>
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="search-container" style={{ width: '400px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="d-flex">
            <div className="dropdown me-2">
              <button 
                className="btn btn-outline-secondary dropdown-toggle" 
                type="button" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" /> 
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            
            <div className="dropdown">
              <button 
                className="btn btn-outline-secondary dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Sort By
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className={`dropdown-item ${!filters.sortBy ? 'active' : ''}`}
                    onClick={() => setFilters({...filters, sortBy: ''})}
                  >
                    Default
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item ${filters.sortBy === 'price-low-high' ? 'active' : ''}`}
                    onClick={() => setFilters({...filters, sortBy: 'price-low-high'})}
                  >
                    Price: Low to High
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item ${filters.sortBy === 'price-high-low' ? 'active' : ''}`}
                    onClick={() => setFilters({...filters, sortBy: 'price-high-low'})}
                  >
                    Price: High to Low
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item ${filters.sortBy === 'rating' ? 'active' : ''}`}
                    onClick={() => setFilters({...filters, sortBy: 'rating'})}
                  >
                    Top Rated
                  </button>
                </li>
                <li>
                  <button 
                    className={`dropdown-item ${filters.sortBy === 'newest' ? 'active' : ''}`}
                    onClick={() => setFilters({...filters, sortBy: 'newest'})}
                  >
                    Newest Arrivals
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="filter-panel mb-4 p-3 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Filters</h5>
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={resetFilters}
              >
                <FaTimes className="me-1" /> Clear All
              </button>
            </div>
            
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3 mb-3">
                <label className="form-label">Price Range</label>
                <div className="row g-2">
                  <div className="col">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Min price"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      min="0"
                    />
                  </div>
                  <div className="col">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Max price"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      min={filters.minPrice || "0"}
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <label className="form-label">Minimum Rating</label>
                <select 
                  className="form-select"
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
              
              <div className="col-md-3 mb-3 d-flex align-items-end">
                <div className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="inStock"
                    name="inStock"
                    checked={filters.inStock}
                    onChange={handleFilterChange}
                  />
                  <label className="form-check-label" htmlFor="inStock">
                    In Stock Only
                  </label>
                </div>
                
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={filters.featured}
                    onChange={handleFilterChange}
                  />
                  <label className="form-check-label" htmlFor="featured">
                    Featured Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {loading ? <Loading /> : <ShowProducts />}
    </div>
  );
};

export default Products;