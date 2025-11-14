import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, TextField, Autocomplete, CircularProgress, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import API from '../services/api';
import styles from './Header.module.css';

const GUEST_CART_KEY = 'guestCart';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // === DROPDOWN DANH MỤC ===
  const [categories, setCategories] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // === LẤY DANH MỤC ===
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await API.get('/Categories', { timeout: 5000 });
      const categoryArray = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoryArray) ? categoryArray : []);
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // === MỞ/CLOSED DROPDOWN ===
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCategoryClick = (categoryId) => {
    handleMenuClose();
    navigate(`/category/${categoryId}`);
  };

  // === LẤY GIỎ HÀNG KHÁCH ===
  const getGuestCartCount = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      if (!saved) return 0;
      const cart = JSON.parse(saved);
      return Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    } catch {
      return 0;
    }
  };

  // === LẤY THÔNG TIN NGƯỜI DÙNG ===
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await API.get('/Auth/get-my-profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsername(response.data.fullName || 'User');
    } catch (error) {
      console.error('Lỗi lấy profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUsername('');
        updateCartCount();
        window.dispatchEvent(new Event('authChange'));
      }
    }
  };

  // === LẤY SỐ LƯỢNG GIỎ HÀNG ===
  const fetchCartCount = async () => {
    const token = localStorage.getItem('accessToken');

    if (isLoggedIn && token) {
      try {
        const response = await API.get('/Cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const total = Array.isArray(response.data)
          ? response.data.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;
        setCartCount(total);
      } catch (error) {
        console.error('Lỗi lấy giỏ:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          setUsername('');
          updateCartCount();
          window.dispatchEvent(new Event('authChange'));
        } else {
          setCartCount(getGuestCartCount());
        }
      }
    } else {
      setCartCount(getGuestCartCount());
    }
  };

  // === CẬP NHẬT GIỎ ===
  const updateCartCount = () => {
    fetchCartCount();
  };

  // === THEO DÕI SỰ KIỆN ===
  useEffect(() => {
    const handleAuthChange = () => {
      const loggedIn = !!localStorage.getItem('accessToken');
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        fetchUserProfile();
        fetchCartCount();
      } else {
        setUsername('');
        updateCartCount();
      }
    };

    const handleCartUpdate = () => {
      updateCartCount();
    };

    handleAuthChange();
    fetchCategories(); // LẤY DANH MỤC KHI MỞ TRANG

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('cartUpdate', handleCartUpdate);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, [location.pathname]);

  // === TÌM KIẾM GỢI Ý ===
  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await API.get(`/Products/Search?search=${encodeURIComponent(query)}&sortBy=CreatedAt&sortOrder=desc&pageNumber=1&pageSize=5`);
      setSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearchChange = (event, value) => {
    setSearchTerm(value);
    fetchSuggestions(value);
  };

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

  // === ĐĂNG XUẤT ===
  const handleLogoutClick = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUsername('');
    setCartCount(getGuestCartCount());
    window.dispatchEvent(new Event('authChange'));
    window.dispatchEvent(new Event('cartUpdate'));
    navigate('/login');
  };

  return (
    <AppBar position="static" className={styles.header}>
      <Toolbar>
        {/* Logo + Dropdown Danh mục */}
        <div className={styles.logoSection}>
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

          {/* Dropdown Danh mục */}
          <Button
            color="inherit"
            onClick={handleMenuOpen}
            className={styles.categoryButton}
            endIcon={<ExpandMoreIcon />}
            disabled={loadingCategories}
          >
            Danh mục
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                maxHeight: 400,
                overflow: 'auto'
              }
            }}
          >
            {loadingCategories ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải...
              </MenuItem>
            ) : categories.length === 0 ? (
              <MenuItem disabled>Không có danh mục</MenuItem>
            ) : (
              categories.map((category) => {
                const categoryId = category.id || category.categoryId;
                return (
                  <MenuItem
                    key={categoryId}
                    onClick={() => handleCategoryClick(categoryId)}
                    className={styles.menuItem}
                  >
                    {category.categoryName}
                  </MenuItem>
                );
              })
            )}
          </Menu>
        </div>

        {/* Tìm kiếm */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <Autocomplete
              freeSolo
              options={suggestions.map(p => p.productName)}
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

        {/* Hành động người dùng */}
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
                onClick={handleLogoutClick}
                className={styles.logoutButton}
              >
                Đăng xuất
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              className={styles.loginButton}
            >
              Đăng nhập
            </Button>
          )}

          {/* Giỏ hàng */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/cart')}
            className={styles.cartButton}
            startIcon={<ShoppingCartIcon />}
          >
            Giỏ hàng
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;