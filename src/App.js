import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ChangePassword from './components/Auth/ChangePassword';
import Dashboard from './components/Admin/Dashboard';
import ProductsManagement from './components/Admin/ProductsManagement';
import CategoryManagement from './components/Admin/CategoryManagement';
import BrandManagement from './components/Admin/BrandManagement';
import OrderManagement from './components/Admin/OrderManagement';
import ReviewManagement from './components/Admin/ReviewManagement';

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
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Home />} />
          <Route path="/product-detail/:productId" element={<ProductDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/category/:categoryId" element={<CategoryProducts />} />

          {/* GUEST-ALLOWED ROUTES (KHÁCH VÃNG LAI ĐƯỢC DÙNG) */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />

          {/* PROTECTED ROUTES (BẮT BUỘC ĐĂNG NHẬP) */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute adminOnly>
                <ProductsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <CategoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <ProtectedRoute adminOnly>
                <BrandManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute adminOnly>
                <ReviewManagement />
              </ProtectedRoute>
            }
          />
          {/* ... các route admin khác */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;