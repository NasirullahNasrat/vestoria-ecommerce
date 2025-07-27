import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register/',
        method: 'POST',
        body: userData,
      }),
    }),
    
    getUser: builder.query({
      query: () => '/auth/user/',
      providesTags: ['User'],
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation,
  useGetUserQuery,
} = authApi;