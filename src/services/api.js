import axios from 'axios';

const API = axios.create({
  baseURL: 'http://14.225.254.184:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // Thêm timeout mặc định 10s
});

// Request interceptor: Thêm Authorization header nếu có accessToken
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Request: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý lỗi 401 và refresh token
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi 401 với refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          console.log('Attempting to refresh token...');
          const res = await axios.post('http://14.225.254.184:8080/api/Auth/refresh-token', { refreshToken });
          console.log('Refresh token response:', res.data);
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return API(originalRequest);
        } catch (refreshErr) {
          console.error('Refresh token failed:', refreshErr.response?.data || refreshErr.message);
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      } else {
        console.warn('No refresh token found, redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // Xử lý lỗi mạng hoặc không có response
    if (!error.response) {
      console.error('Network error:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        advice: 'Check if backend server is running on https://localhost:7248 and CORS is configured correctly.',
      });
    } else {
      // Log chi tiết lỗi từ server
      console.error('API error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
        method: error.config.method,
      });
    }

    return Promise.reject(error);
  }
);

export default API;