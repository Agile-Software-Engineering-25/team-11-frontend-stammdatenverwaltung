import React, { createContext, useContext, useState } from 'react';

type MessageType = { type: 'success' | 'error'; text: string } | null;

interface MessageContextType {
  message: MessageType;
  setMessage: React.Dispatch<React.SetStateAction<MessageType>>;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [message, setMessage] = useState<MessageType>(null);
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMessage = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessage must be used within MessageProvider');
  return ctx;
};
