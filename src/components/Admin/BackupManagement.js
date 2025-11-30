import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import API from '../../services/api';
import AdminLayout from './AdminLayout';

const BackupManagement = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState('info');

  // Auto-hide message after a short delay
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000); // 4 seconds
    return () => clearTimeout(t);
  }, [message]);

  const startBackup = async () => {
    setLoading(true);
    setMessage(null);
    setSeverity('info');

    try {
      await API.post('/backup/start');
      setSeverity('success');
      setMessage('Sao lưu thành công - Bảng sao lưu đã được đưa lên Google Drive');
    } catch (err) {
      console.error('Backup error', err);
      setSeverity('error');
      setMessage('Đã xảy ra lỗi, xin vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 2, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>Sao lưu dữ liệu</Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant="contained" color="primary" onClick={startBackup} disabled={loading}>
            Sao lưu ngay
          </Button>
          {loading && <CircularProgress size={20} />}
        </Box>

        <Box sx={{ mt: 2 }}>
          {message && <Alert severity={severity}>{message}</Alert>}
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default BackupManagement;
