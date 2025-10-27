import React, { useEffect } from 'react';
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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { login, isAdmin, isAuthenticated } from '../../services/auth';

const validationSchema = Yup.object({
  username: Yup.string().required('Tên đăng nhập là bắt buộc'),
  password: Yup.string().required('Mật khẩu là bắt buộc'),
});

const Login = () => {
  const navigate = useNavigate();

  // Xóa token nếu chưa đăng nhập khi vào trang login
  useEffect(() => {
    if (!isAuthenticated()) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('authChange'));
    }
  }, []);

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
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đăng Nhập
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
            initialValues={{ username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              try {
                await login(values);
                if (isAdmin()) {
                  navigate('/admin/dashboard');
                } else {
                  navigate('/');
                }
              } catch (err) {
                setErrors({ submit: err.response?.data?.message || 'Đăng nhập thất bại' });
              }
              setSubmitting(false);
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field
                  as={TextField}
                  name="username"
                  label="Tên đăng nhập"
                  fullWidth
                  autoComplete="username"
                  autoFocus
                  error={touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Field
                  as={TextField}
                  name="password"
                  label="Mật khẩu"
                  type="password"
                  fullWidth
                  autoComplete="current-password"
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                {errors.submit && (
                  <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
                    {errors.submit}
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
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </Button>
              </Form>
            )}
          </Formik>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/forgot-password" variant="body2" sx={{ mr: 2, color: '#0560e7' }}>
              Quên mật khẩu?
            </Link>
            <Link href="/register" variant="body2" sx={{ color: '#0560e7' }}>
              Chưa có tài khoản? Đăng ký
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;