// src/components/Layout.js
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Container } from '@mui/material';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <Container maxWidth="100vh" className={styles.content}>
        {children}
      </Container>
      <Footer />
    </div>
  );
};

export default Layout;