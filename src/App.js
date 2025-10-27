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
import Cart from './components/Customer/Cart';
import Checkout from './components/Customer/Checkout';
import OrderSuccess from './components/Customer/OrderSuccess';
import SearchResults from './components/Customer/SearchResults';
import CategoryProducts from './components/Customer/CategoryProducts';
import Profile from './components/Customer/Profile';

const ProtectedRoute = ({ children, adminOnly }) => {
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>c 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/product-detail/:productId" element={<ProductDetail />} />
        <Route path="/cart" element={<ProtectedRoute><Cart/></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><OrderSuccess/></ProtectedRoute>} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/category/:categoryId" element={<CategoryProducts />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
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