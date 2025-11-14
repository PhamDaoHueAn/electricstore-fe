import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Box, Typography, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, IconButton } from '@mui/material';
import API from '../../../services/api';

const ProductForm = ({ open, onClose, onSaved, initialData = null }) => {
  const [form, setForm] = useState({
    productName: '',
    sellPrice: 0,
    stockQuantity: 0,
    categoryID: 1,
    brandID: 1,
    supplierID: 1,
    costPrice: 0,
    originalPrice: 0,
    consumptionCapacity: 0,
    maintenance: 0,
    manufactureYear: new Date().getFullYear(),
    description: '',
    isActive: true,
    mainImage: null,
  });
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [subFiles, setSubFiles] = useState([]);
  const [subPreviews, setSubPreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (files) {
      setForm(f => ({ ...f, [name]: files[0] }));

      // Nếu là mainImage thì tạo preview
      if (name === 'mainImage' && files[0]) {
        try {
          const previewUrl = URL.createObjectURL(files[0]);
          setPreview(previewUrl);
        } catch (err) {
          console.error('Failed to create preview URL:', err);
          setPreview(null);
        }
      }
    } else if (type === 'number') {
      setForm(f => ({ ...f, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log('Loading product initial data:', initialData);

      // Get description from initialData
      const desc = initialData.description || initialData.Description;
      const descString = desc ? (typeof desc === 'string' ? desc : Object.entries(desc).map(([k, v]) => `${k}: ${v}`).join('\n')) : '';

      // Get sub images from initialData
      const subs = initialData.subImages || initialData.SubImages || [];
      const take = Array.isArray(subs) ? subs.slice(0, 3) : [];
      const padded = [take[0] || null, take[1] || null, take[2] || null];

      setForm(f => ({
        ...f,
        productName: initialData.productName || initialData.ProductName || f.productName,
        sellPrice: initialData.sellPrice || initialData.SellPrice || f.sellPrice,
        stockQuantity: initialData.stockQuantity || initialData.StockQuantity || f.stockQuantity,
        categoryID: initialData.categoryId || initialData.CategoryId || initialData.CategoryID || initialData.categoryID || f.categoryID,
        brandID: initialData.brandId || initialData.BrandId || initialData.BrandID || initialData.brandID || f.brandID,
        supplierID: initialData.supplierId || initialData.SupplierId || initialData.SupplierID || initialData.supplierID || f.supplierID,
        costPrice: initialData.costPrice || initialData.CostPrice || f.costPrice,
        originalPrice: initialData.originalPrice || initialData.OriginalPrice || f.originalPrice,
        consumptionCapacity: initialData.consumptionCapacity || initialData.ConsumptionCapacity || f.consumptionCapacity,
        maintenance: initialData.maintenance || initialData.Maintenance || f.maintenance,
        manufactureYear: initialData.manufactureYear || initialData.ManufactureYear || f.manufactureYear,
        description: descString,
        isActive: initialData.isActive ?? initialData.IsActive ?? f.isActive,
      }));

      // Set preview for main image - thử nhiều property names
      const mainImageUrl = initialData.mainImage ||
        initialData.MainImage ||
        initialData.mainImageUrl ||
        initialData.MainImageUrl ||
        initialData.imageUrl ||
        initialData.ImageUrl ||
        initialData.productImage ||
        initialData.ProductImage ||
        (subs && subs[0]) ||
        null;

      console.log('Main image URL candidates:');
      console.log('- mainImage:', initialData.mainImage);
      console.log('- MainImage:', initialData.MainImage);
      console.log('- mainImageUrl:', initialData.mainImageUrl);
      console.log('- MainImageUrl:', initialData.MainImageUrl);
      console.log('- imageUrl:', initialData.imageUrl);
      console.log('- ImageUrl:', initialData.ImageUrl);
      console.log('- productImage:', initialData.productImage);
      console.log('- ProductImage:', initialData.ProductImage);
      console.log('- Final mainImageUrl:', mainImageUrl);

      setPreview(mainImageUrl);

      // Set sub image previews
      setSubPreviews(padded);
      setSubFiles([null, null, null]);
    } else {
      // reset when no initialData
      setForm(f => ({ ...f, productName: '', sellPrice: 0, stockQuantity: 0, description: '' }));
      setPreview(null);
      setSubPreviews([null, null, null]);
      setSubFiles([null, null, null]);
    }
  }, [initialData]);

  // Also initialize when dialog opens (initialData reference may be the same but open toggles)
  useEffect(() => {
    if (open && initialData) {
      // Get description from initialData
      const desc = initialData.description || initialData.Description;
      const descString = desc ? (typeof desc === 'string' ? desc : Object.entries(desc).map(([k, v]) => `${k}: ${v}`).join('\n')) : '';

      // Get sub images from initialData
      const subs = initialData.subImages || initialData.SubImages || [];
      const take = Array.isArray(subs) ? subs.slice(0, 3) : [];
      const padded = [take[0] || null, take[1] || null, take[2] || null];

      setForm(f => ({
        ...f,
        productName: initialData.productName || initialData.ProductName || f.productName,
        sellPrice: initialData.sellPrice || initialData.SellPrice || f.sellPrice,
        stockQuantity: initialData.stockQuantity || initialData.StockQuantity || f.stockQuantity,
        categoryID: initialData.categoryId || initialData.CategoryId || initialData.CategoryID || initialData.categoryID || f.categoryID,
        brandID: initialData.brandId || initialData.BrandId || initialData.BrandID || initialData.brandID || f.brandID,
        supplierID: initialData.supplierId || initialData.SupplierId || initialData.SupplierID || initialData.supplierID || f.supplierID,
        costPrice: initialData.costPrice || initialData.CostPrice || f.costPrice,
        originalPrice: initialData.originalPrice || initialData.OriginalPrice || f.originalPrice,
        consumptionCapacity: initialData.consumptionCapacity || initialData.ConsumptionCapacity || f.consumptionCapacity,
        maintenance: initialData.maintenance || initialData.Maintenance || f.maintenance,
        manufactureYear: initialData.manufactureYear || initialData.ManufactureYear || f.manufactureYear,
        description: descString,
        isActive: initialData.isActive ?? initialData.IsActive ?? f.isActive,
      }));

      // Set preview for main image
      setPreview(initialData.mainImage || initialData.MainImage || (subs && subs[0]) || null);

      // Set sub image previews
      setSubPreviews(padded);
      setSubFiles([null, null, null]);
    }
  }, [open, initialData]);

  // Load categories, brands, suppliers when dialog opens
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, brandRes, supRes] = await Promise.all([
          API.get('/Categories'),
          API.get('/Brands'),
          API.get('/Supplier/GetAll')
        ]);
        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
        setSuppliers(supRes.data || []);
      } catch (err) {
        console.error('Failed to load select options', err);
      }
    };
    if (open) fetchOptions();
  }, [open]);

  useEffect(() => {
    // Build previews array from subFiles (File/Blob) or initialData subImages (URL strings).
    if (subFiles && subFiles.length > 0 && subFiles.some(f => f !== null)) {
      const previews = subFiles.map((f, i) => {
        if (f instanceof Blob) {
          try {
            return URL.createObjectURL(f);
          } catch (e) {
            console.warn('Failed to create object URL for sub file', e);
            return null;
          }
        }
        // If no file, prefer initialData's subImages URL at same index or null
        const subs = initialData?.subImages || initialData?.SubImages || [];
        return subs[i] || null;
      });
      setSubPreviews(previews);
      // cleanup: revoke any blob URLs we created
      return () => {
        previews.forEach(p => {
          if (typeof p === 'string' && p.startsWith('blob:')) {
            try { URL.revokeObjectURL(p); } catch (_) { }
          }
        });
      };
    } else if (initialData) {
      // When no new files uploaded, show existing images from API
      const subs = initialData?.subImages || initialData?.SubImages || [];
      const padded = [subs[0] || null, subs[1] || null, subs[2] || null];
      setSubPreviews(padded);
    }
  }, [subFiles, initialData]);

  // Cleanup preview URLs khi component unmount hoặc dialog đóng
  useEffect(() => {
    return () => {
      // Cleanup main image preview nếu là blob URL
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(preview);
        } catch (_) { }
      }
    };
  }, [preview]);

  // Reset preview khi dialog đóng
  useEffect(() => {
    if (!open) {
      setPreview(null);
      setSubFiles([null, null, null]);
      setSubPreviews([null, null, null]);
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      console.log('Submitting form:', form);
      console.log('Initial data:', initialData);

      const isUpdate = initialData && (initialData.ProductId || initialData.productId);
      const data = new FormData();

      // Nếu là update, thêm ProductID vào form data
      if (isUpdate) {
        const id = initialData.ProductId || initialData.productId;
        data.append('ProductId', String(id));
        console.log('Adding ProductId to form:', id);
      }

      data.append('ProductName', form.productName);
      data.append('Description', form.description || '');
      data.append('ConsumptionCapacity', String(form.consumptionCapacity));
      data.append('Maintenance', String(form.maintenance));
      data.append('CostPrice', String(form.costPrice));
      data.append('OriginalPrice', String(form.originalPrice || form.sellPrice));
      data.append('SellPrice', String(form.sellPrice));
      data.append('StockQuantity', String(form.stockQuantity));
      data.append('CategoryID', String(form.categoryID));
      data.append('SupplierID', String(form.supplierID));
      data.append('BrandID', String(form.brandID));
      data.append('ManufactureYear', String(form.manufactureYear));
      data.append('IsActive', String(!!form.isActive));

      // Xử lý ảnh chính
      if (form.mainImage) {
        // User đã chọn ảnh mới
        data.append('MainImage', form.mainImage);
        console.log('Added new MainImage file:', form.mainImage.name);
      } else if (!isUpdate) {
        // Đối với tạo mới, MainImage là bắt buộc
        alert('Vui lòng chọn ảnh chính cho sản phẩm');
        return;
      }
      // Khi update mà không chọn ảnh mới, không cần gửi ảnh lên server (giữ nguyên ảnh cũ)
      // Xử lý ảnh phụ - chỉ gửi khi có ảnh mới được chọn
      const filesToAppend = [];
      for (let i = 0; i < 3; i++) {
        const f = subFiles && subFiles[i] ? subFiles[i] : null;
        if (f) {
          // Chỉ append các file mới được chọn
          filesToAppend.push(f);
        }
      }
      // Chỉ append ảnh phụ khi có file mới được chọn
      filesToAppend.forEach(f => data.append('SubImages', f));

      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }

      if (isUpdate) {
        const id = initialData.ProductId || initialData.productId;
        console.log('Updating product with ID:', id);
        const response = await API.put(`/Products/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Update response:', response);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        console.log('Creating new product');
        const response = await API.post('/Products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Create response:', response);
        alert('Tạo sản phẩm thành công!');
      }

      // Reset form và đóng dialog
      setForm({
        productName: '',
        sellPrice: 0,
        stockQuantity: 0,
        categoryID: 1,
        brandID: 1,
        supplierID: 1,
        costPrice: 0,
        originalPrice: 0,
        consumptionCapacity: 0,
        maintenance: 0,
        manufactureYear: new Date().getFullYear(),
        description: '',
        isActive: true,
        mainImage: null,
      });
      setPreview(null);
      setSubFiles([null, null, null]);
      setSubPreviews([null, null, null]);

      // Callback để parent component refresh danh sách
      onSaved && onSaved();
    } catch (err) {
      console.error('Submit failed:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);

      // Better error message
      const errorMessage = err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Lưu thất bại';
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
      <DialogContent sx={{ padding: '24px !important' }}>
        <Grid container spacing={2} sx={{ mt: 1, width: '100% !important' }}>
          <Grid item xs={12} sx={{
            width: '50% !important',
            maxWidth: '100% !important',
            flexBasis: '50% !important'
          }}>
            <TextField
              fullWidth
              label="Tên sản phẩm"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              sx={{
                width: '100% !important',
                maxWidth: '100% !important',
                '& .MuiOutlinedInput-root': {
                  width: '100% !important'
                },
                '& .MuiInputBase-input': {
                  width: '100% !important'
                }
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Giá bán chính thức" name="sellPrice" value={form.sellPrice} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Số lượng" name="stockQuantity" value={form.stockQuantity} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sx={{
            width: '20% !important',
            maxWidth: '100% !important',
            flexBasis: '20% !important'
          }}>
            <FormControl fullWidth>
              <InputLabel id="category-label">Danh mục</InputLabel>
              <Select
                labelId="category-label"
                name="categoryID"
                value={form.categoryID}
                label="Danh mục"
                onChange={(e) => setForm(f => ({ ...f, categoryID: Number(e.target.value) }))}
              >
                {categories.map(c => (
                  <MenuItem key={c.CategoryId || c.categoryId} value={c.CategoryId || c.categoryId}>{c.CategoryName || c.categoryName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sx={{
            width: '20% !important',
            maxWidth: '100% !important',
            flexBasis: '20% !important'
          }}>
            <FormControl fullWidth>
              <InputLabel id="brand-label">Thương hiệu</InputLabel>
              <Select
                labelId="brand-label"
                name="brandID"
                value={form.brandID}
                label="Thương hiệu"
                onChange={(e) => setForm(f => ({ ...f, brandID: Number(e.target.value) }))}
              >
                {brands.map(b => (
                  <MenuItem key={b.BrandId || b.brandId} value={b.BrandId || b.brandId}>{b.BrandName || b.brandName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sx={{
            width: '20% !important',
            maxWidth: '100% !important',
            flexBasis: '20% !important'
          }}>
            <FormControl fullWidth>
              <InputLabel id="supplier-label">Nhà cung cấp</InputLabel>
              <Select
                labelId="supplier-label"
                name="supplierID"
                value={form.supplierID}
                label="Nhà cung cấp"
                onChange={(e) => setForm(f => ({ ...f, supplierID: Number(e.target.value) }))}
              >
                {suppliers.map(s => (
                  <MenuItem key={s.supplierId || s.SupplierId || s.SupplierID} value={s.supplierId || s.SupplierId || s.SupplierID}>{s.supplierName || s.SupplierName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Giá nhập" name="costPrice" value={form.costPrice} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Giá bán gốc" name="originalPrice" value={form.originalPrice} onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Thời gian bảo hành (tháng)" name="maintenance" value={form.maintenance} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Năm sản xuất" name="manufactureYear" value={form.manufactureYear} onChange={handleChange} />
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Checkbox checked={form.isActive ?? true} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />} label="Kích hoạt" />
          </Grid>

          {/* Cột trái: Mô tả */}
          <Grid item xs={6} sx={{
            width: '50% !important',
            maxWidth: '50% !important',
            flexBasis: '50% !important'
          }}>
            <TextField
              fullWidth
              multiline
              rows={17}
              label="Mô tả (dòng: Key: Value)"
              name="description"
              value={form.description}
              onChange={handleChange}
              sx={{
                width: '100% !important',
                '& .MuiOutlinedInput-root': {
                  width: '100% !important'
                },
                '& .MuiInputBase-input': {
                  width: '100% !important'
                }
              }}
            />
          </Grid>

          {/* Cột phải: Ảnh chính + Ảnh phụ */}
          <Grid item xs={6} sx={{
            width: '50% !important',
            maxWidth: '50% !important',
            flexBasis: '47% !important',
            paddingLeft: 2
          }}>
            {/* Ảnh chính */}
            <Typography variant="subtitle2">Ảnh chính</Typography>
            <input type="file" name="mainImage" accept="image/*" onChange={handleChange} />

            {/* Preview ảnh chính giống style ảnh phụ */}
            {preview && (
              <Box sx={{ mt: 1, mb: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  Ảnh chính hiện tại:
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-block', mt: 1 }}>
                  <Box
                    component="img"
                    src={preview}
                    alt="main preview"
                    sx={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: 1
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      // Clear main image
                      setForm(f => ({ ...f, mainImage: null }));
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

            {/* Ảnh phụ bên dưới */}
            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Ảnh phụ (tối đa 3 ảnh)</Typography>
            <input type="file" name="subImages" accept="image/*" multiple onChange={(e) => {
              const files = e.target.files;
              if (!files) return;
              const arr = Array.from(files).slice(0, 3);
              // map selected files into fixed slots 0..2
              const newFiles = [null, null, null];
              const newPreviews = [...(subPreviews || [null, null, null])];
              arr.forEach((f, i) => {
                // revoke previous preview blob URL if present
                const prev = newPreviews[i];
                if (typeof prev === 'string' && prev.startsWith('blob:')) {
                  try { URL.revokeObjectURL(prev); } catch (_) { }
                }
                newFiles[i] = f;
                try { newPreviews[i] = URL.createObjectURL(f); } catch (err) { newPreviews[i] = null; }
              });
              setSubFiles(newFiles);
              setSubPreviews(newPreviews);
            }} />
            {(subPreviews && subPreviews.some(p => p !== null)) && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Ảnh phụ hiện tại:
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Box key={idx} sx={{ position: 'relative' }}>
                  {subPreviews && subPreviews[idx] ? (
                    <Box sx={{ position: 'relative' }}>
                      <Box component="img" src={subPreviews[idx]} alt={`sub-${idx}`} sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                      <IconButton size="small" onClick={() => {
                        // remove preview and file
                        const nf = [...(subFiles || [null, null, null])]; nf[idx] = null; setSubFiles(nf);
                        const np = [...(subPreviews || [null, null, null])]; np[idx] = null; setSubPreviews(np);
                      }} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)' }}>
                        <span style={{ fontSize: 12 }}>✕</span>
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ width: 100, height: 100, border: '1px dashed', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">Ảnh {idx + 1}</Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
