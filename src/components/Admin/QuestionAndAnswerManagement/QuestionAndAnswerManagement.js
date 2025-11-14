import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add, Edit, Delete, QuestionAnswer, ExpandMore } from '@mui/icons-material';
import AdminLayout from '../AdminLayout';
import API from '../../../services/api';

function QuestionAndAnswerManagement() {
  const [qnas, setQnas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQna, setEditingQna] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });

  useEffect(() => {
    fetchQnas();
  }, []);

  const fetchQnas = async () => {
    try {
      const response = await API.get('/QuestionAndAnswer/GetAll');
      setQnas(response.data);
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

  const handleOpenDialog = (qna = null) => {
    if (qna) {
      setEditingQna(qna);
      setFormData({
        question: qna.question || '',
        answer: qna.answer || ''
      });
    } else {
      setEditingQna(null);
      setFormData({
        question: '',
        answer: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQna(null);
    setFormData({
      question: '',
      answer: ''
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        Question: formData.question.trim(),
        Answer: formData.answer.trim()
      };

      if (editingQna) {
        await API.put(`/QuestionAndAnswer/${editingQna.id}`, submitData);
        setSuccess('Cập nhật câu hỏi thành công!');
      } else {
        await API.post('/QuestionAndAnswer', submitData);
        setSuccess('Thêm câu hỏi thành công!');
      }

      handleCloseDialog();
      fetchQnas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa câu hỏi này?')) return;
    try {
      await API.delete(`/QuestionAndAnswer/${id}`);
      setSuccess('Xóa câu hỏi thành công!');
      fetchQnas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || 'Không thể xóa câu hỏi';
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
          <Typography variant="h4">Quản lý Hỏi & Đáp</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Thêm câu hỏi
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <Box sx={{ mb: 2 }}>
          {qnas.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có câu hỏi nào
              </Typography>
            </Paper>
          ) : (
            qnas.map((qna) => (
              <Accordion key={qna.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <QuestionAnswer color="primary" />
                    <Typography variant="body1" fontWeight="medium" sx={{ flexGrow: 1 }}>
                      {qna.question}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(qna)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(qna.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    <strong>Trả lời:</strong> {qna.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      </Box>

      {/* Dialog thêm/sửa câu hỏi */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQna ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Câu hỏi"
              fullWidth
              required
              multiline
              rows={2}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Nhập câu hỏi..."
            />
            <TextField
              label="Trả lời"
              fullWidth
              required
              multiline
              rows={5}
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Nhập câu trả lời..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.question || !formData.answer}
          >
            {editingQna ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

export default QuestionAndAnswerManagement;