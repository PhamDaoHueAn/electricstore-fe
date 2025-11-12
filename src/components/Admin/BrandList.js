import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Tooltip, Avatar, Pagination, Stack,
  TextField, InputAdornment, Typography, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import BrandForm from './BrandForm';

// Component để xử lý loading ảnh
const ImageAvatar = ({ src, alt, name, sx }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {loading && !error && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.8)',
          borderRadius: 1,
          zIndex: 1
        }}>
          <CircularProgress size={16} />
        </Box>
      )}

      {!error && src ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            ...sx,
            borderRadius: 1,
            objectFit: 'contain', // Giữ tỷ lệ ảnh, không bị cắt
            bgcolor: '#f5f5f5', // Background nhạt để ảnh nổi bật
            border: '1px solid #e0e0e0',
            padding: 0.5 // Padding nhỏ để ảnh không sát viền
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      ) : (
        <Avatar
          variant="rounded"
          sx={sx}
        >
          {name ? name.charAt(0).toUpperCase() : 'B'}
        </Avatar>
      )}
    </Box>
  );
};

const BrandList = () => {
  const [allBrands, setAllBrands] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // useEffect riêng để filter và paginate khi allBrands hoặc search/page thay đổi
  useEffect(() => {
    let list = [];

    // Filter based on search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      list = allBrands.filter(brand => {
        const name = brand?.brandName || brand?.BrandName || '';
        return name.toLowerCase().includes(searchLower);
      });
    } else {
      list = allBrands;
    }

    // Frontend pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = list.slice(startIndex, endIndex);

    setBrands(paginatedList);
    const newTotalPages = Math.ceil(list.length / pageSize);
    setTotalPages(newTotalPages);

    // Nếu trang hiện tại vượt quá số trang mới, chuyển về trang cuối
    if (page > newTotalPages && newTotalPages > 0) {
      setPage(newTotalPages);
    }
  }, [allBrands, searchTerm, page, pageSize]);

  useEffect(() => {
    console.log('BrandList useEffect triggered');
    const fetchBrands = async () => {
      console.log('Starting fetchBrands...');
      setLoading(true);
      try {
        // Lấy tất cả brands
        const apiUrl = `/Brands`;
        console.log('Get all API URL:', apiUrl);
        console.log('Making API call...');

        const res = await API.get(apiUrl);
        console.log('API response received:', res);
        console.log('Response data:', res.data);
        console.log('Response status:', res.status);

        const allList = Array.isArray(res.data) ? res.data : [];
        console.log('All brands:', allList);
        setAllBrands(allList);

      } catch (err) {
        console.error('Failed to load brands:', err);
        console.error('Error response:', err.response);
        console.error('Error message:', err.message);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);

        // Set fallback data để test UI
        const fallbackData = [
          {
            brandId: 1,
            brandName: "Samsung",
            imageUrl: "https://localhost:7248/Image/Brand/samsung.png",
            isActive: true
          },
          {
            brandId: 2,
            brandName: "Panasonic",
            imageUrl: "https://localhost:7248/Image/Brand/panasonic.png",
            isActive: true
          },
          {
            brandId: 3,
            brandName: "Toshiba",
            imageUrl: "https://localhost:7248/Image/Brand/toshiba.png",
            isActive: true
          },
          {
            brandId: 4,
            brandName: "LG",
            imageUrl: "https://localhost:7248/Image/Brand/lg.png",
            isActive: true
          },
          {
            brandId: 5,
            brandName: "Aqua",
            imageUrl: "https://localhost:7248/Image/Brand/aqua.png",
            isActive: true
          }
        ];

        console.log('Using fallback data:', fallbackData);
        setAllBrands(fallbackData);
      } finally {
        setLoading(false);
        console.log('Finished fetchBrands');
      }
    };

    fetchBrands();
  }, [refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thương hiệu này?')) return;
    try {
      await API.delete(`/Brands/${id}`);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.response?.data || 'Xóa thất bại');
    }
  };

  const handleEdit = (brand) => {
    console.log('Edit brand clicked:', brand);
    setEditBrand(brand);
    setOpenForm(true);
  };

  const handlePageChange = (e, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    // Chỉ reset về trang 1 khi thực sự có thay đổi search term
    if (newSearchTerm !== searchTerm) {
      setPage(1);
    }
  };

  return (
    <Box>
      {/* Search và Add Button */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Tìm kiếm thương hiệu theo tên..."
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
          Thêm thương hiệu
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên thương hiệu</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(brands) && brands.map(b => {
                  // Debug log cho từng brand
                  console.log('Brand item:', b);

                  const id = b?.brandId || b?.BrandId;
                  const name = b?.brandName || b?.BrandName || '';
                  const isActive = b?.isActive !== undefined ? b.isActive : (b?.IsActive !== undefined ? b.IsActive : true);
                  let image = b?.imageUrl || b?.ImageUrl;

                  // Thêm timestamp để force reload ảnh sau khi update
                  if (image && refreshKey > 0) {
                    const separator = image.includes('?') ? '&' : '?';
                    image = `${image}${separator}_t=${Date.now()}`;
                  }

                  console.log('Mapped values:', { id, name, isActive, image });

                  return (
                    <TableRow key={id} hover>
                      <TableCell>{id}</TableCell>
                      <TableCell>
                        <ImageAvatar
                          src={image}
                          alt={name || 'Brand'}
                          name={name}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>{name}</TableCell>
                      <TableCell>
                        <Chip
                          label={isActive ? 'Hoạt động' : 'Không hoạt động'}
                          color={isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton color="info" onClick={() => handleEdit(b)}>
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
                {brands.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm ? 'Không tìm thấy thương hiệu nào' : 'Chưa có thương hiệu nào'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      <BrandForm
        open={openForm}
        initialData={editBrand}
        onClose={() => {
          setOpenForm(false);
          setEditBrand(null);
        }}
        onSaved={() => {
          setOpenForm(false);
          setEditBrand(null);
          setRefreshKey(k => k + 1);
        }}
      />
    </Box>
  );
};

export default BrandList;