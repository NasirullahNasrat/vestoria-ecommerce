import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiUrl } from '../../config/env'; // Import the environment utility

const baseQuery = fetchBaseQuery({ 
  baseUrl: getApiUrl('/api'), // Use environment-based URL
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Product', 'Cart', 'User', 'Order'],
  endpoints: (builder) => ({}),
});