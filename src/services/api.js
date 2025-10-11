import axios from 'axios';

const API = axios.create({
  baseURL: 'https://localhost:7248/api',  // Thay port đúng (7248 từ log của bạn, hoặc 5000)
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sửa interceptor response để tránh TypeError
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Kiểm tra an toàn: Chỉ xử lý nếu error.response tồn tại
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await API.post('/Auth/refresh-token', { refreshToken });
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return API(originalRequest);
        } catch (refreshErr) {
          console.error('Refresh token failed', refreshErr);
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    // Log network error rõ ràng hơn
    if (!error.response) {
      console.error('Network error - Backend not responding. Check if server is running on port 7248.');
    }
    
    return Promise.reject(error);
  }
);

export default API;