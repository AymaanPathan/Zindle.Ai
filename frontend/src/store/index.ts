import { configureStore } from "@reduxjs/toolkit";
import clientsReducer from "./slices/clientSlice";
import riskReducer from "./slices/riskSlice";
import uiReducer from "./slices/uiSlice";
import chatReducer from "./slices/chatSlice";
import journeyReducer from "./slices/journeySlice";
import customerReducer from "./slices/customerSlice"; 

export const store = configureStore({
  reducer: {
    clients: clientsReducer,
    journey: journeyReducer,
    risk: riskReducer,
    ui: uiReducer,
     chat: chatReducer,
     customer: customerReducer,  
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
