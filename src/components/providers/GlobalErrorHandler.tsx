"use client";
import React, { useEffect } from 'react';
import { useMessage } from '@/components/ui/MessageBox';
import { globalErrorService } from '@/services/globalErrorService';

export function GlobalErrorHandler() {
  const messageProvider = useMessage();

  useEffect(() => {
    // Register the message provider with the global error service
    globalErrorService.setMessageProvider(messageProvider);

    // Cleanup
    return () => {
      globalErrorService.setMessageProvider(null);
    };
  }, [messageProvider]);

  // This component doesn't render anything
  return null;
}

export default GlobalErrorHandler;
