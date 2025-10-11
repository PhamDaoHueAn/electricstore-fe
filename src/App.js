import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ChangePassword from './components/Auth/ChangePassword';
import Dashboard from './components/Admin/Dashboard';
// ... import các component khác
import Home from './components/Customer/Home';
import { isAuthenticated, isAdmin } from './services/auth';
import ProductDetail from './components/Customer/ProductDetail';
import Layout from './components/Layout';


const ProtectedRoute = ({ children, adminOnly }) => {
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/product-detail/:productId" element={<ProductDetail />} />
        {/* Phần Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        {/* ... các routes khác */}
        
        {/* Phần Khách hàng */}
        <Route path="/" element={<Home />} />
      </Routes>
      </Layout>
    </Router>
  );
}

export default App;