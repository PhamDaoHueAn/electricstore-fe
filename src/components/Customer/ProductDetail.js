import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import API from '../../services/api';
import { isAuthenticated } from '../../services/auth';
import { jwtDecode } from 'jwt-decode';
import styles from './ProductDetail.module.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [errorProduct, setErrorProduct] = useState(null);
  const [errorReviews, setErrorReviews] = useState(null);
  const [errorRelated, setErrorRelated] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [editReviewId, setEditReviewId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy userId từ token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        return decoded.AccountID || decoded.sub || null;
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    }
    return null;
  };

  // Làm mới token
  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token available');
      throw new Error('No refresh token available');
    }
    try {
      const response = await API.post('/Auth/refresh-token', { refreshToken }, { timeout: 5000 });
      console.log('Refresh token response:', response.data);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data.accessToken;
    } catch (error) {
      console.error('Refresh token failed:', error.response?.data || error.message);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('authChange'));
      navigate('/login');
      throw error;
    }
  }, [navigate]);

  // Kiểm tra và làm mới token trước khi gửi yêu cầu
  const withTokenRefresh = useCallback(async (apiCall) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return null;
    }
    const token = localStorage.getItem('accessToken');
    try {
      return await apiCall(token);
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          return await apiCall(newToken);
        }
      }
      throw error;
    }
  }, [navigate, refreshToken]);

  // Fetch sản phẩm
  const fetchProduct = useCallback(async () => {
    setLoadingProduct(true);
    try {
      const response = await API.get(`/Products/${productId}`, { timeout: 5000 });
      if (!response.data || Object.keys(response.data).length === 0) {
        throw new Error('Sản phẩm không tồn tại');
      }
      setProduct(response.data);
    } catch (err) {
      setErrorProduct(err.response?.data?.message || 'Không thể tải sản phẩm. Vui lòng thử lại.');
      console.error('Fetch product error:', err.response?.data || err.message);
      setProduct(null);
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  // Fetch đánh giá
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const response = await API.get(`/ProductReview/ByProduct/${productId}`, { timeout: 5000 });
      const data = Array.isArray(response.data) ? response.data : [];
      setReviews(data);
      setErrorReviews(data.length === 0 ? 'Sản phẩm chưa có đánh giá.' : null);
    } catch (err) {
      setErrorReviews('Sản phẩm chưa có đánh giá.');
      console.error('Fetch reviews error:', err.response?.data || err.message);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  // Fetch sản phẩm tương tự
  const fetchRelatedProducts = useCallback(async () => {
    if (!product) return;
    setLoadingRelated(true);
    try {
      const response = await API.get('/Products/GetAll', { timeout: 5000 });
      if (response.data && Array.isArray(response.data.data)) {
        const filtered = response.data.data
          .filter(
            (p) =>
              p.productId !== parseInt(productId) &&
              p.categoryName === product.categoryName
          )
          .slice(0, 4);
        setRelatedProducts(filtered);
        setErrorRelated(filtered.length === 0 ? 'Không tìm thấy sản phẩm tương tự.' : null);
      } else {
        setRelatedProducts([]);
        setErrorRelated('Không tìm thấy sản phẩm tương tự.');
      }
    } catch (error) {
      setErrorRelated('Không thể tải sản phẩm tương tự.');
      console.error('Error fetching related products:', error.response?.data || error.message);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [productId, product]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId, fetchProduct, fetchReviews]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product, fetchRelatedProducts]);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      navigate('/login');
      return;
    }
    try {
      const response = await withTokenRefresh((token) =>
        API.post(
          '/Cart/add',
          { productId: parseInt(productId), quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      console.log('Add to cart response:', response.data);
      alert('Đã thêm vào giỏ hàng!');
      window.dispatchEvent(new Event('authChange')); // Cập nhật giỏ hàng trong Header
    } catch (error) {
      console.error('Error adding to cart:', error.response?.data || error.message);
      alert('Đã xảy ra lỗi khi thêm vào giỏ hàng!');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated()) {
      alert('Vui lòng đăng nhập để mua ngay!');
      navigate('/login');
      return;
    }
    try {
      const response = await withTokenRefresh((token) =>
        API.post(
          '/Cart/add',
          { productId: parseInt(productId), quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      console.log('Buy now response:', response.data);
      navigate('/checkout');
    } catch (error) {
      console.error('Error adding to cart for buy now:', error.response?.data || error.message);
      alert('Đã xảy ra lỗi khi xử lý mua ngay!');
    }
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
    if (!isAuthenticated()) {
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
    setReviewError(null);
  };

  // Gửi đánh giá mới
  const handleSubmitReview = async () => {
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Vui lòng chọn đánh giá từ 1 đến 5');
      return;
    }
    if (!reviewContent.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ProductId', parseInt(productId));
      formData.append('Rating', parseInt(reviewRating));
      formData.append('Content', reviewContent.trim());
      formData.append('ParentID', 0);

      console.log('Sending review data:', {
        ProductId: parseInt(productId),
        Rating: parseInt(reviewRating),
        Content: reviewContent.trim(),
        ParentID: 0,
      });

      const response = await withTokenRefresh((token) =>
        API.post('/api/ProductReview/create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
      );
      console.log('Create review response:', response.data);
      alert('Đánh giá thành công!');
      setReviews([...reviews, response.data]);
      handleCloseReviewModal();
    } catch (error) {
      console.error('Error creating review:', error.response?.data || error.message);
      setReviewError(
        error.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật đánh giá
  const handleUpdateReview = async () => {
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Vui lòng chọn đánh giá từ 1 đến 5');
      return;
    }
    if (!reviewContent.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('Rating', parseInt(reviewRating));
      formData.append('Content', reviewContent.trim());

      console.log('Updating review data:', {
        Rating: parseInt(reviewRating),
        Content: reviewContent.trim(),
      });

      const response = await withTokenRefresh((token) =>
        API.put(`/api/ProductReview/${editReviewId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
      );
      console.log('Update review response:', response.data);
      alert('Cập nhật đánh giá thành công!');
      setReviews(reviews.map((r) => (r.reviewId === editReviewId ? response.data : r)));
      handleCloseReviewModal();
    } catch (error) {
      console.error('Error updating review:', error.response?.data || error.message);
      setReviewError(
        error.response?.data?.message || 'Không thể cập nhật đánh giá. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
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
    : 0;

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
              <Slider {...sliderSettings} ref={sliderRef}>
                {images.map((img, index) => (
                  <div key={index}>
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
              <Box className={styles.sliderImg}>
                {images.map((img, index) => (
                  <Box
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
                  </Box>
                ))}
              </Box>
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
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddShoppingCartIcon />}
                className={styles.addToCart}
                onClick={handleAddToCart}
                sx={{ py: 1.5, backgroundColor: '#0560e7', '&:hover': { backgroundColor: '#004ba0' } }}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleBuyNow}
                sx={{ py: 1.5, backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
              >
                Mua ngay
              </Button>
            </Box>
            <Button
              variant="outlined"
              onClick={() => handleOpenReviewModal()}
              sx={{ mt: 2, color: '#0560e7', borderColor: '#0560e7' }}
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

          {/* Sản Phẩm Tương Tự */}
          <Grid item xs={12}>
            <Paper elevation={2} className={styles.details}>
              <Typography variant="h6">Sản Phẩm Tương Tự</Typography>
              {loadingRelated ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Đang tải sản phẩm tương tự...
                </Typography>
              ) : errorRelated || relatedProducts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Không tìm thấy sản phẩm tương tự.
                </Typography>
              ) : (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {relatedProducts.map((related) => (
                    <Grid item xs={12} sm={6} md={3} key={related.productId}>
                      <Card
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/product-detail/${related.productId}`)}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={related.mainImage || '/placeholder-product.jpg'}
                          alt={related.productName}
                          loading="lazy"
                          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                        />
                        <CardContent>
                          <Typography variant="subtitle1" noWrap>
                            {related.productName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {related.sellPrice.toLocaleString('vi-VN')}₫
                          </Typography>
                          <Rating value={related.averageRating || 0} readOnly size="small" />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
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
              ) : errorReviews ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {errorReviews}
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
            {reviewError && (
              <Typography color="error" sx={{ mb: 2 }}>
                {reviewError}
              </Typography>
            )}
            <Rating
              value={reviewRating}
              onChange={(e, newValue) => setReviewRating(newValue)}
              precision={1}
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
              <Button onClick={handleCloseReviewModal} variant="outlined" disabled={isSubmitting}>
                Hủy
              </Button>
              <Button
                onClick={editReviewId ? handleUpdateReview : handleSubmitReview}
                variant="contained"
                color="primary"
                disabled={isSubmitting}
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