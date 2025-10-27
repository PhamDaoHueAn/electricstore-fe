import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Pagination } from '@mui/material';
import API from '../../services/api';
import styles from './SearchResults.module.css';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const search = queryParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch sản phẩm tìm kiếm
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await API.get(
        `/Products/Search?search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        { timeout: 5000 }
      );
      console.log('Search API response:', response.data);
      setProducts(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setProducts([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (search) {
      fetchProducts();
    }
  }, [search, sortBy, sortOrder, pageNumber]);

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
        Kết quả tìm kiếm cho: "{search}"
      </Typography>
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

export default SearchResults;