import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Row, 
  Col, 
  Card, 
  Spinner, 
  Alert, 
  InputGroup,
  Image 
} from 'react-bootstrap';
import { 
  FaSave, 
  FaTimes, 
  FaUpload, 
  FaTrash, 
  FaMagic, 
  FaCopy, 
  FaArrowLeft,
  FaDollarSign 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAccessToken, isAuthenticated, isAdmin, logout } from '../utils/adminAuth';
import AdminNavbar from './AdminNavbar';
import { getApiUrl } from '../config/env';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    sku: '',
    featured: false,
    active: true,
    category: '',
    vendor: '',
    thumbnail_image: null,
    images: []
  });
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  
  // State for SEO description generation
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [seoInput, setSeoInput] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        if (!isAuthenticated()) {
          toast.error('Please login to access this page');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        
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

        // Use environment configuration for API URLs
        const productUrl = getApiUrl(`/api/products/id/${id}/manage/`);
        const categoriesUrl = getApiUrl('/api/categories/');
        const vendorsUrl = getApiUrl('/api/vendors/');

        const [productResponse, categoriesResponse, vendorsResponse] = await Promise.all([
          fetch(productUrl, {
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          }),
          fetch(categoriesUrl, {
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          }),
          fetch(vendorsUrl, {
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          })
        ]);

        if (!productResponse.ok) {
          throw new Error(`Failed to fetch product: ${productResponse.status}`);
        }

        const productData = await productResponse.json();
        const categoriesData = await categoriesResponse.json();
        const vendorsData = await vendorsResponse.json();

        // Handle different response structures
        const normalizedCategories = Array.isArray(categoriesData) 
          ? categoriesData 
          : categoriesData.results || categoriesData.data || [];
          
        const normalizedVendors = Array.isArray(vendorsData) 
          ? vendorsData 
          : vendorsData.results || vendorsData.data || [];

        // Set product data with proper category and vendor IDs
        setProduct({
          ...productData,
          category: productData.category ? (productData.category.id || productData.category) : '',
          vendor: productData.vendor ? (productData.vendor.id || productData.vendor) : '',
          discount_price: productData.discount_price || '',
          slug: productData.slug || '',
          sku: productData.sku || '',
          active: productData.active !== undefined ? productData.active : true
        });
        
        setCategories(normalizedCategories);
        setVendors(normalizedVendors);
        
        // Set thumbnail preview if exists
        if (productData.thumbnail_image) {
          setThumbnailPreview(productData.thumbnail_image);
        }
        
        // Set image previews if exist
        if (productData.images && productData.images.length > 0) {
          const previews = productData.images.map(img => img.image);
          setImagePreviews(previews);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        toast.error(`Error: ${err.message}`);
        setCategories([]);
        setVendors([]);
        
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

  // Function to generate slug from product name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
      .trim();
  };

  // Add function to generate SEO description
  const generateSEODescription = async () => {
    if (!seoInput.trim()) {
      toast.error('Please enter some product information first');
      return;
    }
    
    setGeneratingDescription(true);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use environment configuration for API URL
      const apiUrl = getApiUrl('/api/generate-seo-keywords/');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: product.name,
          product_description: seoInput
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }
      
      if (data.seo_description) {
        setGeneratedDescription(data.seo_description);
        setShowDescription(true);
        toast.success('SEO description generated successfully!');
      } else {
        throw new Error('No description returned from AI');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error(error.message || 'Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Add function to copy description to clipboard
  const copyDescriptionToClipboard = () => {
    navigator.clipboard.writeText(generatedDescription)
      .then(() => {
        toast.success('Description copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy description: ', err);
        toast.error('Failed to copy description');
      });
  };

  // Add function to apply description
  const applyDescription = () => {
    if (generatedDescription) {
      setProduct(prev => ({ ...prev, description: generatedDescription }));
      setShowDescription(false);
      toast.success('Description applied successfully!');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Auto-generate slug when name changes
    if (name === 'name' && value) {
      setProduct(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setNewThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Please select only image files');
      return;
    }
    
    if (files.length + imagePreviews.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }
    
    const newImagePreviews = [...imagePreviews];
    const newImageFiles = [...newImages];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviews.push(reader.result);
        setImagePreviews([...newImagePreviews]);
      };
      reader.readAsDataURL(file);
      newImageFiles.push(file);
    });
    
    setNewImages(newImageFiles);
  };

  const removeThumbnail = () => {
    setNewThumbnail(null);
    setThumbnailPreview(null);
    setProduct(prev => ({ ...prev, thumbnail_image: null }));
  };

  const removeImage = async (imageId, index) => {
    try {
      // If it's an existing image (has an ID), delete from server
      if (imageId) {
        if (!isAuthenticated()) {
          toast.error('Please login to continue');
          logout();
          navigate('/admin/login');
          return;
        }
        
        // Use environment configuration for API URL
        const apiUrl = getApiUrl(`/api/products/images/${imageId}/`);
        
        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete image');
        }
      }
      
      // Remove from previews and new images
      const newImagePreviews = [...imagePreviews];
      newImagePreviews.splice(index, 1);
      setImagePreviews(newImagePreviews);
      
      const currentImages = product.images || [];
      const newProductImages = [...currentImages];
      newProductImages.splice(index, 1);
      
      const newImageFiles = [...newImages];
      newImageFiles.splice(index, 1);
      setNewImages(newImageFiles);
      
      setProduct(prev => ({
        ...prev,
        images: newProductImages
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
      if (!isAuthenticated()) {
        toast.error('Please login to continue');
        logout();
        navigate('/admin/login');
        return;
      }

      const formData = new FormData();
      
      // Append all basic fields
      formData.append('name', product.name);
      formData.append('slug', product.slug);
      formData.append('description', product.description);
      formData.append('price', product.price);
      formData.append('discount_price', product.discount_price || '');
      formData.append('stock', product.stock);
      formData.append('sku', product.sku);
      formData.append('featured', product.featured);
      formData.append('active', product.active);
      formData.append('category', product.category);
      formData.append('vendor', product.vendor);
      
      // Append new thumbnail if exists
      if (newThumbnail) {
        formData.append('thumbnail_image', newThumbnail);
      }
      
      // Append new images if exist
      if (newImages && newImages.length > 0) {
        newImages.forEach((image) => {
          formData.append('images', image);
        });
      }

      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/products/id/${id}/manage/`);
      
      let response = await fetch(apiUrl, {
        method: 'PATCH',
        body: formData,
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (response.status === 405) {
        response = await fetch(apiUrl, {
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
      setNewThumbnail(null);
      setNewImages([]);
      
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
          <Button variant="outline-secondary" onClick={() => navigate('/admin/products-list')}>
            <FaArrowLeft className="me-2" /> Back to Products
          </Button>
        </div>

        <Card>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  {/* Basic Information Card */}
                  <Card className="mb-4">
                    <Card.Header>Basic Information</Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Product Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={product.name}
                          onChange={handleChange}
                          required
                          minLength={3}
                          placeholder="Enter product name"
                          onBlur={(e) => {
                            if (e.target.value && !product.slug) {
                              setProduct(prev => ({
                                ...prev,
                                slug: generateSlug(e.target.value)
                              }));
                            }
                          }}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Slug *</Form.Label>
                        <Form.Control
                          type="text"
                          name="slug"
                          value={product.slug}
                          onChange={handleChange}
                          required
                          placeholder="product-slug"
                        />
                        <Form.Text muted>
                          Unique URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Description *</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={5}
                          name="description"
                          value={product.description}
                          onChange={handleChange}
                          style={{ minHeight: '150px' }}
                          placeholder="Enter detailed product description"
                        />
                      </Form.Group>

                      {/* SEO Description Generation Section */}
                      <Card className="mb-3 border-info">
                        <Card.Header className="bg-info text-white">
                          AI SEO Description Generator
                        </Card.Header>
                        <Card.Body>
                          <Form.Group className="mb-3">
                            <Form.Label>Enter product details for AI-powered SEO description</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={seoInput}
                              onChange={(e) => setSeoInput(e.target.value)}
                              placeholder="Describe your product features, benefits, target audience, etc."
                            />
                            <Form.Text className="text-muted">
                              Provide details about your product to generate an SEO-optimized description
                            </Form.Text>
                          </Form.Group>
                          
                          <Button 
                            variant="outline-info"
                            disabled={!seoInput.trim() || generatingDescription}
                            onClick={generateSEODescription}
                            className="me-2"
                          >
                            {generatingDescription ? (
                              <Spinner as="span" animation="border" size="sm" />
                            ) : (
                              <>
                                <FaMagic className="me-1" /> Generate SEO Description
                              </>
                            )}
                          </Button>
                          
                          {showDescription && (
                            <div className="mt-3">
                              <Form.Label>Generated Description:</Form.Label>
                              <Card className="bg-light">
                                <Card.Body>
                                  <p className="mb-2">{generatedDescription}</p>
                                  <div className="d-flex gap-2">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={copyDescriptionToClipboard}
                                    >
                                      <FaCopy className="me-1" /> Copy Description
                                    </Button>
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      onClick={applyDescription}
                                    >
                                      Apply to Description
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Card.Body>
                  </Card>

                  {/* Pricing & Inventory Card */}
                  <Card className="mb-4">
                    <Card.Header>Pricing & Inventory</Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Price *</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaDollarSign /></InputGroup.Text>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                name="price"
                                value={product.price}
                                onChange={handleChange}
                                required
                                placeholder="0.00"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Discount Price</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaDollarSign /></InputGroup.Text>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                name="discount_price"
                                value={product.discount_price}
                                onChange={handleChange}
                                placeholder="0.00"
                              />
                            </InputGroup>
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
                              placeholder="0"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>SKU *</Form.Label>
                            <Form.Control
                              type="text"
                              name="sku"
                              value={product.sku}
                              onChange={handleChange}
                              required
                              placeholder="PROD-12345"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  {/* Media Card */}
                  <Card className="mb-4">
                    <Card.Header>Media</Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Thumbnail Image</Form.Label>
                        {thumbnailPreview ? (
                          <div className="mb-2 position-relative">
                            <Image 
                              src={thumbnailPreview} 
                              alt="Thumbnail preview" 
                              fluid 
                              className="rounded"
                            />
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="position-absolute top-0 end-0 m-1"
                              onClick={removeThumbnail}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        ) : (
                          <div className="border rounded p-4 text-center">
                            <label className="d-block cursor-pointer">
                              <FaUpload className="fs-4 mb-2" />
                              <div>Upload Thumbnail</div>
                              <Form.Control
                                type="file"
                                className="d-none"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                              />
                            </label>
                          </div>
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Product Images (Max 5)</Form.Label>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="position-relative">
                              <Image 
                                src={preview} 
                                alt={`Preview ${index}`}
                                width={80}
                                height={80}
                                className="rounded border"
                              />
                              <Button 
                                variant="danger" 
                                size="sm" 
                                className="position-absolute top-0 end-0 m-0 p-1"
                                onClick={() => removeImage(
                                  product.images && product.images[index] ? product.images[index].id : null, 
                                  index
                                )}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="border rounded p-3 text-center">
                          <label className="d-block cursor-pointer">
                            <FaUpload className="fs-4 mb-2" />
                            <div>Upload Images</div>
                            <Form.Control
                              type="file"
                              className="d-none"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Organization Card */}
                  <Card className="mb-4">
                    <Card.Header>Organization</Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Category *</Form.Label>
                        <Form.Select
                          name="category"
                          value={product.category}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Vendor *</Form.Label>
                        <Form.Select
                          name="vendor"
                          value={product.vendor}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select a vendor</option>
                          {vendors.length === 0 ? (
                            <option value="" disabled>Loading vendors...</option>
                          ) : (
                            vendors.map(vendor => {
                              const vendorId = vendor.id || vendor.user?.id;
                              const vendorName = vendor.business_name || vendor.name || vendor.user?.username || 'Unknown Vendor';
                              
                              return (
                                <option key={vendorId} value={vendorId}>
                                  {vendorName}
                                </option>
                              );
                            })
                          )}
                        </Form.Select>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Status Card */}
                  <Card className="mb-4">
                    <Card.Header>Status</Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Featured Product"
                          name="featured"
                          checked={product.featured}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Active (Visible in store)"
                          name="active"
                          checked={product.active}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span className="ms-2">Updating Product...</span>
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Update Product
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </AdminNavbar>
  );
};

export default EditProduct;