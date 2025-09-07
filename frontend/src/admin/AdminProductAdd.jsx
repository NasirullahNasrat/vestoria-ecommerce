import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  Card, 
  Button, 
  Form as BootstrapForm, 
  Row, 
  Col, 
  Spinner,
  InputGroup,
  Image,
  Alert
} from 'react-bootstrap';
import { FaArrowLeft, FaUpload, FaTimes } from "react-icons/fa";
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin
} from "../utils/adminAuth";
import AdminNavbar from "./AdminNavbar";

const AdminProductAdd = () => {
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
        fetchCategoriesAndVendors();
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please login again');
        toast.error('Authentication failed. Please login again');
        logout();
        navigate('/admin/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Auto-generate slug from product name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
      .trim();
  };

  // Form validation schema
  const productSchema = Yup.object().shape({
    name: Yup.string().required('Product name is required'),
    slug: Yup.string()
      .required('Slug is required')
      .matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
    description: Yup.string().required('Description is required'),
    price: Yup.number()
      .required('Price is required')
      .min(0, 'Price cannot be negative'),
    discount_price: Yup.number()
      .min(0, 'Discount price cannot be negative')
      .nullable(),
    category: Yup.number().required('Category is required'),
    vendor: Yup.number().required('Vendor is required'),
    stock: Yup.number()
      .required('Stock is required')
      .min(0, 'Stock cannot be negative'),
    sku: Yup.string().required('SKU is required'),
    featured: Yup.boolean(),
    active: Yup.boolean()
  });

  // Initial form values
  const initialValues = {
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    category: '',
    vendor: '',
    stock: '',
    sku: '',
    featured: false,
    active: true,
    thumbnail_image: null,
    images: []
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // Validate vendor is a number before proceeding
    const vendorId = parseInt(values.vendor, 10);
    if (isNaN(vendorId)) {
      toast.error('Please select a valid vendor');
      setSubmitting(false);
      return;
    }

    // Validate category is a number before proceeding
    const categoryId = parseInt(values.category, 10);
    if (isNaN(categoryId)) {
      toast.error('Please select a valid category');
      setSubmitting(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      
      // Append all basic fields with proper type conversion
      formData.append('name', values.name);
      formData.append('slug', values.slug);
      formData.append('description', values.description);
      formData.append('price', parseFloat(values.price));
      formData.append('category', categoryId);
      formData.append('vendor', vendorId);
      formData.append('stock', parseInt(values.stock, 10));
      formData.append('sku', values.sku);
      formData.append('featured', values.featured ? 'true' : 'false');
      formData.append('active', values.active ? 'true' : 'false');
      
      // Only add discount_price if it has a value
      if (values.discount_price && values.discount_price !== '') {
        formData.append('discount_price', parseFloat(values.discount_price));
      }
      
      // Append thumbnail if exists
      if (values.thumbnail_image) {
        formData.append('thumbnail_image', values.thumbnail_image);
      }
      
      // Append images if exists
      if (values.images && values.images.length > 0) {
        values.images.forEach((image) => {
          formData.append('images', image);
        });
      }
      
      const response = await fetch('http://localhost:8000/api/products/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server error response:', responseData);
        
        // Handle specific field errors
        if (responseData.errors) {
          Object.keys(responseData.errors).forEach(key => {
            toast.error(`${key}: ${responseData.errors[key]}`);
          });
        } else if (responseData.non_field_errors) {
          responseData.non_field_errors.forEach(error => {
            toast.error(error);
          });
        } else {
          throw new Error(responseData.message || responseData.error || 'Failed to create product');
        }
        
        return;
      }
      
      toast.success('Product created successfully!');
      navigate(`/admin/products/edit/${responseData.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error.message || 'Error creating product');
      toast.error(error.message || 'Error creating product');
      
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Handle image uploads
  const handleImageChange = (event, setFieldValue) => {
    const files = Array.from(event.target.files);
    
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
    const newImages = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviews.push(reader.result);
        setImagePreviews([...newImagePreviews]);
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });
    
    setFieldValue('images', newImages);
  };

  // Handle thumbnail upload
  const handleThumbnailChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    
    // Validate file type
    if (file && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFieldValue('thumbnail_image', file);
    }
  };

  // Remove image from preview
  const removeImage = (index, setFieldValue, values) => {
    const newImagePreviews = [...imagePreviews];
    newImagePreviews.splice(index, 1);
    setImagePreviews(newImagePreviews);
    
    const currentImages = values.images || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setFieldValue('images', newImages);
  };

  // Remove thumbnail
  const removeThumbnail = (setFieldValue) => {
    setThumbnailPreview(null);
    setFieldValue('thumbnail_image', null);
  };

  // Fetch categories and vendors
  const fetchCategoriesAndVendors = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [categoriesRes, vendorsRes] = await Promise.all([
        fetch('http://localhost:8000/api/categories/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }),
        fetch('http://localhost:8000/api/vendors/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
      ]);
      
      if (!categoriesRes.ok) {
        throw new Error(`Categories failed: ${categoriesRes.status}`);
      }
      
      if (!vendorsRes.ok) {
        throw new Error(`Vendors failed: ${vendorsRes.status}`);
      }
      
      const categoriesData = await categoriesRes.json();
      const vendorsData = await vendorsRes.json();
      
      // Handle different response structures
      const categoriesList = Array.isArray(categoriesData) 
        ? categoriesData 
        : categoriesData.results || categoriesData.data || [];
      
      const vendorsList = Array.isArray(vendorsData) 
        ? vendorsData 
        : vendorsData.results || vendorsData.data || [];
      
      setCategories(categoriesList);
      setVendors(vendorsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load required data: ' + error.message);
      toast.error('Failed to load required data: ' + error.message);
      
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
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

  if (error) {
    return (
      <AdminNavbar activePage="products">
        <div className="container-fluid py-4">
          <Alert variant="danger">
            <h4>Error</h4>
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
          <h2>Add New Product</h2>
          <Button variant="outline-secondary" onClick={() => navigate('/admin/products-list')}>
            <FaArrowLeft className="me-2" /> Back to Products
          </Button>
        </div>

        <Card>
          <Card.Body>
            <Formik
              initialValues={initialValues}
              validationSchema={productSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form>
                  <Row>
                    <Col md={8}>
                      {/* Basic Information Card */}
                      <Card className="mb-4">
                        <Card.Header>Basic Information</Card.Header>
                        <Card.Body>
                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Product Name *</BootstrapForm.Label>
                            <Field 
                              name="name" 
                              as={BootstrapForm.Control} 
                              type="text" 
                              placeholder="Enter product name"
                              onBlur={(e) => {
                                if (e.target.value && !values.slug) {
                                  setFieldValue('slug', generateSlug(e.target.value));
                                }
                              }}
                            />
                            <ErrorMessage name="name" component="div" className="text-danger small" />
                          </BootstrapForm.Group>

                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Slug *</BootstrapForm.Label>
                            <Field 
                              name="slug" 
                              as={BootstrapForm.Control} 
                              type="text" 
                              placeholder="product-slug" 
                            />
                            <ErrorMessage name="slug" component="div" className="text-danger small" />
                            <BootstrapForm.Text muted>
                              Unique URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                            </BootstrapForm.Text>
                          </BootstrapForm.Group>

                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Description *</BootstrapForm.Label>
                            <Field 
                              name="description" 
                              as="textarea" 
                              rows={5}
                              className="form-control" 
                              placeholder="Enter detailed product description" 
                            />
                            <ErrorMessage name="description" component="div" className="text-danger small" />
                          </BootstrapForm.Group>
                        </Card.Body>
                      </Card>

                      {/* Pricing & Inventory Card */}
                      <Card className="mb-4">
                        <Card.Header>Pricing & Inventory</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <BootstrapForm.Group className="mb-3">
                                <BootstrapForm.Label>Price *</BootstrapForm.Label>
                                <InputGroup>
                                  <InputGroup.Text>$</InputGroup.Text>
                                  <Field 
                                    name="price" 
                                    as={BootstrapForm.Control} 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    placeholder="0.00" 
                                  />
                                </InputGroup>
                                <ErrorMessage name="price" component="div" className="text-danger small" />
                              </BootstrapForm.Group>
                            </Col>
                            <Col md={6}>
                              <BootstrapForm.Group className="mb-3">
                                <BootstrapForm.Label>Discount Price</BootstrapForm.Label>
                                <InputGroup>
                                  <InputGroup.Text>$</InputGroup.Text>
                                  <Field 
                                    name="discount_price" 
                                    as={BootstrapForm.Control} 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    placeholder="0.00" 
                                  />
                                </InputGroup>
                                <ErrorMessage name="discount_price" component="div" className="text-danger small" />
                              </BootstrapForm.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <BootstrapForm.Group className="mb-3">
                                <BootstrapForm.Label>Stock Quantity *</BootstrapForm.Label>
                                <Field 
                                  name="stock" 
                                  as={BootstrapForm.Control} 
                                  type="number" 
                                  min="0" 
                                  placeholder="0" 
                                />
                                <ErrorMessage name="stock" component="div" className="text-danger small" />
                              </BootstrapForm.Group>
                            </Col>
                            <Col md={6}>
                              <BootstrapForm.Group className="mb-3">
                                <BootstrapForm.Label>SKU *</BootstrapForm.Label>
                                <Field 
                                  name="sku" 
                                  as={BootstrapForm.Control} 
                                  type="text" 
                                  placeholder="PROD-12345" 
                                />
                                <ErrorMessage name="sku" component="div" className="text-danger small" />
                              </BootstrapForm.Group>
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
                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Thumbnail Image</BootstrapForm.Label>
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
                                  onClick={() => removeThumbnail(setFieldValue)}
                                >
                                  <FaTimes />
                                </Button>
                              </div>
                            ) : (
                              <div className="border rounded p-4 text-center">
                                <label className="d-block cursor-pointer">
                                  <FaUpload className="fs-4 mb-2" />
                                  <div>Upload Thumbnail</div>
                                  <input 
                                    type="file" 
                                    className="d-none" 
                                    accept="image/*"
                                    onChange={(e) => handleThumbnailChange(e, setFieldValue)}
                                  />
                                </label>
                              </div>
                            )}
                          </BootstrapForm.Group>

                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Product Images (Max 5)</BootstrapForm.Label>
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
                                    onClick={() => removeImage(index, setFieldValue, values)}
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
                                <input 
                                  type="file" 
                                  className="d-none" 
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleImageChange(e, setFieldValue)}
                                />
                              </label>
                            </div>
                          </BootstrapForm.Group>
                        </Card.Body>
                      </Card>

                      {/* Organization Card */}
                      <Card className="mb-4">
                        <Card.Header>Organization</Card.Header>
                        <Card.Body>
                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Category *</BootstrapForm.Label>
                            <Field 
                              name="category" 
                              as="select" 
                              className="form-select"
                            >
                              <option value="">Select a category</option>
                              {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage name="category" component="div" className="text-danger small" />
                          </BootstrapForm.Group>

                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>Vendor *</BootstrapForm.Label>
                            <Field 
                              name="vendor" 
                              as="select" 
                              className="form-select"
                            >
                              <option value="">Select a vendor</option>
                              {vendors.length === 0 ? (
                                <option value="" disabled>Loading vendors...</option>
                              ) : (
                                vendors.map(vendor => {
                                  const vendorId = vendor.user.id || vendor.vendor_id;
                                  const vendorName = vendor.business_name || vendor.name || 'Unknown Vendor';
                                  
                                  return (
                                    <option key={vendorId} value={vendorId}>
                                      {vendorName}
                                    </option>
                                  );
                                })
                              )}
                            </Field>
                            <ErrorMessage name="vendor" component="div" className="text-danger small" />
                          </BootstrapForm.Group>
                        </Card.Body>
                      </Card>

                      {/* Status Card */}
                      <Card className="mb-4">
                        <Card.Header>Status</Card.Header>
                        <Card.Body>
                          <BootstrapForm.Group className="mb-3">
                            <Field 
                              name="featured" 
                              type="checkbox" 
                              id="featured"
                              className="form-check-input me-2"
                            />
                            <BootstrapForm.Label htmlFor="featured" className="form-check-label">
                              Featured Product
                            </BootstrapForm.Label>
                          </BootstrapForm.Group>

                          <BootstrapForm.Group className="mb-3">
                            <Field 
                              name="active" 
                              type="checkbox" 
                              id="active"
                              className="form-check-input me-2"
                              checked
                            />
                            <BootstrapForm.Label htmlFor="active" className="form-check-label">
                              Active (Visible in store)
                            </BootstrapForm.Label>
                          </BootstrapForm.Group>
                        </Card.Body>
                      </Card>

                      <div className="d-grid">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          size="lg"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                              <span className="ms-2">Creating Product...</span>
                            </>
                          ) : (
                            'Create Product'
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              )}
            </Formik>
          </Card.Body>
        </Card>
      </div>
    </AdminNavbar>
  );
};

export default AdminProductAdd;