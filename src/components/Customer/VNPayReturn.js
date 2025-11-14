import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Paper, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import API from '../../services/api';

const VNPayReturn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Lấy tất cả query params từ URL
        const queryString = window.location.search;

        console.log('Query String:', queryString);

        // Gọi API backend để xác thực thanh toán
        const response = await API.get(`/Checkout/VnPayReturn${queryString}`);

        console.log('API Response:', response.data);

        // Kiểm tra nhiều cấu trúc response có thể có
        if (response.data) {
          // Trường hợp 1: { order: {...} }
          if (response.data.order) {
            setOrderData(response.data.order);
          }
          // Trường hợp 2: { Order: {...} } (Pascal case)
          else if (response.data.Order) {
            setOrderData(response.data.Order);
          }
          // Trường hợp 3: response.data chính là order data
          else if (response.data.orderCode || response.data.OrderCode) {
            setOrderData(response.data);
          }
          // Trường hợp 4: { message: "...", order: {...} }
          else if (response.data.message && response.data.message.toLowerCase().includes('success')) {
            setOrderData(response.data);
          }
          else {
            console.error('Unknown response structure:', response.data);
            setError('Không tìm thấy thông tin đơn hàng');
          }
        } else {
          setError('Không nhận được phản hồi từ server');
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra khi xác thực thanh toán');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <CircularProgress size={60} />
          <Typography variant="h6">Đang xử lý kết quả thanh toán...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="error">
            Thanh toán thất bại
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="success.main">
            Thanh toán thành công!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận.
          </Typography>
        </Box>

        {orderData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1, mb: 2 }}>
              Thông tin đơn hàng
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">
                  Mã đơn hàng:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {orderData.orderCode}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">
                  Tổng tiền:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatCurrency(orderData.totalAmount)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">
                  Trạng thái:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="success.main">
                  {orderData.status}
                </Typography>
              </Box>

              {orderData.discountVoucher > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">
                    Giảm giá voucher:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="error">
                    -{formatCurrency(orderData.discountVoucher)}
                  </Typography>
                </Box>
              )}

              {orderData.discountPoint > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">
                    Giảm giá điểm:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="error">
                    -{formatCurrency(orderData.discountPoint)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">
                  Phương thức thanh toán:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {orderData.paymentMethod}
                </Typography>
              </Box>

              {orderData.transactionCode && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">
                    Mã giao dịch:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {orderData.transactionCode}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">
                  Ngày đặt hàng:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatDate(orderData.paymentDate)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={() => navigate('/profile')}>
                Xem đơn hàng
              </Button>
              <Button variant="outlined" onClick={() => navigate('/')}>
                Tiếp tục mua sắm
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VNPayReturn;
