import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Tooltip, Pagination, Stack,
  TextField, InputAdornment, Typography, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    isActive: null
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let apiUrl;
        if (searchPhone.trim()) {
          apiUrl = `/Customers/search?phone=${encodeURIComponent(searchPhone.trim())}`;
        } else {
          apiUrl = `/Customers?pageNumber=${page}&pageSize=${pageSize}`;
        }

        const res = await API.get(apiUrl);

        if (searchPhone.trim()) {
          setCustomers(res.data || []);
          setTotalPages(1);
          setTotalItems(res.data?.length || 0);
        } else {
          setCustomers(res.data.data || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalItems(res.data.totalItems || 0);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
        if (err.response?.status === 404) {
          setCustomers([]);
          setTotalItems(0);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, pageSize, searchPhone, refreshKey]);

  const handleSearchChange = (event) => {
    setSearchPhone(event.target.value);
    setPage(1);
  };

  const handleOpenEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setEditData({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phoneNumber: customer.phone || '',
      address: customer.address || '',
      isActive: customer.isActive
    });
    setOpenEditDialog(true);
  };

  const handleOpenViewDialog = (customer) => {
    setSelectedCustomer(customer);
    setOpenViewDialog(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editData.fullName.trim() || !editData.email.trim() || !editData.phoneNumber.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('FullName', editData.fullName);
      formData.append('Email', editData.email);
      formData.append('PhoneNumber', editData.phoneNumber);
      formData.append('Address', editData.address || '');
      if (editData.isActive !== null) {
        formData.append('IsActive', editData.isActive.toString());
      }

      await API.put(`/Customers/${selectedCustomer.customerId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Cập nhật khách hàng thành công!');
      setOpenEditDialog(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to update customer:', err);
      alert(err.response?.data || 'Cập nhật thất bại');
    }
  };

  const handlePageChange = (e, value) => {
    setPage(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Quản lý khách hàng
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Tìm kiếm theo số điện thoại..."
          value={searchPhone}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 300, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Tổng: {totalItems} khách hàng
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Avatar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Họ tên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>SĐT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Địa chỉ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Điểm</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.customerId} hover>
                    <TableCell>
                      <Avatar
                        src={customer.imageUrl}
                        alt={customer.fullName}
                        sx={{ width: 40, height: 40 }}
                      >
                        {customer.fullName?.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {customer.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {customer.address || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${customer.point} điểm`}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          customer.isActive === null
                            ? 'Chưa có TK'
                            : customer.isActive
                              ? 'Hoạt động'
                              : 'Khóa'
                        }
                        color={
                          customer.isActive === null
                            ? 'default'
                            : customer.isActive
                              ? 'success'
                              : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleOpenViewDialog(customer)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEditDialog(customer)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Không tìm thấy khách hàng nào
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

      {/* Dialog chỉnh sửa */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Họ tên"
              value={editData.fullName}
              onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại"
              value={editData.phoneNumber}
              onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Địa chỉ"
              multiline
              rows={3}
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
            {editData.isActive !== null && (
              <FormControl fullWidth>
                <InputLabel>Trạng thái tài khoản</InputLabel>
                <Select
                  value={editData.isActive.toString()}
                  onChange={(e) => {
                    setEditData({
                      ...editData,
                      isActive: e.target.value === 'true'
                    });
                  }}
                  label="Trạng thái tài khoản"
                >
                  <MenuItem value="true">Hoạt động</MenuItem>
                  <MenuItem value="false">Khóa</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleUpdateCustomer}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xem chi tiết */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chi tiết khách hàng</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  src={selectedCustomer.imageUrl}
                  alt={selectedCustomer.fullName}
                  sx={{ width: 80, height: 80 }}
                >
                  {selectedCustomer.fullName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedCustomer.fullName}
                  </Typography>
                  <Chip
                    label={
                      selectedCustomer.isActive === null
                        ? 'Chưa có tài khoản'
                        : selectedCustomer.isActive
                          ? 'Hoạt động'
                          : 'Khóa'
                    }
                    color={
                      selectedCustomer.isActive === null
                        ? 'default'
                        : selectedCustomer.isActive
                          ? 'success'
                          : 'error'
                    }
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedCustomer.email || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedCustomer.phone}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Giới tính
                  </Typography>
                  <Typography variant="body1">
                    {selectedCustomer.gender === 1 ? 'Nam' : selectedCustomer.gender === 0 ? 'Nữ' : 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày sinh
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedCustomer.birthDate)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Địa chỉ
                  </Typography>
                  <Typography variant="body1">
                    {selectedCustomer.address || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Điểm tích lũy
                  </Typography>
                  <Chip
                    label={`${selectedCustomer.point} điểm`}
                    color="success"
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
