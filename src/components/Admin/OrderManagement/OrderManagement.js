import React from 'react';
import AdminLayout from '../AdminLayout';
import OrderList from './OrderList';
import { Typography } from '@mui/material';

const OrderManagement = () => {
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
        Quản lý Đơn hàng
      </Typography>
      <OrderList />
    </AdminLayout>
  );
};

export default OrderManagement;
