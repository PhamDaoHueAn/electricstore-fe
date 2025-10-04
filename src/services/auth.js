import { jwtDecode } from 'jwt-decode'; 
import API from './api';

export const login = async (credentials) => {
  const res = await API.post('/auth/login', credentials);
  localStorage.setItem('accessToken', res.data.accessToken);
  localStorage.setItem('refreshToken', res.data.refreshToken);
  return res.data;
};

export const register = async (data) => {
  const res = await API.post('/auth/register', data);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await API.post('/auth/forgot-password', { email });
  return res.data;
};

export const changePassword = async (data) => {
  const res = await API.post('/auth/change-password', data);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

export const isAdmin = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  const decoded = jwtDecode(token);
  return decoded.role === 'Admin'; // Adjust based on your JWT claim
};