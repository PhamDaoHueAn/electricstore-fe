import React from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../../services/auth';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
});

const ForgotPassword = () => {
  return (
    <Container maxWidth="sm">
      <Typography variant="h4">Forgot Password</Typography>
      <Formik
        initialValues={{ email: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            await forgotPassword(values.email);
            setStatus('A new password has been sent to your email.');
          } catch (err) {
            setStatus(err.response?.data || 'Request failed');
          }
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form>
            <Field as={TextField} name="email" label="Email" fullWidth error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
            {status && <Typography color={status.includes('sent') ? 'primary' : 'error'}>{status}</Typography>}
            <Button type="submit" disabled={isSubmitting}>Send Reset Email</Button>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default ForgotPassword;