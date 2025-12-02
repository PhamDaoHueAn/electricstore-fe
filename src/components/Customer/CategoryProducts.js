import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, FormControl, Select, MenuItem, CircularProgress, Pagination } from '@mui/material';
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

  const handleBrandClick = (brandId) => {
    console.log('Brand clicked:', brandId);
    setSelectedBrand(brandId);
    setPageNumber(1); 
  };

  const handleSortChange = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split(':');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPageNumber(1); 
  };

  const handlePageChange = (event, value) => {
    setPageNumber(value);
  };

  return (
    <div className={styles.container}>
      <Container maxWidth="lg">
        <Typography variant="h4" className={styles.title}>
          Sản phẩm theo danh mục
        </Typography>

        {brands.length > 0 && (

          <Box className={styles.brandSection}>
            <Slider
              dots={false}
              infinite={false}          
              speed={500}
              slidesToShow={1}
              slidesToScroll={1}
              variableWidth={true}      
              arrows={false}
              swipeToSlide={true}
              touchThreshold={10}
              className={styles.brandSlider}
            >
              {brands.map((brand) => (
                <Box
                  key={brand.brandId}
                  className={`${styles.brandItem} ${selectedBrand === brand.brandId ? styles.selected : ''}`}
                  onClick={() => handleBrandClick(brand.brandId)}
                >
                  <img
                    src={brand.imageUrl || '/images/brand-placeholder.jpg'}
                    alt={brand.brandName}
                    onError={(e) => { e.target.src = '/images/brand-placeholder.jpg'; }}
                  />
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {brand.brandName}
                  </Typography>
                </Box>
              ))}
            </Slider>
          </Box>
        )}

        <FormControl className={styles.sortContainer}>
          <div className={styles.sortLabel}>
            Sắp xếp theo
          </div>
          <Select
            value={`${sortBy}:${sortOrder}`}
            onChange={handleSortChange}
            className={styles.sortSelect}
            displayEmpty
          >
            <MenuItem value="CreatedAt:desc">Mới nhất</MenuItem>
            <MenuItem value="Price:asc">Giá: Thấp đến Cao</MenuItem>
            <MenuItem value="Price:desc">Giá: Cao đến Thấp</MenuItem>
          </Select>
        </FormControl>

        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
        ) : products.length === 0 ? (
          <Box className={styles.noResults}>
            <Typography variant="h6">Không tìm thấy sản phẩm phù hợp</Typography>
          </Box>
        ) : (
          <Box className={styles.productGrid}>
            <ul className={styles.listproduct}>
              {products.map((product) => (
                <li key={product.productId} className={styles.item}>
                  <a
                    onClick={() => navigate(`/product-detail/${product.productId}`)}
                    className={styles.mainContain}
                  >
                    <div className={styles.itemLabel}>
                      {product.manufactureYear >= 2025 && <span className={styles.lnNew}>Mẫu mới</span>}
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
                    <h3>{product.productName}</h3>
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

                  <div className={styles.ratingCompare}>
                    <div className={styles.voteTxt}>
                      <i></i>
                      <b>{product.averageRating || product.AverageRating || 0}</b>
                    </div>
                    <span className={styles.stockCount}>• Tồn kho {product.stockQuantity?.toLocaleString('vi-VN') || 0}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
            pb: 4,
            '& .MuiPaginationItem-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#666',
              fontWeight: 500,
            },
            '& .MuiPaginationItem-root.Mui-selected': {
              backgroundColor: '#1976d2',
              color: 'white',
            }
          }}>
            <Pagination
              count={totalPages}
              page={pageNumber}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Container>
    </div>
  );
};

export default CategoryProducts;