import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Paper, Typography } from '@mui/material';
import AdminLayout from './AdminLayout';

const items = [
  { to: '/admin/products', label: 'Quản lý Sản phẩm' },
  { to: '/admin/customers', label: 'Quản lý Khách hàng' },
  { to: '/admin/employees', label: 'Quản lý Nhân viên' },
  { to: '/admin/orders', label: 'Quản lý Hóa đơn' },
  { to: '/admin/categories', label: 'Quản lý Danh mục' },
  { to: '/admin/brands', label: 'Quản lý Thương hiệu' },
];

const Dashboard = () => {
  return (
    <AdminLayout>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

      <Grid container spacing={2}>
        {items.map((it) => (
          <Grid item xs={12} sm={6} md={4} key={it.to}>
            <Paper
              component={Link}
              to={it.to}
              elevation={3}
              sx={{
                p: 3,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                cursor: 'pointer',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                transition: 'all 0.15s ease',
              }}
            >
              <Typography variant="h6">{it.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </AdminLayout>
  );
};

export default Dashboard;