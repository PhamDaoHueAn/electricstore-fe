import React, { useState, useEffect, useMemo } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import API from '../../services/api';
import styles from './FlashSale.module.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const FlashSale = () => {
  const [flashSaleData, setFlashSaleData] = useState({ today: [], tomorrow: [] });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const hasAnyFlashSale = (flashSaleData.today?.length > 0) || (flashSaleData.tomorrow?.length > 0);

  const isSlotActiveByNow = (slot, now = new Date()) => {
    if (!slot) return false;
    try {
      const start = new Date(`${slot.dateSale}T${slot.startTime}`);
      const end = new Date(`${slot.dateSale}T${slot.endTime}`);
      return now >= start && now <= end;
    } catch {
      return false;
    }
  };

  const activeSlot = useMemo(() => {
    const now = new Date();
    return (flashSaleData.today || []).find(s => isSlotActiveByNow(s, now));
  }, [flashSaleData.today]);

  useEffect(() => {
    fetchFlashSaleData();
  }, []);

  const timeToSeconds = (t = '00:00:00') => {
    const [h = 0, m = 0, s = 0] = t.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const sortSlots = (slots) => [...(slots || [])].sort((a, b) => timeToSeconds(a.startTime) - timeToSeconds(b.startTime));

  const fetchFlashSaleData = async () => {
    try {
      const resp = await API.get('/FlashSale/get-flashsale-today-and-tomorrow', { timeout: 8000 });
      const today = sortSlots(resp.data.today || []);
      const tomorrow = sortSlots(resp.data.tomorrow || []);
      setFlashSaleData({ today, tomorrow });

      const now = new Date();
      const active = today.find(s => isSlotActiveByNow(s, now));
      if (active) setSelectedTimeSlot(active);
      else {
        const next = today.find(s => new Date(`${s.dateSale}T${s.startTime}`) > now);
        setSelectedTimeSlot(next || today[0] || tomorrow[0]);
      }
    } catch (err) {
      console.error('Lỗi lấy Flash Sale:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSlot) {
      setCountdown('');
      return;
    }

    const tick = () => {
      const now = new Date();
      const end = new Date(`${activeSlot.dateSale}T${activeSlot.endTime}`);
      const diff = end - now;

      if (diff <= 0) {
        setCountdown('');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeSlot]);

  const formatPrice = (p) => (typeof p === 'number' ? p.toLocaleString('vi-VN') : p);
  const calculateDiscount = (o, s) => o ? Math.round(((o - s) / o) * 100) : 0;

  const renderCountdown = () => {
    if (!countdown) return null;
    const [h, m, s] = countdown.split(':');
    return (
      <div className={styles.countdown}>
        <div className={styles.timeBox}>{h}</div>
        <span className={styles.colon}>:</span>
        <div className={styles.timeBox}>{m}</div>
        <span className={styles.colon}>:</span>
        <div className={styles.timeBox}>{s}</div>
      </div>
    );
  };

  if (loading || !hasAnyFlashSale) return null;

  // CÀI ĐẶT CAROUSEL MOBILE: KHÔNG VÒNG, CHỈ LƯỚT TỚI CUỐI
  const mobileSliderSettings = {
    dots: true,
    infinite: false,           // KHÔNG LƯỢT VÒNG
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    swipeToSlide: true,
    touchThreshold: 10,
  };

  return (
    <Box className={styles.flashSaleWrapper}> {/* THÊM WRAPPER ĐỂ CÓ NỀN TRẮNG */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Box className={styles.flashSaleContainer}>
          {/* HEADER */}
          <Box className={styles.header}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Box className={styles.flashIcon}>FLASH SALE</Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' } }}>
                {selectedTimeSlot?.flashSaleName || 'SIÊU SALE GIỜ VÀNG'}
              </Typography>
            </Box>
            {activeSlot && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, color: 'white', fontWeight: 'bold' }}>
                  Kết thúc trong:
                </Typography>
                {renderCountdown()}
              </Box>
            )}
          </Box>

          {/* KHUNG GIỜ */}
          <Box className={styles.timeSlotsWrapper}>
            <Box className={styles.timeSlots}>
              {(flashSaleData.today || []).map(slot => {
                const isActive = activeSlot?.flashSaleId === slot.flashSaleId;
                const isFuture = new Date(`${slot.dateSale}T${slot.startTime}`) > new Date();
                const isSelected = selectedTimeSlot?.flashSaleId === slot.flashSaleId;

                return (
                  <Box
                    key={slot.flashSaleId}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`${styles.timeSlot} ${isSelected ? styles.selected : ''} ${isActive ? styles.activeSlot : ''}`}
                  >
                    {isActive && <div className={styles.liveBadge}>LIVE</div>}
                    {!isActive && isFuture && <div className={styles.soonBadge}>Sắp diễn ra</div>}
                    {!isActive && !isFuture && <div className={styles.endedBadge}>Đã kết thúc</div>}
                    <Typography className={styles.slotTime}>
                      {slot.startTime.substring(0, 5)}
                    </Typography>
                  </Box>
                );
              })}
              {(flashSaleData.tomorrow || []).slice(0, 3).map(slot => (
                <Box
                  key={slot.flashSaleId}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`${styles.timeSlot} ${styles.tomorrowSlot} ${selectedTimeSlot?.flashSaleId === slot.flashSaleId ? styles.selected : ''}`}
                >
                  <div className={styles.tomorrowLabel}>Ngày mai</div>
                  <Typography className={styles.slotTime}>
                    {slot.startTime.substring(0, 5)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* SẢN PHẨM */}
          {!selectedTimeSlot || selectedTimeSlot.items?.length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography variant="h6" color="text.secondary">
                Không có sản phẩm trong khung giờ này
              </Typography>
            </Box>
          ) : (
            <>
              {/* PC & Tablet */}
              <Box className={styles.productGrid} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box className={styles.productList}>
                  {selectedTimeSlot.items.map(item => {
                    const discount = calculateDiscount(item.product.originalPrice, item.sellPrice);
                    const isActiveNow = isSlotActiveByNow(selectedTimeSlot);

                    return (
                      <Box key={item.itemId} className={styles.productCard} onClick={() => navigate(`/product-detail/${item.product.productId}`)}>
                        <Box className={styles.imageWrapper}>
                          <img src={item.product.imageUrl || '/placeholder-product.jpg'} alt={item.product.productName} className={styles.productImage} loading="lazy" />
                          {discount > 0 && <Box className={styles.discountTag}>-{discount}%</Box>}
                          {isActiveNow && item.quantity <= 10 && <Box className={styles.hotTag}>Sắp hết!</Box>}
                        </Box>
                        <Box className={styles.productInfo}>
                          <Typography className={styles.productName}>{item.product.productName}</Typography>
                          <Box className={styles.priceSection}>
                            <Typography className={styles.flashPrice}>
                              {isActiveNow ? `${formatPrice(item.sellPrice)}₫` : '?.???.000₫'}
                            </Typography>
                            {item.product.originalPrice > item.sellPrice && (
                              <Typography className={styles.originalPrice}>{formatPrice(item.product.originalPrice)}₫</Typography>
                            )}
                          </Box>
                          <Box className={styles.stockBar}>
                            <Box className={styles.stockFill} style={{ width: `${Math.min(100, (item.quantity / 50) * 100)}%` }} />
                            <Typography className={styles.stockText}>Còn {item.quantity} suất</Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Mobile: Carousel KHÔNG VÒNG */}
              <Box className={styles.mobileProductSlider} sx={{ display: { xs: 'block', md: 'none' } }}>
                <Slider {...mobileSliderSettings}>
                  {selectedTimeSlot.items.map(item => {
                    const discount = calculateDiscount(item.product.originalPrice, item.sellPrice);
                    const isActiveNow = isSlotActiveByNow(selectedTimeSlot);

                    return (
                      <Box key={item.itemId} className={styles.productCard} onClick={() => navigate(`/product-detail/${item.product.productId}`)}>
                        <Box className={styles.imageWrapper}>
                          <img src={item.product.imageUrl || '/placeholder-product.jpg'} alt={item.product.productName} className={styles.productImage} loading="lazy" />
                          {discount > 0 && <Box className={styles.discountTag}>-{discount}%</Box>}
                          {isActiveNow && item.quantity <= 10 && <Box className={styles.hotTag}>Sắp hết!</Box>}
                        </Box>
                        <Box className={styles.productInfo}>
                          <Typography className={styles.productName}>{item.product.productName}</Typography>
                          <Box className={styles.priceSection}>
                            <Typography className={styles.flashPrice}>
                              {isActiveNow ? `${formatPrice(item.sellPrice)}₫` : '?.???.000₫'}
                            </Typography>
                            {item.product.originalPrice > item.sellPrice && (
                              <Typography className={styles.originalPrice}>{formatPrice(item.product.originalPrice)}₫</Typography>
                            )}
                          </Box>
                          <Box className={styles.stockBar}>
                            <Box className={styles.stockFill} style={{ width: `${Math.min(100, (item.quantity / 50) * 100)}%` }} />
                            <Typography className={styles.stockText}>Còn {item.quantity} suất</Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Slider>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default FlashSale;