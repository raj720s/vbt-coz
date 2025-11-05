"use client";

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Simple loading component for client-side rendering
const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Loading component for PersistGate
const PersistLoading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Restoring session...</p>
    </div>
  </div>
);

export function ReduxProvider({ children }: ReduxProviderProps) {
  useEffect(() => {
    console.log('🔍 ReduxProvider: Component mounted');
    
    // Check initial store state
    const initialState = store.getState();
    console.log('🔍 ReduxProvider: Initial store state:', {
      commonData: initialState.commonData ? 'Common data exists' : 'No common data',
      auth: initialState.auth ? 'Auth state exists' : 'No auth state',
      note: 'Auth state persisted with redux-persist'
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<PersistLoading />} persistor={persistor}>
        <AppWrapper>
          {children}
        </AppWrapper>
      </PersistGate>
    </Provider>
  );
}
