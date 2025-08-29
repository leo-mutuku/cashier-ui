import { configureStore } from '@reduxjs/toolkit';
import billsReducer from '../features/bills/billSlice';

export const store = configureStore({
  reducer: {
    bills: billsReducer,
    // Add other reducers here
  },
});