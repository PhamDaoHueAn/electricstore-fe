// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import API from '../services/api';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogoutClick = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCartCount(0);
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
        setSearchTerm(''); // Xóa search term sau khi tìm
      }
    }
  };

  useEffect(() => {
    const fetchCartCount = async () => {
      if (isLoggedIn) {
        try {
          const response = await API.get('/Cart');
          const totalQuantity = response.data.reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(totalQuantity);
        } catch (error) {
          console.error('Error fetching cart count:', error);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };
    fetchCartCount();
  }, [isLoggedIn]);

  return (
    <AppBar position="static" className={styles.header}>
      <Toolbar>
        <Typography
          variant="h5"
          component="a"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className={styles.logo}
        >
          Điện Máy Xanh
        </Typography>
        <div className={styles.searchContainer}>
          <TextField
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm sản phẩm điện máy..."
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
          {!isLoggedIn ? (
            <>
              <Button
                variant="contained"
                color="primary"
                href="/login"
                className={styles.loginButton}
              >
                Đăng nhập
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                href="/cart"
                className={styles.cartButton}
                startIcon={<ShoppingCartIcon />}
              >
                Giỏ hàng{cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
              </Button>
            </>
          ) : (
            <>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <img
                  src="/images/anhdaidien.jpg"
                  alt="User Avatar"
                  className={styles.avatar}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                className={styles.dropdownMenu}
              >
                <MenuItem onClick={handleMenuClose} component={Button} href="/profile">
                  Thông tin cá nhân
                </MenuItem>
                <MenuItem onClick={handleMenuClose} component={Button} href="/cart">
                  Giỏ hàng{cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
                </MenuItem>
                <MenuItem onClick={handleMenuClose} component={Button} href="/products">
                  Danh sách sản phẩm
                </MenuItem>
                <MenuItem onClick={handleLogoutClick} className={styles.logoutItem}>
                  Đăng Xuất
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;