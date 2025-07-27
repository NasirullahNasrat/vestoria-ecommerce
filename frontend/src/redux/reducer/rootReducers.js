// rootReducers.js
import { combineReducers } from 'redux';
import cartReducer from './handleCart';
import authReducer from './authSlice';

const rootReducer = combineReducers({
  cart: cartReducer,
  auth: authReducer,
});

// Optional: Add a reset action
export const resetStore = () => ({ type: 'RESET_STORE' });

const resettableRootReducer = (state, action) => {
  if (action.type === 'RESET_STORE') {
    return rootReducer(undefined, action);
  }
  return rootReducer(state, action);
};

export default resettableRootReducer;