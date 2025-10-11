import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';
import MyChatbot from '../Chatbot';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress
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
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    try {
      const response = await API.get('/Products/GetAll');
      console.log('Products response:', response.data); // Debug

      // Lấy array từ response.data.data (pagination)
      const productArray = response.data?.data || [];
      setProducts(Array.isArray(productArray) ? productArray : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Fallback
      throw error;
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await API.get('/Banner');
      console.log('Banners response:', response.data); // Debug

      // Giả định banners là array trực tiếp hoặc wrap
      let bannerArray = response.data;
      if (response.data?.data) {
        bannerArray = response.data.data;  // Nếu wrap pagination
      }
      setBanners(Array.isArray(bannerArray) ? bannerArray : []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]); // Fallback
      throw error;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('/Categories');
      console.log('Categories response:', response.data); // Debug

      // Giả định categories là array trực tiếp hoặc wrap
      let categoryArray = response.data;
      if (response.data?.data) {
        categoryArray = response.data.data;  // Nếu wrap pagination
      }
      setCategories(Array.isArray(categoryArray) ? categoryArray : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Fallback
      throw error;
    }
  };



  // FilteredProducts: Kết hợp search và category, match ID linh hoạt
  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
      const matchesSearch = product.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || (product.categoryId == selectedCategory); // Loose equality cho number/string
      console.log('Filtering product:', product.productId, 'categoryId:', product.categoryId, 'selected:', selectedCategory, 'matches:', matchesCategory); // Debug
      return matchesSearch && matchesCategory;
    })
    : [];





  // Handler cho category image click
  const handleCategoryImageClick = (categoryId) => {
    console.log('handleCategoryImageClick called with ID:', categoryId, 'Current products:', products.length); // Debug
    if (selectedCategory == categoryId) {
      setSelectedCategory(null); // Toggle off
    } else {
      setSelectedCategory(categoryId);
    }
    setSearchTerm(''); // Xóa search
    // Log filtered sau update (sẽ re-render)
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  // Category Carousel Settings
  const categorySliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 6, // 6 item (3 li x 2)
    slidesToScroll: 6,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4, slidesToScroll: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
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
    <div className={styles.container}>
      {error && (
        <Box sx={{ bgcolor: 'error.main', color: 'white', p: 2, textAlign: 'center' }}>
          <Typography>{error}</Typography>
          <Button onClick={() => window.location.reload()} variant="contained" color="secondary" sx={{ mt: 1 }}>
            Thử lại
          </Button>
        </Box>
      )}

    
      {/* Banner - Centered */}
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

      {/* Category Carousel - Centered, Giống DMX */}
      <Container maxWidth="lg">
        <section className={styles.mainMenuCategories}>
          <div className={styles.listCates}>
            <Slider {...categorySliderSettings}>
              {categories.map((category, index) => {
                const categoryId = category.id || category.categoryId; // Linh hoạt ID
                return (
                  <div key={categoryId || index} className={`${styles.cateItem} ${selectedCategory === categoryId ? styles.selected : ''}`}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault(); // Ngăn href mặc định
                        console.log('Category clicked:', categoryId, 'Current selected:', selectedCategory); // Debug
                        handleCategoryImageClick(categoryId);
                      }}
                    >
                      <span>{category.discount || 'HOT'}</span> {/* Từ API hoặc hardcode */}
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
          <div className={styles.pagesScroll}>
            {/* Dots tự động từ Slick */}
          </div>
        </section>
        {categories.length === 0 && !loading && (
          <Box textAlign="center" p={4}>
            <Typography color="error">Không có danh mục. Kiểm tra API /Categories.</Typography>
          </Box>
        )}
      </Container>

      {/* Product Grid - Centered, CSS Grid Giống DMX */}
      <Container maxWidth="lg">
        <Box className={styles.productGrid}>
          {filteredProducts.length === 0 ? (
            <Box style={{ textAlign: 'center', padding: '50px' }}>
              <Typography variant="h6">Không có sản phẩm phù hợp</Typography>
              <Button onClick={() => { setSearchTerm(''); setSelectedCategory(null); }} variant="outlined" sx={{ mt: 2 }}>
                Xóa bộ lọc
              </Button>
            </Box>
          ) : (
            <ul className={styles.listproduct}>
              {filteredProducts.map((product, index) => (
                <li key={product.productId} className={styles.item} data-index={index + 1}>
                  <a
                    onClick={() => navigate(`/product-detail/${product.productId}`)}
                    className={styles.mainContain}
                  >
                    {/* Item Label */}
                    <div className={styles.itemLabel}>
                      {product.manufactureYear >= 2025 && <span className={styles.lnNew}>Mẫu mới</span>}
                      <span className={styles.lbTragop}>Trả chậm 0% trả trước 0đ</span>
                    </div>

                    {/* Item Img */}
                    <div className={styles.itemImg}>
                      <img
                        className={styles.thumb}
                        src={product.mainImage || '/placeholder-product.jpg'}
                        alt={product.productName}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                    </div>

                    {/* Result Label */}
                    <p className={styles.resultLabel}>
                      <img src="/images/promotion-icon.png" alt="Promotion" width="20" height="20" /> {/* Hardcode icon */}
                      <span>TRUNG THU GIẢM LỚN</span> {/* Hardcode hoặc từ API */}
                    </p>

                    {/* h3 */}
                    <h3>
                      {product.productName}
                      {product.manufactureYear >= 2025 && <span className={styles.newModel}>Mẫu mới</span>}
                    </h3>

                    {/* Item Compare */}
                    <div className={styles.itemCompare}>
                      {product.manufactureYear && <span>{product.manufactureYear}W</span>}
                      <span>Có bơm trợ lực</span> {/* Split từ description nếu cần */}
                    </div>

                    {/* Item Txt Online */}
                    <p className={styles.itemTxtOnline}>
                      <i></i>
                      <span>Online giá rẻ quá</span>
                    </p>

                    {/* Price */}
                    <strong className={styles.price}>
                      {product.sellPrice.toLocaleString('vi-VN')}₫
                    </strong>

                    {/* Box P */}
                    {product.originalPrice > 0 && (
                      <div className={styles.boxP}>
                        <p className={styles.priceOld}>
                          {product.originalPrice.toLocaleString('vi-VN')}₫
                        </p>
                        <span className={styles.percent}>
                          {Math.round(((product.originalPrice - product.sellPrice) / product.originalPrice) * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Item Gift */}
                    <p className={styles.itemGift}>
                      Quà <b>70.000₫</b> {/* Hardcode hoặc từ API */}
                    </p>
                  </a>

                  {/* Item Bottom */}
                  <div className={styles.itemBottom}>
                    <a href="javascript:;" className={styles.shiping} aria-label="shiping">
                      <i className="bi bi-truck"></i> {/* Icon shipping */}
                    </a>
                  </div>

                  {/* Rating Compare */}
                  <div className={styles.ratingCompare}>
                    <div className={styles.voteTxt}>
                      <i></i>
                      <b>4.9</b>
                    </div>
                    <span className={styles.soldCount}>• Đã bán 11,9k</span> {/* Hardcode hoặc từ API */}
                    <a href="javascript:;" className={styles.itemSs} onClick={(e) => e.stopPropagation()}>
                      <i className="bi bi-arrow-left-right"></i>
                      So sánh
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Box>
      </Container>

      

      {isLoggedIn && <MyChatbot />}
    </div>
  );
};

export default Home;