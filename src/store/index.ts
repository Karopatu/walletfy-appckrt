import { configureStore } from '@reduxjs/toolkit';
import eventsReducer from './eventsSlice';
import themeReducer from './themeSlice';
import balanceReducer from './balanceSlice';

export const store = configureStore({
  reducer: {
    events: eventsReducer,
    theme: themeReducer,
    balance: balanceReducer,
  },
});

// Nota: RootState y AppDispatch se definirán y exportarán desde hooks.ts