import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Typography, Alert, Chip, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete
} from '@mui/material';
import {
  Edit, Delete, Add, ExpandMore, AccessTime, LocalOffer, Inventory
} from '@mui/icons-material';
import API from '../../../services/api';
import AdminLayout from '../AdminLayout';

const FlashSaleManagement = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState(null);
  const [selectedFlashSale, setSelectedFlashSale] = useState(null);
  const [formData, setFormData] = useState({
    flashSaleName: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    items: []
  });
  const [itemFormData, setItemFormData] = useState({
    productId: null,
    sellPrice: '',
    quantity: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [flashSalesRes, productsRes] = await Promise.all([
        API.get('/FlashSale/get-all', { headers: { Authorization: `Bearer ${token}` } }),
        API.get('/Products/GetAll', { params: { pageSize: 1000 } })
      ]);
      setFlashSales(flashSalesRes.data || []);
      setProducts(productsRes.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Fetch data error:', err);
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Không thể tải dữ liệu';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (flashSale = null) => {
    if (flashSale) {
      setEditingFlashSale(flashSale);
      setFormData({
        flashSaleName: flashSale.flashSaleName,
        description: flashSale.description || '',
        date: flashSale.dateSale,
        startTime: flashSale.startTime,
        endTime: flashSale.endTime,
        items: []
      });
    } else {
      setEditingFlashSale(null);
      setFormData({
        flashSaleName: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        items: []
      });
    }
    setOpenDialog(true);
  };

  const handleAddItem = () => {
    if (!itemFormData.productId || !itemFormData.sellPrice || !itemFormData.quantity) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const product = products.find(p => p.productId === itemFormData.productId);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: itemFormData.productId,
        productName: product.productName,
        sellPrice: parseFloat(itemFormData.sellPrice),
        quantity: parseInt(itemFormData.quantity)
      }]
    }));
    setItemFormData({ productId: null, sellPrice: '', quantity: '' });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const submitData = {
        flashSaleName: formData.flashSaleName.trim(),
        description: formData.description.trim(),
        Date: formData.date,
        StartTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        EndTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        ...(!editingFlashSale && {
          Items: formData.items.map(i => ({
            ProductId: i.productId,
            SellPrice: parseFloat(i.sellPrice),
            Quantity: parseInt(i.quantity)
          }))
        })
      };

      console.log('Submit data:', JSON.stringify(submitData, null, 2));

      if (editingFlashSale) {
        await API.put(`/FlashSale?id=${editingFlashSale.flashSaleId}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật thành công!');
      } else {
        if (formData.items.length === 0) {
          setError('Vui lòng thêm ít nhất 1 sản phẩm');
          return;
        }
        await API.post('/FlashSale', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Tạo flash sale thành công!');
      }

      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Error response:', err.response);
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMsg);
    }
  }; const handleDelete = async (id) => {
    if (!window.confirm('Xóa flash sale này?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await API.delete(`/FlashSale?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Xóa thành công!');
      fetchData();
    } catch (err) {
      setError('Không thể xóa');
    }
  };

  const handleAddItemToExisting = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await API.post('/FlashSale/add-flashsaleItem', {
        flashSaleId: selectedFlashSale.flashSaleId,
        productId: itemFormData.productId,
        sellPrice: parseFloat(itemFormData.sellPrice),
        quantity: parseInt(itemFormData.quantity)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Thêm sản phẩm thành công!');
      setOpenItemDialog(false);
      fetchData();
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Lỗi khi thêm sản phẩm';
      setError(errorMsg);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await API.delete(`/FlashSale/delete-flashsale-item?id=${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Xóa thành công!');
      fetchData();
    } catch (err) {
      setError('Không thể xóa');
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Quản lý Flash Sale</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Tạo Flash Sale
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {flashSales.map((fs) => (
          <Accordion key={fs.flashSaleId} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <LocalOffer color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{fs.flashSaleName}</Typography>
                  <Typography variant="caption">{fs.description}</Typography>
                </Box>
                <Chip icon={<AccessTime />} label={`${fs.dateSale} ${fs.startTime}-${fs.endTime}`} size="small" />
                <Chip icon={<Inventory />} label={`${fs.items?.length || 0} SP`} size="small" color="primary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Button size="small" startIcon={<Add />} onClick={() => { setSelectedFlashSale(fs); setOpenItemDialog(true); }}>Thêm SP</Button>
                <Button size="small" startIcon={<Edit />} onClick={() => handleOpenDialog(fs)}>Sửa</Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(fs.flashSaleId)}>Xóa</Button>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="right">Giá gốc</TableCell>
                      <TableCell align="right">Giá sale</TableCell>
                      <TableCell align="right">Giảm</TableCell>
                      <TableCell align="center">SL</TableCell>
                      <TableCell align="center">Xóa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fs.items?.map((item) => {
                      const discount = ((item.product.originalPrice - item.sellPrice) / item.product.originalPrice * 100).toFixed(0);
                      return (
                        <TableRow key={item.itemId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <img src={item.product.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                              <Typography variant="body2">{item.product.productName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right"><Typography sx={{ textDecoration: 'line-through' }}>{item.product.originalPrice.toLocaleString()}₫</Typography></TableCell>
                          <TableCell align="right"><Typography color="error" fontWeight="bold">{item.sellPrice.toLocaleString()}₫</Typography></TableCell>
                          <TableCell align="right"><Chip label={`-${discount}%`} color="error" size="small" /></TableCell>
                          <TableCell align="center"><Chip label={item.quantity} size="small" /></TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.itemId)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Dialog Tạo/Sửa */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingFlashSale ? 'Sửa' : 'Tạo'} Flash Sale</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField label="Tên" name="flashSaleName" value={formData.flashSaleName} onChange={(e) => setFormData(prev => ({ ...prev, flashSaleName: e.target.value }))} fullWidth required />
              <TextField label="Mô tả" name="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} multiline rows={2} fullWidth />
              <TextField label="Ngày" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} required />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Bắt đầu" type="time" value={formData.startTime} onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} required />
                <TextField label="Kết thúc" type="time" value={formData.endTime} onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} required />
              </Box>

              {!editingFlashSale && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>Thêm sản phẩm</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Autocomplete options={products} getOptionLabel={(o) => o.productName} value={products.find(p => p.productId === itemFormData.productId) || null} onChange={(e, v) => setItemFormData(prev => ({ ...prev, productId: v?.productId || null }))} renderInput={(params) => <TextField {...params} label="Sản phẩm" />} sx={{ flex: 2 }} />
                    <TextField label="Giá sale" type="number" value={itemFormData.sellPrice} onChange={(e) => setItemFormData(prev => ({ ...prev, sellPrice: e.target.value }))} sx={{ flex: 1 }} />
                    <TextField label="SL" type="number" value={itemFormData.quantity} onChange={(e) => setItemFormData(prev => ({ ...prev, quantity: e.target.value }))} sx={{ flex: 1 }} />
                    <Button variant="contained" onClick={handleAddItem}>+</Button>
                  </Box>

                  {formData.items.length > 0 && (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="right">Giá</TableCell>
                            <TableCell align="center">SL</TableCell>
                            <TableCell align="center">Xóa</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {formData.items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell align="right">{item.sellPrice.toLocaleString()}₫</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => setFormData(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }))}>
                                  <Delete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={!formData.flashSaleName || !formData.date || (!editingFlashSale && formData.items.length === 0)}>
              {editingFlashSale ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Thêm SP */}
        <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm sản phẩm</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Autocomplete options={products} getOptionLabel={(o) => o.productName} value={products.find(p => p.productId === itemFormData.productId) || null} onChange={(e, v) => setItemFormData(prev => ({ ...prev, productId: v?.productId || null }))} renderInput={(params) => <TextField {...params} label="Sản phẩm" />} />
              <TextField label="Giá sale" type="number" value={itemFormData.sellPrice} onChange={(e) => setItemFormData(prev => ({ ...prev, sellPrice: e.target.value }))} fullWidth />
              <TextField label="Số lượng" type="number" value={itemFormData.quantity} onChange={(e) => setItemFormData(prev => ({ ...prev, quantity: e.target.value }))} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenItemDialog(false)}>Hủy</Button>
            <Button onClick={handleAddItemToExisting} variant="contained" disabled={!itemFormData.productId || !itemFormData.sellPrice || !itemFormData.quantity}>Thêm</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default FlashSaleManagement;
