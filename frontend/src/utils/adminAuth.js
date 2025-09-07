// src/utils/adminAuth.js

// Admin-specific token management (using different keys to avoid conflicts)
export const getAccessToken = () => localStorage.getItem('adminAccessToken');
export const getRefreshToken = () => localStorage.getItem('adminRefreshToken');

// User data management
export const getUser = () => {
  try {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const isAdmin = () => {
  const user = getUser();
  return user?.isAdmin || false;
};

// Login function
export const login = (tokens, userData) => {
  localStorage.setItem('adminAccessToken', tokens.access);
  localStorage.setItem('adminRefreshToken', tokens.refresh);
  localStorage.setItem('adminUser', JSON.stringify(userData));
};

// Logout function
export const logout = () => {
  localStorage.removeItem('adminAccessToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('rememberMe');
};

// Check if token exists and is valid (includes JWT expiration check)
export const isTokenValid = () => {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    // Parse JWT payload to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp < currentTime) {
      // Token is expired
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error parsing token:', error);
    logout();
    return false;
  }
};

// Check if user is authenticated (both token valid and is admin)
export const isAuthenticated = () => {
  return isTokenValid() && isAdmin();
};

// Refresh token function
export const refreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  try {
    const response = await fetch('http://localhost:8000/api/admin_token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Store the new access token
    localStorage.setItem('adminAccessToken', data.access);
    
    return data.access;
  } catch (error) {
    console.error('Token refresh error:', error);
    logout();
    throw error;
  }
};

// Verify token with server
export const verifyToken = async () => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No token found');
  }

  try {
    const response = await fetch('http://localhost:8000/api/admin_token/verify/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      // Try to refresh token if verification fails
      try {
        const newToken = await refreshToken();
        return newToken;
      } catch (refreshError) {
        throw new Error('Token verification and refresh failed');
      }
    }

    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    logout();
    throw error;
  }
};

// Get authenticated fetch headers
export const getAuthHeaders = () => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Make authenticated API requests
export const authFetch = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    let response = await fetch(url, { ...options, headers });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      try {
        const newToken = await refreshToken();
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } catch (refreshError) {
        logout();
        window.location.href = '/admin/login';
        throw new Error('Authentication required');
      }
    }

    return response;
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};

// Check if remember me was enabled
export const shouldRememberMe = () => {
  return localStorage.getItem('rememberMe') === 'true';
};

// Get current admin username
export const getUsername = () => {
  const user = getUser();
  return user?.username || '';
};

// Check if user needs to re-authenticate (for sensitive operations)
export const requiresReauth = () => {
  const lastAuth = localStorage.getItem('lastAuthTime');
  if (!lastAuth) return true;
  
  const currentTime = Date.now();
  const timeDiff = currentTime - parseInt(lastAuth);
  const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return timeDiff > fifteenMinutes;
};

// Update last authentication time
export const updateLastAuthTime = () => {
  localStorage.setItem('lastAuthTime', Date.now().toString());
};





// 
export const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};





// Clear all admin auth data
export const clearAllAdminAuth = () => {
  localStorage.removeItem('adminAccessToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('lastAuthTime');
};





