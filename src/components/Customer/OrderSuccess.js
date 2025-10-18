import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Đặt hàng thành công!
      </Typography>
      <Typography sx={{ mb: 4 }}>
        Cảm ơn bạn đã mua sắm. Đơn hàng sẽ được xử lý sớm.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Về trang chủ
      </Button>
    </Container>
  );
};

export default OrderSuccess;