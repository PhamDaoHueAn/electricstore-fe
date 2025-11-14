import React from 'react';
import AdminLayout from '../AdminLayout';
import CategoryList from './CategoryList';
import { Typography } from '@mui/material';

const CategoryManagement = () => {
  return (
    <AdminLayout>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'text.primary',
          mb: 3
        }}
      >
        Quản lý Danh mục
      </Typography>
      <CategoryList />
    </AdminLayout>
  );
};

export default CategoryManagement;