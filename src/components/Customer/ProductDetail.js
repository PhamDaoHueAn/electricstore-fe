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
import EditIcon from '@mui/icons-material/Edit';
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
      formData.append('FullName', reviewName.trim());
      formData.append('Phone', reviewPhone.replace(/\D/g, ''));
      formData.append('ParentID', 0);

      let response;

      response = await API.post('/ProductReview/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });


      setReviews([...reviews, response.data]);
      alert('Gửi đánh giá thành công! - Chờ phê duyệt từ quản trị viên.');
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

  // Backend đã tính averageRating sẵn, chỉ cần lấy ra
  const averageRating = product.averageRating || 0;

  return (
    <Container maxWidth="lg" className={styles.container}>
      <CssBaseline />
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Quay lại
        </Button>

        <div className={styles.twoColumn}>
          {/* HÌNH ẢNH */}

          <div className={styles.leftCol}>
            <Paper elevation={2} sx={{ height: '100%' }}>
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

              {/* THUMBNAIL NGANG */}
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
          </div>

          {/* THÔNG TIN */}
          <div className={styles.rightCol}>
            <Typography variant="h4" gutterBottom className={styles.productTitle}>{productName}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={averageRating} readOnly precision={0.1} size="small" />
              <Typography variant="body2" color="text.secondary">
                ({averageRating.toFixed(1)} • {reviews.length} đánh giá)
              </Typography>
            </Box>
            <Typography variant="h5" className={styles.price} gutterBottom>
              {sellPrice.toLocaleString('vi-VN')}₫
            </Typography>


            {originalPrice > sellPrice && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography className={styles.originalPrice}>
                  {originalPrice.toLocaleString('vi-VN')}₫
                </Typography>
                <Typography className={styles.discount}>-{discountPercent}%</Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              Tồn kho: {stockQuantity}
            </Typography>


            <Box className={styles.actionButtons} sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddShoppingCartIcon />}
                onClick={handleAddToCart}
                size="large"
                className={styles.btnPrimary}
              >
                Thêm vào giỏ
              </Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleBuyNow}
                size="large"
                className={styles.btnSecondary}
              >
                Mua ngay
              </Button>
            </Box>



            {/* THÔNG SỐ KỸ THUẬT (moved below columns) */}
          </div>
        </div>

        {/* THÔNG SỐ KỸ THUẬT - full width, 2 columns */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
            Thông số kỹ thuật
          </Typography>
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ maxHeight: 560, overflow: 'auto', p: 1 }}>
              {descriptionPoints.length > 0 ? (
                <div className={styles.specsGrid}>
                  {descriptionPoints.map((point, index) => {
                    const hasColon = point.includes(':');
                    const label = hasColon ? point.split(':')[0].trim() : point;
                    const value = hasColon ? point.split(':').slice(1).join(':').trim() : '';

                    return (
                      <div key={index} className={styles.specItem}>
                        <div className={styles.specLabel}>{label}</div>
                        <div className={styles.specValue}>{value || '-'}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', color: '#999' }}>Không có thông tin mô tả.</Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* ĐÁNH GIÁ SẢN PHẨM */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
            Đánh giá sản phẩm
          </Typography>

          {loadingReviews ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={30} />
              <Typography sx={{ mt: 2 }}>Đang tải đánh giá...</Typography>
            </Box>
          ) : reviews.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có đánh giá nào cho sản phẩm này
              </Typography>
              <Button sx={{ fontWeight: 'bold' }} variant="contained" color="primary" startIcon={<EditIcon />} onClick={handleOpenReviewModal}>
                Viết đánh giá đầu tiên
              </Button>
            </Paper>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                {reviews.map((review) => (
                  <Paper key={review.reviewId} elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    {/* Đánh giá chính */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: '50%',
                        backgroundColor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', color: '#1976d2', fontSize: '1.2rem'
                      }}>
                        {review.fullName?.charAt(0).toUpperCase() || 'K'}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {review.fullName || 'Khách hàng'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mt: 2, color: '#333' }}>
                          {review.content}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Phản hồi từ cửa hàng */}
                    {review.replyReview && (
                      <Box sx={{ mt: 3, ml: 8, pl: 4, borderLeft: '4px solid #1976d2', backgroundColor: '#f5f9ff', borderRadius: 1, py: 2, px: 3 }}>
                        <Typography variant="body2" fontWeight="bold" color="#1976d2" gutterBottom>
                          Phản hồi từ cửa hàng
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#333' }}>
                          {review.replyReview.content || 'Cảm ơn quý khách đã đánh giá!'}
                        </Typography>
                        {review.replyReview.createAt && review.replyReview.createAt !== '0001-01-01T00:00:00' && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {new Date(review.replyReview.createAt).toLocaleDateString('vi-VN')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>

              {/* NÚT VIẾT ĐÁNH GIÁ */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleOpenReviewModal}
                  sx={{
                    borderRadius: 30,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                    '&:hover': { boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)' }
                  }}
                >
                  Viết đánh giá của bạn
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* SẢN PHẨM LIÊN QUAN */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#d32f2f' }}>Sản phẩm liên quan</Typography>
          {loadingRelated ? (
            <Typography>Đang tải...</Typography>
          ) : relatedProducts.length === 0 ? (
            <Typography color="text.secondary">Không có sản phẩm liên quan.</Typography>
          ) : (
            <Grid container spacing={1}>
              {relatedProducts.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.productId}>
                  <Card
                    onClick={() => navigate(`/product-detail/${p.productId}`)}
                    className={styles.relatedCard}
                    sx={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <CardMedia
                      component="img"
                      height="100"
                      className={styles.relatedCardMedia}
                      src={getImageUrl(p.mainImage) || '/placeholder-product.jpg'}
                      alt={p.productName}
                      onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      sx={{ objectFit: 'contain', backgroundColor: '#fff' }}
                    />
                    <CardContent className={styles.relatedCardContent}>
                      <Typography variant="body2" title={p.productName} sx={{ flexGrow: 1, mb: 1, color: '#333', fontWeight: 'bold' }}>
                        {p.productName}
                      </Typography>
                      <div style={{ marginTop: 'auto' }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          {p.sellPrice.toLocaleString('vi-VN')}₫
                        </Typography>
                      </div>
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', GAP: 1 }}>
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
    </Container >
  );
};

export default ProductDetail;