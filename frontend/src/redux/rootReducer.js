// redux/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './reducer/authSlice';
import cartReducer from './reducer/cartSlice';
import orderReducer from './reducer/orderSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  order: orderReducer,
});

export default rootReducer;