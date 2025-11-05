import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import commonDataReducer from './slices/commonDataSlice';
import authReducer from './slices/authSlice';

// Root reducer
const rootReducer = combineReducers({
  commonData: commonDataReducer,
  auth: authReducer,
});

// Persist configuration for auth
const authPersistConfig = {
  key: 'auth_user',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated', 'isInitialized'],
  timeout: 3000,
};

// Create persisted auth reducer
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

// Configure the store with persistence
export const store = configureStore({
  reducer: combineReducers({
    commonData: commonDataReducer,
    auth: persistedAuthReducer,
  }),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store; 
