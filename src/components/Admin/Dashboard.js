import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Button } from '@mui/material';

const Dashboard = () => {
  return (
    <Grid container spacing={2}>
      <Grid item><Link to="/admin/customers"><Button>Quản lý Khách hàng</Button></Link></Grid>
      <Grid item><Link to="/admin/employees"><Button>Quản lý Nhân viên</Button></Link></Grid>
      {/* Thêm buttons cho các chức năng khác: Danh mục sản phẩm, Nhập/Xuất hàng, Tìm kiếm, Tích điểm, Hóa đơn, Thống kê */}
    </Grid>
  );
};

export default Dashboard;