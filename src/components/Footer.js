// src/components/Footer.js
import React from 'react';
import { Container, Grid, Typography, Box } from '@mui/material';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container maxWidth={false}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom>
                Về chúng tôi
              </Typography>
              <Typography variant="body2">
                Điện Máy Xanh - Nơi mang đến những sản phẩm điện tử chất lượng
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom>
                Liên hệ
              </Typography>
              <Typography variant="body2">
                <span>Email:</span> contact@dienmayxanh.com
              </Typography>
              <Typography variant="body2">
                <span>Hotline:</span> 1800-xxx-xxx
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom>
                Theo dõi chúng tôi
              </Typography>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink}>
                  <span>Facebook</span>
                </a>
                <a href="#" className={styles.socialLink}>
                  <span>Instagram</span>
                </a>
                <a href="#" className={styles.socialLink}>
                  <span>Twitter</span>
                </a>
              </div>
            </Grid>
          </Grid>
          <hr className={styles.divider} />
          <Typography variant="body2" className={styles.copyright}>
            &copy; 2025 Điện Máy Xanh. Tất cả quyền được bảo lưu.
          </Typography>
        </Container>
      </Container>
    </footer>
  );
};

export default Footer;