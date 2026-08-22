import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface VaultItem {
  id: string; // locally generated UUID or index
  ipfsHash: string; // IPFS CID reference
  blockchainIndex: number; // Index in the smart contract
  encryptedData: string; // The full encrypted JSON string (AES ciphertext + IV)
  websiteName: string; // Decrypted name (cached in session only, or displayed as ciphertext when locked)
  username: string; // Decrypted username
  category: string; // e.g. "logins", "cards", "notes"
  isFavorite: boolean;
  updatedAt: number;
}

interface VaultState {
  items: VaultItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VaultState = {
  items: [],
  isLoading: false,
  error: null,
};

const vaultSlice = createSlice({
  name: "vault",
  initialState,
  reducers: {
    setVaultItems: (state, action: PayloadAction<VaultItem[]>) => {
      state.items = action.payload;
    },
    addVaultItem: (state, action: PayloadAction<VaultItem>) => {
      state.items.push(action.payload);
    },
    updateVaultItem: (state, action: PayloadAction<VaultItem>) => {
      const idx = state.items.findIndex((x) => x.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const item = state.items.find((x) => x.id === action.payload);
      if (item) {
        item.isFavorite = !item.isFavorite;
      }
    },
    deleteVaultItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearVault: (state) => {
      state.items = [];
    },
  },
});

export const {
  setVaultItems,
  addVaultItem,
  updateVaultItem,
  toggleFavorite,
  deleteVaultItem,
  clearVault,
} = vaultSlice.actions;

export default vaultSlice.reducer;
