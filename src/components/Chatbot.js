import React from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import config from './Config';

const MyChatbot = () => {
  return (
    <Chatbot
      config={config}
      actionProvider={ActionProvider}
      messageParser={MessageParser}
    />
  );
};

export default MyChatbot;