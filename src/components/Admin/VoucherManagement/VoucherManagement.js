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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import API from '../../../services/api';
import AdminLayout from '../AdminLayout';

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    voucherCode: '',
    voucherName: '',
    discountType: 'percent',
    discountValue: '',
    quantity: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await API.get('/Voucher', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);

      // Chuyển từ UTC sang giờ Việt Nam để hiển thị
      const toLocalInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // Trừ đi offset để về local time
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 16);
      };

      setFormData({
        voucherCode: voucher.voucherCode,
        voucherName: voucher.voucherName || '',
        discountType: voucher.discountType || 'percent',
        discountValue: voucher.discountValue,
        quantity: voucher.quantity || '',
        startDate: toLocalInput(voucher.startDate),
        endDate: toLocalInput(voucher.endDate),
        isActive: voucher.isActive
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        voucherCode: '',
        voucherName: '',
        discountType: 'percent',
        discountValue: '',
        quantity: '',
        startDate: '',
        endDate: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVoucher(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Chuyển đổi sang múi giờ Việt Nam (GMT+7)
      const toVietnamTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        // Thêm 7 giờ để chuyển sang GMT+7
        const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        return vietnamTime.toISOString();
      };

      const submitData = {
        voucherCode: formData.voucherCode.trim(),
        voucherName: formData.voucherName.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        quantity: parseInt(formData.quantity),
        startDate: toVietnamTime(formData.startDate),
        endDate: toVietnamTime(formData.endDate),
        isActive: formData.isActive
      };

      if (editingVoucher) {
        await API.put(`/Voucher/${editingVoucher.voucherId}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Cập nhật voucher thành công!');
      } else {
        await API.post('/Voucher', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Thêm voucher thành công!');
      }

      handleCloseDialog();
      fetchVouchers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data || 'Có lỗi xảy ra');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa voucher này?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await API.delete(`/Voucher/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Xóa voucher thành công!');
      fetchVouchers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data || 'Không thể xóa voucher');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getVoucherStatus = (voucher) => {
    if (!voucher.isActive) return 'inactive';
    if (!voucher.quantity || voucher.quantity <= 0) return 'out_of_stock';
    if (!voucher.startDate || !voucher.endDate) return 'invalid';

    const now = new Date();
    const start = new Date(voucher.startDate);
    const end = new Date(voucher.endDate);

    if (now < start) return 'not_started';
    if (now > end) return 'expired';
    return 'valid';
  };

  const isVoucherValid = (voucher) => {
    return getVoucherStatus(voucher) === 'valid';
  }; if (loading) {
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
          <Typography variant="h4">Quản lý Voucher</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Thêm Voucher
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã Voucher</TableCell>
                <TableCell>Tên Voucher</TableCell>
                <TableCell>Loại giảm</TableCell>
                <TableCell align="right">Giá trị</TableCell>
                <TableCell align="center">Số lượng</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vouchers.map((voucher) => (
                <TableRow key={voucher.voucherId}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {voucher.voucherCode}
                    </Typography>
                  </TableCell>
                  <TableCell>{voucher.voucherName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={voucher.discountType === 'percent' ? 'Phần trăm' : 'Số tiền'}
                      color={voucher.discountType === 'percent' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {voucher.discountType === 'percent'
                      ? `${voucher.discountValue}%`
                      : `${voucher.discountValue.toLocaleString('vi-VN')}₫`}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={voucher.quantity || 0}
                      color={voucher.quantity > 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      Từ: {formatDate(voucher.startDate)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Đến: {formatDate(voucher.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const status = getVoucherStatus(voucher);
                      switch (status) {
                        case 'valid':
                          return <Chip label="Có hiệu lực" color="success" size="small" />;
                        case 'not_started':
                          return <Chip label="Chưa bắt đầu" color="info" size="small" />;
                        case 'expired':
                          return <Chip label="Hết hạn" color="warning" size="small" />;
                        case 'out_of_stock':
                          return <Chip label="Hết hàng" color="error" size="small" />;
                        case 'inactive':
                          return <Chip label="Tạm dừng" color="default" size="small" />;
                        default:
                          return <Chip label="Không hợp lệ" color="error" size="small" />;
                      }
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(voucher)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(voucher.voucherId)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {vouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">Chưa có voucher nào</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog Thêm/Sửa */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingVoucher ? 'Chỉnh sửa Voucher' : 'Thêm Voucher mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Mã Voucher"
                name="voucherCode"
                value={formData.voucherCode}
                onChange={handleInputChange}
                required
                fullWidth
                disabled={!!editingVoucher}
                helperText="Ví dụ: SALE20, FREESHIP"
              />

              <TextField
                label="Tên Voucher"
                name="voucherName"
                value={formData.voucherName}
                onChange={handleInputChange}
                required
                fullWidth
                helperText="Tên mô tả cho voucher"
              />

              <FormControl fullWidth required>
                <InputLabel>Loại giảm giá</InputLabel>
                <Select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  label="Loại giảm giá"
                >
                  <MenuItem value="percent">Phần trăm (%)</MenuItem>
                  <MenuItem value="amount">Số tiền cố định (₫)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={formData.discountType === 'percent' ? 'Giá trị (%)' : 'Giá trị (₫)'}
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                type="number"
                required
                fullWidth
                inputProps={{ min: 0, step: formData.discountType === 'percent' ? 1 : 1000 }}
                helperText={formData.discountType === 'percent' ? 'Từ 0 đến 100' : 'Số tiền giảm'}
              />

              <TextField
                label="Số lượng"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                type="number"
                required
                fullWidth
                inputProps={{ min: 0 }}
                helperText="Số lượng voucher có thể sử dụng"
              />

              <TextField
                label="Ngày bắt đầu"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                type="datetime-local"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Ngày kết thúc"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                type="datetime-local"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                }
                label="Kích hoạt voucher"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={
                !formData.voucherCode.trim() ||
                !formData.voucherName.trim() ||
                !formData.discountValue ||
                !formData.quantity ||
                !formData.startDate ||
                !formData.endDate
              }
            >
              {editingVoucher ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default VoucherManagement;
