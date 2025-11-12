import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminSidebar open={sidebarOpen} />
      <Box component="main" sx={{ flex: 1, p: 3, pt: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleToggleSidebar}
            sx={{
              mr: 2,
              bgcolor: 'background.paper',
              boxShadow: 1,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
