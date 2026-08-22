import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useDispatch } from "react-redux";
import { setCredentials, setSessionKey } from "../redux/authSlice";
import { colors, layout } from "../theme/theme";
import { deriveMasterKey, hashSHA256 } from "../utils/encryption";
import api from "../services/apiService";

export const AuthScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinSetupMode, setPinSetupMode] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [walletSetupMode, setWalletSetupMode] = useState(false);
  const [walletAddr, setWalletAddr] = useState("");

  const getPasswordStrength = () => {
    if (password.length === 0) return { label: "", color: "#FFF", score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
      case 2:
        return { label: "Weak", color: colors.dark.danger, score: 20 };
      case 3:
      case 4:
        return { label: "Fair", color: colors.dark.warning, score: 60 };
      case 5:
        return { label: "Strong", color: colors.dark.success, score: 100 };
      default:
        return { label: "Very Weak", color: colors.dark.danger, score: 10 };
    }
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // 1. Fetch Salt
        const saltRes = await api.get(`/auth/salt?email=${encodeURIComponent(email)}`);
        const { salt } = saltRes.data;

        // 2. Derive Key and Login Hash
        const key = deriveMasterKey(password, salt);
        const loginHash = hashSHA256(key);

        // 3. Login
        const loginRes = await api.post("/auth/login", {
          email,
          loginHash,
        });

        const { token, user } = loginRes.data;
        dispatch(setCredentials({ token, user }));
        dispatch(setSessionKey(key));

        // Prompt PIN code configuration
        setPinSetupMode(true);
      } else {
        // Registration Flow
        // 1. Create client-side Salt
        const salt = "salt-" + hashSHA256(email + Date.now().toString()).slice(0, 16);
        
        // 2. Derive derived Key and Login Hash
        const key = deriveMasterKey(password, salt);
        const loginHash = hashSHA256(key);

        // 3. Register
        const regRes = await api.post("/auth/register", {
          name,
          email,
          loginHash,
          salt,
        });

        const { token, user } = regRes.data;
        dispatch(setCredentials({ token, user }));
        dispatch(setSessionKey(key));

        // Prompt PIN code configuration
        setPinSetupMode(true);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || "Request failed";
      Alert.alert("Authentication Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSetup = async () => {
    if (pinCode.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      const pinHash = hashSHA256(pinCode);
      await api.post("/auth/pin-setup", { pinHash });
      setPinSetupMode(false);
      
      // Move to MetaMask link setup
      setWalletSetupMode(true);
    } catch (err: any) {
      Alert.alert("PIN Setup Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    try {
      // Simulate MetaMask wallet deep linking and linking address
      const simulatedAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      await api.post("/users/wallet-connect", { walletAddress: simulatedAddress });
      setWalletAddr(simulatedAddress);

      Alert.alert("Success", "MetaMask Wallet connected successfully!");
      setWalletSetupMode(false);
    } catch (err: any) {
      Alert.alert("Wallet Connect Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipWallet = () => {
    setWalletSetupMode(false);
  };

  if (pinSetupMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.headerText}>Set Secure PIN</Text>
          <Text style={styles.subText}>Configure a 4-digit PIN for quick unlocks.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter 4-Digit PIN"
            placeholderTextColor={colors.dark.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            value={pinCode}
            onChangeText={setPinCode}
          />

          <TouchableOpacity style={styles.btn} onPress={handlePinSetup}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Confirm PIN</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (walletSetupMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.headerText}>Link Ethereum Wallet</Text>
          <Text style={styles.subText}>Link Coinbase Wallet or MetaMask for storing credentials immutable hashes.</Text>
          
          <TouchableOpacity style={[styles.btn, styles.walletBtn]} onPress={handleWalletConnect}>
            <Text style={styles.btnText}>🦊 Connect MetaMask Mobile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.walletBtnSecondary]} onPress={handleWalletConnect}>
            <Text style={styles.btnText}>🛡️ Connect Coinbase Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipLink} onPress={skipWallet}>
            <Text style={styles.skipLinkText}>Configure Wallet Later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const strength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.logoTitle}>VAULTCHAIN</Text>
          <Text style={styles.tagline}>Military Grade Decentralized Crypt</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin ? styles.activeTab : null]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin ? styles.activeTabText : null]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin ? styles.activeTab : null]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin ? styles.activeTabText : null]}>Register</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.dark.textMuted}
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={colors.dark.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Master Password"
            placeholderTextColor={colors.dark.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFilled,
                    { width: `${strength.score}%`, backgroundColor: strength.color },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleAuth}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>{isLogin ? "Authenticate" : "Create Registry"}</Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    justifyContent: "center",
    padding: layout.spacing.lg,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: layout.spacing.xl,
  },
  logoTitle: {
    fontFamily: "System",
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.accent,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.dark.cardBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.large,
    padding: layout.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: colors.dark.textMuted,
    textAlign: "center",
    marginBottom: layout.spacing.lg,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: layout.borderRadius.medium,
    padding: 4,
    marginBottom: layout.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: layout.borderRadius.medium - 2,
  },
  activeTab: {
    backgroundColor: colors.dark.primary,
  },
  tabText: {
    color: colors.dark.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  activeTabText: {
    color: "#FFF",
  },
  input: {
    backgroundColor: colors.dark.inputBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.medium,
    padding: 16,
    color: "#FFF",
    fontSize: 16,
    marginBottom: layout.spacing.md,
  },
  btn: {
    backgroundColor: colors.dark.primary,
    padding: 18,
    borderRadius: layout.borderRadius.medium,
    alignItems: "center",
    marginTop: layout.spacing.sm,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  walletBtn: {
    backgroundColor: "#F6851B",
    marginTop: layout.spacing.md,
  },
  walletBtnSecondary: {
    backgroundColor: "#0052FF",
    marginTop: layout.spacing.md,
  },
  skipLink: {
    alignItems: "center",
    marginTop: layout.spacing.lg,
  },
  skipLinkText: {
    color: colors.dark.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: layout.spacing.md,
  },
  strengthBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginRight: 10,
    overflow: "hidden",
  },
  strengthBarFilled: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "700",
    width: 70,
    textAlign: "right",
  },
});
