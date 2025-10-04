import React from 'react';
import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: 'ElectronicStoreBot',
  initialMessages: [createChatBotMessage('Hi! I’m your assistant. How can I help you?')],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#376B7E',
    },
    chatButton: {
      backgroundColor: '#5ccc9d',
    },
  },
};

export default config;