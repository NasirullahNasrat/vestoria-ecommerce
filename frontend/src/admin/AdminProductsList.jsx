import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaTimes, FaSync } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup, 
  Badge,
  Spinner
} from 'react-bootstrap';
import AdminNavbar from "./AdminNavbar";
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin
} from "../utils/adminAuth";

const AdminProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    inStock: false,
    featured: false
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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
        fetchProducts();
      } catch (err) {
        console.error('Authentication error:', err);
        toast.error('Authentication failed. Please login again');
        logout();
        navigate('/admin/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Use getAccessToken from adminAuth instead of Redux
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch("http://localhost:8000/api/products/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/admin/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle both array and object responses
      const productsData = Array.isArray(data) ? data : data.results || data.products || [];
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again later.");
      setProducts([]); // Ensure products is always an array
      
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Safely get unique categories from products
  const categories = Array.from(
    new Set(
      (products || [])
        .map(product => product?.category?.name)
        .filter(name => name !== undefined && name !== null)
    )
  );

  const handleDelete = (productId) => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this product?',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              const token = getAccessToken();
              const response = await fetch(`http://localhost:8000/api/products/${productId}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              });

              if (!response.ok) {
                throw new Error('Failed to delete product');
              }

              setProducts(products.filter(product => product.id !== productId));
              toast.success('Product deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              toast.error(error.message);
              
              if (error.message.includes('401')) {
                logout();
                navigate('/admin/login');
              }
            }
          }
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const applyFilters = () => {
    fetchProducts();
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      inStock: false,
      featured: false
    });
    setSearchTerm('');
    fetchProducts();
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const Loading = () => {
    return (
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td><Skeleton width={30} /></td>
                <td><Skeleton width={50} height={50} circle /></td>
                <td><Skeleton width={150} /></td>
                <td><Skeleton width={100} /></td>
                <td><Skeleton width={60} /></td>
                <td><Skeleton width={50} /></td>
                <td><Skeleton width={30} /></td>
                <td>
                  <Skeleton width={70} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/50x50?text=No+Image';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://localhost:8000${imagePath}`;
  };

  if (loading && !authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Checking authentication...</span>
      </div>
    );
  }

  if (!authChecked) {
    return null; // Will redirect from useEffect
  }

  return (
    <AdminNavbar activePage="products">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Products Management</h2>
            <p className="text-muted">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={handleRefresh} disabled={refreshing}>
              <FaSync className={refreshing ? 'spin' : ''} />
              <span className="ms-2">Refresh</span>
            </Button>
            <Link to="/admin/add-product" className="btn btn-primary">
              <FaPlus className="me-2" /> Add Product
            </Link>
          </div>
        </div>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Products List</h5>
            <div className="d-flex">
              <Form onSubmit={handleSearch} className="me-3">
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    Search
                  </Button>
                </InputGroup>
              </Form>
              
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" /> 
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </Card.Header>
          
          {showFilters && (
            <Card.Body className="border-top">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select 
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </div>
                
                <div className="col-md-4 mb-3 d-flex align-items-end">
                  <Form.Check
                    type="checkbox"
                    id="inStock"
                    name="inStock"
                    label="In Stock Only"
                    checked={filters.inStock}
                    onChange={handleFilterChange}
                    className="me-4"
                  />
                  
                  <Form.Check
                    type="checkbox"
                    id="featured"
                    name="featured"
                    label="Featured Only"
                    checked={filters.featured}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="col-md-4 mb-3 d-flex align-items-end justify-content-end gap-2">
                  <Button 
                    variant="outline-danger"
                    size="sm"
                    onClick={resetFilters}
                  >
                    <FaTimes className="me-1" /> Reset All
                  </Button>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Card.Body>
          )}
          
          <Card.Body>
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : loading ? (
              <Loading />
            ) : products.length === 0 ? (
              <div className="text-center py-5">
                <h4>No products found</h4>
                <p className="text-muted">Try adjusting your filters or search term</p>
                <Button 
                  variant="primary"
                  className="mt-3"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Featured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <img 
                            src={getImageUrl(product.images?.[0]?.image)} 
                            alt={product.name} 
                            className="img-thumbnail" 
                            width="50" 
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                            }}
                          />
                        </td>
                        <td>
                          <Link to={`/admin/products/${product.id}`} className="text-decoration-none">
                            {product.name}
                          </Link>
                        </td>
                        <td>{product.category ? product.category.name : '-'}</td>
                        <td>${product.current_price}</td>
                        <td className={product.stock <= 0 ? 'text-danger' : ''}>
                          {product.stock}
                        </td>
                        <td>
                          {product.featured ? (
                            <Badge bg="success">Yes</Badge>
                          ) : (
                            <Badge bg="secondary">No</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link 
                              to={`/admin/products/edit/${product.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <FaEdit />
                            </Link>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminNavbar>
  );
};

export default AdminProductsList;