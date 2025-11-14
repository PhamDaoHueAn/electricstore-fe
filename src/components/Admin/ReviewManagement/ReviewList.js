import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Tooltip, Typography, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Rating, Stack, Tabs, Tab, Avatar
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: Chưa duyệt, 1: Đã duyệt
  const [openReplyDialog, setOpenReplyDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [tabValue, refreshKey]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const isActive = tabValue === 1; // 0: false (chưa duyệt), 1: true (đã duyệt)
      const res = await API.get(`/ProductReview?isactive=${isActive}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      if (err.response?.status === 404) {
        setReviews([]);
      } else {
        alert('Không thể tải danh sách đánh giá');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenReplyDialog = (review) => {
    setSelectedReview(review);
    setReplyContent('');
    setOpenReplyDialog(true);
  };

  const handleOpenViewDialog = (review) => {
    // Data đã có sẵn reply từ GetAll rồi, không cần gọi API nữa
    setSelectedReview(review);
    setOpenViewDialog(true);
  };

  const handleReplyReview = async () => {
    if (!replyContent.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('ParentID', selectedReview.reviewId.toString());
      formData.append('Content', replyContent.trim());

      console.log('Sending reply:', {
        ParentID: selectedReview.reviewId,
        Content: replyContent.trim()
      });

      await API.post('/ProductReview/replyReview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Phản hồi đánh giá thành công!');
      setOpenReplyDialog(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to reply review:', err);
      console.error('Error details:', err.response?.data);
      alert(err.response?.data?.message || err.response?.data || 'Phản hồi thất bại');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      await API.delete(`/ProductReview?reviewId=${reviewId}`);
      alert('Xóa đánh giá thành công!');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert(err.response?.data || 'Xóa đánh giá thất bại');
    }
  };

  const handleOpenEditDialog = (review) => {
    setSelectedReview(review);
    setEditContent(review.replyReview?.content || '');
    setOpenEditDialog(true);
  };

  const handleEditReply = async () => {
    if (!editContent.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', editContent.trim());

      await API.put(`/ProductReview/${selectedReview.replyReview.reviewID}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Cập nhật phản hồi thành công!');
      setOpenEditDialog(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to update reply:', err);
      alert(err.response?.data || 'Cập nhật thất bại');
    }
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
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Quản lý đánh giá sản phẩm
      </Typography>

      {/* Tabs: Chưa duyệt / Đã duyệt */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Chưa duyệt" />
        <Tab label="Đã duyệt" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Người đánh giá</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Đánh giá</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nội dung</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày tạo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.reviewId} hover>
                  <TableCell>{review.reviewId}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ID: {review.productId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {review.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {review.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Rating value={review.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: tabValue === 1 && review.replyReview ? 1 : 0
                        }}
                      >
                        {review.content}
                      </Typography>
                      {tabValue === 1 && review.replyReview && (
                        <Box
                          sx={{
                            pl: 2,
                            borderLeft: '3px solid #2196f3',
                            bgcolor: '#e3f2fd',
                            p: 1,
                            borderRadius: 1,
                            position: 'relative'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="primary" fontWeight="bold">
                              ↳ Admin:
                            </Typography>
                            <Tooltip title="Chỉnh sửa phản hồi">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(review)}
                                sx={{ p: 0.3 }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.85rem',
                              maxWidth: 280,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {review.replyReview.content}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(review.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handleOpenViewDialog(review)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {tabValue === 0 && (
                        <>
                          <Tooltip title="Phản hồi & Duyệt">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenReplyDialog(review)}
                            >
                              <ReplyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteReview(review.reviewId)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {tabValue === 0 ? 'Không có đánh giá chưa duyệt' : 'Không có đánh giá đã duyệt'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog phản hồi đánh giá */}
      <Dialog
        open={openReplyDialog}
        onClose={() => setOpenReplyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Phản hồi đánh giá</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {selectedReview.fullName}
                </Typography>
                <Rating value={selectedReview.rating} readOnly size="small" sx={{ mb: 1 }} />
                <Typography variant="body2">
                  {selectedReview.content}
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Nội dung phản hồi"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập nội dung phản hồi của bạn..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReplyDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleReplyReview}>
            Gửi phản hồi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xem chi tiết */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết đánh giá</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ pt: 2 }}>
              {/* Thông tin người đánh giá */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedReview.fullName?.charAt(0)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedReview.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedReview.phone}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Rating value={selectedReview.rating} readOnly />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedReview.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {formatDate(selectedReview.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Phản hồi (nếu có) */}
              {selectedReview.replyReview && (
                <Box sx={{ ml: 6, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, borderLeft: '4px solid #2196f3' }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      NV
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {selectedReview.replyReview.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {selectedReview.replyReview.content}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Nếu chưa có reply và chưa duyệt thì hiện button reply */}
              {!selectedReview.replyReview && !selectedReview.isActive && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<ReplyIcon />}
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleOpenReplyDialog(selectedReview);
                    }}
                  >
                    Phản hồi & Duyệt đánh giá
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa phản hồi */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa phản hồi</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {selectedReview.fullName}
                </Typography>
                <Rating value={selectedReview.rating} readOnly size="small" sx={{ mb: 1 }} />
                <Typography variant="body2">
                  {selectedReview.content}
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Nội dung phản hồi"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Nhập nội dung phản hồi của bạn..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleEditReply}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewList;
