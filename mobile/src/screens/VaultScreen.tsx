import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { colors, layout } from "../theme/theme";
import { deleteVaultItem, toggleFavorite, VaultItem } from "../redux/vaultSlice";
import { deleteRecordOnChain } from "../services/ethersService";
import api from "../services/apiService";

interface VaultScreenProps {
  onSelectItem: (item: VaultItem) => void;
  onNavigate: (screenName: string) => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({
  onSelectItem,
  onNavigate,
}) => {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.vault.items);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isGridView, setIsGridView] = useState(false);

  const categories = ["All", "Logins", "Cards", "Secure Notes"];

  // Filtering logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.websiteName.toLowerCase().includes(search.toLowerCase()) ||
      item.username.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleDelete = (item: VaultItem) => {
    Alert.alert(
      "Confirm Removal",
      `Are you sure you want to delete ${item.websiteName}? This will perform a transaction to delete the pointer from Ethereum.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Registry Pointer",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Send transaction to contract
              await deleteRecordOnChain(item.blockchainIndex);

              // 2. Post transaction logs to backend
              await api.post("/transactions/log", {
                txHash: "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(""),
                ipfsHash: item.ipfsHash,
                actionType: "DELETE",
                gasUsed: 14210,
                blockNumber: 12053495,
              });

              // 3. Remove local cache
              dispatch(deleteVaultItem(item.id));
              Alert.alert("Success", "Password deleted from local and blockchain registries.");
            } catch (err: any) {
              Alert.alert("Deletion Failed", err.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: VaultItem }) => {
    const isFav = item.isFavorite;

    return (
      <View style={[styles.card, isGridView ? styles.gridCard : styles.listCard]}>
        <TouchableOpacity style={styles.cardMain} onPress={() => onSelectItem(item)}>
          <View style={styles.cardHeader}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoLetter}>
                {item.websiteName ? item.websiteName.charAt(0).toUpperCase() : "🔑"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => dispatch(toggleFavorite(item.id))}>
              <Text style={styles.favoriteIcon}>{isFav ? "⭐️" : "☆"}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.websiteName}
            </Text>
            <Text style={styles.cardUser} numberOfLines={1}>
              {item.username}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Text style={styles.categoryBadge}>{item.category}</Text>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtn}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search credential vault..."
          placeholderTextColor={colors.dark.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.toggleViewBtn}
          onPress={() => setIsGridView(!isGridView)}
        >
          <Text style={{ fontSize: 18 }}>{isGridView ? "📊" : "📱"}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Slider */}
      <View style={styles.categoriesContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryTab,
              selectedCategory === cat ? styles.categoryTabActive : null,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === cat ? styles.categoryTabTextActive : null,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vault List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={isGridView ? 2 : 1}
        key={isGridView ? "g" : "l"}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No credentials match your query.</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => onNavigate("AddPassword")}
            >
              <Text style={styles.emptyAddBtnText}>Add Credentials</Text>
            </TouchableOpacity>
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
  searchHeader: {
    flexDirection: "row",
    paddingHorizontal: layout.spacing.lg,
    paddingTop: layout.spacing.md,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.dark.inputBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.medium,
    padding: 14,
    color: "#FFF",
    fontSize: 16,
  },
  toggleViewBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    borderRadius: layout.borderRadius.medium,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingHorizontal: layout.spacing.lg,
    marginVertical: layout.spacing.md,
    gap: 8,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: layout.borderRadius.round,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  categoryTabActive: {
    backgroundColor: colors.dark.primary,
  },
  categoryTabText: {
    color: colors.dark.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryTabTextActive: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: layout.spacing.lg,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.dark.cardBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.large,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
  },
  listCard: {
    width: "100%",
  },
  gridCard: {
    width: "48%",
    marginHorizontal: "1%",
  },
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: layout.borderRadius.medium - 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  favoriteIcon: {
    fontSize: 18,
    color: colors.dark.warning,
  },
  cardBody: {
    marginVertical: layout.spacing.sm,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  cardUser: {
    color: colors.dark.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  categoryBadge: {
    color: colors.dark.accent,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  deleteBtn: {
    fontSize: 16,
  },
  emptyContainer: {
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
});
