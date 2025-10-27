import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import API from '../../services/api';
import { isAuthenticated } from '../../services/auth';
import styles from './Checkout.module.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'vnpay'
  const [voucherCode, setVoucherCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0); // Số điểm thực tế sử dụng

  // Thông tin khách hàng
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const [cartResponse, profileResponse] = await Promise.all([
          API.get('/Cart', {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            timeout: 5000,
          }),
          API.get('/Auth/get-my-profile', {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            timeout: 5000,
          }),
        ]);

        const cartData = Array.isArray(cartResponse.data) ? cartResponse.data : [];
        setCartItems(cartData);
        setUserPoints(profileResponse.data.point || 0);
        calculateTotal(cartData);
        if (cartData.length === 0) {
          setError('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
          navigate('/cart');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError('Không thể tải giỏ hàng hoặc thông tin người dùng. Vui lòng thử lại.');
        }
        console.error('Error loading data:', error);
        setCartItems([]);
        calculateTotal([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const calculateTotal = (items) => {
    const total = Array.isArray(items)
      ? items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
      : 0;
    setTotalPrice(total);

    // Tính giảm giá
    const discount = voucherCode ? voucherDiscount : 0;
    const maxPoints = Math.floor(total / 10000); // Tối đa điểm có thể dùng
    const pointsToUse = usePoints ? Math.min(userPoints, maxPoints) : 0;
    const pointsDiscount = pointsToUse * 10000; // 1 điểm = 10,000 VNĐ
    setUsedPoints(pointsToUse);

    const final = total - discount - pointsDiscount;
    setFinalPrice(final);
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setError('Vui lòng nhập mã voucher.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.get(`/Checkout/check-voucher/${voucherCode}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        timeout: 5000,
      });
      setVoucherDiscount(response.data.discountAmount || 0);
      setError(null);
      calculateTotal(cartItems);
    } catch (error) {
      setError(error.response?.data?.message || 'Voucher không hợp lệ.');
      setVoucherDiscount(0);
      calculateTotal(cartItems);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!fullName || !phoneNumber || !address) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
      navigate('/cart');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const checkoutData = {
        fullName,
        phoneNumber,
        address,
        voucherCode: voucherCode.trim() || null,
        usePoint: usePoints,
        usedPoints,
      };

      let response;
      if (paymentMethod === 'cod') {
        response = await API.post('/Checkout/cod', checkoutData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          timeout: 10000,
        });
      } else {
        response = await API.post('/Checkout/CreateVnPayPayment', checkoutData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          timeout: 10000,
        });
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/order-success'), 2000);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(error.response?.data?.message || 'Không thể hoàn tất thanh toán. Vui lòng thử lại.');
      }
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Đang tải giỏ hàng...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={styles.checkoutContainer}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Thanh toán
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Thanh toán thành công! Đang chuyển hướng...
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Danh sách sản phẩm */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sản phẩm trong giỏ hàng
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="right">Giá</TableCell>
                  <TableCell align="center">Số lượng</TableCell>
                  <TableCell align="right">Tổng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography className={styles.emptyCart}>Giỏ hàng trống</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cartItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <img
                            src={item.mainImage || '/placeholder-product.jpg'}
                            alt={item.productName}
                            style={{ width: 50, height: 50, objectFit: 'cover' }}
                            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                          />
                          <Typography>{item.productName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{item.sellPrice.toLocaleString('vi-VN')}₫</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {(item.sellPrice * item.quantity).toLocaleString('vi-VN')}₫
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Voucher và điểm */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Áp dụng ưu đãi
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Mã voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                sx={{ flex: 1 }}
                disabled={loading}
              />
              <Button variant="contained" onClick={applyVoucher} disabled={loading}>
                Áp dụng
              </Button>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={usePoints}
                  onChange={(e) => {
                    setUsePoints(e.target.checked);
                    calculateTotal(cartItems);
                  }}
                  disabled={userPoints === 0 || loading}
                />
              }
              label={`Sử dụng ${userPoints} điểm (1 điểm = 10,000₫) - Giảm ${usePoints ? (usedPoints * 10000).toLocaleString('vi-VN') : 0}₫`}
            />
          </Box>
        </Box>

        {/* Thông tin thanh toán */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Thông tin thanh toán
          </Typography>
          <TextField
            fullWidth
            label="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Số điện thoại"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Địa chỉ giao hàng"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="cod">Thanh toán khi nhận hàng (COD)</MenuItem>
              <MenuItem value="vnpay">Thanh toán qua VNPay</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Tổng kết
            </Typography>
            <Typography sx={{ mb: 1 }}>
              Tổng tiền: {totalPrice.toLocaleString('vi-VN')}₫
            </Typography>
            {voucherDiscount > 0 && (
              <Typography color="success.main" sx={{ mb: 1 }}>
                Giảm voucher: -{voucherDiscount.toLocaleString('vi-VN')}₫
              </Typography>
            )}
            {usePoints && usedPoints > 0 && (
              <Typography color="success.main" sx={{ mb: 1 }}>
                Giảm điểm ({usedPoints} điểm): -{(usedPoints * 10000).toLocaleString('vi-VN')}₫
              </Typography>
            )}
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              Tổng thanh toán: {finalPrice.toLocaleString('vi-VN')}₫
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            sx={{ py: 2, mt: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất thanh toán'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Checkout;