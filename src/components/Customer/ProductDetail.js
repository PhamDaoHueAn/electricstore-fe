import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Rating,
  CssBaseline,
  Modal,
  TextField,
} from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import API from '../../services/api';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode'; // Cài đặt: npm install jwt-decode
import styles from './ProductDetail.module.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorProduct, setErrorProduct] = useState(null);
  const [errorReviews, setErrorReviews] = useState(null);
  const sliderRef = useRef(null);
  const thumbnailRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // State cho modal đánh giá
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [editReviewId, setEditReviewId] = useState(null);

  // Lấy thông tin từ token
  const getUserIdFromToken = () => {
    const token = Cookies.get('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.AccountID || decoded.sub; // Tùy thuộc vào cấu trúc token
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    }
    return null;
  };

  // Làm mới token
  const refreshToken = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');
    try {
      const response = await API.post('/api/Auth/refresh', { refreshToken });
      Cookies.set('authToken', response.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: 7 });
      return response.data.accessToken;
    } catch (error) {
      console.error('Refresh token failed:', error);
      Cookies.remove('authToken');
      Cookies.remove('refreshToken');
      navigate('/login');
      return null;
    }
  };

  // Kiểm tra và làm mới token trước khi gửi yêu cầu
  const withTokenRefresh = async (apiCall) => {
    const token = Cookies.get('authToken');
    if (!token) {
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
    const fetchProduct = async () => {
      setLoadingProduct(true);
      try {
        const response = await withTokenRefresh((token) =>
          API.get(`/Products/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
        );
        if (!response.data || Object.keys(response.data).length === 0) {
          throw new Error('Sản phẩm không tồn tại trong response');
        }
        setProduct(response.data);
      } catch (err) {
        setErrorProduct(err.response?.data?.message || 'Không thể tải sản phẩm. Vui lòng thử lại.');
        console.error('Fetch product error:', err.response?.data || err.message);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const response = await withTokenRefresh((token) =>
          API.get(`/ProductReview/ByProduct/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
        );
        setReviews(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setErrorReviews('Không thể tải đánh giá. Hiển thị sản phẩm mà không có đánh giá.');
        console.error('Fetch reviews error:', err.response?.data || err.message);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [productId, navigate]);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <button type="button" className="slick-prev">&#10094;</button>,
    nextArrow: <button type="button" className="slick-next">&#10095;</button>,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  const handleAddToCart = () => {
    console.log('Thêm vào giỏ hàng:', productId);
    // TODO: Implement API call to add to cart with token
  };

  const handleThumbnailClick = (index) => {
    setCurrentSlide(index);
    sliderRef.current.slickGoTo(index);
  };

  // Kiểm tra xem người dùng đã đánh giá chưa
  const userId = getUserIdFromToken();
  const hasReviewed = userId && reviews.some((review) => review.userId === userId && review.isActive);

  // Mở modal để viết hoặc sửa đánh giá
  const handleOpenReviewModal = (review = null) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để viết đánh giá!');
      navigate('/login');
      return;
    }
    if (review) {
      setEditReviewId(review.reviewId);
      setReviewRating(review.rating);
      setReviewContent(review.content);
    } else if (hasReviewed) {
      alert('Bạn đã đánh giá sản phẩm này. Chỉ có thể sửa đánh giá!');
      const userReview = reviews.find((r) => r.userId === userId && r.isActive);
      if (userReview) handleOpenReviewModal(userReview);
      return;
    } else {
      setEditReviewId(null);
      setReviewRating(0);
      setReviewContent('');
    }
    setOpenReviewModal(true);
  };

  // Đóng modal
  const handleCloseReviewModal = () => {
    setOpenReviewModal(false);
    setReviewRating(0);
    setReviewContent('');
    setEditReviewId(null);
  };

  // Gửi đánh giá mới
  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewContent) {
      alert('Vui lòng nhập đầy đủ thông tin đánh giá!');
      return;
    }

    const reviewData = {
      productId: parseInt(productId),
      userId: userId,
      rating: reviewRating,
      content: reviewContent,
    };

    try {
      const response = await withTokenRefresh((token) =>
        API.post('/ProductReview/create', reviewData, { headers: { Authorization: `Bearer ${token}` } })
      );
      if (response.status === 200) {
        alert('Đánh giá thành công!');
        setReviews([...reviews, response.data]);
        handleCloseReviewModal();
      }
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Đã xảy ra lỗi khi gửi đánh giá!');
    }
  };

  // Cập nhật đánh giá
  const handleUpdateReview = async () => {
    if (!reviewRating || !reviewContent) {
      alert('Vui lòng nhập đầy đủ thông tin đánh giá!');
      return;
    }

    const reviewData = {
      rating: reviewRating,
      content: reviewContent,
    };

    try {
      const response = await withTokenRefresh((token) =>
        API.put(`/ProductReview/${editReviewId}`, reviewData, { headers: { Authorization: `Bearer ${token}` } })
      );
      if (response.status === 200) {
        alert('Cập nhật đánh giá thành công!');
        setReviews(reviews.map((r) => (r.reviewId === editReviewId ? response.data : r)));
        handleCloseReviewModal();
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Đã xảy ra lỗi khi cập nhật đánh giá!');
    }
  };

  if (loadingProduct) {
    return (
      <Container maxWidth="lg" className={styles.loading}>
        <Typography variant="h6">Đang tải sản phẩm...</Typography>
      </Container>
    );
  }

  if (errorProduct || !product) {
    return (
      <Container maxWidth="lg" className={styles.error}>
        <Typography variant="h6" color="error">
          {errorProduct || 'Sản phẩm không tồn tại.'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  const { productName, sellPrice, originalPrice, mainImage, subImages, description, brandName, categoryName, manufactureYear, stockQuantity } = product;
  const discountPercent = originalPrice > sellPrice ? Math.round(((originalPrice - sellPrice) / originalPrice) * 100) : 0;
  const descriptionPoints = description ? description.split(', ').map(item => item.trim()) : [];
  const images = [mainImage, ...(subImages || [])];

  const averageRating = reviews.length > 0 && reviews.some(r => r.isActive)
    ? reviews.reduce((sum, review) => sum + (review.isActive ? review.rating : 0), 0) / reviews.filter(r => r.isActive).length
    : 4.9;

  return (
    <Container maxWidth="lg" className={styles.container}>
      <CssBaseline />
      <Box sx={{ my: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, color: '#0560e7' }}
        >
          Quay lại
        </Button>
        <Grid container spacing={4}>
          {/* Hình Ảnh */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} className={styles.imageContainer}>
              <div className={styles.productPageImg}>
                <Slider {...sliderSettings} ref={sliderRef}>
                  {images.map((img, index) => (
                    <div key={index} className={styles.mySlides} style={{ display: currentSlide === index ? 'block' : 'none' }}>
                      <div className={styles.numbertext}>{index + 1} / {images.length}</div>
                      <img
                        src={img || '/placeholder-product.jpg'}
                        alt={`${productName} ${index + 1}`}
                        className={styles.mainImage}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                  ))}
                </Slider>
                <a href="#" className={styles.prev} onClick={() => sliderRef.current.slickPrev()}>&#10094;</a>
                <a href="#" className={styles.next} onClick={() => sliderRef.current.slickNext()}>&#10095;</a>
                <div className={styles.sliderImg} ref={thumbnailRef}>
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`${styles.sliderBox} ${currentSlide === index ? styles.active : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img
                        src={img || '/placeholder-product.jpg'}
                        alt={`${productName} thumbnail ${index + 1}`}
                        className={styles.thumbnailImage}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Paper>
          </Grid>

          {/* Thông Tin Sản Phẩm */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" className={styles.productTitle}>
              {productName}
              {manufactureYear >= 2025 && <span className={styles.newModel}>Mẫu mới</span>}
            </Typography>
            <Box className={styles.rating}>
              <Rating value={averageRating} readOnly precision={0.1} />
              <Typography variant="body2" color="text.secondary">
                ({averageRating.toFixed(1)} • {reviews.filter(r => r.isActive).length} đánh giá • Đã bán {Math.max(1000 - stockQuantity, 0).toLocaleString('vi-VN')}k)
              </Typography>
            </Box>
            <Typography variant="h5" className={styles.price}>
              {sellPrice.toLocaleString('vi-VN')}₫
            </Typography>
            {originalPrice > sellPrice && (
              <Box className={styles.priceBox}>
                <Typography variant="body2" className={styles.originalPrice}>
                  {originalPrice.toLocaleString('vi-VN')}₫
                </Typography>
                <Typography variant="body2" className={styles.discount}>
                  -{discountPercent}%
                </Typography>
              </Box>
            )}
            <Typography variant="body2" className={styles.gift}>
              Quà tặng: <strong>70.000₫</strong>
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddShoppingCartIcon />}
              className={styles.addToCart}
              onClick={handleAddToCart}
              sx={{ mt: 2, py: 1.5, backgroundColor: '#0560e7', '&:hover': { backgroundColor: '#004ba0' } }}
            >
              Thêm vào giỏ hàng
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleOpenReviewModal()}
              sx={{ mt: 2, ml: 2, color: '#0560e7', borderColor: '#0560e7' }}
            >
              Viết đánh giá
            </Button>
          </Grid>

          {/* Mô Tả & Thông Số */}
          <Grid item xs={12}>
            <Paper elevation={2} className={styles.details}>
              <Typography variant="h6">Đặc điểm nổi bật</Typography>
              <ul className={styles.descriptionList}>
                {descriptionPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
              <Typography variant="h6" sx={{ mt: 3 }}>
                Thông số kỹ thuật
              </Typography>
              <Box className={styles.specs}>
                <Typography>Thương hiệu: <strong>{brandName}</strong></Typography>
                <Typography>Danh mục: <strong>{categoryName}</strong></Typography>
                <Typography>Năm sản xuất: <strong>{manufactureYear}</strong></Typography>
                <Typography>Kho: <strong>{stockQuantity} sản phẩm</strong></Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Đánh Giá Sản Phẩm */}
          <Grid item xs={12}>
            <Paper elevation={2} className={styles.details}>
              <Typography variant="h6">Đánh Giá Sản Phẩm</Typography>
              {loadingReviews ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Đang tải đánh giá...
                </Typography>
              ) : errorReviews || reviews.length === 0 || reviews.every(r => !r.isActive) ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Chưa có đánh giá nào cho sản phẩm này.
                </Typography>
              ) : (
                <Box className={styles.reviews}>
                  {reviews
                    .filter(review => review.isActive)
                    .map(review => (
                      <Box key={review.reviewId} className={styles.reviewItem}>
                        <Box className={styles.reviewHeader}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {review.name}
                          </Typography>
                          <Rating value={review.rating} readOnly size="small" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN') === '01/01/0001'
                            ? 'Không rõ'
                            : new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {review.content}
                        </Typography>
                        {review.childReview && (
                          <Box className={styles.childReview}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {review.childReview.name}
                            </Typography>
                            <Typography variant="body2">
                              {review.childReview.content}
                            </Typography>
                          </Box>
                        )}
                        {userId === review.userId && (
                          <Button
                            variant="outlined"
                            onClick={() => handleOpenReviewModal(review)}
                            sx={{ mt: 1, color: '#0560e7', borderColor: '#0560e7' }}
                          >
                            Sửa đánh giá
                          </Button>
                        )}
                      </Box>
                    ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Modal Đánh Giá */}
        <Modal
          open={openReviewModal}
          onClose={handleCloseReviewModal}
          aria-labelledby="review-modal-title"
          className={styles.modal}
        >
          <Box sx={{ width: 400, bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
            <Typography id="review-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
              {editReviewId ? 'Sửa đánh giá' : 'Viết đánh giá'}
            </Typography>
            <Rating
              value={reviewRating}
              onChange={(e, newValue) => setReviewRating(newValue)}
              precision={0.5}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Nhập nội dung đánh giá..."
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCloseReviewModal} variant="outlined">
                Hủy
              </Button>
              <Button
                onClick={editReviewId ? handleUpdateReview : handleSubmitReview}
                variant="contained"
                color="primary"
              >
                {editReviewId ? 'Cập nhật' : 'Gửi'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Container>
  );
};

export default ProductDetail;