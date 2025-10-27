import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Avatar, CssBaseline } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import API from '../../services/api';

const validationSchema = Yup.object({
  fullName: Yup.string().required('Họ tên là bắt buộc'),
  phoneNumber: Yup.string()
    .matches(/^\d{10}$/, 'Số điện thoại phải có đúng 10 số')
    .required('Số điện thoại là bắt buộc'),
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
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');

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
        <Box
          sx={{
            mt: 3,
            p: 4,
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backgroundColor: 'white',
          }}
        >
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}
          <Formik
            initialValues={{
              fullName: '',
              phoneNumber: '',
              email: '',
              username: '',
              password: '',
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              setGeneralError('');
              setSuccess('');
              console.log('Form values:', values);
              try {
                const response = await API.post('/Auth/register', values, { timeout: 5000 });
                console.log('Register API response:', response.data);
                setSuccess('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...');
                setTimeout(() => navigate('/login'), 2000);
              } catch (err) {
                console.error('Error during registration:', err.response?.data);
                if (err.response?.data?.errors) {
                  const apiErrors = err.response.data.errors;
                  setErrors({
                    fullName: apiErrors.FullName?.[0] || '',
                    phoneNumber: apiErrors.PhoneNumber?.[0] || '',
                    email: apiErrors.Email?.[0] || '',
                    username: apiErrors.Username?.[0] || '',
                    password: apiErrors.Password?.[0] || '',
                  });
                } else {
                  setGeneralError(err.response?.data?.title || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
              }
              setSubmitting(false);
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field
                  as={TextField}
                  name="fullName"
                  label="Họ tên"
                  fullWidth
                  autoComplete="name"
                  autoFocus
                  error={touched.fullName && !!errors.fullName}
                  helperText={touched.fullName && errors.fullName}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  type="email"
                  fullWidth
                  autoComplete="email"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
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
                    '&:disabled': {
                      opacity: 0.6,
                    },
                  }}
                >
                  {isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
                </Button>
              </Form>
            )}
          </Formik>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Đã có tài khoản?{' '}
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Đăng nhập
              </a>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;