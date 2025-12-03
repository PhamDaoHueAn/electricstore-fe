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
  CssBaseline,
  Alert,
  AlertTitle
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { login, isAdminOrEmployee, isAuthenticated } from '../../services/auth';

const validationSchema = Yup.object({
  username: Yup.string().required('Tên đăng nhập là bắt buộc'),
  password: Yup.string().required('Mật khẩu là bắt buộc'),
});

const Login = () => {
  const navigate = useNavigate();
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
        <Typography component="h1" variant="h5" fontWeight="bold">
          Đăng Nhập
        </Typography>

        <Paper
          elevation={6}
          sx={{
            mt: 4,
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            bgcolor: '#ffffff',
          }}
        >
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              try {
                await login(values);
                if (isAdminOrEmployee()) {
                  navigate('/admin/profile');
                } else {
                  navigate('/');
                }
              } catch (err) {
                let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

                if (err.response) {
                  const data = err.response.data;

                  const normalize = (d) => {
                    if (!d) return null;
                    if (typeof d === 'string') return d.trim();
                    if (d?.message) return d.message;
                    if (d?.title) return d.title;
                    if (d?.detail) return d.detail;
                    if (d?.errors) return Object.values(d.errors).flat().join(', ');
                    return null;
                  };

                  const serverMsg = normalize(data);

                  if (serverMsg) {
                    if (serverMsg === 'Incorrect username or password') {
                      errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';
                    } else if (serverMsg === 'Account is deactivated') {
                      errorMessage = 'Tài khoản đã bị vô hiệu hóa';
                    } else if (serverMsg.startsWith('Internal server error')) {
                      errorMessage = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
                    } else {
                      errorMessage = serverMsg;
                    }
                  } else if (err.response.status === 401) {
                    errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';
                  }
                } else if (err.message) {
                  errorMessage = err.message;
                }

                setErrors({ submit: errorMessage });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field
                  as={TextField}
                  name="username"
                  label="Tên đăng nhập"
                  fullWidth
                  autoComplete="username"
                  autoFocus
                  error={touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8fbff',
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
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8fbff',
                    },
                  }}
                />
                {errors.submit && (
                  <Alert severity="error" sx={{ borderRadius: 2, py: 1 }}>
                    <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      Đăng nhập thất bại
                    </AlertTitle>
                    {errors.submit}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.8,
                    mt: 2,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #0560e7, #0088ff)',
                    boxShadow: '0 4px 15px rgba(5, 96, 231, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0044cc, #0066cc)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(5, 96, 231, 0.5)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </Button>
              </Form>
            )}
          </Formik>

          {/* Liên kết phụ */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Link
              href="/forgot-password"
              variant="body2"
              sx={{
                color: '#0560e7',
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Quên mật khẩu?
            </Link>
            <Typography variant="body2" sx={{ my: 2, color: '#666' }}>
              hoặc
            </Typography>
            <Link
              href="/register"
              variant="body2"
              sx={{
                color: '#0560e7',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '1.05rem',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;