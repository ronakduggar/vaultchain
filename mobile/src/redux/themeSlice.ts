import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ThemeState {
  mode: "dark" | "light";
}

const initialState: ThemeState = {
  mode: "dark", // default premium dark theme
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
    },
    setThemeMode: (state, action: PayloadAction<"dark" | "light">) => {
      state.mode = action.payload;
    },
  },
});

export const { toggleTheme, setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
