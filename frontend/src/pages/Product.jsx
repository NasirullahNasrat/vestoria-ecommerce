import React, { useEffect, useState } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { Link, useParams, useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/reducer/cartSlice";
import { logout } from "../redux/reducer/authSlice";
import { Footer, Navbar } from "../components";
import ReviewSection from "../components/ReviewSection"; // Direct import
import toast from "react-hot-toast";
import { FaStar, FaArrowLeft } from "react-icons/fa";

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const addToCartHandler = async (product) => {
    try {
      if (!token) {
        toast.error('Please login to add items to cart');
        navigate('/login', { state: { from: `/product/${id}` } });
        return;
      }

      const productData = {
        id: product.id,
        name: product.name,
        price: product.current_price,
        image: product.thumbnail_image || 
              (product.images && product.images[0]?.image) || 
              'https://via.placeholder.com/300x300?text=No+Image',
        qty: 1,
        stock: product.stock
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath}`;
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/products/${id}/reviews/`
      );
      
      console.log("Reviews API response:", response.data);
      console.log("Type of response:", typeof response.data);
      console.log("Is array:", Array.isArray(response.data));
      
      // Set reviews based on actual response format
      if (Array.isArray(response.data)) {
        setReviews(response.data);
      } else if (response.data && response.data.results) {
        setReviews(response.data.results);
      } else if (response.data && response.data.reviews) {
        setReviews(response.data.reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setLoading2(true);
        setError(null);
        
        const response = await axios.get(`http://localhost:8000/api/products/id/${id}/`);
        setProduct(response.data);
        
        // Fetch reviews after product data is loaded
        await fetchReviews();
        
        if (response.data.category?.id) {
          const similarResponse = await axios.get(
            `http://localhost:8000/api/products/?category=${response.data.category.id}`
          );
          const filtered = similarResponse.data.results?.filter(
            item => item.id.toString() !== id.toString()
          ) || [];
          setSimilarProducts(filtered);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
        setLoading2(false);
      }
    };

    fetchProduct();
  }, [id]);

  const Loading = () => (
    <div className="container my-5 py-2">
      <div className="row">
        <div className="col-md-6 py-3">
          <Skeleton height={400} />
        </div>
        <div className="col-md-6 py-5">
          <Skeleton height={30} width={250} />
          <Skeleton height={90} />
          <Skeleton height={40} width={70} />
          <Skeleton height={50} width={110} />
          <Skeleton height={120} />
          <div className="d-flex">
            <Skeleton height={40} width={110} />
            <Skeleton height={40} width={110} className="ms-3" />
          </div>
        </div>
      </div>
    </div>
  );

  const ProductImages = () => {
    if (!product) return null;
    
    // Combine thumbnail with other images if available
    const allImages = [
      product.thumbnail_image,
      ...(product.images?.map(img => img.image) || [])
    ].filter(Boolean); // Remove any undefined/null values

    const mainImage = allImages[selectedImageIndex] || 'https://via.placeholder.com/300x300?text=No+Image';

    return (
      <div className="product-images">
        <div className="main-image mb-4 text-center">
          <img
            src={getImageUrl(mainImage)}
            alt={product.name}
            className="img-fluid"
            style={{
              maxHeight: '400px',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
        </div>
        
        {allImages.length > 1 && (
          <div className="thumbnails d-flex flex-wrap justify-content-center">
            {allImages.map((img, index) => (
              <div 
                key={index}
                className={`thumbnail mx-2 mb-2 ${selectedImageIndex === index ? 'active border border-primary' : ''}`}
                onClick={() => setSelectedImageIndex(index)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '2px',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProductDetails = () => {
    if (!product) return null;
    
    // Use the average_rating from the product if available, otherwise calculate it
    const averageRating = product.avg_rating || 
      (product.reviews?.length > 0 
        ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
        : 0);
    
    const reviewCount = product.review_count || product.reviews?.length || 0;

    return (
      <div className="product-details">
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-outline-secondary mb-4"
        >
          <FaArrowLeft className="me-2" /> Back
        </button>
        
        <h4 className="text-muted">{product.category?.name || 'Uncategorized'}</h4>
        <h1 className="mb-3">{product.name}</h1>
        
        {averageRating > 0 ? (
          <div className="rating mb-3">
            <span className="badge bg-warning text-dark me-2">
              {averageRating} <FaStar className="d-inline" />
            </span>
            <small>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</small>
          </div>
        ) : (
          <div className="rating mb-3">
            <small className="text-muted">No reviews yet</small>
          </div>
        )}

        <div className="price mb-4">
          <h2 className="text-primary">
            ${product.current_price}
            {product.price > product.current_price && (
              <small className="text-muted text-decoration-line-through ms-2">
                ${product.price}
              </small>
            )}
          </h2>
          {product.price > product.current_price && (
            <span className="badge bg-success ms-2">
              Save ${(product.price - product.current_price).toFixed(2)}
            </span>
          )}
        </div>

        <p className="lead mb-4">{product.description}</p>

        <div className="availability mb-4">
          <span className="fw-bold">Status: </span>
          {product.stock > 0 ? (
            <span className="text-success">In Stock ({product.stock} available)</span>
          ) : (
            <span className="text-danger">Out of Stock</span>
          )}
        </div>

        <div className="actions">
          <button
            className="btn btn-primary btn-lg me-3"
            onClick={() => addToCartHandler(product)}
            disabled={product.stock <= 0}
          >
            {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <Link to="/cart" className="btn btn-outline-primary btn-lg">
            View Cart
          </Link>
        </div>
      </div>
    );
  };

  const SimilarProducts = () => {
    if (loading2) return (
      <div className="row">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-md-3 col-sm-6 mb-4">
            <div className="card h-100">
              <Skeleton height={200} />
              <div className="card-body">
                <Skeleton count={3} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );

    if (similarProducts.length === 0) return null;

    return (
      <div className="similar-products">
        <Marquee pauseOnHover pauseOnClick speed={50}>
          {similarProducts.map(item => (
            <div key={item.id} className="card mx-3" style={{ width: '18rem' }}>
              <img
                src={getImageUrl(item.thumbnail_image || (item.images?.[0]?.image))}
                className="card-img-top p-3"
                alt={item.name}
                style={{ height: '200px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                }}
              />
              <div className="card-body text-center">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">${item.current_price}</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => addToCartHandler(item)}
                  disabled={item.stock <= 0}
                >
                  {item.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        {error ? (
          <div className="alert alert-danger text-center">
            <h4>Oops! Something went wrong</h4>
            <p>{error}</p>
            <button 
              className="btn btn-primary me-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        ) : loading ? (
          <Loading />
        ) : (
          <>
            <div className="row">
              <div className="col-md-6">
                <ProductImages />
              </div>
              <div className="col-md-6">
                <ProductDetails />
              </div>
            </div>

            {/* Review Section */}
            <ReviewSection 
              productId={id} 
              reviews={reviews} 
              onReviewAdded={fetchReviews}
              loading={reviewsLoading}
            />

            {similarProducts.length > 0 && (
              <div className="mt-5 pt-5">
                <h2 className="text-center mb-4">You May Also Like</h2>
                <SimilarProducts />
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Product;