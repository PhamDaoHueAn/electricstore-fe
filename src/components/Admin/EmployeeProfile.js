import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { Edit, Save, Cancel, PhotoCamera, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import AdminLayout from './AdminLayout';
import API from '../../services/api';

const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    birthDate: '',
    avatar: null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get('/Auth/get-my-profile');
      setProfile(response.data);
      setFormData({
        fullName: response.data.fullName || '',
        email: response.data.email || '',
        phoneNumber: response.data.phone || '',
        address: response.data.address || '',
        birthDate: response.data.birthDate ? formatDateForInput(response.data.birthDate) : '',
        avatar: null
      });
      setError(null);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Không thể tải thông tin';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    // Chuyển từ "dd/MM/yyyy" sang "yyyy-MM-dd"
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setFormData({
      fullName: profile.fullName || '',
      email: profile.email || '',
      phoneNumber: profile.phone || '',
      address: profile.address || '',
      birthDate: profile.birthDate ? formatDateForInput(profile.birthDate) : '',
      avatar: null
    });
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('FullName', formData.fullName.trim());
      formDataToSend.append('Email', formData.email.trim());
      formDataToSend.append('PhoneNumber', formData.phoneNumber.trim());
      formDataToSend.append('Address', formData.address.trim());
      if (formData.birthDate) {
        formDataToSend.append('BirthDate', formData.birthDate);
      }
      if (formData.avatar) {
        formDataToSend.append('Avatar', formData.avatar);
      }

      await API.put('/Employee/EditMyProfile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setAvatarPreview(null);
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMsg);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp!');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('Mật khẩu mới phải có ít nhất 8 ký tự!');
        return;
      }

      await API.post('/Auth/change-password', {
        OldPassword: passwordData.oldPassword,
        NewPassword: passwordData.newPassword
      });

      setSuccess('Đổi mật khẩu thành công!');
      setOpenPasswordDialog(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Có lỗi xảy ra';
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
      {/* Alerts ở ngoài để không bị Dialog che */}
      {error && (
        <Alert
          severity="error"
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: 400,
            boxShadow: 3
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: 400,
            boxShadow: 3
          }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>

        {/* Header Card */}
        <Card sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          boxShadow: 3
        }}>
          <CardContent sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={avatarPreview || profile?.imageUrl}
                    alt={profile?.fullName}
                    sx={{
                      width: 110,
                      height: 110,
                      border: '4px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  />
                  {isEditing && (
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        backgroundColor: 'white',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: 'grey.100' },
                        boxShadow: 2
                      }}
                      size="small"
                    >
                      <PhotoCamera fontSize="small" />
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleAvatarChange}
                      />
                    </IconButton>
                  )}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600" gutterBottom>
                    {profile?.fullName}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 500 }}>
                    {profile?.position}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                    📅 Ngày vào làm: {profile?.hireDate}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!isEditing ? (
                  <>
                    <Button
                      startIcon={<Edit />}
                      variant="contained"
                      size="large"
                      onClick={handleEdit}
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { backgroundColor: 'grey.100' }
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      startIcon={<Lock />}
                      variant="outlined"
                      size="large"
                      onClick={() => setOpenPasswordDialog(true)}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      Đổi mật khẩu
                    </Button>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Save />}
                      variant="contained"
                      size="large"
                      onClick={handleSave}
                      sx={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#388e3c' }
                      }}
                    >
                      Lưu
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      variant="outlined"
                      size="large"
                      onClick={handleCancel}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      Hủy
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Thông tin cá nhân */}
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3, color: 'primary.main', borderBottom: '3px solid', borderColor: 'primary.main', pb: 1, display: 'inline-block' }}>
              Thông tin cá nhân
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Họ và tên"
                  fullWidth
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      backgroundColor: isEditing ? 'white' : '#f5f5f5',
                      '& input': {
                        color: '#000 !important',
                        WebkitTextFillColor: '#000 !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      backgroundColor: isEditing ? 'white' : '#f5f5f5',
                      '& input': {
                        color: '#000 !important',
                        WebkitTextFillColor: '#000 !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  disabled={!isEditing}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      backgroundColor: isEditing ? 'white' : '#f5f5f5',
                      '& input': {
                        color: '#000 !important',
                        WebkitTextFillColor: '#000 !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ngày sinh"
                  fullWidth
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  disabled={!isEditing}
                  variant="outlined"
                  InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      backgroundColor: isEditing ? 'white' : '#f5f5f5',
                      '& input': {
                        color: '#000 !important',
                        WebkitTextFillColor: '#000 !important'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Địa chỉ"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      backgroundColor: isEditing ? 'white' : '#f5f5f5',
                      '& textarea': {
                        color: '#000 !important',
                        WebkitTextFillColor: '#000 !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Thông tin công việc */}
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3, color: 'success.main', borderBottom: '3px solid', borderColor: 'success.main', pb: 1, display: 'inline-block' }}>
              Thông tin công việc
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Chức vụ"
                  fullWidth
                  value={profile?.position || ''}
                  disabled
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 600,
                      backgroundColor: '#e3f2fd',
                      '& input': {
                        color: '#0d47a1 !important',
                        WebkitTextFillColor: '#0d47a1 !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lương"
                  fullWidth
                  value={profile?.salary ? `${Number(profile.salary).toLocaleString('vi-VN')}₫` : 'Chưa có thông tin'}
                  disabled
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 600,
                      backgroundColor: '#fff3e0',
                      '& input': {
                        color: '#bf360c !important',
                        WebkitTextFillColor: '#bf360c !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ngày vào làm"
                  fullWidth
                  value={profile?.hireDate || ''}
                  disabled
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 600,
                      backgroundColor: '#f3e5f5',
                      '& input': {
                        color: '#4a148c !important',
                        WebkitTextFillColor: '#4a148c !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Trạng thái"
                  fullWidth
                  value={profile?.isActive ? '✓ Đang làm việc' : '✗ Ngừng hoạt động'}
                  disabled
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontWeight: 600,
                      backgroundColor: profile?.isActive ? '#e8f5e9' : '#ffebee',
                      '& input': {
                        color: profile?.isActive ? '#1b5e20 !important' : '#b71c1c !important',
                        WebkitTextFillColor: profile?.isActive ? '#1b5e20 !important' : '#b71c1c !important'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 600 }
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Dialog Đổi Mật Khẩu */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Đổi Mật Khẩu
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Mật khẩu cũ"
              type={showOldPassword ? 'text' : 'password'}
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      edge="end"
                    >
                      {showOldPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              margin="normal"
              required
              helperText="Tối thiểu 8 ký tự, bao gồm chữ, số và ký tự đặc biệt"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu mới"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenPasswordDialog(false);
              setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
              setShowOldPassword(false);
              setShowNewPassword(false);
            }}
            variant="outlined"
          >
            Hủy
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            color="primary"
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default EmployeeProfile;