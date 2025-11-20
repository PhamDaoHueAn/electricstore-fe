import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import AdminLayout from '../AdminLayout';
import API from '../../../services/api';
import logo from '../../../images/logo.png';

const StatisticsReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [statistics, setStatistics] = useState(null);
  const [imports, setImports] = useState([]); // Phíếu nhập theo thời gian
  const [allImports, setAllImports] = useState([]); // Tất cả phiếu nhập (để tính công nợ)
  const [orders, setOrders] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    let statsUrl = '';
    let importFilter = {};
    let orderFilter = {};

    if (reportType === 'day') {
      statsUrl = `/statistics/by-day?date=${selectedDate}`;
      importFilter = { date: selectedDate };
      orderFilter = { date: selectedDate };
    } else if (reportType === 'month') {
      statsUrl = `/statistics/by-month?month=${selectedMonth}&year=${selectedYear}`;
      importFilter = { month: selectedMonth, year: selectedYear };
      orderFilter = { month: selectedMonth, year: selectedYear };
    } else if (reportType === 'year') {
      statsUrl = `/statistics/by-year?year=${selectedYear}`;
      importFilter = { year: selectedYear };
      orderFilter = { year: selectedYear };
    }

    try {
      // Fetch statistics
      const statsResponse = await API.get(statsUrl);
      setStatistics(statsResponse.data);

      // Fetch all imports
      const allImportsResponse = await API.get('/import/getall');
      setAllImports(allImportsResponse.data || []);
      const filteredImports = filterDataByPeriod(allImportsResponse.data || [], 'importDate', importFilter);
      setImports(filteredImports);

      // Fetch orders
      const ordersResponse = await API.get('/order/getall');
      const filteredOrders = filterDataByPeriod(ordersResponse.data || [], 'orderDate', orderFilter);
      setOrders(filteredOrders);

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [reportType, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterDataByPeriod = (data, dateField, filter) => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      if (filter.date) {
        const compareDate = new Date(filter.date);
        return itemDate.toDateString() === compareDate.toDateString();
      } else if (filter.month && filter.year) {
        return itemDate.getMonth() + 1 === filter.month && itemDate.getFullYear() === filter.year;
      } else if (filter.year) {
        return itemDate.getFullYear() === filter.year;
      }
      return true;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUnpaidImports = () => {
    // Tính công nợ từ TẤT CẢ phiếu nhập chưa thanh toán, không phân biệt thời gian
    return allImports.filter(imp => imp.paymentStatus === 'UnPaid' && imp.status === 'Delivered');
  };

  const getTotalDebt = () => {
    return getUnpaidImports().reduce((sum, imp) => sum + (imp.totalAmount || 0), 0);
  };

  const getPeriodLabel = () => {
    if (reportType === 'day') return `Ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`;
    if (reportType === 'month') return `Tháng ${selectedMonth}/${selectedYear}`;
    return `Năm ${selectedYear}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header - Ẩn khi in */}
        <Box className="no-print" sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon fontSize="large" />
            Báo Cáo Thống Kê Doanh Thu & Công Nợ
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Filter Controls */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Loại báo cáo</InputLabel>
                    <Select
                      value={reportType}
                      label="Loại báo cáo"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <MenuItem value="day">Theo ngày</MenuItem>
                      <MenuItem value="month">Theo tháng</MenuItem>
                      <MenuItem value="year">Theo năm</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {reportType === 'day' && (
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Chọn ngày"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}

                {reportType === 'month' && (
                  <>
                    <Grid item xs={12} sm={2}>
                      <FormControl fullWidth>
                        <InputLabel>Tháng</InputLabel>
                        <Select
                          value={selectedMonth}
                          label="Tháng"
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          {[...Array(12)].map((_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>
                              Tháng {i + 1}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Năm"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      />
                    </Grid>
                  </>
                )}

                {reportType === 'year' && (
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Năm"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    />
                  </Grid>
                )}

                <Grid item xs={12} sm={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    fullWidth
                  >
                    In báo cáo
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Print Header - Chỉ hiện khi in */}
        <Box className="print-only" sx={{ display: 'none', position: 'relative', mb: 3, pt: 12 }}>
          <img src={logo} alt="Logo" style={{
            width: '200px',
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            left: 0,
            margin: 0,
            padding: 0
          }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              CỬA HÀNG ĐIỆN TỬ
            </Typography>
            <Typography variant="h5" sx={{ mb: 2 }}>
              BÁO CÁO THỐNG KÊ DOANH THU & CÔNG NỢ
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {getPeriodLabel()}
            </Typography>
            <Typography variant="body2">
              Ngày in: {new Date().toLocaleDateString('vi-VN')} - {new Date().toLocaleTimeString('vi-VN')}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
        </Box>

        {/* Statistics Summary */}
        {statistics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Tổng Doanh Thu
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                        {formatCurrency(statistics.totalRevenue)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Tổng Chi Phí
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                        {formatCurrency(statistics.totalExpense)}
                      </Typography>
                    </Box>
                    <TrendingDownIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Lợi Nhuận
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                        {formatCurrency(statistics.profit)}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Công Nợ
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                        {formatCurrency(getTotalDebt())}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Orders Table */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon />
              Chi Tiết Đơn Hàng ({orders.length} đơn)
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã ĐH</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày đặt</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tổng tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Không có đơn hàng trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell>{order.orderCode}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{order.customerName || 'Khách vãng lai'}</TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: order.status === 'Delivered' ? '#4caf50' : '#ff9800',
                            color: 'white'
                          }}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {orders.length > 0 && (
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                        Tổng cộng:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Imports Table */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDownIcon />
              Chi Tiết Nhập Hàng ({imports.length} phiếu)
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'error.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày nhập</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nhà cung cấp</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Thanh toán</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tổng tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {imports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Không có phiếu nhập trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    imports.map((imp) => (
                      <TableRow key={imp.importId}>
                        <TableCell>{imp.importCode}</TableCell>
                        <TableCell>{formatDate(imp.importDate)}</TableCell>
                        <TableCell>{imp.supplierName}</TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: imp.status === 'Delivered' ? '#4caf50' :
                              imp.status === 'Cancelled' ? '#f44336' : '#ff9800',
                            color: 'white'
                          }}>
                            {imp.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: imp.paymentStatus === 'Paid' ? '#4caf50' : '#f44336',
                            color: 'white'
                          }}>
                            {imp.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(imp.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {imports.length > 0 && (
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                        Tổng cộng:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {formatCurrency(imports.reduce((sum, i) => sum + i.totalAmount, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Debt Details */}
        {getUnpaidImports().length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                <MoneyIcon />
                Chi Tiết Công Nợ ({getUnpaidImports().length} phiếu chưa thanh toán)
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'warning.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày nhập</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nhà cung cấp</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Số tiền nợ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getUnpaidImports().map((imp) => (
                      <TableRow key={imp.importId}>
                        <TableCell>{imp.importCode}</TableCell>
                        <TableCell>{formatDate(imp.importDate)}</TableCell>
                        <TableCell>{imp.supplierName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          {formatCurrency(imp.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#fff3e0' }}>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        Tổng công nợ:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'error.main' }}>
                        {formatCurrency(getTotalDebt())}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Footer - Chỉ hiện khi in */}
        <Box className="print-only" sx={{ display: 'none', mt: 5, pt: 3, borderTop: '2px solid #ddd' }}>
          <Grid container spacing={4}>
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                NGƯỜI LẬP PHIẾU
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                (Ký và ghi rõ họ tên)
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                QUẢN LÝ
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                (Ký và ghi rõ họ tên)
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            @page {
              margin: 0.5cm;
              size: A4;
            }
            
            * {
              margin: 0;
              padding: 0;
            }
            
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Ẩn tất cả ngoại trừ nội dung báo cáo */
            body > *:not(#root) {
              display: none !important;
            }
            
            /* Ẩn sidebar, header, footer khi in */
            aside {
              display: none !important;
            }
            
            header {
              display: none !important;
            }
            
            footer {
              display: none !important;
            }
            
            nav {
              display: none !important;
            }
            
            /* Ẩn các nút toggle và menu */
            .MuiIconButton-root {
              display: none !important;
            }
            .css-1fo0jow {
            display: none !important;
        }      
            /* Main content chiếm full width */
            main {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Ẩn background màu của các card khi in */
            .MuiCard-root {
              background: white !important;
              border: 1px solid #ddd !important;
              box-shadow: none !important;
            }
            
            /* Text màu đen cho các card */
            .MuiTypography-root {
              color: black !important;
            }
            
            /* Table header màu xám nhạt thay vì màu */
            .MuiTableHead-root .MuiTableRow-root {
              background: #f5f5f5 !important;
            }
            
            .MuiTableHead-root .MuiTableCell-root {
              color: black !important;
              border: 1px solid #ddd !important;
            }
            
            /* Table cell */
            .MuiTableCell-root {
              color: black !important;
              border: 1px solid #ddd !important;
            }
            
            /* Status badges - chỉ viền, không fill màu */
            span[style*="backgroundColor"] {
              background-color: white !important;
              color: black !important;
              border: 1px solid black !important;
            }
            
            /* Icons ẩn khi in (trừ logo trong print-header) */
            .no-print .MuiSvgIcon-root {
              display: none !important;
            }
          }
        `}
      </style>
    </AdminLayout>
  );
};

export default StatisticsReport;
