import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  Clipboard,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { colors, layout } from "../theme/theme";
import { toggleTheme } from "../redux/themeSlice";
import { logout } from "../redux/authSlice";
import { clearVault } from "../redux/vaultSlice";
import api from "../services/apiService";

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector((state: RootState) => state.vault.items);

  const [biometrics, setBiometrics] = useState(user?.isBiometricEnabled || false);

  const handleToggleBiometrics = async (val: boolean) => {
    try {
      await api.post("/auth/biometric-setup", { enabled: val });
      setBiometrics(val);
      Alert.alert("Success", `Biometric unlock ${val ? "enabled" : "disabled"}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleBackupExport = () => {
    try {
      // Serialize cached encrypted credentials index details for local cold backup
      const backupPayload = JSON.stringify(
        items.map((item) => ({
          ipfsHash: item.ipfsHash,
          encryptedData: item.encryptedData,
          category: item.category,
        })),
        null,
        2
      );

      Clipboard.setString(backupPayload);
      Alert.alert(
        "Backup Exported",
        "Your encrypted credentials registry has been serialized and copied to your clipboard. Store this text block in a secure cold storage space.",
        [{ text: "Copy Confirmed" }]
      );
    } catch (e) {
      Alert.alert("Backup Failed", "Unable to compile backup registry.");
    }
  };

  const handleWipeAccount = () => {
    Alert.alert(
      "CAUTION: WIPE VAULT",
      "This action wipes all local database caches and session encryption keys. Make sure your references are synced on-chain before proceeding.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe Local Cache",
          style: "destructive",
          onPress: () => {
            dispatch(clearVault());
            dispatch(logout());
            Alert.alert("Wiped", "Local vault registry has been purged successfully.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>◀ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Configurations</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* User Card info */}
        <View style={styles.card}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Settings options list */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Aesthetics Theme Mode (Dark)</Text>
            <Switch
              value={themeMode === "dark"}
              onValueChange={() => dispatch(toggleTheme())}
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Secure TouchID / FaceID Unlock</Text>
            <Switch
              value={biometrics}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Database Session Timeout (15m)</Text>
            <Switch
              value={true}
              disabled
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionHeader}>Backup & Security</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.btnOption} onPress={handleBackupExport}>
            <Text style={styles.btnOptionText}>Export Encrypted Backup</Text>
            <Text style={styles.btnOptionArrow}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOption} onPress={handleBackupExport}>
            <Text style={styles.btnOptionText}>Restore Vault Registry</Text>
            <Text style={styles.btnOptionArrow}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnOption, { borderBottomWidth: 0 }]}
            onPress={handleWipeAccount}
          >
            <Text style={[styles.btnOptionText, { color: colors.dark.danger }]}>
              Wipe Credentials Database
            </Text>
            <Text style={styles.btnOptionArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={() => dispatch(logout())}>
          <Text style={styles.btnLogoutText}>Lock Crypt Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    padding: layout.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.lg,
  },
  backBtn: {
    color: colors.dark.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.dark.cardBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.large,
    padding: layout.spacing.lg,
    alignItems: "center",
    marginBottom: layout.spacing.lg,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarLetter: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
  },
  userName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  userEmail: {
    color: colors.dark.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
  },
  settingLabel: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  btnOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 16,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
  },
  btnOptionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  btnOptionArrow: {
    color: colors.dark.textMuted,
    fontSize: 14,
  },
  btnLogout: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    padding: 16,
    borderRadius: layout.borderRadius.medium,
    alignItems: "center",
    marginTop: layout.spacing.sm,
    marginBottom: 60,
  },
  btnLogoutText: {
    color: colors.dark.danger,
    fontSize: 15,
    fontWeight: "700",
  },
});
