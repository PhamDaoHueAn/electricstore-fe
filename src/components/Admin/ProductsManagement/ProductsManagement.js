import React from 'react';
import AdminLayout from '../AdminLayout';
import ProductList from './ProductList';
import { Typography } from '@mui/material';

const ProductsManagement = () => {
  return (
    <AdminLayout>
      <Typography variant="h4" gutterBottom>Quản lý Sản phẩm</Typography>
      <ProductList />
    </AdminLayout>
  );
};

export default ProductsManagement;
