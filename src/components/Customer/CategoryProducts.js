import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Pagination } from '@mui/material';
import Slider from 'react-slick';
import API from '../../services/api';
import styles from './CategoryProducts.module.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Cài đặt cho slider thương hiệu
  const brandSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 3,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 4, slidesToScroll: 2 },
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 2, slidesToScroll: 1 },
      },
    ],
  };

  // Fetch thương hiệu theo danh mục
  const fetchBrands = async () => {
    try {
      const response = await API.get(`/Brands/get-by-categoryId/${categoryId}`, { timeout: 5000 });
      console.log('Brands API response:', response.data);
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  // Fetch sản phẩm theo danh mục và thương hiệu
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        categoryId,
        sortBy,
        sortOrder,
        pageNumber,
        pageSize,
      });
      if (selectedBrand) {
        params.append('brandId', selectedBrand);
      }
      const response = await API.get(`/Products/GetAll?${params.toString()}`, { timeout: 5000 });
      console.log('Products API response:', response.data);
      setProducts(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
    fetchProducts();
  }, [categoryId, selectedBrand, sortBy, sortOrder, pageNumber]);

  // Xử lý bấm vào thương hiệu
  const handleBrandClick = (brandId) => {
    console.log('Brand clicked:', brandId);
    setSelectedBrand(brandId);
    setPageNumber(1); // Reset về trang 1 khi chọn thương hiệu
  };

  // Xử lý thay đổi sắp xếp
  const handleSortChange = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split(':');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPageNumber(1); // Reset về trang 1 khi thay đổi sắp xếp
  };

  // Xử lý thay đổi trang
  const handlePageChange = (event, value) => {
    setPageNumber(value);
  };

  return (
    <Container maxWidth="lg" className={styles.container}>
      <Typography variant="h4" className={styles.title}>
        Sản phẩm theo danh mục
      </Typography>
      {/* Brand Carousel */}
      {brands.length > 0 && (
        <section className={styles.brandMenu}>
          <div className={styles.listBrands}>
            <Slider {...brandSliderSettings}>
              {brands.map((brand) => (
                <div
                  key={brand.brandId}
                  className={`${styles.brandItem} ${selectedBrand === brand.brandId ? styles.selected : ''}`}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBrandClick(brand.brandId);
                    }}
                  >
                    <img
                      src={brand.imageUrl || '/images/brand-placeholder.jpg'}
                      alt={brand.brandName}
                      width="47"
                      height="47"
                      onError={(e) => { e.target.src = '/images/brand-placeholder.jpg'; }}
                    />
                    <p>{brand.brandName}</p>
                  </a>
                </div>
              ))}
            </Slider>
          </div>
        </section>
      )}
      {/* Sort Select */}
      <FormControl className={styles.sortContainer}>
        <InputLabel>Sắp xếp theo</InputLabel>
        <Select
          value={`${sortBy}:${sortOrder}`}
          onChange={handleSortChange}
          label="Sắp xếp theo"
          className={styles.sortSelect}
        >
          <MenuItem value="CreatedAt:desc">Mới nhất</MenuItem>
          <MenuItem value="Price:asc">Giá: Thấp đến Cao</MenuItem>
          <MenuItem value="Price:desc">Giá: Cao đến Thấp</MenuItem>
        </Select>
      </FormControl>
      {/* Product List */}
      {loading ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
      ) : products.length === 0 ? (
        <Box className={styles.noResults}>
          <Typography variant="h6">Không tìm thấy sản phẩm phù hợp</Typography>
        </Box>
      ) : (
        <Box className={styles.productGrid}>
          <ul className={styles.listproduct}>
            {products.map((product, index) => (
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
                      src={product.mainImage || '/images/placeholder-product.jpg'}
                      alt={product.productName}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/images/placeholder-product.jpg'; }}
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
        </Box>
      )}
      <Pagination
        count={totalPages}
        page={pageNumber}
        onChange={handlePageChange}
        className={styles.pagination}
      />
    </Container>
  );
};

export default CategoryProducts;