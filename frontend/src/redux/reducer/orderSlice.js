import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper function to format API errors
const formatApiErrors = (error) => {
  if (error.response?.data) {
    // Handle Django REST framework error format
    if (typeof error.response.data === 'object') {
      // Handle nested errors or non-field errors
      if (error.response.data.detail) {
        return error.response.data.detail;
      }
      return Object.entries(error.response.data)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n');
    }
    return error.response.data;
  }
  return error.message || 'Request failed';
};

// Normalize order data structure
const normalizeOrderData = (order) => ({
  ...order,
  id: order.id || order._id,
  order_number: order.order_number || order.id,
  created: order.created || order.created_at,
  updated: order.updated || order.updated_at,
  status: order.status?.toLowerCase() || 'pending',
  items: Array.isArray(order.items) ? order.items : [],
  total: parseFloat(order.total) || 0,
});

// Create a new order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { auth, cart } = getState();
      const { token } = auth;
      const { items } = cart;

      if (!token) {
        throw new Error('Authentication required');
      }

      if (!items || items.length === 0) {
        throw new Error('Cart is empty');
      }

      const validatedItems = items.map(item => {
        const product = item.product_details || item.product || item;
        
        if (!product?.id) {
          throw new Error(`Missing product ID for item: ${product?.name || 'Unknown'}`);
        }
        
        const quantity = item.quantity || 1;
        if (typeof quantity !== 'number' || quantity <= 0) {
          throw new Error(`Invalid quantity for ${product.name}`);
        }
        
        const price = product.current_price || product.price;
        if (typeof price !== 'number' || isNaN(price)) {
          throw new Error(`Invalid price for ${product.name}`);
        }

        return {
          product_id: product.id,
          quantity: quantity,
          price: price.toFixed(2)
        };
      });

      const payload = {
        ...orderData,
        items: validatedItems
      };

      const response = await axios.post(
        'http://localhost:8000/api/orders/create/',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return normalizeOrderData(response.data);
    } catch (error) {
      return rejectWithValue(formatApiErrors(error));
    }
  }
);

// Fetch all orders for the current user
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        'http://localhost:8000/api/orders/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Handle different response formats
      let ordersData = response.data;
      if (!Array.isArray(ordersData)) {
        if (ordersData.results) {
          ordersData = ordersData.results; // Handle paginated responses
        } else if (ordersData.orders) {
          ordersData = ordersData.orders; // Handle nested orders response
        } else {
          throw new Error('Invalid orders data format');
        }
      }
      
      return ordersData.map(normalizeOrderData);
    } catch (error) {
      return rejectWithValue(formatApiErrors(error));
    }
  }
);

// Fetch a single order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        `http://localhost:8000/api/orders/${orderId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return normalizeOrderData(response.data);
    } catch (error) {
      return rejectWithValue(formatApiErrors(error));
    }
  }
);

// Clear the cart after successful order
export const clearCart = createAsyncThunk(
  'orders/clearCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.delete(
        'http://localhost:8000/api/cart/clear/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return true;
    } catch (error) {
      return rejectWithValue(formatApiErrors(error));
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    loading: false,
    error: null,
    orders: [],
    currentOrder: null,
    checkoutStatus: null, // 'processing', 'success', 'failed'
    lastFetched: null,
  },
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.error = null;
      state.currentOrder = null;
      state.checkoutStatus = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.checkoutStatus = 'processing';
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload);
        state.checkoutStatus = 'success';
        state.lastFetched = new Date().toISOString();
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.checkoutStatus = 'failed';
      })
      
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  resetOrderState, 
  clearCurrentOrder,
  clearOrderError 
} = orderSlice.actions;

// Selectors
export const selectAllOrders = (state) => state.order.orders;
export const selectCurrentOrder = (state) => state.order.currentOrder;
export const selectOrderLoading = (state) => state.order.loading;
export const selectOrderError = (state) => state.order.error;
export const selectCheckoutStatus = (state) => state.order.checkoutStatus;
export const selectLastFetched = (state) => state.order.lastFetched;

export default orderSlice.reducer;