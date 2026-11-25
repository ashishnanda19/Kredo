import { View, Pressable, StyleSheet, Share } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function VendorQr() {
  // The system sheet offers Print on iPhone and share targets everywhere.
  const shareQr = () =>
    Share.share({ title: "Campus Cafe stall QR", message: "Pay Campus Cafe with Kredo: scan the stall QR in the Kredo app (demo, simulated)." });
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <Glow style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.push("/(vendor)/today")} style={styles.iconBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Your stall QR</Text>
        <View style={styles.iconBtn}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </Svg>
        </View>
      </View>

      {/* Central QR Card */}
      <View style={styles.centerSection}>
        <View style={styles.qrCard}>
          {/* Top Yellow Stall Banner */}
          <View style={styles.cardBanner}>
            <View style={styles.bannerAvatar}>
              <Text style={styles.bannerAvatarText}>C</Text>
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>Campus Cafe</Text>
              <Text style={styles.bannerSubtitle}>Kredo partner</Text>
            </View>
            <View style={styles.checkCircle}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12.5l4.5 4.5L19 7" />
              </Svg>
            </View>
          </View>

          {/* QR Code Container (Interactive: tap to simulate receiving payment) */}
          <Pressable
            onPress={() => router.push("/(vendor)/received")}
            style={styles.qrArea}
          >
            {/* Crisp QR Code Vector */}
            <Svg width={220} height={220} viewBox="0 0 25 25">
              <Path
                fill={INK}
                d="M0 0h1v1h-1zM1 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM8 0h1v1h-1zM9 0h1v1h-1zM11 0h1v1h-1zM13 0h1v1h-1zM14 0h1v1h-1zM16 0h1v1h-1zM18 0h1v1h-1zM19 0h1v1h-1zM20 0h1v1h-1zM21 0h1v1h-1zM22 0h1v1h-1zM23 0h1v1h-1zM24 0h1v1h-1zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM11 1h1v1h-1zM13 1h1v1h-1zM14 1h1v1h-1zM18 1h1v1h-1zM24 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM9 2h1v1h-1zM11 2h1v1h-1zM13 2h1v1h-1zM14 2h1v1h-1zM15 2h1v1h-1zM16 2h1v1h-1zM18 2h1v1h-1zM20 2h1v1h-1zM21 2h1v1h-1zM22 2h1v1h-1zM24 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM9 3h1v1h-1zM12 3h1v1h-1zM14 3h1v1h-1zM15 3h1v1h-1zM16 3h1v1h-1zM18 3h1v1h-1zM20 3h1v1h-1zM21 3h1v1h-1zM22 3h1v1h-1zM24 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM12 4h1v1h-1zM13 4h1v1h-1zM16 4h1v1h-1zM18 4h1v1h-1zM20 4h1v1h-1zM21 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM15 5h1v1h-1zM18 5h1v1h-1zM24 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM15 6h1v1h-1zM18 6h1v1h-1zM19 6h1v1h-1zM20 6h1v1h-1zM21 6h1v1h-1zM22 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM10 7h1v1h-1zM13 7h1v1h-1zM15 7h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM12 8h1v1h-1zM13 8h1v1h-1zM14 8h1v1h-1zM16 8h1v1h-1zM17 8h1v1h-1zM22 8h1v1h-1zM23 8h1v1h-1zM24 8h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM8 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM0 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM19 10h1v1h-1zM20 10h1v1h-1zM21 10h1v1h-1zM22 10h1v1h-1zM23 10h1v1h-1zM24 10h1v1h-1zM0 11h1v1h-1zM1 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1zM7 11h1v1h-1zM8 11h1v1h-1zM18 11h1v1h-1zM20 11h1v1h-1zM21 11h1v1h-1zM22 11h1v1h-1zM23 11h1v1h-1zM0 12h1v1h-1zM1 12h1v1h-1zM4 12h1v1h-1zM6 12h1v1h-1zM18 12h1v1h-1zM19 12h1v1h-1zM20 12h1v1h-1zM24 12h1v1h-1zM0 13h1v1h-1zM7 13h1v1h-1zM16 13h1v1h-1zM17 13h1v1h-1zM18 13h1v1h-1zM19 13h1v1h-1zM20 13h1v1h-1zM23 13h1v1h-1zM2 14h1v1h-1zM3 14h1v1h-1zM4 14h1v1h-1zM5 14h1v1h-1zM6 14h1v1h-1zM17 14h1v1h-1zM20 14h1v1h-1zM0 15h1v1h-1zM1 15h1v1h-1zM3 15h1v1h-1zM6 15h1v1h-1zM7 15h1v1h-1zM17 15h1v1h-1zM18 15h1v1h-1zM19 15h1v1h-1zM22 15h1v1h-1zM1 16h1v1h-1zM3 16h1v1h-1zM4 16h1v1h-1zM9 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM17 16h1v1h-1zM18 16h1v1h-1zM19 16h1v1h-1zM21 16h1v1h-1zM22 16h1v1h-1zM8 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM16 17h1v1h-1zM18 17h1v1h-1zM19 17h1v1h-1zM22 17h1v1h-1zM0 18h1v1h-1zM1 18h1v1h-1zM2 18h1v1h-1zM3 18h1v1h-1zM4 18h1v1h-1zM5 18h1v1h-1zM6 18h1v1h-1zM9 18h1v1h-1zM11 18h1v1h-1zM12 18h1v1h-1zM18 18h1v1h-1zM23 18h1v1h-1zM0 19h1v1h-1zM6 19h1v1h-1zM8 19h1v1h-1zM13 19h1v1h-1zM17 19h1v1h-1zM18 19h1v1h-1zM19 19h1v1h-1zM20 19h1v1h-1zM21 19h1v1h-1zM22 19h1v1h-1zM0 20h1v1h-1zM2 20h1v1h-1zM3 20h1v1h-1zM4 20h1v1h-1zM6 20h1v1h-1zM9 20h1v1h-1zM12 20h1v1h-1zM15 20h1v1h-1zM17 20h1v1h-1zM21 20h1v1h-1zM22 20h1v1h-1zM24 20h1v1h-1zM0 21h1v1h-1zM2 21h1v1h-1zM3 21h1v1h-1zM4 21h1v1h-1zM6 21h1v1h-1zM8 21h1v1h-1zM9 21h1v1h-1zM11 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM18 21h1v1h-1zM22 21h1v1h-1zM23 21h1v1h-1zM24 21h1v1h-1zM0 22h1v1h-1zM2 22h1v1h-1zM3 22h1v1h-1zM4 22h1v1h-1zM6 22h1v1h-1zM9 22h1v1h-1zM10 22h1v1h-1zM11 22h1v1h-1zM14 22h1v1h-1zM15 22h1v1h-1zM19 22h1v1h-1zM20 22h1v1h-1zM22 22h1v1h-1zM23 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM10 23h1v1h-1zM12 23h1v1h-1zM14 23h1v1h-1zM15 23h1v1h-1zM18 23h1v1h-1zM19 23h1v1h-1zM21 23h1v1h-1zM22 23h1v1h-1zM23 23h1v1h-1zM24 23h1v1h-1zM0 24h1v1h-1zM1 24h1v1h-1zM2 24h1v1h-1zM3 24h1v1h-1zM4 24h1v1h-1zM5 24h1v1h-1zM6 24h1v1h-1zM8 24h1v1h-1zM9 24h1v1h-1zM10 24h1v1h-1zM12 24h1v1h-1zM14 24h1v1h-1zM15 24h1v1h-1zM16 24h1v1h-1zM17 24h1v1h-1zM18 24h1v1h-1zM21 24h1v1h-1zM22 24h1v1h-1zM24 24h1v1h-1z"
              />
              <Rect x="9.6" y="9.6" width="5.8" height="5.8" rx="1.4" fill="#F1DD6A" />
              <Circle cx="13.9" cy="11" r=".55" fill={INK} />
              <Path d="M11.2 11.1v3.2M13.3 11.7l-2.1 1.4 2.1 1.6" fill="none" stroke={INK} strokeWidth=".7" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>

            {/* Simulated scan line */}
            <View style={styles.scanline} />
          </Pressable>

          {/* Dashed line */}
          <View style={styles.dashedDivider} />

          {/* Instructional note */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerNote}>
              Students scan this in the Kredo app to pay.
            </Text>
            <Text style={styles.footerHighlight}>
              Tap the code to see a payment arrive.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomWrap}>
        <Pressable onPress={shareQr} style={styles.printBtn} accessibilityLabel="Print stall QR">
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
          </Svg>
          <Text style={styles.printBtnText}>Print</Text>
        </Pressable>

        <Pressable onPress={shareQr} style={styles.shareBtn} accessibilityLabel="Share stall QR">
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </Svg>
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
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
  headerBar: {
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
  centerSection: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  qrCard: {
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    overflow: "hidden",
  },
  cardBanner: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#F1DD6A",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerAvatarText: {
    color: "#F1DD6A",
    fontSize: 17,
    fontWeight: "800",
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: INK,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(11,11,12,0.65)",
    marginTop: 1,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  qrArea: {
    width: 244,
    height: 244,
    alignSelf: "center",
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scanline: {
    position: "absolute",
    left: -6,
    right: -6,
    top: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E3CB4A",
  },
  dashedDivider: {
    marginHorizontal: 22,
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: BORDER,
    borderStyle: "dashed",
  },
  cardFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    alignItems: "center",
  },
  footerNote: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B6B70",
    textAlign: "center",
  },
  footerHighlight: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: INK,
    textAlign: "center",
  },
  bottomWrap: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
    flexDirection: "row",
    gap: 12,
  },
  printBtn: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  printBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
  },
  shareBtn: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
