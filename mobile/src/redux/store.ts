import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import vaultReducer from "./vaultSlice";
import themeReducer from "./themeSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  vault: vaultReducer,
  theme: themeReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // bypass serialize check for fast storage engines
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
