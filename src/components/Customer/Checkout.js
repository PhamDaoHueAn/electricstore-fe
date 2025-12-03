import React, { useState, useEffect, useCallback } from 'react';
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
import axios from 'axios';
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
  const [street, setStreet] = useState(''); // Số nhà, tên đường

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [combinedAddress, setCombinedAddress] = useState('');

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) throw new Error('No refresh token');
    const response = await API.post('/Auth/refresh-token', { refreshToken: refreshTokenValue });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data.accessToken;
  }, []);

  const callApi = useCallback(async (apiCall) => {
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
  }, [refreshToken]);

  const calculateTotal = useCallback((items) => {
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
  }, [isLoggedIn, voucherDiscount, userPoints, usePoints]);

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
          // Try to prefill street and province/district/ward from profile.address if possible
          if (profile.address) {
            setCombinedAddress(profile.address);
          }
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
  }, [isLoggedIn, authChecked, navigate, calculateTotal, callApi]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await axios.get('https://provinces.open-api.vn/api/?depth=1');
        setProvinces(res.data || []);
      } catch (err) {
        console.error('Không thể tải danh sách tỉnh/thành:', err);
      }
    };
    loadProvinces();
  }, []);

  const handleProvinceChange = async (code) => {
    setSelectedProvince(code);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);
    try {
      const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
      setDistricts(res.data?.districts || []);
    } catch (err) {
      console.error('Lỗi tải quận/huyện:', err);
    }
  };

  const handleDistrictChange = async (code) => {
    setSelectedDistrict(code);
    setSelectedWard('');
    setWards([]);
    try {
      const res = await axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
      setWards(res.data?.wards || []);
    } catch (err) {
      console.error('Lỗi tải phường/xã:', err);
    }
  };

  useEffect(() => {
    // Build combined address from parts whenever any part changes
    const provinceName = provinces.find(p => String(p.code) === String(selectedProvince))?.name || '';
    const districtName = districts.find(d => String(d.code) === String(selectedDistrict))?.name || '';
    const wardName = wards.find(w => String(w.code) === String(selectedWard))?.name || '';

    const parts = [street && street.trim(), wardName, districtName, provinceName].filter(Boolean);
    const combined = parts.join(', ');
    setCombinedAddress(combined);
    // Keep old `address` in sync for display/validation
    setAddress(combined);
    setErrors(prev => ({ ...prev, address: validateAddress(combined) }));
  }, [street, selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards]);



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
            label="Số nhà, tên đường *"
            value={street}
            onChange={(e) => {
              setStreet(e.target.value);
            }}
            error={!!errors.address}
            helperText={errors.address || 'Ví dụ: 123 Nguyễn Trãi'}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="province-label">Tỉnh/Thành *</InputLabel>
            <Select
              labelId="province-label"
              value={selectedProvince}
              label="Tỉnh/Thành *"
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={loading || provinces.length === 0}
            >
              {provinces.map(p => (
                <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="district-label">Quận/Huyện *</InputLabel>
            <Select
              labelId="district-label"
              value={selectedDistrict}
              label="Quận/Huyện *"
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={loading || districts.length === 0}
            >
              {districts.map(d => (
                <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="ward-label">Phường/Xã *</InputLabel>
            <Select
              labelId="ward-label"
              value={selectedWard}
              label="Phường/Xã *"
              onChange={(e) => setSelectedWard(e.target.value)}
              disabled={loading || wards.length === 0}
            >
              {wards.map(w => (
                <MenuItem key={w.code} value={w.code}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Địa chỉ đầy đủ (xem trước)"
            value={combinedAddress}
            InputProps={{ readOnly: true }}
            helperText={errors.address || 'Hệ thống sẽ ghép địa chỉ tự động'}
            multiline
            rows={2}
            sx={{ mb: 3 }}
            disabled
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