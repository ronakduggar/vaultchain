import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { colors, layout, shadows } from "../theme/theme";
import { lockVault } from "../redux/authSlice";

interface DashboardScreenProps {
  onNavigate: (screenName: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector((state: RootState) => state.vault.items);

  // Derive counts
  const totalPasswords = items.length;
  const recentItems = [...items]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  const securityScore = user?.securityScore || 100;
  const storageUsedKb = (totalPasswords * 0.5).toFixed(2); // simulated storage used on IPFS

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header Card */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name || "Vault Owner"}</Text>
          </View>
          <TouchableOpacity style={styles.lockBtn} onPress={() => dispatch(lockVault())}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
          </TouchableOpacity>
        </View>

        {/* Circular Progress & Metrics Section */}
        <View style={styles.metricsRow}>
          <View style={[styles.card, styles.scoreCard]}>
            {/* High Fidelity Simulated SVG Circle */}
            <View style={styles.circleContainer}>
              <View style={styles.innerCircle}>
                <Text style={styles.scoreNumber}>{securityScore}%</Text>
                <Text style={styles.scoreSub}>Security</Text>
              </View>
            </View>
            <Text style={styles.scoreLabel}>Audit Status</Text>
          </View>

          <View style={styles.metricStats}>
            <View style={[styles.card, styles.miniMetric]}>
              <Text style={styles.metricVal}>{totalPasswords}</Text>
              <Text style={styles.metricLbl}>Vault Size</Text>
            </View>
            <View style={[styles.card, styles.miniMetric]}>
              <Text style={[styles.metricVal, { color: colors.dark.accent }]}>
                {storageUsedKb} KB
              </Text>
              <Text style={styles.metricLbl}>IPFS Storage</Text>
            </View>
          </View>
        </View>

        {/* Quick Operations Actions */}
        <Text style={styles.sectionHeader}>Vault Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.card, styles.actionCard]}
            onPress={() => onNavigate("AddPassword")}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Add Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.actionCard]}
            onPress={() => onNavigate("Generator")}
          >
            <Text style={styles.actionIcon}>⚡</Text>
            <Text style={styles.actionText}>Generator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.actionCard]}
            onPress={() => onNavigate("SecurityCenter")}
          >
            <Text style={styles.actionIcon}>🛡️</Text>
            <Text style={styles.actionText}>Security Audit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.actionCard]}
            onPress={() => onNavigate("BlockchainLogs")}
          >
            <Text style={styles.actionIcon}>⛓️</Text>
            <Text style={styles.actionText}>Block Registry</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Added List */}
        <View style={styles.recentHeaderContainer}>
          <Text style={styles.sectionHeader}>Recently Updated</Text>
          <TouchableOpacity onPress={() => onNavigate("Vault")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentItems.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyText}>Vault is currently empty.</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => onNavigate("AddPassword")}
            >
              <Text style={styles.emptyAddBtnText}>Add Your First Password</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, styles.recentCard]}
              onPress={() => onNavigate("Vault")}
            >
              <View style={styles.recentItemLeft}>
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoLetter}>
                    {item.websiteName ? item.websiteName.charAt(0).toUpperCase() : "🔑"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.recentTitle}>{item.websiteName}</Text>
                  <Text style={styles.recentUser}>{item.username}</Text>
                </View>
              </View>
              <Text style={styles.recentCategory}>{item.category}</Text>
            </TouchableOpacity>
          ))
        )}
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
  welcomeText: {
    color: colors.dark.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  nameText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  lockBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    borderRadius: layout.borderRadius.medium,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: layout.spacing.lg,
  },
  card: {
    backgroundColor: colors.dark.cardBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.large,
    padding: layout.spacing.md,
  },
  scoreCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: layout.spacing.xs,
  },
  innerCircle: {
    alignItems: "center",
  },
  scoreNumber: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
  },
  scoreSub: {
    color: colors.dark.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scoreLabel: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  metricStats: {
    flex: 1,
    justifyContent: "space-between",
    gap: 12,
  },
  miniMetric: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: layout.spacing.md,
  },
  metricVal: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  metricLbl: {
    color: colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: layout.spacing.lg,
  },
  actionCard: {
    width: "48%", // Grid layout spacer
    paddingVertical: layout.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  recentHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: layout.spacing.sm,
    marginBottom: layout.spacing.xs,
  },
  viewAllText: {
    color: colors.dark.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: layout.spacing.xl,
  },
  emptyText: {
    color: colors.dark.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: layout.spacing.md,
  },
  emptyAddBtn: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: layout.borderRadius.medium,
  },
  emptyAddBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  recentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.sm,
    paddingVertical: 14,
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  recentTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  recentUser: {
    color: colors.dark.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  recentCategory: {
    color: colors.dark.accent,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    textTransform: "uppercase",
  },
});
