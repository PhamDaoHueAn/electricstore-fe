// src/components/Footer.js
import React from 'react';
import { Container, Grid, Typography, IconButton } from '@mui/material';
import { Facebook, Instagram, Twitter } from '@mui/icons-material';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container maxWidth={false}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>

            {/* ABOUT */}
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom className={styles.title}>
                Về chúng tôi
              </Typography>
              <Typography variant="body2" className={styles.text}>
                Điện Máy Xanh - Nơi mang đến những sản phẩm điện tử chất lượng
              </Typography>
            </Grid>

            {/* CONTACT */}
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom className={styles.title}>
                Liên hệ
              </Typography>
              <Typography variant="body2" className={styles.text}>
                <span>Email:</span> contact@dienmayxanh.com
              </Typography>
              <Typography variant="body2" className={styles.text}>
                <span>Hotline:</span> 1800 1060
              </Typography>
            </Grid>

            {/* SOCIAL */}
            <Grid item xs={12} md={4} className={styles.footerSection}>
              <Typography variant="h6" gutterBottom className={styles.title}>
                Theo dõi chúng tôi
              </Typography>

              <div className={styles.socialIcons}>
                <IconButton className={styles.iconBtn}>
                  <Facebook />
                </IconButton>
                <IconButton className={styles.iconBtn}>
                  <Instagram />
                </IconButton>
                <IconButton className={styles.iconBtn}>
                  <Twitter />
                </IconButton>
              </div>
            </Grid>

          </Grid>

          <hr className={styles.divider} />

          <Typography variant="body2" className={styles.copyright}>
            © 2025 Điện Máy Xanh. Tất cả quyền được bảo lưu.
          </Typography>

        </Container>
      </Container>
    </footer>
  );
};

export default Footer;
