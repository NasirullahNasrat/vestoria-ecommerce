import { apiSlice } from './apiSlice';

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ page = 1, limit = 10, category = null, search = '' }) => ({
        url: '/products/',
        params: { page, limit, category, search },
      }),
      providesTags: ['Product'],
    }),
    
    getProduct: builder.query({
      query: (id) => `/products/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    
    createProduct: builder.mutation({
      query: (product) => ({
        url: '/products/',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const { 
  useGetProductsQuery, 
  useGetProductQuery,
  useCreateProductMutation,
} = productApi;