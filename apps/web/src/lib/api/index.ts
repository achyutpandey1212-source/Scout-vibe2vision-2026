import axios from 'axios';
import { auth } from '@/lib/firebase/client';
import { env } from '@/config/env';

export * from './types';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

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
  (error) => Promise.reject(error),
);

export const authApi = {
  sync: () => api.post('/api/v1/auth/sync'),
  me: () => api.get('/api/v1/auth/me'),
};

export const profileApi = {
  get: () => api.get('/api/v1/profile'),
  update: (data: any) => api.post('/api/v1/profile', data),
  completeOnboarding: () => api.post('/api/v1/profile/onboarding/complete'),
  getV2: () => api.get('/api/v1/profile/v2'),
  updateV2: (data: any) => api.post('/api/v1/profile/v2', data),
  uploadResumeV2: (formData: FormData) =>
    api.post('/api/v1/profile/v2/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  mergeProfileV2: (data: any) => api.post('/api/v1/profile/v2/merge', data),
};

export const opportunitiesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    opportunityType?: string;
    q?: string;
    sortBy?: string;
    platform?: string;
  }) => api.get('/api/v1/opportunities', { params }),
  getById: (id: string) => api.get(`/api/v1/opportunities/${id}`),
  counts: (params?: { platform?: string }) => api.get('/api/v1/opportunities/counts', { params }),
};

export const recommendationsApi = {
  list: () => api.get('/api/v1/recommendations'),
};

export const bookmarksApi = {
  list: () => api.get('/api/v1/bookmarks'),
  add: (opportunityId: string) => api.post('/api/v1/bookmarks', { opportunityId }),
  remove: (opportunityId: string) => api.delete(`/api/v1/bookmarks/${opportunityId}`),
};

export const sourcesApi = {
  getStats: () => api.get('/api/v1/discovery/sources/stats'),
  list: () => api.get('/api/v1/discovery/sources'),
};
