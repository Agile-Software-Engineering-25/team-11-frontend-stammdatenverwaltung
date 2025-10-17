import React, { createContext, useContext, useState } from 'react';

type MessageType = { type: 'success' | 'error'; text: string } | null;

const MessageContext = createContext<
  | {
      message: MessageType;
      setMessage: (msg: MessageType) => void;
    }
  | undefined
>(undefined);

export const MessageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [message, setMessage] = useState<MessageType>(null);
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessage must be used within MessageProvider');
  return ctx;
};
