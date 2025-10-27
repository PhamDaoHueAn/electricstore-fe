import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import API from '../../services/api';
import { isAuthenticated } from '../../services/auth';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch thông tin khách hàng và lịch sử mua hàng
  const fetchProfileData = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch thông tin khách hàng
      const profileResponse = await API.get('/Auth/get-my-profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        timeout: 5000,
      });
      console.log('Profile API response:', profileResponse.data);
      setUser(profileResponse.data);

      // Fetch lịch sử mua hàng
      const ordersResponse = await API.get('/Order/getByCustomer', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        timeout: 5000,
      });
      console.log('Orders API response:', ordersResponse.data);
      setOrders(ordersResponse.data || []);
    } catch (err) {
      console.error('Error fetching profile data:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      } else {
        setError('Không thể tải thông tin khách hàng hoặc lịch sử mua hàng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Thông tin khách hàng */}
          <Box
            sx={{
              backgroundColor: 'white',
              p: 4,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Avatar
              src={user?.imageUrl || '/images/default-avatar.jpg'}
              alt={user?.fullName}
              sx={{ width: 100, height: 100 }}
              onError={(e) => { e.target.src = '/images/default-avatar.jpg'; }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0560e7' }}>
                {user?.fullName || 'Khách hàng'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Email: {user?.email || 'Chưa cập nhật'}
              </Typography>
              <Typography variant="body1">
                Số điện thoại: {user?.phone || 'Chưa cập nhật'}
              </Typography>
              <Typography variant="body1">
                Địa chỉ: {user?.address || 'Chưa cập nhật'}
              </Typography>
              <Typography variant="body1">
                Giới tính: {user?.gender || 'Chưa cập nhật'}
              </Typography>
              <Typography variant="body1">
                Ngày sinh: {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
              </Typography>
              <Typography variant="body1">
                Điểm tích lũy: {user?.point || 0}
              </Typography>
            </Box>
          </Box>

          {/* Lịch sử mua hàng */}
          <Box sx={{ backgroundColor: 'white', p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0560e7', mb: 2 }}>
              Lịch sử mua hàng
            </Typography>
            {orders.length === 0 ? (
              <Typography variant="body1" sx={{ color: '#666' }}>
                Bạn chưa có đơn hàng nào.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã đơn hàng</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ngày đặt</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tổng tiền</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Địa chỉ giao</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>SĐT</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Phương thức thanh toán</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell>{order.orderCode}</TableCell>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString('vi-VN')} {new Date(order.orderDate).toLocaleTimeString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          {order.totalAmount.toLocaleString('vi-VN')}₫
                        </TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>{order.shippingAddress || 'Chưa cung cấp'}</TableCell>
                        <TableCell>{order.phoneNumber || 'Chưa cung cấp'}</TableCell>
                        <TableCell>{order.paymentMethod || 'Chưa cung cấp'}</TableCell>
                        <TableCell>
                          {order.orderDetails?.map((item) => (
                            <Box key={item.orderDetailId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <img
                                src={item.productImage || '/images/placeholder-product.jpg'}
                                alt={item.productName}
                                style={{ width: 50, height: 50, objectFit: 'cover' }}
                                onError={(e) => { e.target.src = '/images/placeholder-product.jpg'; }}
                              />
                              <Box>
                                <Typography variant="body2">{item.productName}</Typography>
                                <Typography variant="caption">
                                  Số lượng: {item.quantity} | Giá: {item.price.toLocaleString('vi-VN')}₫
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default Profile;