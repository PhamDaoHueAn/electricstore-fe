import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Tooltip, Avatar, Pagination, Stack, TextField, InputAdornment, Typography, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ProductForm from './ProductForm';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Format giá tiền theo chuẩn Việt Nam
  const formatPrice = (price) => {
    if (!price) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let apiUrl;

        // Nếu có search term thì dùng endpoint Search riêng
        if (searchTerm.trim()) {
          apiUrl = `/Products/Search?search=${encodeURIComponent(searchTerm.trim())}&pageNumber=${page}&pageSize=${pageSize}`;
        } else {
          // Không có search thì dùng endpoint GetAll
          apiUrl = `/Products/GetAll?pageNumber=${page}&pageSize=${pageSize}`;
        }

        const res = await API.get(apiUrl);
        // Backend returns a paged object: { TotalItems, PageNumber, PageSize, TotalPages, Data }
        const payload = res.data;
        const list = payload?.Data || payload?.data || payload?.items || payload || [];
        setProducts(Array.isArray(list) ? list : []);
        setTotalPages(payload?.TotalPages || payload?.totalPages || 1);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [refreshKey, page, pageSize, searchTerm]);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset về trang đầu khi search
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await API.delete(`/Products/${id}`);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.response?.data || 'Xóa thất bại');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setOpenForm(true);
  };

  const handleView = (id) => {
    window.open(`/product-detail/${id}`, '_blank');
  };

  const handlePageChange = (e, value) => {
    setPage(value);
  };

  return (
    <Box>
      {/* Search và Add Button */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Tìm kiếm sản phẩm theo tên..."
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
          Thêm sản phẩm
        </Button>
      </Box>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" color="text.secondary">
            Đang tải dữ liệu...
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Giá</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Kho</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thương hiệu</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Danh mục</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(products) && products.map(p => {
                  const id = p.ProductId || p.productId || '';
                  const img = p.MainImage || p.mainImage || (p.SubImages && p.SubImages[0]) || null;
                  const isActive = p.IsActive !== undefined ? p.IsActive : (p.isActive !== undefined ? p.isActive : true);

                  return (
                    <TableRow key={id} hover>
                      <TableCell>{id}</TableCell>
                      <TableCell>
                        <Avatar variant="rounded" src={img} alt={p.ProductName || p.productName} />
                      </TableCell>
                      <TableCell>{p.ProductName || p.productName}</TableCell>
                      <TableCell>{formatPrice(p.SellPrice || p.sellPrice)}</TableCell>
                      <TableCell>{p.StockQuantity || p.stockQuantity}</TableCell>
                      <TableCell>
                        <Chip
                          label={isActive ? 'Đang bán' : 'Ngừng bán'}
                          color={isActive ? 'success' : 'error'}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{p.BrandName || p.brandName || p.brand?.BrandName || p.brand?.brandName}</TableCell>
                      <TableCell>{p.CategoryName || p.categoryName || p.category?.CategoryName || p.category?.categoryName}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">

                          <Tooltip title="Chỉnh sửa">
                            <IconButton color="info" onClick={() => handleEdit(p)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton color="error" onClick={() => handleDelete(id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
          </Box>
        </>
      )}

      <ProductForm open={openForm} initialData={editProduct} onClose={() => { setOpenForm(false); setEditProduct(null); }} onSaved={() => { setOpenForm(false); setEditProduct(null); setRefreshKey(k => k + 1); }} />
    </Box>
  );
};

export default ProductList;
