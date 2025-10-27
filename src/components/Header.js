import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, TextField, Autocomplete, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import API from '../services/api';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch thông tin người dùng để lấy fullName
  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/Auth/get-my-profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        timeout: 5000,
      });
      setUsername(response.data.fullName || 'User');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUsername('');
        setCartCount(0);
        navigate('/login');
      } else {
        setUsername('User');
      }
    }
  };

  // Fetch số lượng sản phẩm trong giỏ hàng
  const fetchCartCount = async () => {
    try {
      const response = await API.get('/Cart', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        timeout: 5000,
      });
      const totalQuantity = Array.isArray(response.data)
        ? response.data.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      setCartCount(totalQuantity);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUsername('');
        setCartCount(0);
        navigate('/login');
      } else {
        setCartCount(0);
      }
    }
  };

  // Fetch gợi ý tìm kiếm
  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await API.get(`/Products/Search?search=${encodeURIComponent(query)}&sortBy=CreatedAt&sortOrder=desc&pageNumber=1&pageSize=5`, {
        timeout: 5000,
      });
      console.log('Suggestions API response:', response.data);
      setSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  // Xử lý đăng nhập và giỏ hàng
  useEffect(() => {
    const handleAuthChange = () => {
      const loggedIn = isAuthenticated();
      setIsLoggedIn(loggedIn);
      if (loggedIn && location.pathname !== '/login') {
        fetchUserProfile();
        fetchCartCount();
      } else {
        setUsername('');
        setCartCount(0);
      }
    };

    handleAuthChange();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [location.pathname]);

  // Xử lý thay đổi ô tìm kiếm
  const handleSearchChange = (event, value) => {
    setSearchTerm(value);
    fetchSuggestions(value);
  };

  // Xử lý chọn gợi ý hoặc nhấn Enter
  const handleSearch = (event, value) => {
    if (event.key === 'Enter' || event.type === 'click' || value) {
      const query = value || searchTerm;
      if (query.trim()) {
        setSuggestions([]);
        setSearchTerm('');
        navigate(`/search?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // Xử lý đăng xuất
  const handleLogoutClick = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUsername('');
    setCartCount(0);
    window.dispatchEvent(new Event('authChange'));
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
          <div className={styles.searchBox}>
            <Autocomplete
              freeSolo
              options={suggestions.map((product) => product.productName)}
              inputValue={searchTerm}
              onInputChange={handleSearchChange}
              onChange={handleSearch}
              loading={loadingSuggestions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Tìm kiếm sản phẩm..."
                  className={styles.searchInput}
                  onKeyPress={handleSearch}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
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
        </div>
        <div className={styles.userActions}>
          {isLoggedIn && location.pathname !== '/login' ? (
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