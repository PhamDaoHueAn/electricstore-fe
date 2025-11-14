import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../../services/api';
import styles from './Cart.module.css';

const GUEST_CART_KEY = 'guestCart';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  const getGuestCart = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveGuestCart = (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cartUpdate')); // CẬP NHẬT HEADER
  };

  const callApi = async (apiCall) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      return await apiCall(token);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        window.dispatchEvent(new Event('authChange')); // KHÔNG RELOAD
      }
      throw error;
    }
  };

  // Hàm load giỏ hàng (có thể gọi lại)
  const fetchCart = async () => {
    setLoading(true);
    setError('');

    if (isLoggedIn) {
      try {
        const response = await callApi((token) =>
          API.get('/Cart', { headers: { Authorization: `Bearer ${token}` } })
        );
        const data = Array.isArray(response?.data) ? response.data : [];
        setCartItems(data);
      } catch (err) {
        console.error('Lỗi API:', err);
        setError('Không thể tải giỏ hàng. Dùng giỏ khách.');
        setCartItems(getGuestCart());
      }
    } else {
      setCartItems(getGuestCart());
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  // Cập nhật số lượng
  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    setLoading(true);

    if (isLoggedIn) {
      try {
        await callApi((token) =>
          API.put('/Cart/update', { productId, quantity }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        // Load lại giỏ hàng để lấy giá FlashSale mới nhất
        await fetchCart();
        window.dispatchEvent(new Event('cartUpdate'));
      } catch {
        setError('Cập nhật thất bại.');
      }
    } else {
      try {
        // Gọi API lấy giá FlashSale cho giỏ hàng khách
        const priceResponse = await API.get(`/FlashSale/get-price-flashsale?productId=${productId}&quantity=${quantity}`);
        const newPrice = priceResponse.data;

        const updated = cartItems.map(item =>
          item.productId === productId ? { ...item, quantity, sellPrice: newPrice } : item
        );
        setCartItems(updated);
        saveGuestCart(updated);
      } catch (err) {
        console.error('Lỗi lấy giá FlashSale:', err);
        // Nếu lỗi, vẫn cập nhật số lượng nhưng giữ nguyên giá
        const updated = cartItems.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        );
        setCartItems(updated);
        saveGuestCart(updated);
      }
    }
    setLoading(false);
  };

  // Xóa sản phẩm
  const handleRemoveItem = async (productId) => {
    setLoading(true);
    if (isLoggedIn) {
      try {
        await callApi((token) =>
          API.delete(`/Cart/remove/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        // Load lại giỏ hàng để cập nhật FlashSale cho các sản phẩm còn lại
        await fetchCart();
        window.dispatchEvent(new Event('cartUpdate'));
      } catch {
        setError('Xóa thất bại.');
      }
    } else {
      const updated = cartItems.filter(item => item.productId !== productId);
      setCartItems(updated);
      saveGuestCart(updated);
    }
    setLoading(false);
  };

  // Xóa toàn bộ
  const handleClearCart = async () => {
    setLoading(true);
    if (isLoggedIn) {
      try {
        await callApi((token) => API.delete('/Cart/clear', { headers: { Authorization: `Bearer ${token}` } }));
        setCartItems([]);
        window.dispatchEvent(new Event('cartUpdate'));
      } catch {
        setError('Xóa thất bại.');
      }
    } else {
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      window.dispatchEvent(new Event('cartUpdate'));
    }
    setLoading(false);
  };

  // ĐI CHECKOUT – KHÔNG BẮT LOGIN
  const handleCheckout = () => {
    navigate('/checkout'); // LUÔN ĐƯỢC PHÉP
  };

  const calculateTotal = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.sellPrice || 0) * (item.quantity || 1), 0);
    return total.toLocaleString('vi-VN') + ' VNĐ';
  };

  if (loading) return <CircularProgress className={-styles.loading} />;

  return (
    <Container maxWidth="lg" className={styles.container}>
      <Typography variant="h4" className={styles.title}>Giỏ Hàng</Typography>

      {error && <Typography color="error" className={styles.error}>{error}</Typography>}

      {cartItems.length === 0 ? (
        <Typography className={styles.emptyCart}>
          Giỏ hàng trống. <Button onClick={() => navigate('/')}>Mua sắm ngay!</Button>
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hình</TableCell>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="right">Giá</TableCell>
                  <TableCell align="center">SL</TableCell>
                  <TableCell align="right">Tổng</TableCell>
                  <TableCell align="center">Xóa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <Avatar src={item.mainImage} sx={{ width: 60, height: 60 }} variant="square" />
                    </TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell align="right">{(item.sellPrice || 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                    <TableCell align="center">
                      <Box className={styles.quantityControl}>
                        <IconButton
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {((item.sellPrice || 0) * item.quantity).toLocaleString('vi-VN')} VNĐ
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleRemoveItem(item.productId)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box className={styles.actionRow}>
            <Button variant="outlined" onClick={handleClearCart} disabled={loading}>
              Xóa toàn bộ
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">Tổng: {calculateTotal()}</Typography>
              <Button variant="contained" onClick={handleCheckout}>
                Đặt hàng ngay
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Cart;