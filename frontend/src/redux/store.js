import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducer/authSlice';
import cartReducer from './reducer/cartSlice';
import orderReducer from './reducer/orderSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    order: orderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.headers', 'payload.config'],
        ignoredPaths: ['order.currentOrder.created'], // Ignore non-serializable fields
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;