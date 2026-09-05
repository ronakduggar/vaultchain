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
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { colors, layout } from "../theme/theme";
import { addVaultItem } from "../redux/vaultSlice";
import { encryptLocal } from "../utils/encryption";
import { uploadToIPFS } from "../services/ipfsService";
import { storeRecordOnChain } from "../services/ethersService";
import api from "../services/apiService";

interface AddPasswordScreenProps {
  onBack: () => void;
}

export const AddPasswordScreen: React.FC<AddPasswordScreenProps> = ({ onBack }) => {
  const dispatch = useDispatch();
  const masterKeyHex = useSelector((state: RootState) => state.auth.masterKeyHex);

  const [websiteName, setWebsiteName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Logins");
  const [tags, setTags] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const categories = ["Logins", "Cards", "Secure Notes"];

  const handleSave = async () => {
    if (!websiteName || !username || !password) {
      Alert.alert("Error", "Please fill out required fields (Website, Username, Password).");
      return;
    }

    if (!masterKeyHex) {
      Alert.alert("Security Error", "Master session key is missing. Please re-authenticate.");
      return;
    }

    setLoading(true);
    try {
      // Phase 1: Local client-side encryption
      setLoadingPhase("Deriving payload and encrypting locally via AES-256...");
      const secretPayload = JSON.stringify({
        websiteName,
        websiteUrl,
        username,
        password,
        notes,
        category,
        tags: tags.split(",").map((t) => t.trim()),
        timestamp: Date.now(),
      });

      const encryptedJson = encryptLocal(secretPayload, masterKeyHex);

      // Phase 2: Upload ciphertext payload to IPFS
      setLoadingPhase("Uploading encrypted payload block to IPFS nodes...");
      const ipfsCid = await uploadToIPFS(encryptedJson);

      // Phase 3: Write reference to Ethereum Contract
      setLoadingPhase("Writing hash reference pointer (CID) to Ethereum Registry...");
      // Encrypt the metadata label (website title) to protect privacy on-chain
      const encryptedMetadata = encryptLocal(JSON.stringify({ title: websiteName }), masterKeyHex);
      
      const txReceipt = await storeRecordOnChain(ipfsCid, encryptedMetadata);

      // Phase 4: Sync index reference with the Backend
      setLoadingPhase("Synchronizing transaction metrics with backend audit logs...");
      const syncRes = await api.post("/transactions/log", {
        txHash: txReceipt.txHash,
        ipfsHash: ipfsCid,
        actionType: "STORE",
        gasUsed: txReceipt.gasUsed,
        blockNumber: txReceipt.blockNumber,
      });

      // Fetch index assigned by the contract (simulate length size)
      const currentLength = 0; // index mapping

      // Phase 5: Cache local copy
      dispatch(
        addVaultItem({
          id: Math.random().toString(36).slice(2, 9),
          ipfsHash: ipfsCid,
          blockchainIndex: currentLength,
          encryptedData: encryptedJson,
          websiteName,
          username,
          category,
          isFavorite: false,
          updatedAt: Date.now(),
        })
      );

      // Trigger transaction receipt presentation overlay
      setReceipt({
        txHash: txReceipt.txHash,
        ipfsHash: ipfsCid,
        gasUsed: txReceipt.gasUsed,
        blockNumber: txReceipt.blockNumber,
        network: txReceipt.network,
      });
      setShowReceiptModal(true);

    } catch (err: any) {
      console.error(err);
      Alert.alert("Upload Failed", err.message || "Credential upload process failed.");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const handleCloseModal = () => {
    setShowReceiptModal(false);
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>◀ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Credential</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Credential Type</Text>
          <View style={styles.catContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catTab,
                  category === cat ? styles.catTabActive : null,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.catTabText,
                    category === cat ? styles.catTabTextActive : null,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Google Account, Binance"
            placeholderTextColor={colors.dark.textMuted}
            value={websiteName}
            onChangeText={setWebsiteName}
          />

          <Text style={styles.inputLabel}>Website URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://accounts.google.com"
            placeholderTextColor={colors.dark.textMuted}
            autoCapitalize="none"
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
          />

          <Text style={styles.inputLabel}>Username / Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Username or email address"
            placeholderTextColor={colors.dark.textMuted}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.inputLabel}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Master password protected secret"
            placeholderTextColor={colors.dark.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional details (encrypted)"
            placeholderTextColor={colors.dark.textMuted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />

          <Text style={styles.inputLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="finance, personal, work"
            placeholderTextColor={colors.dark.textMuted}
            value={tags}
            onChangeText={setTags}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.dark.accent} size="large" />
              <Text style={styles.loadingPhase}>{loadingPhase}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={handleSave}>
              <Text style={styles.btnText}>Encrypt & Upload to Block</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* High Fidelity Blockchain Transaction Receipt Modal */}
      <Modal visible={showReceiptModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>⛓️</Text>
            <Text style={styles.modalHeader}>Decentralized Store Receipt</Text>
            <Text style={styles.modalSub}>Immutable block payload written successfully!</Text>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Transaction Hash</Text>
              <Text style={styles.receiptVal} numberOfLines={1} ellipsizeMode="middle">
                {receipt?.txHash}
              </Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>IPFS Content ID (CID)</Text>
              <Text style={[styles.receiptVal, { color: colors.dark.accent }]} numberOfLines={1} ellipsizeMode="middle">
                {receipt?.ipfsHash}
              </Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Gas Used</Text>
              <Text style={styles.receiptVal}>{receipt?.gasUsed} Gwei</Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Block Number</Text>
              <Text style={styles.receiptVal}>#{receipt?.blockNumber}</Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Network Node</Text>
              <Text style={styles.receiptVal}>{receipt?.network}</Text>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseModal}>
              <Text style={styles.modalCloseBtnText}>Acknowledge Registry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inputLabel: {
    color: colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: layout.spacing.sm,
  },
  catContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: layout.spacing.sm,
  },
  catTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    borderRadius: layout.borderRadius.medium - 4,
  },
  catTabActive: {
    backgroundColor: colors.dark.primary,
  },
  catTabText: {
    color: colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  catTabTextActive: {
    color: "#FFF",
  },
  input: {
    backgroundColor: colors.dark.inputBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.medium - 4,
    padding: 14,
    color: "#FFF",
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
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
  loadingContainer: {
    alignItems: "center",
    padding: layout.spacing.lg,
    marginTop: layout.spacing.sm,
  },
  loadingPhase: {
    color: colors.dark.accent,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: layout.spacing.lg,
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: layout.borderRadius.large,
    padding: layout.spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: layout.spacing.sm,
  },
  modalHeader: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  modalSub: {
    color: colors.dark.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: layout.spacing.lg,
    textAlign: "center",
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  receiptLabel: {
    color: colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  receiptVal: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "50%",
  },
  modalCloseBtn: {
    backgroundColor: colors.dark.success,
    width: "100%",
    padding: 16,
    borderRadius: layout.borderRadius.medium,
    alignItems: "center",
    marginTop: layout.spacing.xl,
  },
  modalCloseBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
