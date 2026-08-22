import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Provider, useSelector, useDispatch } from "react-redux";
import store, { RootState } from "./src/redux/store";
import { colors, layout } from "./src/theme/theme";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { VaultScreen } from "./src/screens/VaultScreen";
import { AddPasswordScreen } from "./src/screens/AddPasswordScreen";
import { PasswordDetailsScreen } from "./src/screens/PasswordDetailsScreen";
import { GeneratorScreen } from "./src/screens/GeneratorScreen";
import { SecurityCenterScreen } from "./src/screens/SecurityCenterScreen";
import { BlockchainScreen } from "./src/screens/BlockchainScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { VaultItem } from "./src/redux/vaultSlice";

const MainNavigator: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const isLocked = useSelector((state: RootState) => state.auth.isLocked);
  
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("Dashboard");
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

  // Authentication gate
  if (!isOnboardingCompleted) {
    return <OnboardingScreen onComplete={() => setIsOnboardingCompleted(true)} />;
  }

  if (!token || isLocked) {
    return <AuthScreen />;
  }

  // Handle custom stack routing
  const navigateTo = (screenName: string) => {
    setCurrentScreen(screenName);
  };

  const handleSelectItem = (item: VaultItem) => {
    setSelectedItem(item);
    setCurrentScreen("PasswordDetails");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "Dashboard":
        return <DashboardScreen onNavigate={navigateTo} />;
      case "Vault":
        return <VaultScreen onSelectItem={handleSelectItem} onNavigate={navigateTo} />;
      case "AddPassword":
        return <AddPasswordScreen onBack={() => navigateTo("Dashboard")} />;
      case "PasswordDetails":
        if (selectedItem) {
          return <PasswordDetailsScreen item={selectedItem} onBack={() => navigateTo("Vault")} />;
        }
        return <VaultScreen onSelectItem={handleSelectItem} onNavigate={navigateTo} />;
      case "Generator":
        return <GeneratorScreen onBack={() => navigateTo("Dashboard")} />;
      case "SecurityCenter":
        return <SecurityCenterScreen onBack={() => navigateTo("Dashboard")} />;
      case "BlockchainLogs":
        return <BlockchainScreen onBack={() => navigateTo("Dashboard")} />;
      case "Settings":
        return <SettingsScreen onBack={() => navigateTo("Dashboard")} />;
      default:
        return <DashboardScreen onNavigate={navigateTo} />;
    }
  };

  // Bottom Navigation Bar for main tabs
  const showTabs = ["Dashboard", "Vault", "Settings"].includes(currentScreen);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark.background} />
      <View style={styles.body}>{renderScreen()}</View>

      {showTabs && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, currentScreen === "Dashboard" ? styles.tabActive : null]}
            onPress={() => navigateTo("Dashboard")}
          >
            <Text style={styles.tabIcon}>📱</Text>
            <Text style={styles.tabLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, currentScreen === "Vault" ? styles.tabActive : null]}
            onPress={() => navigateTo("Vault")}
          >
            <Text style={styles.tabIcon}>🔑</Text>
            <Text style={styles.tabLabel}>Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, currentScreen === "Settings" ? styles.tabActive : null]}
            onPress={() => navigateTo("Settings")}
          >
            <Text style={styles.tabIcon}>⚙️</Text>
            <Text style={styles.tabLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <MainNavigator />
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderTopColor: colors.dark.cardBorder,
    borderTopWidth: 1,
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backdropFilter: "blur(20px)",
    height: 70,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabActive: {
    opacity: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default App;
