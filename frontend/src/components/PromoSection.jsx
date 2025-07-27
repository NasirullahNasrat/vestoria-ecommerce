// components/PromoSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const PromoSection = () => {
  return (
    <section className="promo-section">
      {/* Motivation Banner */}
      <div className="motivation-banner">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h2>Elevate Your Style</h2>
              <p className="lead">Discover pieces that inspire confidence and express your unique personality</p>
              <Link to="/products" className="btn btn-light btn-lg">Shop Now</Link>
            </div>
            <div className="col-md-6">
              <img 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="Fashion inspiration" 
                className="img-fluid rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Promo Grid */}
      <div className="promo-grid py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="promo-card">
                <img 
                  src="https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Summer Collection" 
                  className="img-fluid"
                />
                <div className="promo-content">
                  <h3>Summer Vibes</h3>
                  <p>Refresh your wardrobe with our breezy summer collection</p>
                  <Link to="/products?category=summer" className="btn btn-outline-light">Explore</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="promo-card">
                <img 
                  src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Limited Edition" 
                  className="img-fluid"
                />
                <div className="promo-content">
                  <h3>Limited Edition</h3>
                  <p>Exclusive pieces you won't find anywhere else</p>
                  <Link to="/products?category=limited" className="btn btn-outline-light">Discover</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="promo-card">
                <img 
                  src="https://images.unsplash.com/photo-1551232864-3f0890e580d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Accessories" 
                  className="img-fluid"
                />
                <div className="promo-content">
                  <h3>Complete Your Look</h3>
                  <p>The perfect accessories to elevate any outfit</p>
                  <Link to="/products?category=accessories" className="btn btn-outline-light">View All</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="testimonial-section py-5 bg-light">
        <div className="container text-center">
          <h2 className="mb-5">What Our Customers Say</h2>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="testimonial-card p-4 h-100">
                <img 
                  src="https://randomuser.me/api/portraits/women/32.jpg" 
                  alt="Customer" 
                  className="rounded-circle mb-3"
                  width="80"
                />
                <p>"The quality exceeded my expectations! I get compliments every time I wear my new jacket."</p>
                <div className="stars text-warning mb-2">
                  ★ ★ ★ ★ ★
                </div>
                <h5>Sarah Johnson</h5>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="testimonial-card p-4 h-100">
                <img 
                  src="https://randomuser.me/api/portraits/men/75.jpg" 
                  alt="Customer" 
                  className="rounded-circle mb-3"
                  width="80"
                />
                <p>"Fast shipping and excellent customer service. Will definitely shop here again!"</p>
                <div className="stars text-warning mb-2">
                  ★ ★ ★ ★ ★
                </div>
                <h5>Michael Chen</h5>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="testimonial-card p-4 h-100">
                <img 
                  src="https://randomuser.me/api/portraits/women/68.jpg" 
                  alt="Customer" 
                  className="rounded-circle mb-3"
                  width="80"
                />
                <p>"I love how unique their pieces are. Always something special in every collection."</p>
                <div className="stars text-warning mb-2">
                  ★ ★ ★ ★ ☆
                </div>
                <h5>Emma Rodriguez</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="final-cta py-5 text-center">
        <div className="container">
          <h2 className="display-5 mb-4">Ready to Transform Your Wardrobe?</h2>
          <p className="lead mb-5">Join thousands of satisfied customers who shop with us</p>
          <Link to="/products" className="btn btn-primary btn-lg px-5">Start Shopping</Link>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;