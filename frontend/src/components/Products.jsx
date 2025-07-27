import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/reducer/cartSlice";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaStar, FaShoppingCart, FaEye, FaSearch } from "react-icons/fa";
import './Product.css';
import { logout } from "../redux/reducer/authSlice";

const Products = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
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
      
      // Handle Django validation errors
      if (error?.product) {
        toast.error(error.product[0]); // Show the first validation error
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
        const response = await fetch("http://localhost:8000/api/products/");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
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
    return `http://localhost:8000${imagePath}`;
  };

  const filteredProducts = data.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    if (filteredProducts.length === 0 && !loading) {
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
            <p className="text-muted">Try adjusting your search or check back later</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="row">
        {filteredProducts.map((product) => {
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
                </div>
                <div className="card-footer bg-transparent border-top-0">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => addProduct(product)}
                  >
                    Add to Cart
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
        
        <div className="search-container mx-auto" style={{ maxWidth: '500px' }}>
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
      </div>
      
      {loading ? <Loading /> : <ShowProducts />}
    </div>
  );
};

export default Products;