import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, TextField,
  Autocomplete, CircularProgress, Menu, MenuItem, Avatar   // ← THÊM Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import API from '../services/api';
import styles from './Header.module.css';
import logo from '../images/logo.png';
import logoMobile from '../images/logo-mobile.png';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Badge from '@mui/material/Badge';
import ListItemText from '@mui/material/ListItemText';
import { useMediaQuery } from '@mui/material';

const GUEST_CART_KEY = 'guestCart';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState('/images/default-avatar.jpg'); // ← THÊM STATE CHO AVATAR
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // === DROPDOWN DANH MỤC ===
  const [categories, setCategories] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const isMobile = useMediaQuery('(max-width:599px)');

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

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleCategoryClick = (categoryId) => {
    handleMenuClose();
    navigate(`/category/${categoryId}`);
  };

  // === GIỎ HÀNG KHÁCH VÃNG LAI ===
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

  // === LẤY THÔNG TIN NGƯỜI DÙNG (có lấy avatar) ===
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await API.get('/Auth/get-my-profile');
      setUsername(response.data.fullName || 'User');
      setUserAvatar(response.data.imageUrl || '/images/default-avatar.jpg'); // ← LẤY AVATAR THẬT
    } catch (error) {
      console.error('Lỗi lấy profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUsername('');
        setUserAvatar('/images/default-avatar.jpg');
        updateCartCount();
        window.dispatchEvent(new Event('authChange'));
      }
    }
  };

  // === LẤY GIỎ HÀNG ===
  const fetchCartCount = async () => {
    const token = localStorage.getItem('accessToken');
    if (isLoggedIn && token) {
      try {
        const response = await API.get('/Cart');
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
          setUserAvatar('/images/default-avatar.jpg');
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

  const updateCartCount = () => fetchCartCount();

  // === THEO DÕI ĐĂNG NHẬP ===
  useEffect(() => {
    const handleAuthChange = () => {
      const loggedIn = !!localStorage.getItem('accessToken');
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        fetchUserProfile();
        fetchCartCount();
      } else {
        setUsername('');
        setUserAvatar('/images/default-avatar.jpg');
        updateCartCount();
      }
    };

    const handleCartUpdate = () => updateCartCount();

    handleAuthChange();
    fetchCategories();

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('cartUpdate', handleCartUpdate);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, [location.pathname]);

  // === TÌM KIẾM ===
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
    setUserAvatar('/images/default-avatar.jpg');
    setCartCount(getGuestCartCount());
    window.dispatchEvent(new Event('authChange'));
    window.dispatchEvent(new Event('cartUpdate'));
    navigate('/login');
  };

  return (
    <AppBar position="fixed" className={styles.header}>
      <Toolbar className={styles.toolbar}>
        <div className={styles.mainRow}>
          {/* LEFT */}
          <div className={styles.leftSection}>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className={styles.logo}>
              <img
                src={isMobile ? logoMobile : logo}
                alt="Điện máy XANH"
                className={styles.logoImage}
              />
            </a>

            <Button
              color="inherit"
              onClick={handleMenuOpen}
              className={styles.categoryButton}
              startIcon={<MenuIcon />}
            >
              <span className={styles.categoryText}>Danh mục</span>
            </Button>

            {/* Menu dropdown */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
              PaperProps={{ sx: { mt: 1, minWidth: 220 } }}>
              {loadingCategories ? (
                <MenuItem disabled><CircularProgress size={20} /> Đang tải...</MenuItem>
              ) : categories.length === 0 ? (
                <MenuItem disabled>Không có danh mục</MenuItem>
              ) : (
                categories.map((category) => {
                  const categoryId = category.id || category.categoryId;
                  return (
                    <MenuItem key={categoryId} onClick={() => handleCategoryClick(categoryId)}>
                      {category.categoryName}
                    </MenuItem>
                  );
                })
              )}
            </Menu>
          </div>

          {/* CENTER - Tìm kiếm (sẽ xuống dòng trên mobile) */}
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <Autocomplete
                freeSolo
                fullWidth                       // ← Thêm dòng này
                options={suggestions.map(p => p.productName)}
                inputValue={searchTerm}
                onInputChange={handleSearchChange}
                onChange={handleSearch}
                loading={loadingSuggestions}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Tìm kiếm sản phẩm..."
                    variant="outlined"
                    size="small"
                    className={styles.searchInput}
                    onKeyPress={handleSearch}
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
              <Button variant="contained" className={styles.searchButton} onClick={handleSearch}>
                <SearchIcon />
              </Button>
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.rightSection}>
            {isLoggedIn ? (
              <div className={styles.userInfo}>
                <IconButton onClick={() => navigate('/profile')} color="inherit">
                  <Avatar src={userAvatar} alt={username} sx={{ width: 36, height: 36 }} />
                </IconButton>
                <Typography className={styles.username} onClick={() => navigate('/profile')}>
                  {username}
                </Typography>
                <Button size="small" variant="contained" color="error" onClick={handleLogoutClick}>
                  Thoát
                </Button>
              </div>
            ) : (
              <Button variant="outlined" color="inherit" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            )}

            <IconButton color="inherit" onClick={() => navigate('/cart')} className={styles.cartIcon}>
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </div>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;