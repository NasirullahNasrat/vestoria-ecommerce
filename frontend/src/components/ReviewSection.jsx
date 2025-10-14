// src/components/ReviewSection.jsx
import React, { useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getApiUrl } from "../config/env"; // Import the environment utility

const ReviewSection = ({ productId, reviews, onReviewAdded, loading }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, user } = useSelector((state) => state.auth);

  // Safely handle reviews data - ensure it's always an array
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  
  // Handle case where reviews might be in a results property (for paginated responses)
  const reviewsArray = safeReviews.results ? safeReviews.results : safeReviews;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Please login to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/products/${productId}/reviews/create/`);
      
      const response = await axios.post(
        apiUrl,
        { rating, title, content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setContent("");
      setShowReviewForm(false);
      
      // Notify parent component to refresh reviews
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      if (error.response?.data?.non_field_errors) {
        toast.error(error.response.data.non_field_errors[0]);
      } else if (error.response?.data) {
        // Handle field-specific errors
        const errorMessages = Object.values(error.response.data).flat();
        toast.error(errorMessages[0] || "Failed to submit review");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (ratingValue) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < ratingValue ? "text-warning" : "text-muted"}
        style={{ cursor: "pointer", fontSize: "1.5rem" }}
        onClick={() => setRating(index + 1)}
      />
    ));
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', 'month': 'long', 'day': 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="mt-5">
        <h3>Customer Reviews</h3>
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0">Loading reviews...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3>Customer Reviews</h3>
      
      {reviewsArray.length === 0 ? (
        <div className="alert alert-info">
          <p className="mb-0">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviewsArray.map((review) => (
            <div key={review.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="card-title mb-2">{review.title}</h5>
                  <div className="text-muted small">
                    {formatDate(review.created)}
                  </div>
                </div>
                <div className="mb-2">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className={index < review.rating ? "text-warning" : "text-muted"}
                    />
                  ))}
                  <span className="ms-2">{review.rating}/5</span>
                </div>
                <p className="card-text">{review.content}</p>
                <p className="text-muted mb-0">
                  <small>By {review.user || review.user?.username || 'Anonymous'}</small>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {token ? (
        <>
          {!showReviewForm ? (
            <button
              className="btn btn-primary mt-3"
              onClick={() => setShowReviewForm(true)}
            >
              Write a Review
            </button>
          ) : (
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">Write a Review</h5>
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <div className="d-flex align-items-center">
                      {renderStars(rating)}
                      <span className="ms-2">{rating}/5</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reviewTitle" className="form-label">
                      Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="reviewTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      maxLength={200}
                      placeholder="Enter a title for your review"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reviewContent" className="form-label">
                      Review
                    </label>
                    <textarea
                      className="form-control"
                      id="reviewContent"
                      rows="4"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      maxLength={1000}
                      placeholder="Share your experience with this product"
                    ></textarea>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </span>
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowReviewForm(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-info mt-3">
          <p className="mb-0">
            Please <a href="/login" className="alert-link">login</a> to write a review.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;