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
import API from '../../services/api';
import styles from './Home.module.css';
import FlashSale from './FlashSale';

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
  }, [isLoggedIn, selectedCategory]);

  const fetchProducts = async () => {
    try {
      // Gọi API với categoryId nếu có
      const firstResponse = await API.get('/Products/GetAll', {
        params: {
          pageNumber: 1,
          pageSize: 12,
          sortBy: 'CreatedAt',
          sortOrder: 'desc',
          categoryId: selectedCategory || undefined,
          brandId: undefined, // Có thể thêm lọc thương hiệu sau
        },
        timeout: 5000,
      });
      console.log('First products response:', firstResponse.data);

      const { totalPages, data: firstPageData } = firstResponse.data;
      let allProducts = firstPageData || [];

      // Lấy các trang còn lại nếu totalPages > 1
      if (totalPages > 1) {
        const pageRequests = [];
        for (let page = 2; page <= totalPages; page++) {
          pageRequests.push(
            API.get('/Products/GetAll', {
              params: {
                pageNumber: page,
                pageSize: 12,
                sortBy: 'CreatedAt',
                sortOrder: 'desc',
                categoryId: selectedCategory || undefined,
                brandId: undefined,
              },
              timeout: 5000,
            })
          );
        }
        const responses = await Promise.all(pageRequests);
        responses.forEach(response => {
          allProducts = allProducts.concat(response.data.data || []);
        });
      }

      // Tính averageRating từ productReview
      allProducts = allProducts.map(product => {
        const reviews = Array.isArray(product.productReview) ? product.productReview : [];
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.isActive ? review.rating : 0), 0) / reviews.filter(r => r.isActive).length
          : 0;
        return { ...product, averageRating };
      });

      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      throw error;
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await API.get('/Banner', { timeout: 5000 });
      console.log('Banners response:', response.data);
      let bannerArray = response.data;
      if (response.data?.data) {
        bannerArray = response.data.data;
      }
      setBanners(Array.isArray(bannerArray) ? bannerArray : []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
      throw error;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('/Categories', { timeout: 5000 });
      console.log('Categories response:', response.data);
      let categoryArray = response.data;
      if (response.data?.data) {
        categoryArray = response.data.data;
      }
      setCategories(Array.isArray(categoryArray) ? categoryArray : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      throw error;
    }
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
      const matchesSearch = product.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || (product.categoryId == selectedCategory);
      console.log('Filtering product:', product.productId, 'categoryId:', product.categoryId, 'selected:', selectedCategory, 'matches:', matchesCategory);
      return matchesSearch && matchesCategory;
    })
    : [];

  const handleCategoryImageClick = (categoryId) => {
    console.log('Navigating to category:', categoryId);
    setSelectedCategory(categoryId);
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
  };

  const categorySliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
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
              {categories.map((category, index) => {
                const categoryId = category.id || category.categoryId;
                return (
                  <div key={categoryId || index} className={`${styles.cateItem} ${selectedCategory === categoryId ? styles.selected : ''}`}>
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
          <div className={styles.pagesScroll}></div>
        </section>
        {categories.length === 0 && !loading && (
          <Box textAlign="center" p={4}>
            <Typography color="error">Không có danh mục. Kiểm tra API /Categories.</Typography>
          </Box>
        )}
      </Container>

      {/* Product Grid */}
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
                    <div className={styles.itemLabel}>
                      {product.manufactureYear >= 2025 && <span className={styles.lnNew}>Mẫu mới</span>}
                      <span className={styles.lbTragop}>Trả chậm 0% trả trước 0đ</span>
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
                    <p className={styles.resultLabel}>
                      <img src="/images/promotion-icon.png" alt="Promotion" width="20" height="20" />
                      <span>TRUNG THU GIẢM LỚN</span>
                    </p>
                    <h3>
                      {product.productName}
                      {product.manufactureYear >= 2025 && <span className={styles.newModel}>Mẫu mới</span>}
                    </h3>
                    <div className={styles.itemCompare}>
                      {product.manufactureYear && <span>{product.manufactureYear}W</span>}
                      <span>Có bơm trợ lực</span>
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
                          {Math.round(((product.originalPrice - product.sellPrice) / product.originalPrice) * 100)}%
                        </span>
                      </div>
                    )}
                    <p className={styles.itemGift}>
                      Quà <b>70.000₫</b>
                    </p>
                  </a>
                  <div className={styles.itemBottom}>
                    <a href="javascript:;" className={styles.shiping} aria-label="shiping">
                      <i className="bi bi-truck"></i>
                    </a>
                  </div>
                  <div className={styles.ratingCompare}>
                    <div className={styles.voteTxt}>
                      <i></i>
                      <b>{(product.averageRating || 0).toFixed(1)}</b>
                    </div>
                    <span className={styles.stockCount}>• Tồn kho {product.stockQuantity.toLocaleString('vi-VN')}</span>
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