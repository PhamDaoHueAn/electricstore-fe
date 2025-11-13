import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemText, ListItemIcon, Divider, Tooltip, Typography, Avatar } from '@mui/material';
import {
  Dashboard,
  Inventory,
  People,
  Group,
  Receipt,
  Category,
  BrandingWatermark
} from '@mui/icons-material';

const AdminSidebar = ({ open = true }) => {
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', path: '/admin/dashboard', icon: <Dashboard />, color: '#ffffffff' },
    { text: 'Quản lý Sản phẩm', path: '/admin/products', icon: <Inventory />, color: '#ffffffff' },
    { text: 'Quản lý Khách hàng', path: '/admin/customers', icon: <People />, color: '#ffffffff' },
    { text: 'Quản lý Nhân viên', path: '/admin/employees', icon: <Group />, color: '#ffffffff' },
    { text: 'Quản lý đơn hàng', path: '/admin/orders', icon: <Receipt />, color: '#ffffffff' },
    { text: 'Quản lý Danh mục', path: '/admin/categories', icon: <Category />, color: '#ffffffff' },
    { text: 'Quản lý Thương hiệu', path: '/admin/brands', icon: <BrandingWatermark />, color: '#ffffffff' }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: open ? 240 : 60,
        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        height: '100vh',
        borderRight: 1,
        borderColor: 'divider',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      {open && (
        <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
            A
          </Avatar>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
            Admin Panel
          </Typography>
        </Box>
      )}

      <List sx={{ pt: open ? 2 : 6 }}>
        {menuItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <React.Fragment key={item.path}>
              {index === 1 && <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />}
              {open ? (
                <ListItem
                  component={Link}
                  to={item.path}
                  button
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 40,
                    color: active ? item.color : 'rgba(255,255,255,0.8)'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: active ? 'white' : 'rgba(255,255,255,0.8)',
                        fontWeight: active ? 'bold' : 'normal',
                        fontSize: '0.85rem'
                      }
                    }}
                  />
                  {active && (
                    <Box sx={{
                      width: 4,
                      height: 20,
                      bgcolor: item.color,
                      borderRadius: 2,
                      ml: 1
                    }} />
                  )}
                </ListItem>
              ) : (
                <Tooltip title={item.text} placement="right">
                  <ListItem
                    component={Link}
                    to={item.path}
                    button
                    sx={{
                      justifyContent: 'center',
                      px: 0,
                      mb: 0.5,
                      mx: 1,
                      borderRadius: 2,
                      bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                      border: active ? `2px solid ${item.color}` : '2px solid transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: 'auto',
                      justifyContent: 'center',
                      color: active ? item.color : 'rgba(255,255,255,0.8)'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                  </ListItem>
                </Tooltip>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default AdminSidebar;
