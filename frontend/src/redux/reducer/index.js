import handleCart from './handleCart'
import { combineReducers } from "redux";
const rootReducers = combineReducers({
    handleCart,
})
export default rootReducers



// import { combineReducers } from 'redux';
// import cartReducer from './handleCart';
// import authReducer from './authSlice';

// const rootReducer = combineReducers({
//   cart: cartReducer,
//   auth: authReducer,
// });

// export default rootReducer;