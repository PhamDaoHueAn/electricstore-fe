import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';
import MyChatbot from '../Chatbot';
import { 
  Container, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Box,
  Menu,
  MenuItem
} from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import MenuIcon from '@mui/icons-material/Menu';
import API from '../../services/api';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [banners, setBanners] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await API.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const fetchBanners = async () => {
      try {
        const response = await API.get('/banners'); // Gọi API để lấy banner
        setBanners(response.data); // Lưu dữ liệu banner vào state
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };

    fetchProducts();
    fetchBanners();
  }, []);

  const filteredProducts = products.filter(product =>
    product.ProductName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLoginClick = () => navigate('/login');
  const handleLogoutClick = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerTop}>
        <Container>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h5" component="a" href="/" className={styles.logo}>
                Điện Máy Xanh
              </Typography>
            </Grid>
            <Grid item className={styles.userActions}>
              {!isLoggedIn ? (
                <>
                  <Button variant="outlined" color="primary" href="/login" className="me-2">
                    <i className="bi bi-box-arrow-in-right"></i> Đăng nhập
                  </Button>
                  <Button variant="outlined" color="primary" href="/register" className="me-2">
                    <i className="bi bi-person-plus"></i> Đăng ký
                  </Button>
                  <Button variant="contained" color="primary">
                    <i className="bi bi-cart"></i> Giỏ hàng (0)
                  </Button>
                </>
              ) : (
                <>
                  <IconButton onClick={handleMenuOpen} color="inherit">
                    <img src="/images/anhdaidien.jpg" alt="User Avatar" className="rounded-circle" style={{ width: '30px', height: '30px' }} />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    className={styles.dropdownMenu}
                  >
                    <MenuItem onClick={handleMenuClose}>
                      <i className="bi bi-person-fill"></i> Thông tin cá nhân
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>
                      <i className="bi bi-cart"></i> Giỏ hàng (0)
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>
                      <i className="bi bi-box"></i> Danh sách sản phẩm
                    </MenuItem>
                    <MenuItem onClick={handleLogoutClick} className="text-danger">
                      <i className="bi bi-box-arrow-right"></i> Đăng Xuất
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </div>

      <nav className={styles.navBar}>
        <Container>
          <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" aria-label="menu">
                <MenuIcon />
              </IconButton>
              <Grid container spacing={2}>
                <Grid item>
                  <Typography variant="body1" className={styles.navLink}>
                    <a href="/" className={styles.navLink}>Trang chủ</a>
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body1" className={styles.navLink}>
                    <div className="dropdown">
                      <a href="#" className={`${styles.navLink} dropdown-toggle`} data-bs-toggle="dropdown">Danh mục sản phẩm</a>
                      <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="#">Điện thoại</a></li>
                        <li><a className="dropdown-item" href="#">Laptop</a></li>
                        <li><a className="dropdown-item" href="#">Tivi</a></li>
                        <li><a className="dropdown-item" href="#">Tủ lạnh</a></li>
                        <li><a className="dropdown-item" href="#">Máy giặt</a></li>
                      </ul>
                    </div>
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body1" className={styles.navLink}>
                    <a href="#" className={styles.navLink}>Sản phẩm mới</a>
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body1" className={styles.navLink}>
                    <a href="#" className={styles.navLink}>Sản phẩm bán chạy</a>
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body1" className={styles.navLink}>
                    <a href="#" className={styles.navLink}>Đơn hàng</a>
                  </Typography>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
        </Container>
      </nav>

      {/* Banner */}
      <Box className={styles.banner}>
        <Slider {...sliderSettings}>
          {banners.map((banner) => (
            <div key={banner.id}>
              <img src={banner.imageUrl} alt={`Banner ${banner.id}`} className={styles.bannerImage} />
            </div>
          ))}
        </Slider>
      </Box>

      {/* Search Area */}
      <Container maxWidth="md" className={styles.searchArea}>
        <div className="input-group shadow-sm">
          <TextField
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm sản phẩm điện máy..."
            className={styles.searchInput}
          />
          <Button variant="contained" color="primary" style={{ marginLeft: '10px', borderRadius: '25px' }}>
            <i className="bi bi-search"></i> Tìm kiếm
          </Button>
        </div>
      </Container>

      {/* Product Grid */}
      <Container maxWidth="lg" className={styles.productGrid}>
        <Grid container spacing={3} className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {filteredProducts.map((product) => (
            <Grid item key={product.ProductId || product.id}>
              <Card className={styles.productCard} onClick={() => navigate(`/product-detail/${product.ProductId}`)}>
                <CardMedia
                  component="img"
                  image={`/images/${product.MainImage}`} // Thay bằng URL thực tế
                  alt={product.ProductName}
                  className={styles.productImage}
                />
                <CardContent>
                  <Typography variant="h6" className={styles.productTitle}>
                    {product.ProductName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {product.Description.substring(0, 50)}...
                  </Typography>
                  <Typography variant="body1" className={styles.productPrice}>
                    {product.SellPrice.toLocaleString('vi-VN')} VNĐ
                  </Typography>
                  <Typography variant="body2" className={styles.productOriginalPrice}>
                    {product.OriginalPrice.toLocaleString('vi-VN')} VNĐ
                  </Typography>
                  <Button variant="contained" className={styles.addToCartButton} disabled={!isLoggedIn}>
                    <i className="bi bi-cart-plus"></i> Thêm vào giỏ
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <footer className={styles.footer}>
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom>
                Về chúng tôi
              </Typography>
              <Typography variant="body2">
                Điện Máy Xanh - Nơi mang đến những sản phẩm điện tử chất lượng
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom>
                Liên hệ
              </Typography>
              <Typography variant="body2">
                <i className="bi bi-envelope me-2"></i> contact@dienmayxanh.com
              </Typography>
              <Typography variant="body2">
                <i className="bi bi-telephone me-2"></i> 1800-xxx-xxx
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom>
                Theo dõi chúng tôi
              </Typography>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLinks}>
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" className={styles.socialLinks}>
                  <i className="bi bi-instagram"></i>
                </a>
                <a href="#" className={styles.socialLinks}>
                  <i className="bi bi-twitter"></i>
                </a>
              </div>
            </Grid>
          </Grid>
          <hr className="my-4" />
          <Typography variant="body2" className={styles.copyright}>
            &copy; 2025 Điện Máy Xanh. Tất cả quyền được bảo lưu.
          </Typography>
        </Container>
      </footer>

      {isLoggedIn && <MyChatbot />}
    </div>
  );
};

export default Home;