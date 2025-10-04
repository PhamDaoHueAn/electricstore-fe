import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Dialog, TextField } from '@mui/material';
import API from '../../services/api';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', email: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await API.get('/customers'); // Endpoint backend
    setCustomers(res.data);
  };

  const handleCreateOrUpdate = async () => {
    if (formData.id) {
      await API.put(`/customers/${formData.id}`, formData);
    } else {
      await API.post('/customers', formData);
    }
    fetchCustomers();
    setOpen(false);
  };

  const handleDelete = async (id) => {
    await API.delete(`/customers/${id}`);
    fetchCustomers();
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setOpen(true);
  };

  return (
    <>
      <Button onClick={() => { setFormData({ id: null, name: '', email: '' }); setOpen(true); }}>Thêm Khách hàng</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.id}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>
                <Button onClick={() => handleEdit(customer)}>Sửa</Button>
                <Button onClick={() => handleDelete(customer.id)}>Xóa</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <TextField label="Tên" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        <TextField label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        <Button onClick={handleCreateOrUpdate}>Lưu</Button>
      </Dialog>
    </>
  );
};

export default CustomerManagement;