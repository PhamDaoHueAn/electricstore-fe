import React, { useState, useEffect, useMemo } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import styles from './FlashSale.module.css';

const FlashSale = () => {
  const [flashSaleData, setFlashSaleData] = useState({ today: [], tomorrow: [] });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // === KIỂM TRA CÓ DỮ LIỆU HAY KHÔNG ===
  const hasAnyFlashSale = 
    (flashSaleData.today && flashSaleData.today.length > 0) || 
    (flashSaleData.tomorrow && flashSaleData.tomorrow.length > 0);

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
      const resp = await API.get('/FlashSale/get-flashsale-today-and-tomorrow', {
      timeout: 5000
    });
      const today = sortSlots(resp.data.today || []);
      const tomorrow = sortSlots(resp.data.tomorrow || []);
      setFlashSaleData({ today, tomorrow });

      const now = new Date();
      const active = today.find(s => isSlotActiveByNow(s, now));
      if (active) {
        setSelectedTimeSlot(active);
        return;
      }
      const nextFuture = today.find(s => new Date(`${s.dateSale}T${s.startTime}`) > now);
      if (nextFuture) {
        setSelectedTimeSlot(nextFuture);
        return;
      }
      if (today.length) {
        setSelectedTimeSlot(today[0]);
        return;
      }
      if (tomorrow.length) setSelectedTimeSlot(tomorrow[0]);
    } catch (err) {
    console.error('Lỗi lấy Flash Sale:', err);
    setFlashSaleData({ today: [], tomorrow: [] }); // KHIỂM TRA AN TOÀN
  } finally {
    setLoading(false);
  }
};



  // === ĐẾM NGƯỢC ===
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
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeSlot]);

  // === HÀM HỖ TRỢ ===
  const formatPrice = (p) => (typeof p === 'number' ? p.toLocaleString('vi-VN') : p);
  const calculateDiscount = (o, s) => o ? Math.round(((o - s) / o) * 100) : 0;

  const renderCountdown = () => {
    if (!countdown) return null;
    const [h, m, s] = countdown.split(':');
    return (
      <div className={styles.countdownDigits}>
        <span className={styles.digit}>{h}</span>
        <span className={styles.colon}>:</span>
        <span className={styles.digit}>{m}</span>
        <span className={styles.colon}>:</span>
        <span className={styles.digit}>{s}</span>
      </div>
    );
  };

  const formatTimeButtonContent = (slot) => {
    const now = new Date();
    const isActive = activeSlot?.flashSaleId === slot.flashSaleId;
    const isFuture = new Date(`${slot.dateSale}T${slot.startTime}`) > now;
    const isTomorrow = flashSaleData.tomorrow?.some(s => s.flashSaleId === slot.flashSaleId);

    return (
      <div className={styles.slotInner}>
        {isActive && <div className={`${styles.slotLabel} ${styles.activeLabel}`}>Đang diễn ra</div>}
        {!isActive && isFuture && !isTomorrow && <div className={styles.slotLabel}>Sắp diễn ra</div>}
        {!isActive && !isFuture && !isTomorrow && <div className={styles.slotLabelDisabled}>Đã kết thúc</div>}
        {isTomorrow && <div className={styles.slotLabel}>Ngày mai</div>}

        <div className={styles.slotTimeLarge}>
          {isActive
            ? `${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}`
            : slot.startTime.substring(0, 5)}
        </div>

        {isActive && <div className={styles.countdownWrap}>{renderCountdown()}</div>}
      </div>
    );
  };

  // === ẨN TOÀN BỘ NẾU KHÔNG CÓ DỮ LIỆU ===
  if (loading) return null;

  if (!hasAnyFlashSale) {
    return null; // ẨN HOÀN TOÀN
  }

  return (
    <Box sx={{ py: 2 }}>
      <Container maxWidth="lg">
        <Box className={styles.flashSaleContainer}>
          <Box className={styles.flashSaleHeader}>
            <Typography variant="h4" className={styles.title}>
              {selectedTimeSlot?.flashSaleName || 'FLASH SALE'}
            </Typography>
          </Box>

          <div className={styles.divider}>
            <Box className={styles.timeSlots}>
              {(flashSaleData.today || []).map(slot => (
                <div
                  key={slot.flashSaleId}
                  className={`${styles.timeSlotButton} ${selectedTimeSlot?.flashSaleId === slot.flashSaleId ? styles.active : ''}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                  role="button"
                >
                  {formatTimeButtonContent(slot)}
                </div>
              ))}

              {(flashSaleData.tomorrow || []).map(slot => (
                <div
                  key={slot.flashSaleId}
                  className={`${styles.timeSlotButton} ${selectedTimeSlot?.flashSaleId === slot.flashSaleId ? styles.active : ''}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                  role="button"
                >
                  {formatTimeButtonContent(slot)}
                </div>
              ))}
            </Box>
          </div>

          <Box className={styles.productGrid}>
            {(!selectedTimeSlot || !selectedTimeSlot.items || selectedTimeSlot.items.length === 0) ? (
              <div className={styles.emptyState}>Không có sản phẩm flash sale</div>
            ) : (
              <ul className={styles.listproduct}>
                {selectedTimeSlot.items.map(item => {
                  const discountPercent = calculateDiscount(item.product.originalPrice, item.sellPrice);
                  return (
                    <li key={item.itemId} className={styles.item}>
                      <a
                        onClick={() => navigate(`/product-detail/${item.product.productId}`)}
                        className={styles.mainContain}
                      >
                        {discountPercent > 0 && (
                          <div className={styles.discountBadge}>-{discountPercent}%</div>
                        )}

                        <div className={styles.itemImg}>
                          <img
                            className={styles.thumb}
                            src={item.product.imageUrl || '/placeholder-product.jpg'}
                            alt={item.product.productName}
                            loading="lazy"
                            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                          />
                        </div>

                        <h4 className={styles.prodName} title={item.product.productName}>
                          {item.product.productName}
                        </h4>

                        <div className={styles.priceRow}>
                          <strong className={styles.priceMain}>
                            {isSlotActiveByNow(selectedTimeSlot)
                              ? `${formatPrice(item.sellPrice)}₫`
                              : `${Math.floor(item.sellPrice / 1000000)}.xxx.000`}
                          </strong>
                          <span className={styles.priceOld}>
                            {formatPrice(item.product.originalPrice)}₫
                          </span>
                        </div>

                        <div className={styles.saleDesc}>
                          {selectedTimeSlot?.description}
                        </div>

                        <div className={styles.itemBottom}>
                          <span className={styles.stockCount}>
                            Còn {item.quantity} suất
                          </span>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FlashSale;