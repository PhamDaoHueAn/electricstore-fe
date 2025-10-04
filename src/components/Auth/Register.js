import React from 'react';
import { TextField, Button, Container, Typography, Link } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/auth';

const validationSchema = Yup.object({
  fullName: Yup.string().required('Required'),
  phoneNumber: Yup.string().matches(/^\d{10}$/, 'Invalid phone number').required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  username: Yup.string().required('Required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain lowercase letter')
    .matches(/[A-Z]/, 'Must contain uppercase letter')
    .matches(/[0-9]/, 'Must contain number')
    .required('Required'),
});

const Register = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Typography variant="h4">Register</Typography>
      <Formik
        initialValues={{ fullName: '', phoneNumber: '', email: '', username: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            await register(values);
            navigate('/login');
          } catch (err) {
            setErrors({ submit: err.response?.data || 'Registration failed' });
          }
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Field as={TextField} name="fullName" label="Full Name" fullWidth error={touched.fullName && !!errors.fullName} helperText={touched.fullName && errors.fullName} />
            <Field as={TextField} name="phoneNumber" label="Phone Number" fullWidth error={touched.phoneNumber && !!errors.phoneNumber} helperText={touched.phoneNumber && errors.phoneNumber} />
            <Field as={TextField} name="email" label="Email" fullWidth error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
            <Field as={TextField} name="username" label="Username" fullWidth error={touched.username && !!errors.username} helperText={touched.username && errors.username} />
            <Field as={TextField} name="password" label="Password" type="password" fullWidth error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
            {errors.submit && <Typography color="error">{errors.submit}</Typography>}
            <Button type="submit" disabled={isSubmitting}>Register</Button>
          </Form>
        )}
      </Formik>
      <Link href="/login">Already have an account? Login</Link>
    </Container>
  );
};

export default Register;