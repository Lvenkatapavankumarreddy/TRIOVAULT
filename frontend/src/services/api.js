import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token for cross-domain support
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('triovault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or unauthenticated
      if (!window.location.pathname.includes('/unlock')) {
        window.dispatchEvent(new CustomEvent('vault:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  unlock: (password) => api.post('/auth/unlock', { password }),
  lock: () => api.post('/auth/lock'),
  getSession: () => api.get('/auth/session'),
};

// Folder APIs
export const folderApi = {
  getFolders: () => api.get('/folders'),
  getFolderById: (folderId, logActivity = true) => 
    api.get(`/folders/${folderId}`, { params: { logActivity } }),
  getFolderStats: (folderId) => api.get(`/folders/${folderId}/stats`),
};

// File APIs
export const fileApi = {
  getFilesByFolder: (folderId, params = {}) => 
    api.get(`/files/${folderId}`, { params }),
  getFileById: (fileId) => api.get(`/files/file/${fileId}`),
  uploadFiles: (formData, onProgress) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
  downloadFile: (fileId) => api.get(`/files/${fileId}/download`),
  previewFile: (fileId) => api.get(`/files/${fileId}/preview`),
  renameFile: (fileId, newName) => api.put(`/files/${fileId}/rename`, { newName }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
};

// Activity APIs
export const activityApi = {
  getActivities: (limit = 50) => api.get('/activities', { params: { limit } }),
  getFolderActivities: (folderId, limit = 50) => 
    api.get(`/activities/${folderId}`, { params: { limit } }),
};

// Analytics APIs
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
};

export default api;

