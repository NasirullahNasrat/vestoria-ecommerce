import React, { useState, useEffect } from "react";
import axios from "axios";
import { Footer, Navbar } from "../components";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState({ question: "", answer: "" });
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const navigate = useNavigate();

  // Generate a simple math CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const question = `${num1} + ${num2}`;
    const answer = (num1 + num2).toString();
    setCaptcha({ question, answer });
    setUserCaptchaInput(""); // Reset user input when generating new CAPTCHA
  };

  // Initialize CAPTCHA on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error when user types
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name";
      isValid = false;
    } else if (formData.name.length > 100) {
      newErrors.name = "Name is too long (max 100 characters)";
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Please enter your message";
      isValid = false;
    } else if (formData.message.length < 10) {
      newErrors.message = "Message should be at least 10 characters long";
      isValid = false;
    }

    // Validate CAPTCHA
    if (userCaptchaInput !== captcha.answer) {
      setCaptchaError("Incorrect answer. Please try again.");
      isValid = false;
    } else {
      setCaptchaError("");
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Regenerate CAPTCHA if the answer was wrong
      if (captchaError) generateCaptcha();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        "http://localhost:8000/api/contact/",
        {
          ...formData,
          captcha_verified: true // You can send this to your backend if needed
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      
      toast.success(response.data.message || "Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
      generateCaptcha(); // Generate new CAPTCHA after successful submission
      
    } catch (error) {
      console.error("Submission error:", error);
      generateCaptcha(); // Regenerate CAPTCHA on error
      
      if (error.response) {
        // Handle server validation errors
        if (error.response.data) {
          const serverErrors = error.response.data;
          if (typeof serverErrors === 'object') {
            setErrors(prev => ({
              ...prev,
              ...serverErrors
            }));
          }
          toast.error(
            serverErrors.message || 
            "Failed to submit form. Please check your inputs."
          );
        }
      } else {
        toast.error("Network error. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">Contact Us</h1>
        <hr />
        <div className="row my-4 h-100">
          <div className="col-md-4 col-lg-4 col-sm-8 mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="form my-3">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
              </div>
              
              <div className="form my-3">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  id="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>
              
              <div className="form my-3">
                <label htmlFor="message">Message</label>
                <textarea
                  rows={5}
                  className={`form-control ${errors.message ? "is-invalid" : ""}`}
                  id="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleChange}
                />
                {errors.message && (
                  <div className="invalid-feedback">{errors.message}</div>
                )}
              </div>

              {/* CAPTCHA Section */}
              <div className="form my-3">
                <label htmlFor="captcha">CAPTCHA: What is {captcha.question}?</label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${captchaError ? "is-invalid" : ""}`}
                    id="captcha"
                    placeholder="Your answer"
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={generateCaptcha}
                    title="Refresh CAPTCHA"
                  >
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                </div>
                {captchaError && (
                  <div className="invalid-feedback">{captchaError}</div>
                )}
              </div>
              
              <div className="text-center">
                <button
                  className="my-2 px-4 mx-auto btn btn-dark"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span 
                        className="spinner-border spinner-border-sm me-2" 
                        role="status" 
                        aria-hidden="true"
                      ></span>
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;