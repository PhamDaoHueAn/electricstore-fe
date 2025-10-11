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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/auth';

const validationSchema = Yup.object({
  fullName: Yup.string().required('Họ tên là bắt buộc'),
  phoneNumber: Yup.string().matches(/^\d{10}$/, 'Số điện thoại không hợp lệ').required('Số điện thoại là bắt buộc'),
  email: Yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  username: Yup.string().required('Tên đăng nhập là bắt buộc'),
  password: Yup.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/[a-z]/, 'Phải chứa chữ thường')
    .matches(/[A-Z]/, 'Phải chứa chữ hoa')
    .matches(/[0-9]/, 'Phải chứa số')
    .required('Mật khẩu là bắt buộc'),
});

const Register = () => {
  const navigate = useNavigate();

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
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đăng Ký
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
            initialValues={{ fullName: '', phoneNumber: '', email: '', username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              try {
                await register(values);
                navigate('/login');
              } catch (err) {
                setErrors({ submit: err.response?.data || 'Đăng ký thất bại' });
              }
              setSubmitting(false);
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field
                  as={TextField}
                  name="fullName"
                  label="Họ tên"
                  fullWidth
                  autoComplete="name"
                  autoFocus
                  error={touched.fullName && !!errors.fullName}
                  helperText={touched.fullName && errors.fullName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Field
                  as={TextField}
                  name="phoneNumber"
                  label="Số điện thoại"
                  fullWidth
                  autoComplete="tel"
                  error={touched.phoneNumber && !!errors.phoneNumber}
                  helperText={touched.phoneNumber && errors.phoneNumber}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Field
                  as={TextField}
                  name="email"
                  label="Email"
                  fullWidth
                  autoComplete="email"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Field
                  as={TextField}
                  name="username"
                  label="Tên đăng nhập"
                  fullWidth
                  autoComplete="username"
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
                  autoComplete="new-password"
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
                  {isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
                </Button>
              </Form>
            )}
          </Formik>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/login" variant="body2" sx={{ color: '#0560e7' }}>
              Đã có tài khoản? Đăng nhập
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;