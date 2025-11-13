import API from './api';
import { jwtDecode } from 'jwt-decode';

export const login = async ({ username, password }) => {
  const response = await API.post('/Auth/login', {
    username,
    password,
  });
  const { accessToken, refreshToken } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  window.dispatchEvent(new Event('authChange')); // Thông báo đăng nhập
  return response.data;
};

export const register = async (data) => {
  const response = await API.post('/Auth/register', data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await API.post('/Auth/forgot-password', { email });
  return response.data;
};

export const changePassword = async (data) => {
  const response = await API.post('/Auth/change-password', data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.dispatchEvent(new Event('authChange')); // Thông báo đăng xuất
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('authChange'));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Invalid token:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new Event('authChange'));
    return false;
  }
};

export const isAdmin = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Admin';
  } catch (error) {
    console.error('Invalid token:', error);
    return false;
  }
};

export const isAdminOrEmployee = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role === 'Admin' || role === 'Employee';
  } catch (error) {
    console.error('Invalid token:', error);
    return false;
  }
};