import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { store } from './index';

// Define los tipos para RootState y AppDispatch aquí, basados en el store importado
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Usar estos hooks a lo largo de tu aplicación en lugar de los simples `useDispatch` y `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;