import React from 'react';
import AdminLayout from './AdminLayout';
import EmployeeList from './EmployeeList';

const EmployeeManagement = () => {
  return (
    <AdminLayout>
      <EmployeeList />
    </AdminLayout>
  );
};

export default EmployeeManagement;
