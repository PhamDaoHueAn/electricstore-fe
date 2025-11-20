import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Autocomplete,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  Info as InfoIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import AdminLayout from '../AdminLayout';
import API from '../../../services/api';

const ImportManagement = () => {
  const [imports, setImports] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form data
  const [formData, setFormData] = useState({
    supplierID: '',
    note: '',
    importDetails: []
  });

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [importsRes, suppliersRes] = await Promise.all([
        API.get('/Import/getall'),
        API.get('/Supplier/GetAll')
      ]);
      setImports(importsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsBySupplier = async (supplierId) => {
    try {
      const response = await API.get('/Products/GetAll', {
        params: { pageSize: 1000 }
      });
      const filteredProducts = response.data.data.filter(
        p => p.supplierId === supplierId
      );
      setProducts(filteredProducts);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm');
      console.error(err);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      supplierID: '',
      note: '',
      importDetails: []
    });
    setProducts([]);
    setSelectedProduct(null);
    setQuantity(1);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSupplierChange = (supplierId) => {
    setFormData({ ...formData, supplierID: supplierId, importDetails: [] });
    if (supplierId) {
      fetchProductsBySupplier(supplierId);
    } else {
      setProducts([]);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      setError('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ');
      return;
    }

    const existingIndex = formData.importDetails.findIndex(
      d => d.productID === selectedProduct.productId
    );

    if (existingIndex >= 0) {
      const updated = [...formData.importDetails];
      updated[existingIndex].quantity += quantity;
      setFormData({ ...formData, importDetails: updated });
    } else {
      setFormData({
        ...formData,
        importDetails: [
          ...formData.importDetails,
          {
            productID: selectedProduct.productId,
            productName: selectedProduct.productName,
            costPrice: selectedProduct.costPrice,
            quantity: quantity
          }
        ]
      });
    }

    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveProduct = (index) => {
    const updated = formData.importDetails.filter((_, i) => i !== index);
    setFormData({ ...formData, importDetails: updated });
  };

  const handleSubmit = async () => {
    if (!formData.supplierID || formData.importDetails.length === 0) {
      setError('Vui lòng chọn nhà cung cấp và thêm ít nhất 1 sản phẩm');
      return;
    }

    try {
      const submitData = {
        supplierID: formData.supplierID,
        note: formData.note,
        importDetails: formData.importDetails.map(d => ({
          productID: d.productID,
          quantity: d.quantity
        }))
      };

      await API.post('/Import/create', submitData);
      setSuccess('Tạo đơn nhập hàng thành công');
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.response?.data || 'Không thể tạo đơn nhập hàng');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (importId, status) => {
    try {
      const formDataStatus = new FormData();
      formDataStatus.append('importId', importId);
      formDataStatus.append('status', status);

      await API.put('/Import/update-status', formDataStatus, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(`Cập nhật trạng thái thành ${status === 'Delivered' ? 'Đã nhận' : 'Đã hủy'} thành công`);
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data || 'Không thể cập nhật trạng thái');
    }
  };

  const handleUpdatePaymentStatus = async (importId) => {
    try {
      await API.put(`/Import/update-payment?importId=${importId}`);
      setSuccess('Cập nhật trạng thái thanh toán thành công');
      fetchData();
    } catch (err) {
      setError('Không thể cập nhật trạng thái thanh toán');
      console.error(err);
    }
  };

  const handleViewDetail = (importItem) => {
    setSelectedImport(importItem);
    setOpenDetailDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Đang chờ';
      case 'Delivered': return 'Đã nhận';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'UnPaid': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'Paid': return 'Đã thanh toán';
      case 'UnPaid': return 'Chưa thanh toán';
      default: return status;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedImports = imports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Đang tải...</Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  Quản Lý Nhập Hàng
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ fontWeight: 600 }}
              >
                Tạo Đơn Nhập Hàng
              </Button>
            </Box>
          </CardContent>
        </Card>

        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã Nhập</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nhà Cung Cấp</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nhân Viên</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày Nhập</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Tổng Tiền</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Trạng Thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Thanh Toán</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Thao Tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedImports.map((item) => (
                <TableRow key={item.importId} hover>
                  <TableCell>{item.importCode}</TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell>{item.employeeName}</TableCell>
                  <TableCell>{new Date(item.importDate).toLocaleString('vi-VN')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                    {item.totalAmount.toLocaleString('vi-VN')}₫
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getPaymentStatusLabel(item.paymentStatus)}
                      color={getPaymentStatusColor(item.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewDetail(item)}
                      >
                        <InfoIcon />
                      </IconButton>
                      {item.status === 'Delivered' && item.paymentStatus === 'UnPaid' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleUpdatePaymentStatus(item.importId)}
                          title="Đánh dấu đã thanh toán"
                        >
                          <PaymentIcon />
                        </IconButton>
                      )}
                      {item.status === 'Pending' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleUpdateStatus(item.importId, 'Delivered')}
                            title="Đã nhận hàng"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleUpdateStatus(item.importId, 'Cancelled')}
                            title="Hủy đơn"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={imports.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
          />
        </TableContainer>

        {/* Dialog Tạo Đơn Nhập */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tạo Đơn Nhập Hàng
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Nhà Cung Cấp</InputLabel>
                <Select
                  value={formData.supplierID}
                  label="Nhà Cung Cấp"
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.supplierName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.supplierID && (
                <Card sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Thêm Sản Phẩm
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        value={selectedProduct}
                        onChange={(event, newValue) => setSelectedProduct(newValue)}
                        options={products}
                        getOptionLabel={(option) => `${option.productName} - ${option.costPrice.toLocaleString('vi-VN')}₫`}
                        renderInput={(params) => (
                          <TextField {...params} label="Chọn Sản Phẩm" fullWidth sx={{ minWidth: 350 }} />
                        )}
                        ListboxProps={{
                          style: {
                            maxHeight: 250,
                            overflowY: 'auto',
                            wordBreak: 'break-word',
                            minWidth: 350
                          }
                        }}
                        PaperComponent={(props) => (
                          <Paper {...props} style={{ minWidth: 350, ...props.style }} />
                        )}
                        sx={{ minWidth: 350 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Số Lượng"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddProduct}
                        sx={{ height: 56 }}
                      >
                        Thêm
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              )}

              {formData.importDetails.length > 0 && (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Số Lượng</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Giá Nhập</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Thành Tiền</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.importDetails.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.productName}</TableCell>
                          <TableCell align="center">{detail.quantity}</TableCell>
                          <TableCell align="right">{detail.costPrice.toLocaleString('vi-VN')}₫</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {(detail.quantity * detail.costPrice).toLocaleString('vi-VN')}₫
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveProduct(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                          Tổng Cộng:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: 18, color: '#d32f2f' }}>
                          {formData.importDetails.reduce((sum, d) => sum + d.quantity * d.costPrice, 0).toLocaleString('vi-VN')}₫
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi Chú"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} variant="outlined">
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.supplierID || formData.importDetails.length === 0}
            >
              Tạo Đơn
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Chi Tiết */}
        <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Chi Tiết Đơn Nhập Hàng
          </DialogTitle>
          <DialogContent>
            {selectedImport && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography><strong>Mã Nhập:</strong> {selectedImport.importCode}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Trạng Thái:</strong>{' '}
                      <Chip
                        label={getStatusLabel(selectedImport.status)}
                        color={getStatusColor(selectedImport.status)}
                        size="small"
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Thanh Toán:</strong>{' '}
                      <Chip
                        label={getPaymentStatusLabel(selectedImport.paymentStatus)}
                        color={getPaymentStatusColor(selectedImport.paymentStatus)}
                        size="small"
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Nhà Cung Cấp:</strong> {selectedImport.supplierName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Nhân Viên:</strong> {selectedImport.employeeName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Ngày Nhập:</strong> {new Date(selectedImport.importDate).toLocaleString('vi-VN')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Tổng Tiền:</strong>{' '}
                      <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                        {selectedImport.totalAmount.toLocaleString('vi-VN')}₫
                      </span>
                    </Typography>
                  </Grid>
                  {selectedImport.note && (
                    <Grid item xs={12}>
                      <Typography><strong>Ghi Chú:</strong> {selectedImport.note}</Typography>
                    </Grid>
                  )}
                </Grid>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Chi Tiết Sản Phẩm
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mã SP</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Số Lượng</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Giá Nhập</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Thành Tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedImport.importDetails.map((detail) => (
                        <TableRow key={detail.importDetailId}>
                          <TableCell>{detail.productId}</TableCell>
                          <TableCell align="center">{detail.quantity}</TableCell>
                          <TableCell align="right">{detail.costPrice.toLocaleString('vi-VN')}₫</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {detail.totalPrice.toLocaleString('vi-VN')}₫
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailDialog(false)} variant="contained">
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar thông báo */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default ImportManagement;
