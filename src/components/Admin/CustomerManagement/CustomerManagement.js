import React from 'react';
import AdminLayout from '../AdminLayout';
import CustomerList from './CustomerList';

const CustomerManagement = () => {
  return (
    <AdminLayout>
      <CustomerList />
    </AdminLayout>
  );
};

export default CustomerManagement;