// src/config/env.js

const config = {
    // API Configuration
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
    
    // Environment
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
    IS_DEVELOPMENT: process.env.REACT_APP_ENVIRONMENT === 'development',
    IS_PRODUCTION: process.env.REACT_APP_ENVIRONMENT === 'production',
    IS_STAGING: process.env.REACT_APP_ENVIRONMENT === 'staging',
    
    // App Info
    APP_NAME: process.env.REACT_APP_NAME || 'React App',
    APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
    
    // Feature Flags
    DEBUG: process.env.REACT_APP_DEBUG === 'true',
    ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    
    // API Endpoints (you can also put these in a separate api.js file)
    ENDPOINTS: {
      AUTH: {
        LOGIN: '/api/auth/login/',
        LOGOUT: '/api/auth/logout/',
        CHECK: '/api/auth/check/',
      },
      SETTINGS: '/api/system-settings/',
      PRODUCTS: '/api/products/',
      USERS: '/api/users/',
      ORDERS: '/api/orders/',
    }
  };
  
  // Helper function to get full API URL
  export const getApiUrl = (endpoint) => {
    return `${config.API_BASE_URL}${endpoint}`;
  };
  
  // Export the config object
  export default config;