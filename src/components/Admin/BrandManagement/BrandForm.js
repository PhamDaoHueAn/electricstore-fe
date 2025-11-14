import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, Box, Typography, FormControlLabel, Checkbox, IconButton
} from '@mui/material';
import API from '../../../services/api';

const BrandForm = ({ open, onClose, onSaved, initialData = null }) => {
  const [form, setForm] = useState({
    brandName: '',
    isActive: true,
    brandImage: null,
  });
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (files) {
      setForm(f => ({ ...f, [name]: files[0] }));

      // Tạo preview cho ảnh
      if (files[0]) {
        try {
          const previewUrl = URL.createObjectURL(files[0]);
          setPreview(previewUrl);
        } catch (err) {
          console.error('Failed to create preview URL:', err);
          setPreview(null);
        }
      }
    } else if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log('Loading initial data:', initialData);
      setForm(f => ({
        ...f,
        // Hỗ trợ cả camelCase và PascalCase
        brandName: initialData.brandName || initialData.BrandName || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : (initialData.IsActive !== undefined ? initialData.IsActive : true),
      }));

      // Set preview for existing image
      const imageUrl = initialData.imageUrl || initialData.ImageUrl;
      setPreview(imageUrl || null);
      console.log('Set preview to:', imageUrl);
    } else {
      // Reset form for new brand
      setForm({
        brandName: '',
        isActive: true,
        brandImage: null,
      });
      setPreview(null);
    }
  }, [initialData]);

  // Reset khi dialog đóng
  useEffect(() => {
    if (!open) {
      setPreview(null);
      setForm({
        brandName: '',
        isActive: true,
        brandImage: null,
      });
    }
  }, [open]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(preview);
        } catch (_) { }
      }
    };
  }, [preview]);

  const handleSubmit = async () => {
    try {
      if (!form.brandName.trim()) {
        alert('Vui lòng nhập tên thương hiệu');
        return;
      }

      // Validate image cho new brand
      const brandId = initialData?.brandId || initialData?.BrandId;
      const isNewBrand = !brandId;
      if (isNewBrand && !form.brandImage) {
        alert('Vui lòng chọn ảnh thương hiệu');
        return;
      }

      const data = new FormData();
      data.append('BrandName', form.brandName);
      data.append('IsActive', String(!!form.isActive));

      if (form.brandImage) {
        data.append('BrandImage', form.brandImage);
      }

      if (brandId) {
        // PUT để update
        console.log('Updating brand with ID:', brandId);
        await API.put(`/Brands/${brandId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Cập nhật thương hiệu thành công!');
      } else {
        // POST để tạo mới
        await API.post('/Brands', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Tạo thương hiệu thành công!');
      }

      // Reset form và đóng dialog
      setForm({
        brandName: '',
        isActive: true,
        brandImage: null,
      });
      setPreview(null);

      // Delay để đảm bảo ảnh đã được xử lý trên server
      setTimeout(() => {
        // Refresh danh sách sau khi ảnh đã upload xong
        onSaved && onSaved();
      }, 500);

      // Đóng dialog sau khi đã refresh
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      console.error('Save failed', err);
      alert(err.response?.data || 'Lưu thất bại');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {initialData ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu'}
      </DialogTitle>
      <DialogContent sx={{ padding: '24px !important' }}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Cột trái: Form fields */}
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Tên thương hiệu"
              name="brandName"
              value={form.brandName}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isActive}
                  onChange={handleChange}
                  name="isActive"
                />
              }
              label="Kích hoạt"
            />
          </Grid>

          {/* Cột phải: Ảnh */}
          <Grid item xs={4}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Ảnh thương hiệu {!initialData && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            <input
              type="file"
              name="brandImage"
              accept="image/*"
              onChange={handleChange}
              required={!initialData}
              style={{
                marginBottom: '16px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%'
              }}
            />

            {/* Preview ảnh */}
            {preview && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                  Ảnh hiện tại:
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={preview}
                    alt="brand preview"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: 2,
                      objectFit: 'contain',
                      bgcolor: '#f5f5f5',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: 1,
                      padding: 1
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setForm(f => ({ ...f, brandImage: null }));
                      setPreview(null);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                      boxShadow: 1
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#d32f2f' }}>✕</span>
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Placeholder khi chưa có ảnh */}
            {!preview && (
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.default',
                  mt: 1
                }}
              >
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Chưa có ảnh
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BrandForm;