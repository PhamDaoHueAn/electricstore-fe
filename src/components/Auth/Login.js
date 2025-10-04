import React from 'react';
import { TextField, Button, Container, Typography, Link } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { login, isAdmin } from '../../services/auth';

const validationSchema = Yup.object({
  username: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
});

const Login = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Typography variant="h4">Login</Typography>
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
            setErrors({ submit: err.response?.data || 'Login failed' });
          }
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Field as={TextField} name="username" label="Username" fullWidth error={touched.username && !!errors.username} helperText={touched.username && errors.username} />
            <Field as={TextField} name="password" label="Password" type="password" fullWidth error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
            {errors.submit && <Typography color="error">{errors.submit}</Typography>}
            <Button type="submit" disabled={isSubmitting}>Login</Button>
          </Form>
        )}
      </Formik>
      <Link href="/forgot-password">Forgot Password?</Link>
      <Link href="/register">Register</Link>
    </Container>
  );
};

export default Login;