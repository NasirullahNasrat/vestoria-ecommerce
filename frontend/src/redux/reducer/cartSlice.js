import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null
};

// Helper function for auth headers
const getAuthConfig = (getState) => {
  const { token } = getState().auth;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Fetch cart from API
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        'http://localhost:8000/api/cart/',
        getAuthConfig(getState)
      );
      return response.data.items || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch cart');
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ id, name, price, image, qty = 1 }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/cart/items/',
        {
          product: id,
          quantity: qty,
          name,
          price,
          image
        },
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add to cart');
    }
  }
);

// Update cart item quantity
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ id, qty }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/cart/items/${id}/`,
        { quantity: qty },  // Changed from { quantity: qty } to match your API
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update cart item');
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(
        `http://localhost:8000/api/cart/items/${id}/`,
        getAuthConfig(getState)
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove from cart');
    }
  }
);

// Clear entire cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      await axios.delete(
        'http://localhost:8000/api/cart/clear/',
        getAuthConfig(getState)
      );
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to clear cart');
    }
  }
);

// Checkout process
export const checkout = createAsyncThunk(
  'cart/checkout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/orders/create/',
        {},
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Checkout failed');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartError: (state) => {
      state.error = null;
    },
    // Add logout reducer to clear cart state
    logout: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const existingIndex = state.items.findIndex(item => item.id === action.payload.id);
        if (existingIndex >= 0) {
          state.items[existingIndex].qty += action.payload.qty;
        } else {
          state.items.push(action.payload);
        }
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        state.lastUpdated = Date.now();
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.lastUpdated = Date.now();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.lastUpdated = Date.now();
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkout.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.lastUpdated = Date.now();
      })
      .addCase(checkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export the logout action
export const { resetCartError, logout } = cartSlice.actions;
export default cartSlice.reducer;