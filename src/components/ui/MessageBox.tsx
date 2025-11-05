"use client";

import { useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@/icons';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  timestamp: Date;
  persistent?: boolean; // If true, message won't auto-dismiss
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}

interface MessageBoxProps {
  message: Message | null;
  onClose: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const messageStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircleIcon,
    iconColor: 'text-green-500 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
    contentColor: 'text-green-700 dark:text-green-300'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: XCircleIcon,
    iconColor: 'text-red-500 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
    contentColor: 'text-red-700 dark:text-red-300'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
    contentColor: 'text-yellow-700 dark:text-yellow-300'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-500 dark:text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-200',
    contentColor: 'text-blue-700 dark:text-blue-300'
  }
};

export function MessageBox({ 
  message, 
  onClose, 
  autoDismiss = true, 
  dismissDelay = 5000 
}: MessageBoxProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      
      // Auto-dismiss if not persistent and autoDismiss is enabled
      if (autoDismiss && !message.persistent) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, dismissDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, autoDismiss, dismissDelay, onClose]);

  if (!message) return null;

  const styles = messageStyles[message.type];
  const IconComponent = styles.icon;

  return (
    <div className={`fixed top-4 right-4 z-509980 max-w-md w-full transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
    }`}>
      <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${styles.titleColor}`}>
                {message.title}
              </h3>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className={`${styles.iconColor} hover:opacity-70 transition-opacity`}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className={`mt-1 text-sm ${styles.contentColor}`}>
              {message.content}
            </div>
            
            {message.actions && message.actions.length > 0 && (
              <div className="mt-3 flex gap-2">
                {message.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      action.variant === 'primary' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message context and provider for global message management
import { createContext, useContext, useCallback } from 'react';

interface MessageContextType {
  showMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  showSuccess: (title: string, content: string, options?: Partial<Message>) => void;
  showError: (title: string, content: string, options?: Partial<Message>) => void;
  showWarning: (title: string, content: string, options?: Partial<Message>) => void;
  showInfo: (title: string, content: string, options?: Partial<Message>) => void;
  clearMessage: () => void;
  currentMessage: Message | null;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}

interface MessageProviderProps {
  children: React.ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  const showMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setCurrentMessage(newMessage);
  }, []);

  const showSuccess = useCallback((title: string, content: string, options?: Partial<Message>) => {
    showMessage({
      type: 'success',
      title,
      content,
      ...options
    });
  }, [showMessage]);

  const showError = useCallback((title: string, content: string, options?: Partial<Message>) => {
    showMessage({
      type: 'error',
      title,
      content,
      ...options
    });
  }, [showMessage]);

  const showWarning = useCallback((title: string, content: string, options?: Partial<Message>) => {
    showMessage({
      type: 'warning',
      title,
      content,
      ...options
    });
  }, [showMessage]);

  const showInfo = useCallback((title: string, content: string, options?: Partial<Message>) => {
    showMessage({
      type: 'info',
      title,
      content,
      ...options
    });
  }, [showMessage]);

  const clearMessage = useCallback(() => {
    setCurrentMessage(null);
  }, []);

  return (
    <MessageContext.Provider value={{
      showMessage,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      clearMessage,
      currentMessage
    }}>
      {children}
      <MessageBox
        message={currentMessage}
        onClose={clearMessage}
        autoDismiss={true}
        dismissDelay={5000}
      />
    </MessageContext.Provider>
  );
}
