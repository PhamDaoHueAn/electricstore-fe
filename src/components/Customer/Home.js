import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';
import MyChatbot from '../Chatbot';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Pagination,
  PaginationItem,
  IconButton,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import API from '../../services/api';
import styles from './Home.module.css';
import FlashSale from './FlashSale';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();

  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Chatbot dialog
  const [openChat, setOpenChat] = useState(false);

  const handleOpenChat = () => setOpenChat(true);
  const handleCloseChat = () => setOpenChat(false);

  // Tải dữ liệu
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchProducts(),
          fetchBanners(),
          fetchCategories(),
        ]);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối backend.');
        console.error('Fetch all data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [currentPage, selectedCategory, searchTerm]);

  // Các hàm fetch giữ nguyên
  const fetchProducts = async () => {
    try {
      const response = await API.get('/Products/GetAll', {
        params: {
          pageNumber: currentPage,
          pageSize: pageSize,
          sortBy: 'CreatedAt',
          sortOrder: 'desc',
          categoryId: selectedCategory || undefined,
          searchTerm: searchTerm || undefined,
        },
        timeout: 10000,
      });

      const { data, totalPages } = response.data;
      const productsWithRating = (data || []).map(product => {
        const reviews = Array.isArray(product.productReview) ? product.productReview : [];
        const activeReviews = reviews.filter(r => r.isActive);
        const averageRating = activeReviews.length > 0
          ? activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length
          : 0;
        return { ...product, averageRating: parseFloat(averageRating.toFixed(1)) };
      });

      setProducts(productsWithRating);
      setTotalPages(totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalPages(1);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await API.get('/Banner', { timeout: 5000 });
      const bannerArray = response.data?.data || response.data || [];
      setBanners(Array.isArray(bannerArray) ? bannerArray : []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('/Categories', { timeout: 5000 });
      const categoryArray = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoryArray) ? categoryArray : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryImageClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    navigate(`/category/${categoryId}`);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false
  };

  const categorySliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 6,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4, slidesToScroll: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 2 } }
    ],
    arrows: false,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải...</Typography>
      </Box>
    );
  }

  return (
    <>
      <div className={styles.container}>
        {error && (
          <Box sx={{ bgcolor: 'error.main', color: 'white', p: 2, textAlign: 'center' }}>
            <Typography>{error}</Typography>
            <Button onClick={() => window.location.reload()} variant="contained" color="secondary" sx={{ mt: 1 }}>
              Thử lại
            </Button>
          </Box>
        )}

        {/* Banner */}
        <Container maxWidth="lg">
          <Box className={styles.banner}>
            {banners.length > 0 ? (
              <Slider {...sliderSettings}>
                {banners.map((banner) => (
                  <div key={banner.id}>
                    <img
                      src={banner.imageUrl || '/placeholder-banner.jpg'}
                      alt={`Banner ${banner.id}`}
                      className={styles.bannerImage}
                      onError={(e) => { e.target.src = '/placeholder-banner.jpg'; }}
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <Box style={{ height: '400px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Không có banner</Typography>
              </Box>
            )}
          </Box>
        </Container>

        <FlashSale />

        {/* Category Carousel */}
        <Container maxWidth="lg">
          <section className={styles.mainMenuCategories}>
            <div className={styles.listCates}>
              <Slider {...categorySliderSettings}>
                {categories.map((category) => {
                  const categoryId = category.id || category.categoryId;
                  return (
                    <div key={categoryId} className={`${styles.cateItem} ${selectedCategory === categoryId ? styles.selected : ''}`}>
                      <a
                        href={`/category/${categoryId}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleCategoryImageClick(categoryId);
                        }}
                      >
                        <span>{category.discount || 'HOT'}</span>
                        <img
                          src={category.imageUrl || '/images/category-placeholder.jpg'}
                          alt={category.categoryName}
                          width="47"
                          height="47"
                          onError={(e) => { e.target.src = '/images/category-placeholder.jpg'; }}
                        />
                        <p>{category.categoryName}</p>
                      </a>
                    </div>
                  );
                })}
              </Slider>
            </div>
          </section>
        </Container>

        {/* Product Grid + Pagination */}
        <Container maxWidth="lg">
          <Box className={styles.productGrid}>
            {products.length === 0 ? (
              <Box textAlign="center" p={4}>
                <Typography variant="h6">Không tìm thấy sản phẩm</Typography>
                <Button onClick={() => { setSearchTerm(''); setSelectedCategory(null); setCurrentPage(1); }} variant="outlined" sx={{ mt: 2 }}>
                  Xóa bộ lọc
                </Button>
              </Box>
            ) : (
              <>
                <ul className={styles.listproduct}>
                  {products.map((product) => (
                    <li key={product.productId} className={styles.item}>
                      <a onClick={() => navigate(`/product-detail/${product.productId}`)} className={styles.mainContain}>
                        <div className={styles.itemLabel}>
                          {product.manufactureYear >= 2025 && <span className={styles.lnNew}>Mẫu mới</span>}
                        </div>
                        <div className={styles.itemImg}>
                          <img
                            className={styles.thumb}
                            src={product.mainImage || '/placeholder-product.jpg'}
                            alt={product.productName}
                            loading="lazy"
                            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                          />
                        </div>
                        <h3>
                          {product.productName}
                          
                        </h3>
                        <div className={styles.itemCompare}>
                          {product.manufactureYear && <span>{product.manufactureYear}W</span>}
                        </div>
                        <p className={styles.itemTxtOnline}>
                          <i></i>
                          <span>Online giá rẻ quá</span>
                        </p>
                        <strong className={styles.price}>
                          {product.sellPrice.toLocaleString('vi-VN')}₫
                        </strong>
                        {product.originalPrice > 0 && (
                          <div className={styles.boxP}>
                            <p className={styles.priceOld}>
                              {product.originalPrice.toLocaleString('vi-VN')}₫
                            </p>
                            <span className={styles.percent}>
                              -{Math.round(((product.originalPrice - product.sellPrice) / product.originalPrice) * 100)}%
                            </span>
                          </div>
                        )}
                        
                      </a>
                      <div className={styles.itemBottom}>
                        <a href="javascript:;" className={styles.shiping} aria-label="shiping">
                          <i className="bi bi-truck"></i>
                        </a>
                      </div>
                      <div className={styles.ratingCompare}>
                        <div className={styles.voteTxt}>
                          <i></i>
                          <b>{product.averageRating || 0}</b>
                        </div>
                        <span className={styles.stockCount}>• Tồn kho {product.stockQuantity?.toLocaleString('vi-VN') || 0}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pb: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      renderItem={(item) => (
                        <PaginationItem
                          slots={{ previous: ArrowBackIosIcon, next: ArrowForwardIosIcon }}
                          {...item}
                        />
                      )}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Container>
      </div>
      
      <>
        
        <Fab
          color="primary"
          aria-label="chat"
          onClick={handleOpenChat}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            background: 'linear-gradient(45deg, #0560e7, #0088ff)',
            boxShadow: '0 4px 20px rgba(5, 96, 231, 0.4)',
            '&:hover': {
              background: '#0044cc',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <ChatIcon sx={{ fontSize: 30 }} />
        </Fab>

        {/* Khung chat nhỏ */}
        <Dialog
          open={openChat}
          onClose={handleCloseChat}
          TransitionComponent={Transition}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              position: 'fixed',
              bottom: 0,
              right: 20,
              m: 0,
              width: { xs: '100%', sm: 380 },
              height: { xs: '100%', sm: 550 },
              maxHeight: '90vh',
              borderRadius: { xs: 0, sm: '16px 16px 0 0' },
              boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: '#0560e7', color: 'white', py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Hỗ trợ trực tuyến
            </Typography>
            <IconButton onClick={handleCloseChat} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: '100%' }}>
            <MyChatbot />
          </DialogContent>
        </Dialog>
      </>
    </>
  );
};

export default Home;