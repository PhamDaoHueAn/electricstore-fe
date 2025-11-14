import React from 'react';
import AdminLayout from '../AdminLayout';
import BrandList from './BrandList';
import { Typography } from '@mui/material';

const BrandManagement = () => {
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
        Quản lý Thương hiệu
      </Typography>
      <BrandList />
    </AdminLayout>
  );
};

export default BrandManagement;