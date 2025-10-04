import React from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { changePassword } from '../../services/auth';

const validationSchema = Yup.object({
  oldPassword: Yup.string().required('Required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain lowercase letter')
    .matches(/[A-Z]/, 'Must contain uppercase letter')
    .matches(/[0-9]/, 'Must contain number')
    .required('Required'),
});

const ChangePassword = () => {
  return (
    <Container maxWidth="sm">
      <Typography variant="h4">Change Password</Typography>
      <Formik
        initialValues={{ oldPassword: '', newPassword: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            await changePassword(values);
            setStatus('Password changed successfully');
          } catch (err) {
            setStatus(err.response?.data || 'Change failed');
          }
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form>
            <Field as={TextField} name="oldPassword" label="Old Password" type="password" fullWidth error={touched.oldPassword && !!errors.oldPassword} helperText={touched.oldPassword && errors.oldPassword} />
            <Field as={TextField} name="newPassword" label="New Password" type="password" fullWidth error={touched.newPassword && !!errors.newPassword} helperText={touched.newPassword && errors.newPassword} />
            {status && <Typography color={status.includes('successfully') ? 'primary' : 'error'}>{status}</Typography>}
            <Button type="submit" disabled={isSubmitting}>Change Password</Button>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default ChangePassword;