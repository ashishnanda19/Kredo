import { View, Pressable, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

const CATEGORIES = ["Canteen", "Print and copy", "Stationery", "Other"];

export default function VendorDetails() {
  const router = useRouter();
  const [stall, setStall] = useState("Campus Cafe");
  const [cat, setCat] = useState("Canteen");
  const [pinState, setPinState] = useState<0 | 1 | 2>(0); // 0: unpinned, 1: finding, 2: pinned

  const handlePin = () => {
    if (pinState !== 0) return;
    setPinState(1);
    setTimeout(() => setPinState(2), 1200);
  };

  const isReady = pinState === 2 && stall.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <Glow style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Top Header & Progress */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <View style={styles.stepWrap}>
          <View style={styles.stepLabels}>
            <Text style={styles.stepMuted}>Step 1 of 3</Text>
            <Text style={styles.stepMuted}>Your stall</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
      </View>

      {/* Screen Title */}
      <View style={styles.titleWrap}>
        <Text style={styles.mainTitle}>
          <Text>Tell us about{"\n"}</Text>
          <Text>your stall</Text>
        </Text>
      </View>

      {/* Stall Name Input */}
      <View style={styles.sectionWrap}>
        <Text style={styles.fieldLabel}>Stall name</Text>
        <TextInput
          value={stall}
          onChangeText={setStall}
          style={styles.textInput}
          placeholder="e.g. Campus Cafe"
          placeholderTextColor="#9A9AA0"
        />

        {/* Category Chips */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Category</Text>
        <View style={styles.chipsRow}>
          {CATEGORIES.map((item) => {
            const isSelected = item === cat;
            return (
              <Pressable
                key={item}
                onPress={() => setCat(item)}
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
              >
                <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Pin Location Map Box */}
      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Pin your stall</Text>
          <Text style={styles.mapSubtitle}>Students near you can find you</Text>
        </View>

        <Pressable onPress={handlePin} style={styles.mapCard}>
          {/* Simulated map lines */}
          <View style={styles.mapGrid} />
          <View style={styles.road1} />
          <View style={styles.road2} />
          <View style={styles.building1} />
          <View style={styles.building2} />

          {pinState === 0 && (
            <View style={styles.mapCenter}>
              <View style={styles.useLocationBtn}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="3" />
                  <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <Circle cx="12" cy="12" r="8" />
                </Svg>
                <Text style={styles.useLocationText}>Use my location</Text>
              </View>
            </View>
          )}

          {pinState === 1 && (
            <View style={styles.mapCenter}>
              <View style={styles.pulseDot} />
              <Text style={styles.findingText}>Finding you…</Text>
            </View>
          )}

          {pinState === 2 && (
            <View style={styles.mapCenter}>
              {/* Drop Pin */}
              <View style={styles.pinDrop}>
                <Svg width={36} height={46} viewBox="0 0 40 52">
                  <Path d="M20 50C20 50 4 33 4 19a16 16 0 0 1 32 0c0 14-16 31-16 31z" fill={INK} />
                  <Circle cx="20" cy="19" r="7" fill="#F1DD6A" />
                </Svg>
              </View>
              {/* Green Pinned Badge */}
              <View style={styles.pinnedBadge}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7" />
                </Svg>
                <Text style={styles.pinnedBadgeText}>Pinned: Block B, campus</Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomWrap}>
        {isReady ? (
          <Pressable
            onPress={() => router.push("/(vendor)/verify")}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </Pressable>
        ) : (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Pin your stall to continue</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  glow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 92,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET_BG,
    shadowColor: "rgba(120,90,0,0.45)",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  topBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  stepWrap: {
    flex: 1,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepMuted: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B6B70",
  },
  progressBarBg: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EAE7DF",
    overflow: "hidden",
  },
  progressBarFill: {
    width: "33%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#E3CB4A",
  },
  titleWrap: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 38,
    color: INK,
  },
  sectionWrap: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B6B70",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  textInput: {
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    fontSize: 17,
    fontWeight: "700",
    color: INK,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: INK,
    borderColor: INK,
  },
  chipUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  chipTextUnselected: {
    color: INK,
  },
  mapSection: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mapTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B6B70",
  },
  mapSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  mapCard: {
    height: 150,
    borderRadius: 26,
    backgroundColor: "#F1EFE9",
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    position: "relative",
  },
  mapGrid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ECE8DD",
  },
  road1: {
    position: "absolute",
    left: -20,
    top: 62,
    width: 400,
    height: 14,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-8deg" }],
  },
  road2: {
    position: "absolute",
    left: 150,
    top: -20,
    width: 14,
    height: 200,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "14deg" }],
  },
  building1: {
    position: "absolute",
    left: 22,
    top: 18,
    width: 70,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E7E3D8",
  },
  building2: {
    position: "absolute",
    right: 24,
    bottom: 16,
    width: 90,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E7E3D8",
  },
  mapCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  useLocationBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  useLocationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  pulseDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E3CB4A",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  findingText: {
    position: "absolute",
    bottom: 14,
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  pinDrop: {
    marginTop: -20,
  },
  pinnedBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pinnedBadgeText: {
    color: "#1B6B3A",
    fontSize: 12,
    fontWeight: "800",
  },
  bottomWrap: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  continueBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  disabledBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ECEAE4",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtnText: {
    color: "#9A9AA0",
    fontSize: 17,
    fontWeight: "700",
  },
});
