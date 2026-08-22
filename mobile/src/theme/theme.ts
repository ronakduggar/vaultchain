export const colors = {
  dark: {
    primary: "#5B5FEF",
    secondary: "#7B61FF",
    accent: "#00E5FF",
    success: "#22C55E",
    danger: "#EF4444",
    warning: "#F59E0B",
    background: "#0F172A",
    cardBg: "rgba(30, 41, 59, 0.45)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    text: "#F8FAFC",
    textMuted: "#94A3B8",
    inputBg: "rgba(15, 23, 42, 0.6)",
  },
  light: {
    primary: "#5B5FEF",
    secondary: "#7B61FF",
    accent: "#00B8D4",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#D97706",
    background: "#F8FAFC",
    cardBg: "rgba(255, 255, 255, 0.75)",
    cardBorder: "rgba(15, 23, 42, 0.06)",
    text: "#0F172A",
    textMuted: "#64748B",
    inputBg: "rgba(241, 245, 249, 0.9)",
  },
};

export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  }),
};

export const layout = {
  borderRadius: {
    small: 8,
    medium: 16,
    large: 24,
    round: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
