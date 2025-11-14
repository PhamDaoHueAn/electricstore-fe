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
import AddIcon from '@mui/icons-material/Add';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    position: '',
    salary: '',
    hireDate: '',
    isActive: true
  });
  const [addData, setAddData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    position: '',
    salary: '',
    hireDate: '',
    birthDate: '',
    username: ''
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let apiUrl;
        if (searchPhone.trim()) {
          apiUrl = `/Employee/search?phone=${encodeURIComponent(searchPhone.trim())}`;
        } else {
          apiUrl = `/Employee?pageNumber=${page}&pageSize=${pageSize}`;
        }
        
        const res = await API.get(apiUrl);
        
        if (searchPhone.trim()) {
          setEmployees(res.data || []);
          setTotalPages(1);
          setTotalItems(res.data?.length || 0);
        } else {
          setEmployees(res.data.data || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalItems(res.data.totalItems || 0);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        if (err.response?.status === 404) {
          setEmployees([]);
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

  const handleOpenEditDialog = (employee) => {
    setSelectedEmployee(employee);
    setEditData({
      fullName: employee.fullName || '',
      email: employee.email || '',
      phoneNumber: employee.phone || '',
      address: employee.address || '',
      position: employee.position || '',
      salary: employee.salary || '',
      hireDate: employee.hireDate || '',
      isActive: employee.isActive
    });
    setOpenEditDialog(true);
  };

  const handleOpenViewDialog = (employee) => {
    setSelectedEmployee(employee);
    setOpenViewDialog(true);
  };

  const handleOpenAddDialog = () => {
    setAddData({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      position: '',
      salary: '',
      hireDate: '',
      birthDate: '',
      username: ''
    });
    setOpenAddDialog(true);
  };

  const handleUpdateEmployee = async () => {
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
      formData.append('Position', editData.position);
      formData.append('Salary', editData.salary);
      formData.append('HireDate', editData.hireDate);
      formData.append('IsActive', editData.isActive.toString());

      await API.put(`/Employee/${selectedEmployee.employeeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Cập nhật nhân viên thành công!');
      setOpenEditDialog(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to update employee:', err);
      alert(err.response?.data || 'Cập nhật thất bại');
    }
  };

  const handleAddEmployee = async () => {
    if (!addData.fullName.trim() || !addData.email.trim() || !addData.phoneNumber.trim() ||
      !addData.username.trim() || !addData.position.trim() || !addData.salary ||
      !addData.hireDate || !addData.birthDate) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const payload = {
        fullName: addData.fullName,
        email: addData.email,
        phoneNumber: addData.phoneNumber,
        address: addData.address || '',
        position: addData.position,
        salary: parseFloat(addData.salary),
        hireDate: addData.hireDate,
        birthDate: addData.birthDate,
        username: addData.username,
        isActive: true
      };

      await API.post('/Employee', payload);
      alert('Thêm nhân viên thành công!');
      setOpenAddDialog(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to add employee:', err);
      alert(err.response?.data || 'Thêm nhân viên thất bại');
    }
  };

  const handlePageChange = (e, value) => {
    setPage(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý nhân viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Thêm nhân viên
        </Button>
      </Box>

      {/* Search bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Tìm kiếm theo số điện thoại..."
          value={searchPhone}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell width="80px">Avatar</TableCell>
                  <TableCell><strong>Họ tên</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>SĐT</strong></TableCell>
                  <TableCell><strong>Chức vụ</strong></TableCell>
                  <TableCell><strong>Lương</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell align="center" width="150px"><strong>Hành động</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.employeeId} hover>
                      <TableCell>
                        <Avatar
                          src={employee.imageUrl}
                          alt={employee.fullName}
                          sx={{ width: 50, height: 50 }}
                        >
                          {employee.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.fullName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{employee.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{employee.phone || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.position}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(employee.salary)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.isActive ? 'Hoạt động' : 'Khóa'}
                          color={employee.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenViewDialog(employee)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEditDialog(employee)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {employees.length} / {totalItems} nhân viên
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

      {/* Dialog thêm mới */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm nhân viên mới</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Họ tên"
              value={addData.fullName}
              onChange={(e) => setAddData({ ...addData, fullName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Username"
              value={addData.username}
              onChange={(e) => setAddData({ ...addData, username: e.target.value })}
              required
              helperText="Username sẽ là mật khẩu mặc định"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={addData.email}
              onChange={(e) => setAddData({ ...addData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại"
              value={addData.phoneNumber}
              onChange={(e) => setAddData({ ...addData, phoneNumber: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Ngày sinh"
              type="date"
              value={addData.birthDate}
              onChange={(e) => setAddData({ ...addData, birthDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Địa chỉ"
              multiline
              rows={2}
              value={addData.address}
              onChange={(e) => setAddData({ ...addData, address: e.target.value })}
            />
            <TextField
              fullWidth
              label="Chức vụ"
              value={addData.position}
              onChange={(e) => setAddData({ ...addData, position: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Lương"
              type="number"
              value={addData.salary}
              onChange={(e) => setAddData({ ...addData, salary: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Ngày vào làm"
              type="date"
              value={addData.hireDate}
              onChange={(e) => setAddData({ ...addData, hireDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAddEmployee}>
            Thêm mới
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
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
              rows={2}
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
            <TextField
              fullWidth
              label="Chức vụ"
              value={editData.position}
              onChange={(e) => setEditData({ ...editData, position: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Lương"
              type="number"
              value={editData.salary}
              onChange={(e) => setEditData({ ...editData, salary: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Ngày vào làm"
              type="date"
              value={editData.hireDate}
              onChange={(e) => setEditData({ ...editData, hireDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleUpdateEmployee}>
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
        <DialogTitle>Chi tiết nhân viên</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  src={selectedEmployee.imageUrl}
                  alt={selectedEmployee.fullName}
                  sx={{ width: 80, height: 80 }}
                >
                  {selectedEmployee.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedEmployee.fullName}
                  </Typography>
                  <Chip
                    label={selectedEmployee.isActive ? 'Hoạt động' : 'Khóa'}
                    color={selectedEmployee.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedEmployee.email}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedEmployee.phone || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Địa chỉ
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedEmployee.address || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Chức vụ
                  </Typography>
                  <Chip
                    label={selectedEmployee.position}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Lương
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    {formatCurrency(selectedEmployee.salary)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày sinh
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(selectedEmployee.birthDate)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày vào làm
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(selectedEmployee.hireDate)}
                  </Typography>
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

export default EmployeeList;
