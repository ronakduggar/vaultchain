import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  isBiometricEnabled: boolean;
  securityScore: number;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  masterKeyHex: string | null; // stored securely in-session (cleared on lock/logout)
  isLocked: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  masterKeyHex: null,
  isLocked: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isLocked = false;
    },
    setSessionKey: (state, action: PayloadAction<string>) => {
      state.masterKeyHex = action.payload;
      state.isLocked = false;
    },
    lockVault: (state) => {
      state.masterKeyHex = null;
      state.isLocked = true;
    },
    unlockVault: (state, action: PayloadAction<string>) => {
      state.masterKeyHex = action.payload;
      state.isLocked = false;
    },
    updateWalletAddress: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.walletAddress = action.payload;
      }
    },
    updateSecurityScore: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.securityScore = action.payload;
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.masterKeyHex = null;
      state.isLocked = true;
    },
  },
});

export const {
  setCredentials,
  setSessionKey,
  lockVault,
  unlockVault,
  updateWalletAddress,
  updateSecurityScore,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
