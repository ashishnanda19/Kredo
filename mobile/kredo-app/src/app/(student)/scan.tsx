import { View, Pressable, StyleSheet, PanResponder, Animated } from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

type VendorNearby = {
  id: string;
  name: string;
  kind: string;
  dist: string;
  iconType: "cafe" | "print" | "shop";
};

const NEARBY_LIST: VendorNearby[] = [
  { id: "cafe", name: "Campus Cafe", kind: "Canteen", dist: "35 m", iconType: "cafe" },
  { id: "print", name: "Xerox Corner", kind: "Print and copy", dist: "80 m", iconType: "print" },
  { id: "shop", name: "Daily Needs", kind: "Stationery", dist: "140 m", iconType: "shop" },
];

export default function Scan() {
  const router = useRouter();
  const [selectedVendor, setSelectedVendor] = useState<VendorNearby | null>(null);
  const [amountStr, setAmountStr] = useState("");

  const numAmt = amountStr ? parseInt(amountStr, 10) : 0;
  const total = numAmt + 5;
  const isOver = numAmt > 0 && total > 2880;
  const hasAmount = numAmt > 0 && !isOver;

  // Slide to pay slider state
  const SLIDE_WIDTH = 280;
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newX = Math.max(0, Math.min(SLIDE_WIDTH, gestureState.dx));
      pan.setValue(newX);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx >= SLIDE_WIDTH * 0.75) {
        Animated.timing(pan, {
          toValue: SLIDE_WIDTH,
          duration: 150,
          useNativeDriver: false,
        }).start(() => {
          router.push("/(student)/paid");
        });
      } else {
        Animated.spring(pan, {
          toValue: 0,
          friction: 6,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleKeyPress = (digit: string) => {
    if (amountStr.length >= 4) return;
    setAmountStr((prev) => (prev + digit).replace(/^0+/, ""));
  };

  const handleDelete = () => {
    setAmountStr((prev) => prev.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <View style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push("/(student)/home")} style={styles.iconBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Scan and pay</Text>
        <View style={styles.iconBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M13 3L5 13h6l-1 8 8-10h-6z" />
          </Svg>
        </View>
      </View>

      {/* Camera Viewfinder Box (Interactive simulation) */}
      <View style={styles.cameraSection}>
        <Pressable
          onPress={() => setSelectedVendor(NEARBY_LIST[0])}
          style={styles.viewfinderCard}
        >
          {/* 4 Corner Camera Brackets */}
          <View style={[styles.corner, { left: 26, top: 26, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 16 }]} />
          <View style={[styles.corner, { right: 26, top: 26, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 16 }]} />
          <View style={[styles.corner, { left: 26, bottom: 26, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 16 }]} />
          <View style={[styles.corner, { right: 26, bottom: 26, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 16 }]} />

          {/* Scanline */}
          <View style={styles.scanline} />
          <Text style={styles.viewfinderText}>Point at a stall QR</Text>
        </Pressable>
      </View>

      {/* Near You Header */}
      <View style={styles.nearYouSection}>
        <View style={styles.nearYouHeaderRow}>
          <View style={styles.pingWrap}>
            <View style={styles.pingDot} />
          </View>
          <Text style={styles.nearYouTitle}>Near you</Text>
          <View style={styles.gpsBadge}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsBadgeText}>GPS on</Text>
          </View>
        </View>
        <Text style={styles.nearYouSubtitle}>
          3 partner vendors within 200 m. Tap one to pay without scanning.
        </Text>
      </View>

      {/* Nearby Vendors List */}
      <View style={styles.vendorListCard}>
        {NEARBY_LIST.map((vendor, idx) => (
          <Pressable
            key={vendor.id}
            onPress={() => setSelectedVendor(vendor)}
            style={[styles.vendorRow, idx > 0 && styles.vendorBorder]}
          >
            <View style={styles.vendorIconBox}>
              {vendor.iconType === "cafe" && (
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2 2 0 0 1 0 4H16M8 4v2M12 4v2" />
                </Svg>
              )}
              {vendor.iconType === "print" && (
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
                </Svg>
              )}
              {vendor.iconType === "shop" && (
                <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 7h16M4 7l2 12h12l2-12M9 11v4M15 11v4" />
                </Svg>
              )}
            </View>

            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <Text style={styles.vendorMeta}>{vendor.kind} · {vendor.dist}</Text>
            </View>

            <View style={styles.payBtnSmall}>
              <Text style={styles.payBtnSmallText}>Pay</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={styles.locationDisclaimer}>
        Your location is only used to find vendors near you.
      </Text>

      {/* Payment Sheet Modal */}
      {selectedVendor && (
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => setSelectedVendor(null)} style={styles.modalBackdrop} />

          <View style={styles.sheetBox}>
            <View style={styles.sheetHandle} />

            {/* Vendor Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderInfo}>
                <Text style={styles.sheetVendorTitle}>{selectedVendor.name}</Text>
                <Text style={styles.sheetVendorDist}>{selectedVendor.dist} away. Partner vendor</Text>
              </View>
              <Pressable onPress={() => setSelectedVendor(null)} style={styles.closeBtn}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 6l12 12M18 6L6 18" />
                </Svg>
              </Pressable>
            </View>

            {/* Amount Display */}
            <Text style={styles.sheetAmountText}>
              {amountStr ? `₹${amountStr}` : "₹0"}
            </Text>
            <Text style={styles.sheetCostLine}>
              {numAmt > 0
                ? `Cost to you: ₹${numAmt}. Fee: ₹5. Total due on 7 Dec: ₹${total}`
                : "Cost to you shown before you pay"}
            </Text>

            {/* Numeric Keypad */}
            <View style={styles.keypadGrid}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, idx) => {
                if (k === "") return <View key={idx} style={styles.keypadCell} />;
                if (k === "del") {
                  return (
                    <Pressable key={idx} onPress={handleDelete} style={styles.keypadCell}>
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6z" />
                        <Path d="M12 10l4 4M16 10l-4 4" />
                      </Svg>
                    </Pressable>
                  );
                }
                return (
                  <Pressable key={idx} onPress={() => handleKeyPress(k)} style={styles.keypadCell}>
                    <Text style={styles.keypadText}>{k}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Slide to Pay or Disabled CTA */}
            <View style={styles.sheetActionWrap}>
              {hasAmount && (
                <View style={styles.sliderContainer}>
                  <Animated.View style={[styles.sliderFill, { width: pan }]} />
                  <Text style={styles.sliderLabel}>Slide to pay ₹{total}</Text>
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[styles.sliderThumb, { transform: [{ translateX: pan }] }]}
                  >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12h14M13 6l6 6-6 6" />
                    </Svg>
                  </Animated.View>
                </View>
              )}

              {isOver && (
                <Pressable onPress={() => router.push("/(student)/limit")} style={styles.overLimitBtn}>
                  <Text style={styles.overLimitText}>Over your limit of ₹2,880</Text>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A3261B" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 6l6 6-6 6" />
                  </Svg>
                </Pressable>
              )}

              {!amountStr && (
                <View style={styles.noAmountBtn}>
                  <Text style={styles.noAmountText}>Enter an amount</Text>
                </View>
              )}

              <Text style={styles.sheetRepayDisclaimer}>
                You repay our lending partner by 7 Dec, not Kredo.
              </Text>
            </View>
          </View>
        </View>
      )}
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
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  cameraSection: {
    marginTop: 26,
    alignItems: "center",
  },
  viewfinderCard: {
    width: 256,
    height: 256,
    borderRadius: 36,
    backgroundColor: "#F4F2EB",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 38,
    height: 38,
    borderColor: INK,
  },
  scanline: {
    position: "absolute",
    left: 40,
    right: 40,
    top: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E3CB4A",
  },
  viewfinderText: {
    position: "absolute",
    bottom: 30,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B70",
  },
  nearYouSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  nearYouHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pingWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E3CB4A",
  },
  nearYouTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: INK,
  },
  gpsBadge: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#E3F2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2E9B57",
  },
  gpsBadgeText: {
    color: "#1B6B3A",
    fontSize: 12,
    fontWeight: "800",
  },
  nearYouSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B6B70",
  },
  vendorListCard: {
    marginTop: 14,
    marginHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
  },
  vendorBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
  },
  vendorIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  vendorMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  payBtnSmall: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnSmallText: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },
  locationDisclaimer: {
    marginTop: 16,
    fontSize: 12,
    color: "#6B6B70",
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  modalBackdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(11,11,12,0.3)",
  },
  sheetBox: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: INK,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E4E1D8",
    alignSelf: "center",
  },
  sheetHeader: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetHeaderInfo: {
    flex: 1,
  },
  sheetVendorTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: INK,
  },
  sheetVendorDist: {
    fontSize: 13,
    color: "#6B6B70",
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAmountText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2,
    color: INK,
  },
  sheetCostLine: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    color: "#6B6B70",
    minHeight: 20,
  },
  keypadGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  keypadCell: {
    width: "32%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadText: {
    fontSize: 24,
    fontWeight: "600",
    color: INK,
  },
  sheetActionWrap: {
    marginTop: 14,
  },
  sliderContainer: {
    position: "relative",
    height: 64,
    borderRadius: 32,
    backgroundColor: INK,
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: "#E3CB4A",
  },
  sliderLabel: {
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingLeft: 24,
  },
  sliderThumb: {
    position: "absolute",
    left: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1DD6A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  overLimitBtn: {
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F9E1DE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  overLimitText: {
    color: "#A3261B",
    fontSize: 16,
    fontWeight: "800",
  },
  noAmountBtn: {
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECEAE4",
    alignItems: "center",
    justifyContent: "center",
  },
  noAmountText: {
    color: "#9A9AA0",
    fontSize: 16,
    fontWeight: "800",
  },
  sheetRepayDisclaimer: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
});
