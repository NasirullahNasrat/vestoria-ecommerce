import { apiSlice } from './apiSlice';

export const cartApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/cart/',
      providesTags: ['Cart'],
    }),
    
    addToCart: builder.mutation({
      query: (productId) => ({
        url: '/cart/add/',
        method: 'POST',
        body: { product_id: productId },
      }),
      invalidatesTags: ['Cart'],
    }),
    
    removeFromCart: builder.mutation({
      query: (productId) => ({
        url: '/cart/remove/',
        method: 'POST',
        body: { product_id: productId },
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const { 
  useGetCartQuery, 
  useAddToCartMutation,
  useRemoveFromCartMutation,
} = cartApi;