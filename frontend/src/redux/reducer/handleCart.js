// Retrieve initial state from localStorage if available
const getInitialCart = () => {
  const storedCart = localStorage.getItem("cart");
  return storedCart ? JSON.parse(storedCart) : [];
};

const handleCart = (state = getInitialCart(), action) => {
  const product = action.payload;
  let updatedCart;

  switch (action.type) {
    case "ADDITEM":
      // Check if product already in cart
      const exist = state.find((x) => x.id === product.id);
      if (exist) {
        // Increase the quantity
        updatedCart = state.map((x) =>
          x.id === product.id ? { ...x, qty: x.qty + 1 } : x
        );
      } else {
        updatedCart = [...state, { ...product, qty: 1 }];
      }
      // Update localStorage
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;

    case "DELITEM":
      const exist2 = state.find((x) => x.id === product.id);
      if (exist2.qty === 1) {
        updatedCart = state.filter((x) => x.id !== exist2.id);
      } else {
        updatedCart = state.map((x) =>
          x.id === product.id ? { ...x, qty: x.qty - 1 } : x
        );
      }
      // Update localStorage
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;

    default:
      return state;
  }
};

export default handleCart;






// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   cartItems: [],
//   totalQuantity: 0,
//   totalAmount: 0,
// };

// const cartSlice = createSlice({
//   name: 'cart',
//   initialState,
//   reducers: {
//     addToCart: (state, action) => {
//       const existingItem = state.cartItems.find(
//         (item) => item.id === action.payload.id
//       );
      
//       if (existingItem) {
//         existingItem.quantity += 1;
//       } else {
//         state.cartItems.push({ ...action.payload, quantity: 1 });
//       }
      
//       state.totalQuantity += 1;
//       state.totalAmount += action.payload.current_price;
//     },
    
//     removeFromCart: (state, action) => {
//       const itemIndex = state.cartItems.findIndex(
//         (item) => item.id === action.payload.id
//       );
      
//       if (itemIndex >= 0) {
//         const item = state.cartItems[itemIndex];
//         state.totalQuantity -= item.quantity;
//         state.totalAmount -= item.current_price * item.quantity;
//         state.cartItems.splice(itemIndex, 1);
//       }
//     },
    
//     decreaseQuantity: (state, action) => {
//       const itemIndex = state.cartItems.findIndex(
//         (item) => item.id === action.payload.id
//       );
      
//       if (itemIndex >= 0) {
//         const item = state.cartItems[itemIndex];
//         if (item.quantity > 1) {
//           item.quantity -= 1;
//           state.totalQuantity -= 1;
//           state.totalAmount -= item.current_price;
//         } else {
//           state.cartItems.splice(itemIndex, 1);
//           state.totalQuantity -= 1;
//           state.totalAmount -= item.current_price;
//         }
//       }
//     },
    
//     clearCart: (state) => {
//       state.cartItems = [];
//       state.totalQuantity = 0;
//       state.totalAmount = 0;
//     },
//   },
// });

// export const { addToCart, removeFromCart, decreaseQuantity, clearCart } = cartSlice.actions;
// export default cartSlice.reducer;