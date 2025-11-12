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
  CardContent,
  CardMedia,
  CircularProgress
} from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import API from '../../services/api';
import styles from './ProductDetail.module.css';

const GUEST_CART_KEY = 'guestCart';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [error, setError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [editReviewId, setEditReviewId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // === KIỂM TRA ĐĂNG NHẬP ===
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // === GIỎ HÀNG KHÁCH ===
  const getGuestCart = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveGuestCart = (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  };

  // === FETCH SẢN PHẨM ===
  const fetchProduct = useCallback(async () => {
    setLoadingProduct(true);
    setError(null);
    try {
      const response = await API.get(`/Products/${productId}`);
      if (!response.data) throw new Error('Sản phẩm không tồn tại');
      setProduct(response.data);
    } catch (err) {
      setError('Không thể tải sản phẩm. Vui lòng thử lại.');
      console.error('Lỗi fetch product:', err);
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  // === FETCH ĐÁNH GIÁ ===
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const response = await API.get(`/ProductReview/ByProduct/${productId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setReviews(data.filter(r => r.isActive));
    } catch (err) {
      console.error('Lỗi fetch reviews:', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  // === FETCH SẢN PHẨM LIÊN QUAN ===
  const fetchRelatedProducts = useCallback(async () => {
    if (!product) return;
    setLoadingRelated(true);
    try {
      const response = await API.get('/Products/GetAll', {
        params: { pageNumber: 1, pageSize: 20 }
      });
      if (response.data?.data) {
        const filtered = response.data.data
          .filter(p => 
            p.productId !== parseInt(productId) && 
            p.categoryId === product.categoryId
          )
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.error('Lỗi fetch related:', err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [productId, product]);

  // === TẢI DỮ LIỆU ===
  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

  useEffect(() => {
    if (product) fetchRelatedProducts();
  }, [product, fetchRelatedProducts]);

  // === THÊM VÀO GIỎ ===
  const addToCart = (quantity = 1) => {
    const guestCart = getGuestCart();
    const existing = guestCart.find(i => i.productId === parseInt(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      guestCart.push({
        productId: parseInt(productId),
        productName: product.productName,
        mainImage: product.mainImage,
        sellPrice: product.sellPrice,
        quantity
      });
    }
    saveGuestCart(guestCart);
    window.dispatchEvent(new Event('cartUpdate'));
    return true;
  };

  const handleAddToCart = async () => {
    if (isLoggedIn) {
      try {
        await API.post('/Cart/add', { productId: parseInt(productId), quantity: 1 }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        alert('Đã thêm vào giỏ hàng!');
        window.dispatchEvent(new Event('cartUpdate'));
      } catch (err) {
        alert('Lỗi khi thêm vào giỏ!');
      }
    } else {
      addToCart(1);
      alert('Đã thêm vào giỏ hàng!');
    }
  };

  const handleBuyNow = async () => {
    if (isLoggedIn) {
      try {
        await API.post('/Cart/add', { productId: parseInt(productId), quantity: 1 }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        window.dispatchEvent(new Event('cartUpdate'));
        navigate('/checkout');
      } catch {
        alert('Lỗi khi thêm vào giỏ!');
      }
    } else {
      addToCart(1);
      window.dispatchEvent(new Event('cartUpdate'));
      navigate('/checkout');
    }
  };

  // === VIẾT ĐÁNH GIÁ ===
  const handleOpenReviewModal = () => {
    setEditReviewId(null);
    setReviewRating(0);
    setReviewContent('');
    setReviewName('');
    setReviewPhone('');
    setReviewError(null);
    setOpenReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setOpenReviewModal(false);
  };

  const validatePhone = (phone) => /^0[3|5|7|8|9][0-9]{8}$/.test(phone.replace(/\D/g, ''));

  const handleSubmitReview = async () => {
    if (reviewRating < 1) return setReviewError('Vui lòng chọn số sao');
    if (!reviewContent.trim()) return setReviewError('Vui lòng nhập nội dung');
    if (!reviewName.trim()) return setReviewError('Vui lòng nhập họ tên');
    if (!validatePhone(reviewPhone)) return setReviewError('SĐT không hợp lệ');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ProductId', productId);
      formData.append('Rating', reviewRating);
      formData.append('Content', reviewContent.trim());
      formData.append('Name', reviewName.trim());
      formData.append('Phone', reviewPhone.replace(/\D/g, ''));
      formData.append('ParentID', 0);

      let response;
      if (isLoggedIn) {
        response = await API.post('/api/ProductReview/create', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
      } else {
        response = await API.post('/api/ProductReview/guest', formData);
      }

      setReviews([...reviews, response.data]);
      alert('Gửi đánh giá thành công!');
      handleCloseReviewModal();
    } catch (err) {
      setReviewError('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === XỬ LÝ HÌNH ẢNH ===
  const getImageUrl = (url) => {
    if (!url) return '/placeholder-product.jpg';
    if (url.startsWith('http')) return url;
    return `https://localhost:7248${url}`;
  };

  // === LOADING & ERROR ===
  if (loadingProduct) {
    return (
      <Container sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải sản phẩm...</Typography>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error">{error || 'Sản phẩm không tồn tại'}</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Quay lại trang chủ</Button>
      </Container>
    );
  }

  // === DỮ LIỆU SẢN PHẨM ===
  const {
    productName, sellPrice, originalPrice, mainImage, subImages, description,
    brandName, categoryName, manufactureYear, stockQuantity, productReview
  } = product;

  const discountPercent = originalPrice > sellPrice
    ? Math.round(((originalPrice - sellPrice) / originalPrice) * 100)
    : 0;

  // === XỬ LÝ DESCRIPTION (OBJECT → ARRAY) ===
  const descriptionPoints = (() => {
    if (!description) return [];
    if (typeof description === 'object' && !Array.isArray(description)) {
      return Object.entries(description).map(([key, value]) => `${key}: ${value}`);
    }
    if (typeof description === 'string') {
      return description.split(', ').map(i => i.trim()).filter(Boolean);
    }
    return [];
  })();

  const images = [mainImage, ...(subImages || [])].filter(Boolean);

  const averageRating = productReview && productReview.length > 0
    ? productReview.reduce((s, r) => s + (r.isActive ? r.rating : 0), 0) / productReview.filter(r => r.isActive).length
    : 0;

  return (
    <Container maxWidth="lg" className={styles.container}>
      <CssBaseline />
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Quay lại
        </Button>

        <Grid container spacing={4}>
          {/* HÌNH ẢNH */}
          {/* HÌNH ẢNH – DÙNG LẠI PHIÊN BẢN CŨ (HOẠT ĐỘNG MƯỢT) */}
<Grid item xs={12} md={6}>
  <Paper elevation={2}>
    <Slider
      ref={sliderRef}
      dots={false}
      infinite={images.length > 1}
      speed={500}
      slidesToShow={1}
      arrows={images.length > 1}
      afterChange={(index) => setCurrentSlide(index)}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={getImageUrl(img)}
          alt={`${productName} ${i + 1}`}
          className={styles.mainImage}
          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
        />
      ))}
    </Slider>

    {/* THUMBNAIL NGANG – DÙNG LẠI CŨ */}
    <Box className={styles.sliderImg}>
      {images.map((img, i) => (
        <Box
          key={i}
          className={`${styles.sliderBox} ${currentSlide === i ? styles.active : ''}`}
          onClick={() => sliderRef.current?.slickGoTo(i)}
        >
          <img
            src={getImageUrl(img)}
            alt={`Thumb ${i + 1}`}
            className={styles.thumbnailImage}
            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
          />
        </Box>
      ))}
    </Box>
  </Paper>
</Grid>

          {/* THÔNG TIN */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>{productName}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={averageRating} readOnly precision={0.1} size="small" />
              <Typography variant="body2" color="text.secondary">
                ({averageRating.toFixed(1)} • {productReview?.filter(r => r.isActive).length || 0} đánh giá)
              </Typography>
            </Box>

            <Typography variant="h5" className={styles.price} gutterBottom>
              {sellPrice.toLocaleString('vi-VN')}₫
            </Typography>

            {originalPrice > sellPrice && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography className={styles.originalPrice}>
                  {originalPrice.toLocaleString('vi-VN')}₫
                </Typography>
                <Typography className={styles.discount}>-{discountPercent}%</Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddShoppingCartIcon />}
                onClick={handleAddToCart}
                size="large"
                fullWidth
              >
                Thêm vào giỏ
              </Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleBuyNow}
                size="large"
                fullWidth
                sx={{ backgroundColor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
              >
                Mua ngay
              </Button>
            </Box>

            <Button
              variant="outlined"
              onClick={handleOpenReviewModal}
              sx={{ mb: 3 }}
              fullWidth
            >
              Viết đánh giá
            </Button>

            {/* THÔNG SỐ KỸ THUẬT */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Thông số kỹ thuật</Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 1 } }}>
                {descriptionPoints.length > 0 ? (
                  descriptionPoints.map((point, i) => (
                    <Typography component="li" key={i} variant="body2" color="text.secondary">
                      {point}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Không có thông tin mô tả.
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 3, fontSize: '0.9rem', color: 'text.secondary' }}>
              <Typography><strong>Thương hiệu:</strong> {brandName}</Typography>
              <Typography><strong>Danh mục:</strong> {categoryName}</Typography>
              <Typography><strong>Năm sản xuất:</strong> {manufactureYear}</Typography>
              <Typography><strong>Tồn kho:</strong> {stockQuantity.toLocaleString('vi-VN')}</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* ĐÁNH GIÁ */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>Đánh giá sản phẩm</Typography>
          {loadingReviews ? (
            <Typography>Đang tải đánh giá...</Typography>
          ) : reviews.length === 0 ? (
            <Typography color="text.secondary">Chưa có đánh giá nào.</Typography>
          ) : (
            <Box sx={{ spaceY: 2 }}>
              {reviews.map((review) => (
                <Paper key={review.reviewId} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight="bold">{review.name}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {review.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* SẢN PHẨM LIÊN QUAN */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>Sản phẩm liên quan</Typography>
          {loadingRelated ? (
            <Typography>Đang tải...</Typography>
          ) : relatedProducts.length === 0 ? (
            <Typography color="text.secondary">Không có sản phẩm liên quan.</Typography>
          ) : (
            <Grid container spacing={2}>
              {relatedProducts.map((p) => (
                <Grid item xs={6} sm={4} md={3} key={p.productId}>
                  <Card
                    onClick={() => navigate(`/product-detail/${p.productId}`)}
                    sx={{ cursor: 'pointer', height: '100%' }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={getImageUrl(p.mainImage)}
                      alt={p.productName}
                      onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                    />
                    <CardContent>
                      <Typography variant="body2" noWrap>{p.productName}</Typography>
                      <Typography variant="h6" color="primary">
                        {p.sellPrice.toLocaleString('vi-VN')}₫
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* MODAL VIẾT ĐÁNH GIÁ */}
        <Modal open={openReviewModal} onClose={handleCloseReviewModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Viết đánh giá</Typography>
            {reviewError && <Typography color="error" sx={{ mb: 2 }}>{reviewError}</Typography>}

            <Rating
              value={reviewRating}
              onChange={(e, v) => setReviewRating(v || 0)}
              precision={1}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Họ và tên *"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Số điện thoại *"
              value={reviewPhone}
              onChange={(e) => setReviewPhone(e.target.value)}
              placeholder="0912345678"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Nội dung đánh giá *"
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', GAP: 1 }}>
              <Button onClick={handleCloseReviewModal} disabled={isSubmitting}>Hủy</Button>
              <Button
                onClick={handleSubmitReview}
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Container>
  );
};

export default ProductDetail;