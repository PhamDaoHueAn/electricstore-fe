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
  CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Business, Phone, LocationOn } from '@mui/icons-material';
import AdminLayout from '../AdminLayout';
import API from '../../../services/api';

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierPhone: '',
    supplierAddress: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await API.get('/Supplier/GetAll');
      setSuppliers(response.data);
      setError(null);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Không thể tải dữ liệu';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        supplierName: supplier.supplierName,
        supplierPhone: supplier.supplierPhone || '',
        supplierAddress: supplier.supplierAddress || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        supplierName: '',
        supplierPhone: '',
        supplierAddress: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
    setFormData({
      supplierName: '',
      supplierPhone: '',
      supplierAddress: ''
    });
  };

  const handleSubmit = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('SupplierName', formData.supplierName.trim());
      formDataToSend.append('SupplierPhone', formData.supplierPhone.trim());
      formDataToSend.append('SupplierAddress', formData.supplierAddress.trim());

      if (editingSupplier) {
        await API.put(`/Supplier/${editingSupplier.supplierId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Cập nhật nhà cung cấp thành công!');
      } else {
        await API.post('/Supplier', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Thêm nhà cung cấp thành công!');
      }

      handleCloseDialog();
      fetchSuppliers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa nhà cung cấp này?')) return;
    try {
      await API.delete(`/Supplier/${id}`);
      setSuccess('Xóa nhà cung cấp thành công!');
      fetchSuppliers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Không thể xóa nhà cung cấp';
      setError(errorMsg);
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
          <Typography variant="h4">Quản lý Nhà cung cấp</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Thêm nhà cung cấp
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Tên nhà cung cấp</strong></TableCell>
                <TableCell><strong>Số điện thoại</strong></TableCell>
                <TableCell><strong>Địa chỉ</strong></TableCell>
                <TableCell align="center"><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Chưa có nhà cung cấp nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.supplierId} hover>
                    <TableCell>{supplier.supplierId}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {supplier.supplierName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2">
                          {supplier.supplierPhone || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {supplier.supplierAddress || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(supplier)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(supplier.supplierId)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog thêm/sửa nhà cung cấp */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Tên nhà cung cấp"
              fullWidth
              required
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              InputProps={{
                startAdornment: <Business sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            <TextField
              label="Số điện thoại"
              fullWidth
              required
              value={formData.supplierPhone}
              onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            <TextField
              label="Địa chỉ"
              fullWidth
              required
              multiline
              rows={3}
              value={formData.supplierAddress}
              onChange={(e) => setFormData({ ...formData, supplierAddress: e.target.value })}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.supplierName || !formData.supplierPhone || !formData.supplierAddress}
          >
            {editingSupplier ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

export default SupplierManagement;