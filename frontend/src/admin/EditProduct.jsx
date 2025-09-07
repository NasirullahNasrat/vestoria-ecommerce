import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FaSave, FaTimes, FaUpload, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAccessToken, isAuthenticated, isAdmin, logout } from '../utils/adminAuth';
import AdminNavbar from './AdminNavbar';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    current_price: '',
    stock: '',
    featured: false,
    category: '',
    images: []
  });
  const [categories, setCategories] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Use isAuthenticated instead of verifyToken
        if (!isAuthenticated()) {
          toast.error('Please login to access this page');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        // Additional check for admin role
        if (!isAdmin()) {
          toast.error('Admin access required');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
        setAuthChecked(true);
        
        if (!id) {
          setError('Product ID is missing from URL');
          setLoading(false);
          return;
        }

        // Fetch product and categories in parallel
        const [productResponse, categoriesResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/products/id/${id}/manage/`, {
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          }),
          fetch('http://localhost:8000/api/categories/', {
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          })
        ]);

        if (!productResponse.ok || !categoriesResponse.ok) {
          throw new Error(`Failed to fetch data: Products ${productResponse.status}, Categories ${categoriesResponse.status}`);
        }

        const [productData, categoriesData] = await Promise.all([
          productResponse.json(),
          categoriesResponse.json()
        ]);

        // Handle both array and object responses for categories
        const normalizedCategories = Array.isArray(categoriesData) 
          ? categoriesData 
          : categoriesData.results || categoriesData.categories || [];

        setProduct({
          ...productData,
          category: productData.category?.id || '',
          current_price: productData.current_price || productData.price
        });
        setCategories(normalizedCategories);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        toast.error(`Error: ${err.message}`);
        setCategories([]); // Ensure categories is always an array
        
        if (err.message.includes('401')) {
          logout();
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const removeImage = async (imageId) => {
    try {
      // Check authentication before proceeding
      if (!isAuthenticated()) {
        toast.error('Please login to continue');
        logout();
        navigate('/admin/login');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/products/images/${imageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setProduct(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      }));
      toast.success('Image removed successfully');
    } catch (err) {
      toast.error(err.message);
      
      if (err.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Check authentication before submission
      if (!isAuthenticated()) {
        toast.error('Please login to continue');
        logout();
        navigate('/admin/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('price', product.price);
      formData.append('current_price', product.current_price || product.price);
      formData.append('stock', product.stock);
      formData.append('featured', product.featured);
      formData.append('category', product.category);
      
      if (newImage) {
        formData.append('images', newImage);
      }

      // First try PATCH
      let response = await fetch(`http://localhost:8000/api/products/id/${id}/manage/`, {
        method: 'PATCH',
        body: formData,
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      // If PATCH not allowed, try PUT
      if (response.status === 405) {
        response = await fetch(`http://localhost:8000/api/products/id/${id}/manage/`, {
          method: 'PUT',
          body: formData,
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error details:', errorData);
        throw new Error(errorData.detail || errorData.message || JSON.stringify(errorData) || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      setNewImage(null);
      setImagePreview(null);
      
      toast.success('Product updated successfully!');
      navigate('/admin/products-list');
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
      toast.error(err.message);
      
      if (err.message.includes('401') || err.message.includes('authentication') || err.message.includes('token')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Checking authentication...</span>
      </div>
    );
  }

  if (!id) {
    return (
      <AdminNavbar activePage="products">
        <div className="container-fluid py-4">
          <Alert variant="danger">
            <h4>Error: No Product ID</h4>
            <p>No product ID was provided in the URL. Please navigate to this page through the products list.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/admin/products')}
              className="mt-2"
            >
              Back to Products List
            </Button>
          </Alert>
        </div>
      </AdminNavbar>
    );
  }

  if (loading) {
    return (
      <AdminNavbar activePage="products">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <Spinner animation="border" variant="primary" />
          <span className="ms-3">Loading product data...</span>
        </div>
      </AdminNavbar>
    );
  }

  if (error) {
    return (
      <AdminNavbar activePage="products">
        <div className="container-fluid py-4">
          <Alert variant="danger">
            <h4>Error Loading Product</h4>
            <p>{error}</p>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => navigate('/admin/products')}>
                Back to Products
              </Button>
            </div>
          </Alert>
        </div>
      </AdminNavbar>
    );
  }

  return (
    <AdminNavbar activePage="products">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Edit Product: {product.name}</h2>
          <Button variant="secondary" onClick={() => navigate('/admin/products-list')}>
            <FaTimes className="me-2" /> Cancel
          </Button>
        </div>

        <Card>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={product.name}
                      onChange={handleChange}
                      required
                      minLength={3}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="description"
                      value={product.description}
                      onChange={handleChange}
                      style={{ minHeight: '150px' }}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Original Price ($) *</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0.01"
                          name="price"
                          value={product.price}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Price ($) *</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0.01"
                          name="current_price"
                          value={product.current_price}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stock Quantity *</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          name="stock"
                          value={product.stock}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category *</Form.Label>
                        <Form.Select
                          name="category"
                          value={product.category}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {(categories || []).map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Featured Product"
                      name="featured"
                      checked={product.featured}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-4">
                    <Form.Label>Product Images</Form.Label>
                    <div className="mb-3">
                      {product.images?.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {product.images.map((image) => (
                            <div key={image.id} className="position-relative">
                              <img
                                src={image.image}
                                alt={`Product ${image.id}`}
                                className="img-thumbnail"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 rounded-circle p-1"
                                onClick={() => removeImage(image.id)}
                                title="Remove image"
                              >
                                <FaTrash size={12} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert variant="info">No images available</Alert>
                      )}
                    </div>

                    <Form.Label className="d-block">
                      <Button variant="outline-primary" as="div" className="w-100">
                        <FaUpload className="me-2" />
                        Upload New Image
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="d-none"
                        />
                      </Button>
                    </Form.Label>
                    
                    {imagePreview && (
                      <div className="mt-3">
                        <p className="mb-2">New Image Preview:</p>
                        <div className="position-relative d-inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-thumbnail"
                            style={{ maxWidth: '200px', maxHeight: '200px' }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 rounded-circle p-1"
                            onClick={() => {
                              setImagePreview(null);
                              setNewImage(null);
                            }}
                            title="Cancel upload"
                          >
                            <FaTimes size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-4 gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/admin/products-list')}
                  disabled={saving}
                >
                  <FaTimes className="me-2" /> Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </AdminNavbar>
  );
};

export default EditProduct;