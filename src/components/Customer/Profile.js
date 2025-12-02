import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, IconButton, Tooltip, TextField, MenuItem, Grid,
  Snackbar, InputLabel, AlertTitle, InputAdornment
} from '@mui/material';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

import API from '../../services/api';
import { isAuthenticated } from '../../services/auth';

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('/images/default-avatar.jpg');
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    Email: '',
    PhoneNumber: '',
    Address: '',
    FullName: '',
    Avatar: null,
    BirthDate: '',
    Gender: null
  });

  const [errors, setErrors] = useState({
    FullName: '',
    Email: '',
    PhoneNumber: '',
    Gender: ''
  });

  const validateFullName = (value) => {
    if (!value.trim()) return 'Họ và tên là bắt buộc';
    if (value.trim().length < 2) return 'Họ tên phải ít nhất 2 ký tự';
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) return 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email là bắt buộc';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ';
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return 'Số điện thoại là bắt buộc';
    const cleaned = value.replace(/\D/g, '');
    if (!/^0[3|5|7|8|9][0-9]{8}$/.test(cleaned)) return 'Số điện thoại không hợp lệ (VD: 0901234567)';
    return '';
  };

  const validateGender = (value) => {
    if (value === null || value === '') return 'Vui lòng chọn giới tính';
    return '';
  };

  const validateForm = () => {
    const nameError = validateFullName(formData.FullName);
    const emailError = validateEmail(formData.Email);
    const phoneError = validatePhone(formData.PhoneNumber);
    const genderError = validateGender(formData.Gender);

    setErrors({
      FullName: nameError,
      Email: emailError,
      PhoneNumber: phoneError,
      Gender: genderError
    });

    return !(nameError || emailError || phoneError || genderError);
  };

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchProfileData = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        API.get('/Auth/get-my-profile'),
        API.get('/Order/getByCustomer')
      ]);

      const profile = profileRes.data;
      setUser(profile);
      setAvatarPreview(profile.imageUrl || '/images/default-avatar.jpg');

      setFormData({
        Email: profile.email || '',
        PhoneNumber: profile.phone || '',
        Address: profile.address || '',
        FullName: profile.fullName || '',
        Avatar: null,
        BirthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
        Gender: profile.gender !== null && profile.gender !== undefined ? profile.gender : null
      });

      setOrders(ordersRes.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      } else {
        setError('Không thể tải thông tin. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được quá 5MB');
      return;
    }

    setFormData(prev => ({ ...prev, Avatar: file }));
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      setError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      data.append('Email', formData.Email.trim());
      data.append('PhoneNumber', formData.PhoneNumber.replace(/\D/g, ''));
      data.append('Address', formData.Address.trim());
      data.append('FullName', formData.FullName.trim());
      data.append('BirthDate', formData.BirthDate || '');
      data.append('Gender', formData.Gender);
      if (formData.Avatar) data.append('Avatar', formData.Avatar);

      await API.put('/Customers/EditMyProfile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Cập nhật thông tin thành công!');
      setOpenEdit(false);
      fetchProfileData();
      window.dispatchEvent(new Event('authChange'));
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setProcessing(true);
    try {
      await API.post('/Order/CancelOrder', null, {
        params: { OrderCode: cancellingOrder.orderCode }
      });
      setOrders(prev => prev.map(order =>
        order.orderId === cancellingOrder.orderId ? { ...order, status: 'Cancelled' } : order
      ));
      setOpenCancelDialog(false);
      setCancellingOrder(null);
      setSuccessMsg('Hủy đơn hàng thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Hủy đơn hàng thất bại.');
    } finally {
      setProcessing(false);
    }
  };

  const openCancelConfirm = (order) => {
    setCancellingOrder(order);
    setOpenCancelDialog(true);
  };

  const renderStatus = (status) => {
    const map = {
      Pending: { color: 'warning', icon: <AccessTimeIcon fontSize="small" />, text: 'Chờ xác nhận' },
      Confirmed: { color: 'info', icon: <CheckCircleIcon fontSize="small" />, text: 'Đã xác nhận' },
      Shipping: { color: 'primary', icon: <LocalShippingIcon fontSize="small" />, text: 'Đang giao' },
      Delivered: { color: 'success', icon: <DoneAllIcon fontSize="small" />, text: 'Đã giao' },
      Completed: { color: 'success', icon: <DoneAllIcon fontSize="small" />, text: 'Hoàn thành' },
      Cancelled: { color: 'error', icon: <CancelIcon fontSize="small" />, text: 'Đã hủy' },
    };
    const cfg = map[status] || { color: 'default', text: status };
    return <Chip icon={cfg.icon} label={cfg.text} color={cfg.color} size="small" sx={{ fontWeight: 600 }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', mb: 5, position: 'relative' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #0560e7 0%, #0088ff 100%)', p: 4, color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={user?.imageUrl || '/images/default-avatar.jpg'}
              alt={user?.fullName}
              sx={{ width: 100, height: 100, border: '4px solid white' }}
            />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user?.fullName || 'Khách hàng'}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpenEdit(true)}
            sx={{
              position: 'absolute', top: 16, right: 16,
              bgcolor: 'rgba(255,255,255,0.2)', color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <EditIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#0560e7', fontWeight: 'bold' }}>
            Thông tin chi tiết
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Typography><strong>Số điện thoại:</strong> {user?.phone || 'Chưa cập nhật'}</Typography>
            <Typography><strong>Địa chỉ:</strong> {user?.address || 'Chưa cập nhật'}</Typography>
            <Typography>
              <strong>Giới tính:</strong>{' '}
              {user?.gender === 1 ? 'Nam' : user?.gender === 0 ? 'Nữ' : 'Khác'}
            </Typography>
            <Typography>
              <strong>Ngày sinh:</strong>{' '}
              {user?.birthDate 
                ? new Date(user.birthDate).toLocaleDateString('vi-VN')
                : 'Chưa cập nhật'
              }
            </Typography>
            <Typography>
              <strong>Điểm tích lũy:</strong>{' '}
              <Chip label={`${user?.point || 0} điểm`} color="primary" size="small" />
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Dialog open={openEdit} onClose={() => !saving && setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0560e7', color: 'white', fontWeight: 'bold' }}>
          <EditIcon sx={{ mr: 1 }} /> Chỉnh sửa thông tin cá nhân
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}><AlertTitle>Lỗi</AlertTitle>{error}</Alert>}

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar src={avatarPreview} sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }} />
            <InputLabel htmlFor="avatar-upload">
              <input ref={fileInputRef} type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarChange} />
              <Button variant="outlined" component="span" startIcon={<PhotoCamera />} size="small">
                Đổi ảnh đại diện
              </Button>
            </InputLabel>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Tối đa 5MB, định dạng JPG/PNG
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Họ và tên *"
                value={formData.FullName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, FullName: value }));
                  setErrors(prev => ({ ...prev, FullName: validateFullName(value) }));
                }}
                error={!!errors.FullName}
                helperText={errors.FullName}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.Email}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, Email: value }));
                  setErrors(prev => ({ ...prev, Email: validateEmail(value) }));
                }}
                error={!!errors.Email}
                helperText={errors.Email || 'Ví dụ: example@gmail.com'}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Số điện thoại *"
                value={formData.PhoneNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  if (value && !value.startsWith('0')) value = '0' + value.slice(-10);
                  setFormData(prev => ({ ...prev, PhoneNumber: value }));
                  setErrors(prev => ({ ...prev, PhoneNumber: validatePhone(value) }));
                }}
                error={!!errors.PhoneNumber}
                helperText={errors.PhoneNumber || 'Ví dụ: 0901234567'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">+84</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={2}
                value={formData.Address}
                onChange={(e) => setFormData(prev => ({ ...prev, Address: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày sinh"
                type="date"
                value={formData.BirthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, BirthDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Giới tính *"
                value={formData.Gender === null ? '' : formData.Gender}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : Number(e.target.value);
                  setFormData(prev => ({ ...prev, Gender: value }));
                  setErrors(prev => ({ ...prev, Gender: validateGender(value) }));
                }}
                error={!!errors.Gender}
                helperText={errors.Gender}
              >
                <MenuItem value=""><em>Chọn giới tính</em></MenuItem>
                <MenuItem value={1}>Nam</MenuItem>
                <MenuItem value={0}>Nữ</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving} size="large">
            Hủy
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            size="large"
            sx={{
              minWidth: 140,
              background: 'linear-gradient(45deg, #0560e7, #0088ff)',
              '&:hover': { background: 'linear-gradient(45deg, #0044cc, #0066cc)' }
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#0560e7' }}>Lịch sử mua hàng</Typography>
      {orders.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary">Bạn chưa có đơn hàng nào</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>Mua sắm ngay</Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell><strong>Mã đơn</strong></TableCell>
                <TableCell><strong>Ngày đặt</strong></TableCell>
                <TableCell><strong>Tổng tiền</strong></TableCell>
                <TableCell><strong>Trạng thái</strong></TableCell>
                <TableCell><strong>Thanh toán</strong></TableCell>
                <TableCell><strong>Sản phẩm</strong></TableCell>
                <TableCell align="center"><strong>Hành động</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderId} hover>
                  <TableCell><strong>#{order.orderCode}</strong></TableCell>
                  <TableCell>
                    {new Date(order.orderDate).toLocaleDateString('vi-VN')} <br />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.orderDate).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    {order.totalAmount.toLocaleString('vi-VN')}₫
                  </TableCell>
                  <TableCell>{renderStatus(order.status)}</TableCell>
                  <TableCell>
                    <Chip label={order.paymentMethod === 'COD' ? 'COD' : 'VNPay'} size="small" color={order.paymentMethod === 'COD' ? 'default' : 'success'} />
                  </TableCell>
                  <TableCell>
                    {order.orderDetails?.slice(0, 2).map((item) => (
                      <Box key={item.orderDetailId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <img src={item.productImage || '/images/placeholder-product.jpg'} alt={item.productName}
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <Box>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{item.productName}</Typography>
                          <Typography variant="caption">x{item.quantity} • {item.price.toLocaleString('vi-VN')}₫</Typography>
                        </Box>
                      </Box>
                    ))}
                    {order.orderDetails?.length > 2 && (
                      <Typography variant="caption" color="primary">
                        +{order.orderDetails.length - 2} sản phẩm khác
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {order.status === 'Pending' && (
                      <Tooltip title="Hủy đơn hàng">
                        <IconButton color="error" onClick={() => openCancelConfirm(order)} size="small">
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openCancelDialog} onClose={() => !processing && setOpenCancelDialog(false)}>
        <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn <strong>hủy đơn hàng #{cancellingOrder?.orderCode}</strong> không?<br />
            Hành động này <strong>không thể hoàn tác</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} disabled={processing}>Không</Button>
          <Button onClick={handleCancelOrder} color="error" variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Hủy đơn'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ width: '100%' }}>
          <AlertTitle>Thành công!</AlertTitle>
          {successMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;