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
import styles from './Checkout.module.css';

const GUEST_CART_KEY = 'guestCart';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Thông tin khách hàng
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // === KIỂM TRA ĐĂNG NHẬP ===
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // === LẤY GIỎ HÀNG KHÁCH ===
  const getGuestCart = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // === LÀM MỚI TOKEN ===
  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) throw new Error('No refresh token');
    const response = await API.post('/Auth/refresh-token', { refreshToken: refreshTokenValue });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data.accessToken;
  };

  const callApi = async (apiCall) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      return await apiCall(token);
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const newToken = await refreshToken();
          return await apiCall(newToken);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          window.dispatchEvent(new Event('authChange'));
          return null;
        }
      }
      throw error;
    }
  };

  // === TẢI DỮ LIỆU ===
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      let items = [];

      if (isLoggedIn) {
        try {
          const [cartRes, profileRes] = await Promise.all([
            callApi(t => API.get('/Cart', { headers: { Authorization: `Bearer ${t}` } })),
            callApi(t => API.get('/Auth/get-my-profile', { headers: { Authorization: `Bearer ${t}` } }))
          ]);

          items = Array.isArray(cartRes?.data) ? cartRes.data : [];
          const profile = profileRes?.data || {};

          // TỰ ĐỘNG ĐIỀN THÔNG TIN
          setFullName(profile.fullName || '');
          setPhoneNumber(profile.phoneNumber || '');
          setAddress(profile.address || '');
          setUserPoints(profile.point || 0);
        } catch (err) {
          console.error('Lỗi tải dữ liệu:', err);
          setError('Không thể tải thông tin. Vui lòng đăng nhập lại.');
          items = getGuestCart();
        }
      } else {
        items = getGuestCart();
        if (items.length === 0) {
          setError('Giỏ hàng trống.');
          navigate('/cart');
          return;
        }
      }

      setCartItems(items);
      calculateTotal(items);
      setLoading(false);
    };

    loadData();
  }, [isLoggedIn, navigate]);

  // === TÍNH TOÁN GIÁ ===
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    setTotalPrice(total);

    let discount = 0;
    let pointsDiscount = 0;

    if (isLoggedIn) {
      discount = voucherDiscount;
      const maxPoints = Math.floor(total / 10000);
      const pointsToUse = usePoints ? Math.min(userPoints, maxPoints) : 0;
      pointsDiscount = pointsToUse * 10000;
      setUsedPoints(pointsToUse);
    }

    const final = total - discount - pointsDiscount;
    setFinalPrice(final > 0 ? final : 0);
  };

  // === ÁP DỤNG VOUCHER ===
  const applyVoucher = async () => {
    if (!isLoggedIn) return setError('Vui lòng đăng nhập để dùng voucher.');
    if (!voucherCode.trim()) return setError('Nhập mã voucher.');

    setLoading(true);
    try {
      const res = await callApi(t => API.get(`/Checkout/check-voucher/${voucherCode}`, {
        headers: { Authorization: `Bearer ${t}` }
      }));
      setVoucherDiscount(res.data.discountAmount || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Voucher không hợp lệ.');
      setVoucherDiscount(0);
    } finally {
      calculateTotal(cartItems);
      setLoading(false);
    }
  };

  // === XỬ LÝ THANH TOÁN ===
  const handleCheckout = async () => {
    if (!isLoggedIn && (!fullName.trim() || !phoneNumber.trim() || !address.trim())) {
      return setError('Vui lòng nhập đầy đủ thông tin.');
    }

    if (cartItems.length === 0) return setError('Giỏ hàng trống.');

    setLoading(true);
    setError(null);

    try {
      let response;

      if (isLoggedIn) {
        // ĐÃ LOGIN → DÙNG API CŨ
        const checkoutData = {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          voucherCode: voucherCode.trim() || null,
          usePoint: usePoints,
          usedPoints
        };

        response = await callApi(t => API.post(
          paymentMethod === 'cod' ? '/Checkout/cod' : '/Checkout/CreateVnPayPayment',
          checkoutData,
          { headers: { Authorization: `Bearer ${t}` } }
        ));
      } else {
        // CHƯA LOGIN → DÙNG /Checkout/Buy-now
        const buyNowData = {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          productId: cartItems[0].productId, // Chỉ hỗ trợ 1 sản phẩm từ "Mua ngay"
          quantity: cartItems[0].quantity,
          voucherCode: voucherCode.trim() || null,
          usePoint: false,
          method: paymentMethod.toUpperCase() // COD hoặc VNPAY
        };

        response = await API.post('/Checkout/Buy-now', buyNowData);
      }

      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
        return;
      }

      if (!isLoggedIn) {
        localStorage.removeItem(GUEST_CART_KEY);
        window.dispatchEvent(new Event('cartUpdate'));
      }

      setSuccess(true);
      setTimeout(() => navigate('/order-success'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Thanh toán thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // === RENDER ===
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={styles.checkoutContainer}>
      <Typography variant="h4" sx={{ mb: 4 }}>Thanh toán</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Thành công! Đang chuyển hướng...</Alert>}

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Sản phẩm */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Sản phẩm</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="right">Giá</TableCell>
                  <TableCell align="center">SL</TableCell>
                  <TableCell align="right">Tổng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src={item.mainImage || '/placeholder-product.jpg'} alt={item.productName} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                        <Typography>{item.productName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{item.sellPrice.toLocaleString('vi-VN')}₫</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">{(item.sellPrice * item.quantity).toLocaleString('vi-VN')}₫</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {isLoggedIn && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Ưu đãi</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField label="Mã voucher" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} sx={{ flex: 1 }} disabled={loading} />
                <Button variant="contained" onClick={applyVoucher} disabled={loading}>Áp dụng</Button>
              </Box>
              <FormControlLabel
                control={<Checkbox checked={usePoints} onChange={e => { setUsePoints(e.target.checked); calculateTotal(cartItems); }} disabled={userPoints === 0 || loading} />}
                label={`Dùng ${userPoints} điểm (giảm ${(userPoints * 10000).toLocaleString('vi-VN')}₫)`}
              />
            </Box>
          )}
        </Box>

        {/* Thông tin thanh toán */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {isLoggedIn ? 'Thông tin giao hàng (có thể sửa)' : 'Thông tin giao hàng *'}
          </Typography>

          <TextField
            fullWidth
            label={isLoggedIn ? "Họ và tên" : "Họ và tên *"}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
            required={!isLoggedIn}
          />
          <TextField
            fullWidth
            label={isLoggedIn ? "Số điện thoại" : "Số điện thoại *"}
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
            required={!isLoggedIn}
          />
          <TextField
            fullWidth
            label={isLoggedIn ? "Địa chỉ giao hàng" : "Địa chỉ giao hàng *"}
            value={address}
            onChange={e => setAddress(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            disabled={loading}
            required={!isLoggedIn}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} disabled={loading}>
              <MenuItem value="cod">Thanh toán khi nhận hàng (COD)</MenuItem>
              <MenuItem value="vnpay">Thanh toán qua VNPay</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Tổng kết</Typography>
            <Typography>Giá gốc: {totalPrice.toLocaleString('vi-VN')}₫</Typography>
            {voucherDiscount > 0 && <Typography color="success.main">- Voucher: -{voucherDiscount.toLocaleString('vi-VN')}₫</Typography>}
            {usePoints && usedPoints > 0 && <Typography color="success.main">- Điểm ({usedPoints}): -{(usedPoints * 10000).toLocaleString('vi-VN')}₫</Typography>}
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>Tổng: {finalPrice.toLocaleString('vi-VN')}₫</Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            sx={{ py: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Hoàn tất thanh toán'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Checkout;