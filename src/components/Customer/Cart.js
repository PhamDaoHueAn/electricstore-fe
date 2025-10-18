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
import Cookies from 'js-cookie';
import styles from './Cart.module.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Làm mới token
  const refreshToken = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');
    try {
      const response = await API.post('/Auth/refresh-token', { refreshToken });
      Cookies.set('authToken', response.data.accessToken, {
        secure: process.env.NODE_ENV === 'production',
        expires: 7
      });
      return response.data.accessToken;
    } catch (error) {
      console.error('Refresh token failed:', error);
      Cookies.remove('authToken');
      Cookies.remove('refreshToken');
      navigate('/login');
      return null;
    }
  };

  // Gọi API với làm mới token
  const withTokenRefresh = async (apiCall) => {
    const token = Cookies.get('authToken');
    if (!token) {
      setError('Vui lòng đăng nhập để xem giỏ hàng.');
      navigate('/login');
      return null;
    }
    try {
      const response = await apiCall(token);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const response = await apiCall(newToken);
          return response;
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await withTokenRefresh((token) =>
          API.get('/Cart', { headers: { Authorization: `Bearer ${token}` } })
        );
        if (response) {
          console.log('Cart data:', response.data);
          if (!Array.isArray(response.data)) {
            throw new Error('Dữ liệu giỏ hàng không hợp lệ.');
          }
          setCartItems(response.data);
        }
      } catch (err) {
        console.error('Lỗi lấy giỏ hàng:', err.response?.data || err.message);
        setError(err.response?.status === 401 ? 'Vui lòng đăng nhập lại.' : 'Không thể tải giỏ hàng.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    setLoading(true);
    setError('');
    try {
      await withTokenRefresh((token) =>
        API.put('/Cart/update', { productId, quantity }, { headers: { Authorization: `Bearer ${token}` } })
      );
      setCartItems(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    } catch (err) {
      console.error('Lỗi cập nhật số lượng:', err.response?.data || err.message);
      setError('Không thể cập nhật số lượng.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    setLoading(true);
    setError('');
    try {
      await withTokenRefresh((token) =>
        API.delete(`/Cart/remove/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
      );
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err.response?.data || err.message);
      setError('Không thể xóa sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    setLoading(true);
    setError('');
    try {
      await withTokenRefresh((token) =>
        API.delete('/Cart/clear', { headers: { Authorization: `Bearer ${token}` } })
      );
      setCartItems([]);
    } catch (err) {
      console.error('Lỗi xóa giỏ hàng:', err.response?.data || err.message);
      setError('Không thể xóa giỏ hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout', { replace: true });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.sellPrice * item.quantity || 0), 0)
      .toLocaleString('vi-VN') + ' VNĐ';
  };

  if (loading) {
    return <CircularProgress className={styles.loading} />;
  }

  return (
    <Container maxWidth="lg" className={styles.container}>
      <Box className={styles.container}>
        <Typography variant="h4" className={styles.title}>
          Giỏ Hàng
        </Typography>
        {error && (
          <Typography color="error" variant="body2" className={styles.error}>
            {error}
          </Typography>
        )}
        {cartItems.length === 0 ? (
          <Typography className={styles.emptyCart}>Giỏ hàng trống.</Typography>
        ) : (
          <>
            <TableContainer component={Paper} className={styles.tableContainer}>
              <Table className={styles.table}>
                <TableHead className={styles.tableHead}>
                  <TableRow>
                    <TableCell className={styles.tableCell}>Hình ảnh</TableCell>
                    <TableCell className={styles.tableCell}>Sản phẩm</TableCell>
                    <TableCell align="right" className={styles.tableCell}>Giá</TableCell>
                    <TableCell align="center" className={styles.tableCell}>Số lượng</TableCell>
                    <TableCell align="right" className={styles.tableCell}>Tổng</TableCell>
                    <TableCell align="center" className={styles.tableCell}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className={styles.tableCell}>
                        <Avatar
                          src={item.mainImage || '/placeholder-product.jpg'}
                          alt={item.productName}
                          variant="square"
                          sx={{ width: 60, height: 60 }}
                          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                        />
                      </TableCell>
                      <TableCell className={styles.tableCell}>{item.productName || 'Không xác định'}</TableCell>
                      <TableCell align="right" className={styles.tableCell}>{(item.sellPrice || 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell align="center" className={styles.tableCell}>
                        <Box className={styles.quantityControl}>
                          <IconButton
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={loading || item.quantity <= 1}
                            className={styles.quantityButton}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography className={styles.quantityText}>{item.quantity || 1}</Typography>
                          <IconButton
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={loading}
                            className={styles.quantityButton}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right" className={styles.tableCell}>
                        {((item.sellPrice || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} VNĐ
                      </TableCell>
                      <TableCell align="center" className={styles.tableCell}>
                        <IconButton
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={loading}
                          className={styles.deleteButton}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box className={styles.actionRow}>
              <Button
                variant="outlined"
                className={styles.clearButton}
                onClick={handleClearCart}
                disabled={loading || cartItems.length === 0}
              >
                Xóa toàn bộ giỏ hàng
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" className={styles.totalText}>Tổng cộng: {calculateTotal()}</Typography>
                <Button
                  variant="contained"
                  className={styles.checkoutButton}
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                >
                  Đặt Hàng
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Cart;