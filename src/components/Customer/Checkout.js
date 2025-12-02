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
  Checkbox,
  InputAdornment
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
  const [successMessage, setSuccessMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [errors, setErrors] = useState({
    fullName: '',
    phoneNumber: '',
    address: ''
  });

  const validateFullName = (value) => {
    if (!value.trim()) return 'Họ và tên là bắt buộc';
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) return 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    if (value.trim().length < 2) return 'Họ tên quá ngắn';
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return 'Số điện thoại là bắt buộc';
    if (!/^0[3|5|7|8|9][0-9]{8}$/.test(value.replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ (VD: 0901234567)';
    }
    return '';
  };

  const validateAddress = (value) => {
    if (!value.trim()) return 'Địa chỉ là bắt buộc';
    if (value.trim().length < 10) return 'Địa chỉ quá ngắn, vui lòng nhập chi tiết';
    return '';
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
    setAuthChecked(true);
  }, []);

  const getGuestCart = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

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

  useEffect(() => {
    if (!authChecked) return;
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

          if (items.length === 0) {
            setError('Giỏ hàng trống.');
            navigate('/cart');
            return;
          }

          setFullName(profile.fullName || '');
          setPhoneNumber(profile.phone || '');
          setAddress(profile.address || '');
          setUserPoints(profile.point || 0);

          setErrors({
            fullName: validateFullName(profile.fullName || ''),
            phoneNumber: validatePhone(profile.phone || ''),
            address: validateAddress(profile.address || '')
          });

        } catch (err) {
          console.error('Lỗi tải dữ liệu:', err);
          setError('Không thể tải thông tin. Vui lòng đăng nhập lại.');
          items = getGuestCart();
        }
      } else {
        items = getGuestCart();
      }

      setCartItems(items);
      calculateTotal(items);
      setLoading(false);
    };

    loadData();
  }, [isLoggedIn, authChecked, navigate]);

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
      const res = await API.get(`/Checkout/check-voucher/${voucherCode}`);
      const voucher = res.data;

      let discount = 0;
      if (voucher.discountType === 'percent') {
        discount = totalPrice * (voucher.discountValue / 100);
      } else if (voucher.discountType === 'amount') {
        discount = voucher.discountValue;
      }

      setVoucherDiscount(discount);
      setError(null);
      setSuccessMessage(`Áp dụng voucher thành công! Giảm ${discount.toLocaleString('vi-VN')}₫`);
      calculateTotal(cartItems);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data || 'Voucher không hợp lệ.');
      setVoucherDiscount(0);
      calculateTotal(cartItems);
    } finally {
      setLoading(false);
    }
  };

  // === XỬ LÝ THANH TOÁN ===
  const handleCheckout = async () => {
    const nameError = validateFullName(fullName);
    const phoneError = validatePhone(phoneNumber);
    const addressError = validateAddress(address);

    if (nameError || phoneError || addressError) {
      setErrors({ fullName: nameError, phoneNumber: phoneError, address: addressError });
      setError('Vui lòng kiểm tra lại thông tin.');
      return;
    }

    if (cartItems.length === 0) return setError('Giỏ hàng trống.');

    setLoading(true);
    setError(null);

    try {
      let response;

      if (isLoggedIn) {
        const checkoutData = {
          FullName: fullName.trim(),
          PhoneNumber: phoneNumber.trim(),
          Address: address.trim(),
          VoucherCode: voucherCode.trim() || null,
          usePoint: usePoints,
          ReturnUrl: paymentMethod === 'vnpay' ? `${window.location.origin}/vnpay-return` : null
        };

        response = await callApi(t => API.post(
          paymentMethod === 'cod' ? '/Checkout/cod' : '/Checkout/CreateVnPayPayment',
          checkoutData,
          { headers: { Authorization: `Bearer ${t}` } }
        ));
      } else {
        const paymentData = {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          products: cartItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity
          })),
          voucherCode: voucherCode.trim() || null,
          usePoint: false,
          method: paymentMethod.toUpperCase(),
          returnUrl: paymentMethod === 'vnpay' ? `${window.location.origin}/vnpay-return` : null
        };

        response = await API.post('/Checkout/Payment-without-login', paymentData);
      }

      if (response.data.paymentUrl || response.data.PaymentUrl) {
        window.location.href = response.data.paymentUrl || response.data.PaymentUrl;
        return;
      }

      if (!isLoggedIn) {
        localStorage.removeItem(GUEST_CART_KEY);
        window.dispatchEvent(new Event('cartUpdate'));
      }

      setSuccess(true);
      setTimeout(() => navigate('/order-success'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Thanh toán</Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>Thành công! Đang chuyển hướng...</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Sản phẩm */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Sản phẩm</Typography>
          <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Sản phẩm</strong></TableCell>
                  <TableCell align="right"><strong>Giá</strong></TableCell>
                  <TableCell align="center"><strong>SL</strong></TableCell>
                  <TableCell align="right"><strong>Tổng</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img
                          src={item.mainImage || '/placeholder-product.jpg'}
                          alt={item.productName}
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <Typography fontWeight={500}>{item.productName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{item.sellPrice.toLocaleString('vi-VN')}₫</TableCell>
                    <TableCell align="center"><strong>{item.quantity}</strong></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {(item.sellPrice * item.quantity).toLocaleString('vi-VN')}₫
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Ưu đãi */}
          {isLoggedIn && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Ưu đãi</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Mã voucher"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  sx={{ flex: 1 }}
                  disabled={loading}
                />
                <Button variant="contained" onClick={applyVoucher} disabled={loading}>
                  Áp dụng
                </Button>
              </Box>
              <FormControlLabel
                control={<Checkbox checked={usePoints} onChange={e => setUsePoints(e.target.checked)} disabled={userPoints === 0 || loading} />}
                label={`Dùng ${userPoints.toLocaleString()} điểm (giảm ${(userPoints * 10000).toLocaleString('vi-VN')}₫)`}
              />
            </Box>
          )}
        </Box>

        {/* Thông tin thanh toán */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            {isLoggedIn ? 'Thông tin giao hàng' : 'Thông tin giao hàng *'}
          </Typography>

          <TextField
            fullWidth
            label="Họ và tên *"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setErrors(prev => ({ ...prev, fullName: validateFullName(e.target.value) }));
            }}
            error={!!errors.fullName}
            helperText={errors.fullName}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Số điện thoại *"
            value={phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
              setPhoneNumber(value);
              setErrors(prev => ({ ...prev, phoneNumber: validatePhone(value) }));
            }}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber || 'VD: 0901234567'}
            InputProps={{
              startAdornment: <InputAdornment position="start">+84</InputAdornment>,
            }}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Địa chỉ giao hàng *"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setErrors(prev => ({ ...prev, address: validateAddress(e.target.value) }));
            }}
            error={!!errors.address}
            helperText={errors.address || 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành'}
            multiline
            rows={3}
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} disabled={loading}>
              <MenuItem value="cod">Thanh toán khi nhận hàng (COD)</MenuItem>
              <MenuItem value="vnpay">Thanh toán qua VNPay</MenuItem>
            </Select>
          </FormControl>

          <Paper elevation={4} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Tổng kết đơn hàng</Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tạm tính:</Typography>
              <Typography fontWeight="bold">{totalPrice.toLocaleString('vi-VN')}₫</Typography>
            </Box>

            {voucherDiscount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'green' }}>
                <Typography>Giảm giá (Voucher):</Typography>
                <Typography fontWeight="bold">-{voucherDiscount.toLocaleString('vi-VN')}₫</Typography>
              </Box>
            )}

            {usePoints && usedPoints > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'green' }}>
                <Typography>Giảm giá (Điểm):</Typography>
                <Typography fontWeight="bold">-{usedPoints * 10000}₫</Typography>
              </Box>
            )}

            <Box sx={{ borderTop: '2px solid #ddd', pt: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Tổng thanh toán:
                </Typography>
                <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>
                  {finalPrice.toLocaleString('vi-VN')}₫
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            sx={{
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: 3,
              background: 'linear-gradient(45deg, #0560e7, #0088ff)',
              '&:hover': { background: 'linear-gradient(45deg, #0044cc, #0066cc)' }
            }}
          >
            {loading ? <CircularProgress size={28} color="inherit" /> : 'HOÀN TẤT ĐƠN HÀNG'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Checkout;