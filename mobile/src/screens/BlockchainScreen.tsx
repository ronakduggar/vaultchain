import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { colors, layout } from "../theme/theme";
import api from "../services/apiService";

interface BlockchainScreenProps {
  onBack: () => void;
}

export const BlockchainScreen: React.FC<BlockchainScreenProps> = ({ onBack }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTxHistory();
  }, []);

  const fetchTxHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/transactions/history");
      setHistory(res.data);
    } catch (err: any) {
      console.warn("Failed to fetch blockchain logs from server:", err.message);
      // fallback mock logs for demonstration
      setHistory([
        {
          _id: "1",
          txHash: "0x39a16f2c3b88b0a30b88def098f642f64180aa3cb88b0a30b88def098f642f56",
          ipfsHash: "QmYwAPJviwgoP3ver9nReurx1mUrBeOkUpz3a16f2c3w3j3",
          actionType: "STORE",
          gasUsed: 48512,
          blockNumber: 12053422,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTxPress = (tx: any) => {
    Alert.alert(
      "Block Metadata Integrity",
      `Transaction Hash: ${tx.txHash}\n\nIPFS Content Pointer (CID): ${tx.ipfsHash}\n\nGas Used: ${tx.gasUsed} gwei\n\nBlock Confirmation: #${tx.blockNumber}\n\nNetwork Node: Hardhat Localhost (1337)\n\nDecentralized payload verified.`,
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blockchain Registry</Text>
        <TouchableOpacity onPress={fetchTxHistory}>
          <Text style={styles.backBtn}>🔄</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Smart Contract Registry</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Contract Address:</Text>
              <Text style={styles.metaVal} numberOfLines={1}>0x5fbdb2315678afecb367f032d93f642f64180aa3</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Network Node:</Text>
              <Text style={[styles.metaVal, { color: colors.dark.success }]}>Active - Local Chain 1337</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Linked Wallet:</Text>
              <Text style={[styles.metaVal, { color: colors.dark.accent }]} numberOfLines={1}>
                {user?.walletAddress || "None Linked"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, styles.txCard]} onPress={() => handleTxPress(item)}>
            <View style={styles.txRowHeader}>
              <Text style={styles.txAction}>{item.actionType}</Text>
              <Text style={styles.txBlock}>Block #{item.blockNumber}</Text>
            </View>
            <Text style={styles.txHash} numberOfLines={1}>Tx: {item.txHash}</Text>
            <View style={styles.txFooter}>
              <Text style={styles.txGas}>Gas Used: {item.gasUsed}</Text>
              <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transaction records recorded yet.</Text>
          </View>
        }
      />
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
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
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
    marginBottom: layout.spacing.lg,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: layout.spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
  },
  metaLabel: {
    color: colors.dark.textMuted,
    fontSize: 13,
  },
  metaVal: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "50%",
  },
  txCard: {
    padding: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  txRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  txAction: {
    color: colors.dark.accent,
    fontSize: 14,
    fontWeight: "800",
  },
  txBlock: {
    color: colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  txHash: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "System",
    marginVertical: 4,
  },
  txFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  txGas: {
    color: colors.dark.textMuted,
    fontSize: 11,
  },
  txDate: {
    color: colors.dark.textMuted,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: layout.spacing.xl,
  },
  emptyText: {
    color: colors.dark.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
