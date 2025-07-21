import { createSlice,  } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface BalanceState {
  initialBalance: number;
}

const getInitialBalance = (): number => {
  if (typeof window !== 'undefined') {
    const storedBalance = localStorage.getItem('initialBalance');
    return storedBalance ? parseFloat(storedBalance) : 0;
  }
  return 0;
};

const initialState: BalanceState = {
  initialBalance: getInitialBalance(),
};

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    setInitialBalance: (state, action: PayloadAction<number>) => {
      state.initialBalance = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('initialBalance', action.payload.toString());
      }
    },
  },
});

export const { setInitialBalance } = balanceSlice.actions;
export default balanceSlice.reducer;