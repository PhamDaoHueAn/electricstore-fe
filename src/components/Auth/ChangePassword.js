import React from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Link, 
  Paper, 
  Avatar, 
  Box,
  CssBaseline
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { changePassword } from '../../services/auth';

const validationSchema = Yup.object({
  oldPassword: Yup.string().required('Mật khẩu cũ là bắt buộc'),
  newPassword: Yup.string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/[a-z]/, 'Phải chứa chữ thường')
    .matches(/[A-Z]/, 'Phải chứa chữ hoa')
    .matches(/[0-9]/, 'Phải chứa số')
    .required('Mật khẩu mới là bắt buộc'),
});

const ChangePassword = () => {
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <KeyIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đổi Mật Khẩu
        </Typography>
        <Paper
          elevation={3}
          sx={{
            mt: 3,
            p: 4,
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <Formik
            initialValues={{ oldPassword: '', newPassword: '' }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                await changePassword(values);
                setStatus('Mật khẩu đã được thay đổi thành công');
              } catch (err) {
                setStatus(err.response?.data || 'Thay đổi thất bại');
              }
              setSubmitting(false);
            }}
          >
            {({ errors, touched, isSubmitting, status }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field
                  as={TextField}
                  name="oldPassword"
                  label="Mật khẩu cũ"
                  type="password"
                  fullWidth
                  autoComplete="current-password"
                  autoFocus
                  error={touched.oldPassword && !!errors.oldPassword}
                  helperText={touched.oldPassword && errors.oldPassword}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Field
                  as={TextField}
                  name="newPassword"
                  label="Mật khẩu mới"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  error={touched.newPassword && !!errors.newPassword}
                  helperText={touched.newPassword && errors.newPassword}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                {status && (
                  <Typography 
                    color={status.includes('thành công') ? 'primary' : 'error'} 
                    variant="body2" 
                    sx={{ textAlign: 'center' }}
                  >
                    {status}
                  </Typography>
                )}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.5,
                    mt: 1,
                    borderRadius: 2,
                    backgroundColor: '#0560e7',
                    '&:hover': {
                      backgroundColor: '#004ba0',
                    },
                  }}
                >
                  {isSubmitting ? 'Đang thay đổi...' : 'Đổi Mật Khẩu'}
                </Button>
              </Form>
            )}
          </Formik>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/" variant="body2" sx={{ color: '#0560e7' }}>
              Quay lại trang chủ
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ChangePassword;