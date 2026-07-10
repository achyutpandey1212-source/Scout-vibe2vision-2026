import axios from 'axios';
import { auth } from '@/lib/firebase/client';
import { env } from '@/config/env';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Firebase ID Token in Authorization Header automatically for all requests
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to retrieve Firebase ID Token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
