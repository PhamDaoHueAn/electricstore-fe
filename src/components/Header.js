import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import API from '../services/api';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');

  // Lấy tên người dùng từ token
  const getUsernameFromToken = () => {
    const token = Cookies.get('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.name || decoded.username || 'User';
      } catch (error) {
        console.error('Invalid token:', error);
        return 'User';
      }
    }
    return '';
  };

  // Fetch số lượng sản phẩm trong giỏ hàng
  const fetchCartCount = async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      return;
    }

    try {
      const response = await API.get('/Cart', {
        headers: { Authorization: `Bearer ${Cookies.get('authToken')}` },
        timeout: 5000,
      });
      const totalQuantity = Array.isArray(response.data)
        ? response.data.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      setCartCount(totalQuantity);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      if (error.response?.status === 401) {
        Cookies.remove('authToken');
        Cookies.remove('refreshToken');
        setUsername('');
        setCartCount(0);
        navigate('/login');
      } else {
        setCartCount(0);
      }
    }
  };

  // Xử lý đăng nhập và giỏ hàng
  useEffect(() => {
    if (isLoggedIn) {
      setUsername(getUsernameFromToken());
      fetchCartCount();
    } else {
      setUsername('');
      setCartCount(0);
    }
  }, [isLoggedIn]);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
        setSearchTerm('');
      }
    }
  };

  // Xử lý đăng xuất
  const handleLogoutClick = () => {
    Cookies.remove('authToken');
    Cookies.remove('refreshToken');
    setCartCount(0);
    setUsername('');
    navigate('/login');
  };

  return (
    <AppBar position="static" className={styles.header}>
      <Toolbar>
        <Typography
          variant="h5"
          component="a"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className={styles.logo}
        >
          Điện Máy Xanh
        </Typography>
        <div className={styles.searchContainer}>
          <TextField
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className={styles.searchInput}
            onKeyPress={handleSearch}
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            className={styles.searchButton}
          >
            Tìm kiếm
          </Button>
        </div>
        <div className={styles.userActions}>
          {isLoggedIn ? (
            <>
              <IconButton
                color="inherit"
                onClick={() => navigate('/profile')}
                className={styles.userIcon}
              >
                <AccountCircleIcon />
              </IconButton>
              <Typography
                variant="body1"
                className={styles.username}
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer', marginRight: '16px' }}
              >
                {username}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleLogoutClick}
                className={styles.logoutButton}
              >
                Đăng Xuất
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              href="/login"
              className={styles.loginButton}
            >
              Đăng nhập
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            href="/cart"
            className={styles.cartButton}
            startIcon={<ShoppingCartIcon />}
          >
            Giỏ hàng{cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;