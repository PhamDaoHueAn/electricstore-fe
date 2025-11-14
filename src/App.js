import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ChangePassword from './components/Auth/ChangePassword';
import EmployeeProfile from './components/Admin/EmployeeProfile';
import ProductsManagement from './components/Admin/ProductsManagement/ProductsManagement';
import CategoryManagement from './components/Admin/CategoryManagement/CategoryManagement';
import BrandManagement from './components/Admin/BrandManagement/BrandManagement';
import OrderManagement from './components/Admin/OrderManagement/OrderManagement';
import ReviewManagement from './components/Admin/ReviewManagement/ReviewManagement';
import VoucherManagement from './components/Admin/VoucherManagement/VoucherManagement';
import BannerManagement from './components/Admin/BannerManagement/BannerManagement';
import FlashSaleManagement from './components/Admin/FlashSaleManagement/FlashSaleManagement';
import CustomerManagement from './components/Admin/CustomerManagement/CustomerManagement';
import EmployeeManagement from './components/Admin/EmployeeManagement/EmployeeManagement';
import SupplierManagement from './components/Admin/SupplierMannagement/SupplierMannagement';
import QuestionAndAnswerManagement from './components/Admin/QuestionAndAnswerManagement/QuestionAndAnswerManagement';

import Home from './components/Customer/Home';
import { isAuthenticated, isAdmin, isAdminOrEmployee } from './services/auth';
import ProductDetail from './components/Customer/ProductDetail';

import Layout from './components/Layout';
import Cart from './components/Customer/Cart';
import Checkout from './components/Customer/Checkout';
import OrderSuccess from './components/Customer/OrderSuccess';
import VNPayReturn from './components/Customer/VNPayReturn';
import SearchResults from './components/Customer/SearchResults';
import CategoryProducts from './components/Customer/CategoryProducts';
import Profile from './components/Customer/Profile';

const ProtectedRoute = ({ children, adminOnly, adminOrEmployee }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />;
  if (adminOrEmployee && !isAdminOrEmployee()) return <Navigate to="/" replace />;
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
          <Route path="/vnpay-return" element={<VNPayReturn />} />

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

          {/* ADMIN & EMPLOYEE ROUTES */}
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute adminOrEmployee>
                <EmployeeProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute adminOrEmployee>
                <ProductsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute adminOrEmployee>
                <CategoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <ProtectedRoute adminOrEmployee>
                <BrandManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute adminOrEmployee>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute adminOrEmployee>
                <ReviewManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vouchers"
            element={
              <ProtectedRoute adminOrEmployee>
                <VoucherManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/flashsale"
            element={
              <ProtectedRoute adminOrEmployee>
                <FlashSaleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <ProtectedRoute adminOrEmployee>
                <BannerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/flashsales"
            element={
              <ProtectedRoute adminOrEmployee>
                <FlashSaleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <ProtectedRoute adminOrEmployee>
                <SupplierManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qna"
            element={
              <ProtectedRoute adminOrEmployee>
                <QuestionAndAnswerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute adminOrEmployee>
                <CustomerManagement />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ONLY ROUTES */}
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute adminOnly>
                <EmployeeManagement />
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