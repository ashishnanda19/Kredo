import { View, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function VendorVerify() {
  const router = useRouter();
  const [docState, setDocState] = useState<0 | 1 | 2>(0);
  const [bankState, setBankState] = useState<0 | 1 | 2>(0);

  const tapDoc = () => {
    if (docState === 1) return;
    if (docState === 2) {
      setDocState(0);
      return;
    }
    setDocState(1);
    setTimeout(() => setDocState(2), 1200);
  };

  const tapBank = () => {
    if (bankState === 1) return;
    if (bankState === 2) {
      setBankState(0);
      return;
    }
    setBankState(1);
    setTimeout(() => setBankState(2), 1200);
  };

  const isReady = docState === 2 && bankState === 2;

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
            <Text style={styles.stepMuted}>Step 2 of 3</Text>
            <Text style={styles.stepMuted}>Verify</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
      </View>

      {/* Screen Title */}
      <View style={styles.titleWrap}>
        <Text style={styles.mainTitle}>
          <Text>Verify your{"\n"}</Text>
          <Text>stall</Text>
        </Text>
        <View style={styles.privacyNote}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="5" y="11" width="14" height="9" rx="2.5" />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </Svg>
          <Text style={styles.privacyText}>
            Photos stay on your phone. We keep only the last 4 digits of your account.
          </Text>
        </View>
      </View>

      {/* 2 Upload / Link Cards */}
      <View style={styles.cardsWrap}>
        {/* Document Card */}
        <Pressable onPress={tapDoc} style={[styles.cardBox, docState === 2 && styles.cardBoxDone]}>
          {docState === 0 && (
            <View style={styles.cardContent}>
              <View style={styles.iconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7L17.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <Circle cx={12} cy={12.5} r={3.2} />
                </Svg>
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Shop licence or owner ID</Text>
                <Text style={styles.cardSubText}>Tap to scan</Text>
              </View>
            </View>
          )}

          {docState === 1 && (
            <View style={styles.readingBox}>
              <Text style={styles.readingText}>Reading your document…</Text>
              <View style={styles.scanLine} />
            </View>
          )}

          {docState === 2 && (
            <View style={styles.cardContent}>
              <View style={styles.docPreviewBox}>
                <View style={styles.docPreviewTop} />
                <View style={styles.docPreviewLine1} />
                <View style={styles.docPreviewLine2} />
                <View style={styles.docPreviewLine3} />
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Added</Text>
                <Text style={styles.cardSubText}>Tap to retake</Text>
              </View>
              <View style={styles.checkCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7" />
                </Svg>
              </View>
            </View>
          )}
        </Pressable>

        {/* Bank Account Card */}
        <Pressable onPress={tapBank} style={[styles.cardBox, bankState === 2 && styles.cardBoxDone]}>
          {bankState === 0 && (
            <View style={styles.cardContent}>
              <View style={styles.iconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
                </Svg>
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Payout account</Text>
                <Text style={styles.cardSubText}>Tap to link your bank</Text>
              </View>
            </View>
          )}

          {bankState === 1 && (
            <View style={styles.readingBox}>
              <Text style={styles.readingText}>Checking with your bank…</Text>
              <View style={styles.scanLine} />
            </View>
          )}

          {bankState === 2 && (
            <View style={styles.cardContent}>
              <View style={styles.bankLinkedBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
                </Svg>
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Bank •••• 4821</Text>
                <Text style={styles.cardSubText}>Linked. Tap to change</Text>
              </View>
              <View style={styles.checkCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7" />
                </Svg>
              </View>
            </View>
          )}
        </Pressable>
      </View>

      {/* Bottom Submit CTA */}
      <View style={styles.bottomWrap}>
        {isReady ? (
          <Pressable
            onPress={() => router.push("/(vendor)/reviewing")}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </Pressable>
        ) : (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Add both to continue</Text>
          </View>
        )}
        <Text style={styles.disclaimerText}>
          Our lending partner checks your stall, usually within 2 working days.
        </Text>
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
    width: "66%",
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
  privacyNote: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B6B70",
  },
  cardsWrap: {
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 14,
  },
  cardBox: {
    height: 124,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D3CFC2",
    borderStyle: "dashed",
    overflow: "hidden",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  cardBoxDone: {
    borderColor: "#2E9B57",
    borderStyle: "solid",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F1EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTexts: {
    flex: 1,
  },
  cardMainText: {
    fontSize: 16,
    fontWeight: "800",
    color: INK,
  },
  cardSubText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 3,
  },
  readingBox: {
    flex: 1,
    backgroundColor: "rgba(241,221,106,0.18)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  readingText: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  scanLine: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E3CB4A",
  },
  docPreviewBox: {
    width: 90,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    position: "relative",
  },
  docPreviewTop: {
    height: 14,
    backgroundColor: "#F1DD6A",
  },
  docPreviewLine1: {
    position: "absolute",
    left: 10,
    top: 24,
    width: 55,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9D6CC",
  },
  docPreviewLine2: {
    position: "absolute",
    left: 10,
    top: 34,
    width: 68,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E4E1D8",
  },
  docPreviewLine3: {
    position: "absolute",
    left: 10,
    top: 44,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E4E1D8",
  },
  bankLinkedBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E3F2E8",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomWrap: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  submitBtn: {
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
  submitBtnText: {
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
  disclaimerText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
});
