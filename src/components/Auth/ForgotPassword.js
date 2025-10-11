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
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../../services/auth';

const validationSchema = Yup.object({
  email: Yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
});

const ForgotPassword = () => {
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
          <MailOutlineIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Quên Mật Khẩu
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
            initialValues={{ email: '' }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                await forgotPassword(values.email);
                setStatus('Mật khẩu mới đã được gửi đến email của bạn.');
              } catch (err) {
                setStatus(err.response?.data || 'Yêu cầu thất bại');
              }
              setSubmitting(false);
            }}
          >
            {({ errors, touched, isSubmitting, status }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field
                  as={TextField}
                  name="email"
                  label="Email"
                  fullWidth
                  autoComplete="email"
                  autoFocus
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                {status && (
                  <Typography 
                    color={status.includes('gửi') ? 'primary' : 'error'} 
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
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Email Khôi Phục'}
                </Button>
              </Form>
            )}
          </Formik>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/login" variant="body2" sx={{ color: '#0560e7' }}>
              Quay lại đăng nhập
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;