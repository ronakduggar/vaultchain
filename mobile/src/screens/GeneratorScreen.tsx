import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Clipboard,
  Switch,
} from "react-native";
import { colors, layout } from "../theme/theme";

interface GeneratorScreenProps {
  onBack: () => void;
}

export const GeneratorScreen: React.FC<GeneratorScreenProps> = ({ onBack }) => {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const calculateEntropy = () => {
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 32;

    if (poolSize === 0) return 0;

    // Entropy formula: bits = length * log2(poolSize)
    const bits = length * (Math.log(poolSize) / Math.log(2));
    return Math.round(bits);
  };

  const getEntropyStrength = (entropy: number) => {
    if (entropy === 0) return { label: "N/A", color: colors.dark.textMuted };
    if (entropy < 50) return { label: "Weak (Easy crack)", color: colors.dark.danger };
    if (entropy < 80) return { label: "Moderate (Decent)", color: colors.dark.warning };
    return { label: "Excellent (Military Grade)", color: colors.dark.success };
  };

  const handleGenerate = () => {
    let charset = "";
    if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) charset += "0123456789";
    if (useSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (!charset) {
      Alert.alert("Error", "Please select at least one character type.");
      return;
    }

    let password = "";
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * charset.length);
      password += charset.charAt(idx);
    }

    setGeneratedPassword(password);
  };

  const handleCopy = () => {
    if (!generatedPassword) return;
    Clipboard.setString(generatedPassword);
    Alert.alert("Copied", "Generated password copied to clipboard.");
  };

  const entropy = calculateEntropy();
  const strength = getEntropyStrength(entropy);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>◀ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entropy Generator</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.entropyHeader}>Cryptographic Entropy</Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultText} selectable numberOfLines={2}>
              {generatedPassword || "Click Generate below"}
            </Text>
            {generatedPassword.length > 0 && (
              <TouchableOpacity onPress={handleCopy}>
                <Text style={styles.copyTextLink}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>

          {generatedPassword.length > 0 && (
            <View style={styles.meterContainer}>
              <View style={styles.meterLine}>
                <Text style={styles.meterLabel}>Entropy Bits:</Text>
                <Text style={styles.meterVal}>{entropy} bits</Text>
              </View>
              <View style={styles.meterLine}>
                <Text style={styles.meterLabel}>Strength Profile:</Text>
                <Text style={[styles.meterVal, { color: strength.color }]}>{strength.label}</Text>
              </View>
            </View>
          )}

          {/* Configuration Options */}
          <Text style={styles.optionsTitle}>Parameters</Text>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Length: {length} Characters</Text>
            <View style={styles.lengthControls}>
              <TouchableOpacity
                style={styles.lenBtn}
                onPress={() => setLength(Math.max(8, length - 2))}
              >
                <Text style={styles.lenBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.lenBtn}
                onPress={() => setLength(Math.min(64, length + 2))}
              >
                <Text style={styles.lenBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Uppercase Letters (A-Z)</Text>
            <Switch
              value={useUpper}
              onValueChange={setUseUpper}
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Lowercase Letters (a-z)</Text>
            <Switch
              value={useLower}
              onValueChange={setUseLower}
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Numeric Characters (0-9)</Text>
            <Switch
              value={useNumbers}
              onValueChange={setUseNumbers}
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Special Symbols (!@#)</Text>
            <Switch
              value={useSymbols}
              onValueChange={setUseSymbols}
              trackColor={{ false: "#1E293B", true: colors.dark.primary }}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleGenerate}>
            <Text style={styles.btnText}>Calculate & Generate</Text>
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
  },
  entropyHeader: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    textAlign: "center",
  },
  resultBox: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.medium,
    padding: layout.spacing.md,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    minHeight: 64,
  },
  resultText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  copyTextLink: {
    color: colors.dark.accent,
    fontSize: 15,
    fontWeight: "800",
  },
  meterContainer: {
    marginTop: layout.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: layout.borderRadius.medium - 4,
    padding: layout.spacing.md,
  },
  meterLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  meterLabel: {
    color: colors.dark.textMuted,
    fontSize: 13,
  },
  meterVal: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  optionsTitle: {
    color: colors.dark.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: layout.spacing.xl,
    marginBottom: layout.spacing.xs,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
  },
  optionLabel: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  lengthControls: {
    flexDirection: "row",
    gap: 8,
  },
  lenBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  lenBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  btn: {
    backgroundColor: colors.dark.primary,
    padding: 16,
    borderRadius: layout.borderRadius.medium,
    alignItems: "center",
    marginTop: layout.spacing.lg,
  },
  btnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
