// src/features/bills/billsSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Sample initial data (you would replace this with your actual data)
const initialState = {
  unclearedBills: [
    { id: 'B001', customer: 'John Doe', amount: 124.99, date: '2025-04-25' },
    { id: 'B002', customer: 'Jane Smith', amount: 89.50, date: '2025-04-26' },
    { id: 'B003', customer: 'Bob Johnson', amount: 245.75, date: '2025-04-26' },
    { id: 'B004', customer: 'Mary Williams', amount: 56.25, date: '2025-04-27' },
  ],
  stagedBills: [],
};

export const billsSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    stageBill: (state, action) => {
      // Find the bill in unclearedBills
      const billId = action.payload;
      const billIndex = state.unclearedBills.findIndex(bill => bill.id === billId);
      
      if (billIndex !== -1) {
        // Move the bill from uncleared to staged
        const bill = state.unclearedBills[billIndex];
        state.stagedBills.push(bill);
        state.unclearedBills.splice(billIndex, 1);
      }
    },
    unstageBill: (state, action) => {
      // Find the bill in stagedBills
      const billId = action.payload;
      const billIndex = state.stagedBills.findIndex(bill => bill.id === billId);
      
      if (billIndex !== -1) {
        // Move the bill from staged back to uncleared
        const bill = state.stagedBills[billIndex];
        state.unclearedBills.push(bill);
        state.stagedBills.splice(billIndex, 1);
      }
    },
    clearStagedBills: (state) => {
      // Clear all staged bills
      state.stagedBills = [];
    },
    // Add more actions as needed
    addNewBill: (state, action) => {
      state.unclearedBills.push(action.payload);
    }
  },
});

// Export actions
export const { stageBill, unstageBill, clearStagedBills, addNewBill } = billsSlice.actions;

export default billsSlice.reducer;