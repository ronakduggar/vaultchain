import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { colors, layout } from "../theme/theme";

const { width } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to VaultChain",
      subtitle: "Your passwords secured by the Ethereum blockchain.",
      desc: "VaultChain utilizes military-grade key derivation to secure your database. Not even our servers can read your data.",
      icon: "🔒",
    },
    {
      title: "Military-Grade Encryption",
      subtitle: "AES-256 local decryption keys.",
      desc: "Your credentials are encrypted locally on your device using a PBKDF2 derived key. Plaintext passwords never travel across the wire.",
      icon: "🛡️",
    },
    {
      title: "Decentralized IPFS Storage",
      subtitle: "Own your data. No single point of failure.",
      desc: "The encrypted vault blocks are hosted on IPFS. The hash pointer (CID) is immutable and recorded on Ethereum.",
      icon: "🌐",
    },
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Progress Indicators */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.indicator,
              idx === activeSlide ? styles.indicatorActive : null,
            ]}
          />
        ))}
      </View>

      {/* Main Slide Card */}
      <View style={styles.slideCard}>
        <Text style={styles.icon}>{slides[activeSlide].icon}</Text>
        <Text style={styles.title}>{slides[activeSlide].title}</Text>
        <Text style={styles.subtitle}>{slides[activeSlide].subtitle}</Text>
        <Text style={styles.desc}>{slides[activeSlide].desc}</Text>
      </View>

      {/* Bottom Control Bar */}
      <View style={styles.controlContainer}>
        {activeSlide > 0 ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => setActiveSlide(activeSlide - 1)}
          >
            <Text style={styles.skipText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.btnText}>
            {activeSlide === slides.length - 1 ? "Get Started" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: "space-between",
    padding: layout.spacing.lg,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: layout.spacing.lg,
    gap: 8,
  },
  indicator: {
    width: 24,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: colors.dark.primary,
    width: 36,
  },
  slideCard: {
    backgroundColor: colors.dark.cardBg,
    borderColor: colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: layout.borderRadius.large,
    padding: layout.spacing.xl,
    marginHorizontal: layout.spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  icon: {
    fontSize: 72,
    marginBottom: layout.spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.dark.text,
    textAlign: "center",
    marginBottom: layout.spacing.sm,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.accent,
    textAlign: "center",
    marginBottom: layout.spacing.md,
  },
  desc: {
    fontSize: 14,
    color: colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  controlContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.spacing.md,
    marginBottom: layout.spacing.lg,
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    color: colors.dark.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: layout.borderRadius.medium,
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
});
