import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Grid
} from '@mui/material';
import { Edit, Delete, Add, Image as ImageIcon } from '@mui/icons-material';
import API from '../../../services/api';
import AdminLayout from '../AdminLayout';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    bannerName: '',
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await API.get('/Banner');
      setBanners(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        bannerName: banner.bannerName,
        imageFile: null
      });
      setImagePreview(banner.imageUrl);
    } else {
      setEditingBanner(null);
      setFormData({
        bannerName: '',
        imageFile: null
      });
      setImagePreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBanner(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      setFormData(prev => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const submitFormData = new FormData();
      submitFormData.append('bannerName', formData.bannerName.trim());

      if (formData.imageFile) {
        submitFormData.append('imageFile', formData.imageFile);
      }

      if (editingBanner) {
        if (!formData.imageFile) {
          setError('Vui lòng chọn ảnh mới khi cập nhật banner');
          return;
        }
        await API.put(`/Banner/${editingBanner.bannerId}`, submitFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Cập nhật banner thành công!');
      } else {
        if (!formData.imageFile) {
          setError('Vui lòng chọn ảnh cho banner');
          return;
        }
        await API.post('/Banner', submitFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Thêm banner thành công!');
      }

      handleCloseDialog();
      fetchBanners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data || 'Có lỗi xảy ra');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await API.delete(`/Banner/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Xóa banner thành công!');
      fetchBanners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data || 'Không thể xóa banner');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Quản lý Banner</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Thêm Banner
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          {banners.map((banner) => (
            <Grid item xs={12} sm={6} md={4} key={banner.bannerId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={banner.imageUrl}
                  alt={banner.bannerName}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {banner.bannerName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(banner)}
                      fullWidth
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(banner.bannerId)}
                      fullWidth
                    >
                      Xóa
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {banners.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">Chưa có banner nào</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Dialog Thêm/Sửa */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Tên Banner"
                name="bannerName"
                value={formData.bannerName}
                onChange={handleInputChange}
                required
                fullWidth
                helperText="Tên mô tả cho banner"
              />

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                  fullWidth
                >
                  {formData.imageFile ? 'Đổi ảnh' : 'Chọn ảnh'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {formData.imageFile && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {formData.imageFile.name}
                  </Typography>
                )}
              </Box>

              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Xem trước:
                  </Typography>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.bannerName.trim() || (!formData.imageFile && !editingBanner)}
            >
              {editingBanner ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default BannerManagement;
