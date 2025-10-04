import React from 'react';

const MessageParser = ({ children, actions }) => {
  const parse = (message) => {
    const lowercase = message.toLowerCase();

    if (lowercase.includes("hello")) {
      actions.handleHello();
    } else if (lowercase.includes("product") || lowercase.includes("item")) {
      actions.handleProductInquiry();
    }
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          parse: parse,
          actions,
        });
      })}
    </div>
  );
};

export default MessageParser;