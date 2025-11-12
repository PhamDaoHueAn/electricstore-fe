import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, Box, Typography, FormControlLabel, Checkbox, IconButton, Avatar
} from '@mui/material';
import API from '../../services/api';

const CategoryForm = ({ open, onClose, onSaved, initialData = null }) => {
  const [form, setForm] = useState({
    categoryName: '',
    isActive: true,
    categoryImage: null,
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
        categoryName: initialData.categoryName || initialData.CategoryName || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : (initialData.IsActive !== undefined ? initialData.IsActive : true),
      }));

      // Set preview for existing image
      const imageUrl = initialData.imageUrl || initialData.ImageUrl;
      setPreview(imageUrl || null);
      console.log('Set preview to:', imageUrl);
    } else {
      // Reset form for new category
      setForm({
        categoryName: '',
        isActive: true,
        categoryImage: null,
      });
      setPreview(null);
    }
  }, [initialData]);

  // Reset khi dialog đóng
  useEffect(() => {
    if (!open) {
      setPreview(null);
      setForm({
        categoryName: '',
        isActive: true,
        categoryImage: null,
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
      if (!form.categoryName.trim()) {
        alert('Vui lòng nhập tên danh mục');
        return;
      }

      // Validate image cho new category
      const categoryId = initialData?.categoryId || initialData?.CategoryId;
      const isNewCategory = !categoryId;
      if (isNewCategory && !form.categoryImage) {
        alert('Vui lòng chọn ảnh danh mục');
        return;
      }

      const data = new FormData();
      data.append('CategoryName', form.categoryName);
      data.append('IsActive', String(!!form.isActive));

      if (form.categoryImage) {
        data.append('CategoryImage', form.categoryImage);
      }

      if (categoryId) {
        // PUT để update
        console.log('Updating category with ID:', categoryId);
        await API.put(`/Categories/${categoryId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Cập nhật danh mục thành công!');
      } else {
        // POST để tạo mới
        await API.post('/Categories', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Tạo danh mục thành công!');
      }

      // Reset form và đóng dialog
      setForm({
        categoryName: '',
        isActive: true,
        categoryImage: null,
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
      }, 50);
    } catch (err) {
      console.error('Save failed', err);
      alert(err.response?.data || 'Lưu thất bại');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {initialData ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
      </DialogTitle>
      <DialogContent sx={{ padding: '24px !important' }}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Cột trái: Form fields */}
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Tên danh mục"
              name="categoryName"
              value={form.categoryName}
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
              Ảnh danh mục {!initialData && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            <input
              type="file"
              name="categoryImage"
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
                  <Avatar
                    variant="rounded"
                    src={preview}
                    alt="category preview"
                    sx={{
                      width: 120,
                      height: 120,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: 1
                    }}
                  >
                    {form.categoryName.charAt(0)}
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setForm(f => ({ ...f, categoryImage: null }));
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

export default CategoryForm;