import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Tooltip, Pagination, Stack,
  TextField, InputAdornment, Typography, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Avatar, Grid, Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PrintIcon from '@mui/icons-material/Print';
import logo from '../../../images/logo.png';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [printOrder, setPrintOrder] = useState(null);

  // Định nghĩa các trạng thái và màu sắc
  const statusConfig = {
    'Pending': { label: 'Chờ xác nhận', color: 'warning' },
    'Processing': { label: 'Đang xử lý', color: 'info' },
    'Shipping': { label: 'Đang giao', color: 'primary' },
    'Delivered': { label: 'Đã giao', color: 'success' },
    'Cancelled': { label: 'Đã hủy', color: 'error' }
  };

  // Danh sách trạng thái có thể chuyển đổi
  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'Pending': ['Processing'],
      'Processing': ['Shipping'],
      'Shipping': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        let apiUrl = statusFilter
          ? `/Order/filter?status=${statusFilter}&pageNumber=${page}&pageSize=${pageSize}`
          : `/Order/getAll?pageNumber=${page}&pageSize=${pageSize}`;

        const res = await API.get(apiUrl);
        console.log('Orders response:', res.data);

        if (res.data) {
          setOrders(res.data.data || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalRecords(res.data.totalRecords || 0);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
        alert('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, statusFilter, refreshKey, pageSize]);

  const handleViewDetail = async (orderCode) => {
    try {
      const res = await API.get(`/Order/getByOrderCode/${orderCode}`);
      console.log('Order detail response:', res.data);
      console.log('discountByVoucher:', res.data.discountByVoucher);
      console.log('discountByPoint:', res.data.discountByPoint);
      setSelectedOrder(res.data);
      setOpenDetailDialog(true);
    } catch (err) {
      console.error('Failed to load order details:', err);
      alert('Không thể tải chi tiết đơn hàng');
    }
  };

  const handlePrintInvoice = async (orderCode) => {
    try {
      const res = await API.get(`/Order/getByOrderCode/${orderCode}`);
      setPrintOrder(res.data);
      // Đợi một chút để state update xong rồi mới in
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (err) {
      console.error('Failed to load order for printing:', err);
      alert('Không thể tải thông tin đơn hàng để in');
    }
  };

  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    const nextStatuses = getNextStatuses(order.status);
    if (nextStatuses.length > 0) {
      setNewStatus(nextStatuses[0]);
      setOpenStatusDialog(true);
    } else {
      alert('Đơn hàng này không thể thay đổi trạng thái');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await API.put(`/Order/update-status/${selectedOrder.orderCode}`, JSON.stringify(newStatus), {
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Cập nhật trạng thái thành công!');
      setOpenStatusDialog(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || err.response?.data || 'Cập nhật thất bại');
    }
  };

  const handleCancelOrder = async (orderCode) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
      await API.post(`/Order/CancelOrder?OrderCode=${orderCode}`);
      alert('Hủy đơn hàng thành công!');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert(err.response?.data || 'Hủy đơn hàng thất bại');
    }
  };

  const handleRefund = async (orderCode) => {
    if (!window.confirm('Bạn có chắc muốn hoàn tiền cho đơn hàng này?')) return;

    try {
      await API.put(`/Order/Refund?OrderCode=${orderCode}`);
      alert('Hoàn tiền thành công!');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to refund:', err);
      alert(err.response?.data || 'Hoàn tiền thất bại');
    }
  };

  const handlePageChange = (e, value) => {
    setPage(value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1); // Reset về trang 1 khi filter
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderCode?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.phoneNumber?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Toolbar: Search và Filter */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Tìm kiếm theo mã đơn, tên khách hàng, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Lọc theo trạng thái</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="Lọc theo trạng thái"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" />
              </InputAdornment>
            }
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="Pending">Chờ xác nhận</MenuItem>
            <MenuItem value="Processing">Đang xử lý</MenuItem>
            <MenuItem value="Shipping">Đang giao</MenuItem>
            <MenuItem value="Delivered">Đã giao</MenuItem>
            <MenuItem value="Cancelled">Đã hủy</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary">
          Tổng: {totalRecords} đơn hàng
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã đơn</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ngày đặt</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>SĐT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tổng tiền</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thanh toán</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.orderCode} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {order.orderCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.orderDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.phoneNumber}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                        {(order.discountByVoucher > 0 || order.discountByPoint > 0) && (
                          <Typography variant="caption" color="success.main">
                            {order.discountByVoucher > 0 && `Voucher: -${formatCurrency(order.discountByVoucher)}`}
                            {order.discountByVoucher > 0 && order.discountByPoint > 0 && ' | '}
                            {order.discountByPoint > 0 && `Điểm: -${formatCurrency(order.discountByPoint)}`}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusConfig[order.status]?.label || order.status}
                        color={statusConfig[order.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="column" spacing={0.5}>
                        <Chip
                          label={order.paymentMethod}
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          label={order.paymentStatus === 'Paid' ? 'Đã thanh toán' :
                            order.paymentStatus === 'UnPaid' ? 'Chưa thanh toán' :
                              order.paymentStatus === 'Pending' ? 'Chờ thanh toán' :
                                order.paymentStatus === 'Refunded' ? 'Đã hoàn tiền' : order.paymentStatus}
                          color={order.paymentStatus === 'Paid' ? 'success' :
                            order.paymentStatus === 'Pending' ? 'warning' :
                              order.paymentStatus === 'Refunded' ? 'info' : 'default'}
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleViewDetail(order.orderCode)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="In hóa đơn">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handlePrintInvoice(order.orderCode)}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <Tooltip title="Cập nhật trạng thái">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenStatusDialog(order)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status === 'Pending' && (
                          <Tooltip title="Hủy đơn">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleCancelOrder(order.orderCode)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status === 'Cancelled' && order.paymentStatus === 'Paid' && (
                          <Tooltip title="Hoàn tiền">
                            <IconButton
                              color="secondary"
                              size="small"
                              onClick={() => handleRefund(order.orderCode)}
                            >
                              <MonetizationOnIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Không tìm thấy đơn hàng nào
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

      {/* Dialog xem chi tiết đơn hàng */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết đơn hàng: {selectedOrder?.orderCode}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Khách hàng</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedOrder.customerName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Số điện thoại</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedOrder.phoneNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Ngày đặt hàng</Typography>
                  <Typography variant="body1">{formatDate(selectedOrder.orderDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  <Chip
                    label={statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                    color={statusConfig[selectedOrder.status]?.color || 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Địa chỉ giao hàng</Typography>
                  <Typography variant="body1">{selectedOrder.shippingAddress}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phương thức thanh toán</Typography>
                  <Chip
                    label={selectedOrder.paymentMethod}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Trạng thái thanh toán</Typography>
                  <Chip
                    label={selectedOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' :
                      selectedOrder.paymentStatus === 'Pending' ? 'Chờ thanh toán' :
                        selectedOrder.paymentStatus === 'Refunded' ? 'Đã hoàn tiền' : selectedOrder.paymentStatus}
                    color={selectedOrder.paymentStatus === 'Paid' ? 'success' :
                      selectedOrder.paymentStatus === 'Pending' ? 'warning' :
                        selectedOrder.paymentStatus === 'Refunded' ? 'info' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                {selectedOrder.discountByVoucher > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Giảm giá Voucher</Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      - {formatCurrency(selectedOrder.discountByVoucher)}
                    </Typography>
                  </Grid>
                )}
                {selectedOrder.discountByPoint > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Giảm giá điểm tích lũy</Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      - {formatCurrency(selectedOrder.discountByPoint)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Sản phẩm</Typography>
              {selectedOrder.orderDetails?.map((item) => (
                <Box
                  key={item.orderDetailId}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 2,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}
                >
                  <Avatar
                    src={item.productImage}
                    alt={item.productName}
                    variant="rounded"
                    sx={{ width: 60, height: 60 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {item.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Số lượng: {item.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đơn giá: {formatCurrency(item.price)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Tính toán và hiển thị chi tiết thanh toán */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1
              }}>
                {/* Tạm tính */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Tạm tính:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(
                      selectedOrder.orderDetails?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
                    )}
                  </Typography>
                </Box>

                {/* Giảm giá voucher - LUÔN HIỂN THỊ */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color={selectedOrder.discountByVoucher > 0 ? "success.main" : "text.secondary"}>
                    Giảm giá Voucher:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color={selectedOrder.discountByVoucher > 0 ? "success.main" : "text.secondary"}>
                    {selectedOrder.discountByVoucher > 0 ? '- ' : ''}{formatCurrency(selectedOrder.discountByVoucher || 0)}
                  </Typography>
                </Box>

                {/* Giảm giá điểm - LUÔN HIỂN THỊ */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color={selectedOrder.discountByPoint > 0 ? "success.main" : "text.secondary"}>
                    Giảm giá điểm tích lũy:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color={selectedOrder.discountByPoint > 0 ? "success.main" : "text.secondary"}>
                    {selectedOrder.discountByPoint > 0 ? '- ' : ''}{formatCurrency(selectedOrder.discountByPoint || 0)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Tổng cộng */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Tổng cộng:</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedOrder?.status === 'Cancelled' && selectedOrder?.paymentStatus === 'Paid' && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                setOpenDetailDialog(false);
                handleRefund(selectedOrder.orderCode);
              }}
            >
              Hoàn tiền
            </Button>
          )}
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog cập nhật trạng thái */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Mã đơn hàng: <strong>{selectedOrder.orderCode}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Trạng thái hiện tại:
                <Chip
                  label={statusConfig[selectedOrder.status]?.label}
                  color={statusConfig[selectedOrder.status]?.color}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Trạng thái mới</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="Trạng thái mới"
                >
                  {getNextStatuses(selectedOrder.status).map((status) => (
                    <MenuItem key={status} value={status}>
                      {statusConfig[status]?.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleUpdateStatus}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template in hóa đơn nhỏ - chỉ hiện khi in */}
      {/* 
        HƯỚNG DẪN IN:
        1. Nhấn Ctrl+P để mở hộp thoại in
        2. Ở mục "Khổ giấy": Chọn dropdown, kéo xuống chọn "Thêm kích thước tùy chỉnh" hoặc "More settings"
        3. Nhập: Width = 80mm, Height = 297mm (hoặc để Auto)
        4. Lề: Chọn "Mặc định" hoặc "Minimum"
        5. Tỷ lệ: Để 100%
        6. Nhấn "In" hoặc "Save as PDF" để xem trước
      */}
      {printOrder && (
        <Box className="print-only" sx={{ display: 'none' }}>
          <Box sx={{ width: '80mm', margin: '0 auto', p: 1.5, fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
            {/* Logo và header */}
            <Box sx={{ textAlign: 'center', mb: 1.5 }}>
              <img src={logo} alt="Logo" style={{ width: '100px', objectFit: 'contain' }} />
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', mt: 0.5 }}>
                CỬA HÀNG ĐIỆN TỬ
              </Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                HÓA ĐƠN BÁN HÀNG
              </Typography>
            </Box>

            {/* Thông tin đơn hàng */}
            <Box sx={{ mb: 1, borderBottom: '1px dashed #000', pb: 1 }}>
              <Typography sx={{ fontSize: '12px' }}>Mã đơn: {printOrder.orderCode}</Typography>
              <Typography sx={{ fontSize: '12px' }}>Ngày: {formatDate(printOrder.orderDate)}</Typography>
              <Typography sx={{ fontSize: '12px' }}>KH: {printOrder.customerName}</Typography>
              <Typography sx={{ fontSize: '12px' }}>SĐT: {printOrder.phoneNumber}</Typography>
            </Box>

            {/* Chi tiết sản phẩm - table đơn giản */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000', pb: 0.5, mb: 0.5 }}>
                <Box sx={{ flex: '2' }}>Sản phẩm</Box>
                <Box sx={{ width: '40px', textAlign: 'center' }}>SL</Box>
                <Box sx={{ width: '80px', textAlign: 'right' }}>Giá</Box>
              </Box>
              {printOrder.orderDetails?.map((item, index) => (
                <Box key={index} sx={{ mb: 0.8 }}>
                  <Box sx={{ display: 'flex', fontSize: '12px' }}>
                    <Box sx={{ flex: '2' }}>{item.productName}</Box>
                    <Box sx={{ width: '40px', textAlign: 'center' }}>{item.quantity}</Box>
                    <Box sx={{ width: '80px', textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Tổng tiền */}
            <Box sx={{ borderTop: '1px dashed #000', pt: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', mb: 0.4 }}>
                <span>Tạm tính:</span>
                <span>{formatCurrency(printOrder.orderDetails?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', mb: 0.4 }}>
                <span>Giảm giá (Voucher):</span>
                <span>{printOrder.discountByVoucher > 0 ? '-' : ''}{formatCurrency(printOrder.discountByVoucher || 0)}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', mb: 0.4 }}>
                <span>Giảm giá (Điểm):</span>
                <span>{printOrder.discountByPoint > 0 ? '-' : ''}{formatCurrency(printOrder.discountByPoint || 0)}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderTop: '1px solid #000', pt: 0.5, mt: 0.5 }}>
                <span>Tổng cộng:</span>
                <span>{formatCurrency(printOrder.totalAmount)}</span>
              </Box>
            </Box>

            {/* Thanh toán */}
            <Box sx={{ mb: 1, fontSize: '12px', borderBottom: '1px dashed #000', pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <span>Thanh toán:</span>
                <span>{printOrder.paymentMethod}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Trạng thái:</span>
                <span>{printOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
              </Box>
            </Box>

            {printOrder.note && (
              <Box sx={{ mb: 1, fontSize: '11px', fontStyle: 'italic' }}>
                Ghi chú: {printOrder.note}
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 1.5, fontSize: '12px' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>
                Cảm ơn quý khách!
              </Typography>
              <Typography sx={{ fontSize: '11px', mt: 0.5 }}>
                Hotline: 1800 1062
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-only, .print-only * {
              visibility: visible;
            }
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              display: block !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default OrderList;
