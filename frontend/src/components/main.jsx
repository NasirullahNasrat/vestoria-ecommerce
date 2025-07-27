import React, { useState, useEffect } from "react";
import './Home.css'; 
import image1 from './images/1.jpg'; // Adjust the path and extension
import image2 from './images/2.jpg'; // Adjust the path and extension
import image3 from './images/3.jpg'; // Adjust the path and extension


const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Array of slides with image URLs and captions
  const slides = [
    {
      image: image1,
      title: "New Season Arrivals",
      text: "Discover our latest collection for the upcoming season",
      link: "/new-arrivals"
    },
    {
      image: image2,
      title: "Summer Sale",
      text: "Up to 50% off on selected items. Limited time only!",
      link: "/summer-sale"
    },
    {
      image: image3,
      title: "Exclusive Collection",
      text: "Shop our designer exclusives available only here",
      link: "/exclusives"
    }
  ];

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="hero-slideshow">
      {/* Slides container */}
      <div className="slideshow-container">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className="slide-image"
            />
            <div className="slide-content">
              <h3>{slide.title}</h3>
              <p>{slide.text}</p>
              <a href={slide.link} className="btn btn-light">Shop Now</a>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation dots */}
      <div className="slide-dots">
        {slides.map((_, index) => (
          <span 
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;