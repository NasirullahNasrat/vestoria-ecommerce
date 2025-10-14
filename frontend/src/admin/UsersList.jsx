import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaSearch, 
  FaUserEdit, 
  FaTrash, 
  FaUserShield, 
  FaUser, 
  FaEye,
  FaSync,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import { toast } from "react-hot-toast";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup, 
  Badge,
  Spinner,
  Dropdown
} from 'react-bootstrap';
import AdminNavbar from "./AdminNavbar";
import { 
  isAuthenticated, 
  getAccessToken, 
  logout, 
  isAdmin
} from "../utils/adminAuth";
import { getApiUrl } from "../config/env";

const UsersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
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
        fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Use getAccessToken from adminAuth instead of Redux
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use environment configuration for API URL
      const baseUrl = getApiUrl('/api/admin/customers/');
      const url = new URL(baseUrl);
      
      const params = {
        search: searchTerm,
        role: filters.role !== 'all' ? filters.role : '',
        status: filters.status !== 'all' ? filters.status : ''
      };
      
      Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
      });
      
      console.log("Fetching from:", url.toString());
  
      const response = await fetch(url, {
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
      console.log("API Response:", data);
      
      // Handle different possible response structures
      let customersArray = [];
      
      if (Array.isArray(data)) {
        customersArray = data;
      } else if (data.results && Array.isArray(data.results)) {
        customersArray = data.results;
      } else if (data.customers && Array.isArray(data.customers)) {
        customersArray = data.customers;
      } else if (data.data && Array.isArray(data.data)) {
        customersArray = data.data;
      } else {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          customersArray = [data];
        } else {
          throw new Error('Unexpected response format: ' + JSON.stringify(data));
        }
      }
      
      setCustomers(customersArray);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError(error.message);
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (customerId) => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this customer?',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              const token = getAccessToken();
              // Use environment configuration for API URL
              const apiUrl = getApiUrl(`/api/admin/customers/${customerId}/`);
              
              const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              });

              if (!response.ok) {
                throw new Error('Failed to delete customer');
              }

              toast.success('Customer deleted successfully');
              fetchCustomers();
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

  const handleStatusChange = async (customerId, newStatus) => {
    try {
      const token = getAccessToken();
      // Use environment configuration for API URL
      const apiUrl = getApiUrl(`/api/admin/customers/${customerId}/`);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: newStatus === 'active' })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.message);
      
      if (error.message.includes('401')) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchCustomers();
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      status: 'all'
    });
    setSearchTerm('');
    fetchCustomers();
  };

  const handleRefresh = () => {
    fetchCustomers();
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
    return null;
  }

  return (
    <AdminNavbar activePage="customers">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Customer Management</h2>
            <p className="text-muted">
              Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="primary" onClick={handleRefresh} disabled={refreshing}>
            <FaSync className={refreshing ? 'spin' : ''} />
            <span className="ms-2">Refresh</span>
          </Button>
        </div>

        {/* Debug section - remove after testing */}
        <div style={{ display: 'none' }}>
          <pre>{JSON.stringify(customers, null, 2)}</pre>
        </div>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Customers List</h5>
            <div className="d-flex">
              <Form onSubmit={handleSearch} className="me-3">
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search customers..."
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
                <div className="col-md-6 mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="customer">Customer</option>
                  </Form.Select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </div>
                
                <div className="col-md-12 d-flex justify-content-end gap-2">
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
              <div className="d-flex justify-content-center">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-5">
                <h4>No customers found</h4>
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
                <Table hover striped>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {customer.is_staff ? (
                              <FaUserShield className="text-primary me-2" />
                            ) : (
                              <FaUser className="me-2" />
                            )}
                            {customer.first_name || 'No Name'} {customer.last_name || ''}
                          </div>
                        </td>
                        <td>{customer.email || 'N/A'}</td>
                        <td>{customer.phone || 'N/A'}</td>
                        <td>
                          <Badge bg={customer.is_staff ? 'primary' : 'secondary'}>
                            {customer.is_staff ? 'Admin' : 'Customer'}
                          </Badge>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant={customer.is_active ? 'success' : 'secondary'} 
                              size="sm"
                            >
                              {customer.is_active ? 'Active' : 'Inactive'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleStatusChange(customer.id, 'active')}>
                                Active
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange(customer.id, 'inactive')}>
                                Inactive
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                        <td>{customer.date_joined ? new Date(customer.date_joined).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          {customer.last_login ? 
                            new Date(customer.last_login).toLocaleString() : 
                            'Never'}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => navigate(`/admin/customers/${customer.id}`)}
                            >
                              <FaEye />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
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

export default UsersList;