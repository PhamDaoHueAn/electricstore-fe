import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Button,
  Grid
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const MyChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get('/Chatbot/history');
        const history = Array.isArray(res.data) ? res.data : [];

        if (history.length === 0) {
          setMessages([
            {
              role: 'model',
              message: 'Xin chào! Tôi là trợ lý ảo của Điện Máy Xanh',
              timestamp: new Date().toISOString()
            },
            {
              role: 'model',
              message: 'Bạn cần mình hỗ trợ tìm sản phẩm nào hôm nay ạ?',
              timestamp: new Date().toISOString()
            }
          ]);
        } else {
          setMessages(history);
        }
      } catch (err) {
        console.warn('Lỗi lấy lịch sử chat:', err);
        setMessages([
          { role: 'model', message: 'Xin chào! Tôi là trợ lý ảo', timestamp: new Date().toISOString() },
          { role: 'model', message: 'Bạn cần hỗ trợ gì ạ?', timestamp: new Date().toISOString() }
        ]);
      }
    };

    fetchHistory();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');

    const newUserMessage = {
      role: 'user',
      message: userMsg,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const res = await API.post('/Chatbot/send', { message: userMsg });

      const botReply = {
        role: 'model',
        message: res.data.message || 'Mình chưa rõ, bạn nói lại giúp mình nhé!',
        products: res.data.products || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botReply]);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      setMessages(prev => [...prev, {
        role: 'model',
        message: 'Oops! Mình đang gặp lỗi kết nối. Bạn thử lại sau vài giây nhé!',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const ProductSuggestions = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {products.map((product, idx) => (
          <Grid item xs={12} sm={6} key={idx}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 3,
                borderRadius: 2,
                transition: '0.3s',
                '&:hover': { boxShadow: 8 }
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={product.imageUrl || '/placeholder-product.jpg'}
                alt={product.name}
                sx={{ objectFit: 'contain', bgcolor: '#f9f9f9' }}
                onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
              />
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', mb: 1 }}>
                  {product.name}
                </Typography>
                <Typography variant="h6" color="error" sx={{ fontWeight: 'bold' }}>
                  {product.price.toLocaleString('vi-VN')}₫
                </Typography>
              </CardContent>
              <Box sx={{ p: 1, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => {
                    
                    navigate(`/product-detail/${product.id}`);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Xem chi tiết
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fb' }}>
      <Box sx={{ bgcolor: '#0560e7', color: 'white', p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <SmartToyIcon /> Trợ lý ảo Điện Máy Xanh
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>Hỗ trợ 24/7 - Gợi ý sản phẩm nhanh</Typography>
      </Box>


      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 3,
              gap: 1,
            }}
          >
            {msg.role === 'model' && (
              <Avatar sx={{ bgcolor: '#0560e7', width: 38, height: 38 }}>
                <SmartToyIcon />
              </Avatar>
            )}

            <Box sx={{ maxWidth: '85%' }}>
              <Paper
                elevation={msg.role === 'model' ? 1 : 3}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: msg.role === 'user' ? '#0560e7' : 'white',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {msg.message}
                </Typography>
              </Paper>

              {msg.role === 'model' && msg.products && msg.products.length > 0 && (
                <ProductSuggestions products={msg.products} />
              )}
            </Box>

            {msg.role === 'user' && (
              <Avatar sx={{ width: 38, height: 38 }}>B</Avatar>
            )}
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Trợ lý đang phản hồi yêu cầu của bạn...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Hỏi mình bất cứ sản phẩm nào nhé..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            sx={{ bgcolor: '#fafafa', borderRadius: 3 }}
          />
          <IconButton
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            sx={{
              bgcolor: '#0560e7',
              color: 'white',
              '&:hover': { bgcolor: '#0044cc' },
              '&:disabled': { bgcolor: '#ccc' }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default MyChatbot;