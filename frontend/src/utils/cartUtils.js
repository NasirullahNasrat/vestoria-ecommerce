// src/utils/cartUtils.js
export const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };
  
  export const calculateTotalItems = (items) => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  };