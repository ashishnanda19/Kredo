import { View, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Verify() {
  const router = useRouter();
  const [frontState, setFrontState] = useState<0 | 1 | 2>(0); // 0: empty, 1: busy, 2: done
  const [backState, setBackState] = useState<0 | 1 | 2>(0);

  const tapFront = () => {
    if (frontState === 1) return;
    if (frontState === 2) {
      setFrontState(0);
      return;
    }
    setFrontState(1);
    setTimeout(() => setFrontState(2), 1200);
  };

  const tapBack = () => {
    if (backState === 1) return;
    if (backState === 2) {
      setBackState(0);
      return;
    }
    setBackState(1);
    setTimeout(() => setBackState(2), 1200);
  };

  const isReady = frontState === 2 && backState === 2;

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <View style={styles.glow} />
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
            <Text style={styles.stepMuted}>Step 1 of 2</Text>
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
          <Text>Add your{"\n"}</Text>
          <Text>college ID</Text>
        </Text>
        <View style={styles.privacyNote}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B6B70" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="5" y="11" width="14" height="9" rx="2.5" />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </Svg>
          <Text style={styles.privacyText}>Photos stay on your phone.</Text>
        </View>
      </View>

      {/* 2 ID Upload Cards */}
      <View style={styles.cardsWrap}>
        {/* Front of ID */}
        <Pressable onPress={tapFront} style={[styles.cardBox, frontState === 2 && styles.cardBoxDone]}>
          {frontState === 0 && (
            <View style={styles.cardContent}>
              <View style={styles.cameraIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7L17.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <Circle cx={12} cy={12.5} r={3.2} />
                </Svg>
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Front of ID</Text>
                <Text style={styles.cardSubText}>Tap to scan</Text>
              </View>
            </View>
          )}

          {frontState === 1 && (
            <View style={styles.readingBox}>
              <Text style={styles.readingText}>Reading your ID…</Text>
              <View style={styles.scanLine} />
            </View>
          )}

          {frontState === 2 && (
            <View style={styles.cardContent}>
              {/* Card visual preview */}
              <View style={styles.cardPreviewBox}>
                <View style={styles.cardPreviewTop} />
                <View style={styles.cardPreviewAvatar} />
                <View style={styles.cardPreviewLine1} />
                <View style={styles.cardPreviewLine2} />
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Front added</Text>
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

        {/* Back of ID */}
        <Pressable onPress={tapBack} style={[styles.cardBox, backState === 2 && styles.cardBoxDone]}>
          {backState === 0 && (
            <View style={styles.cardContent}>
              <View style={styles.cameraIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7L17.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <Circle cx={12} cy={12.5} r={3.2} />
                </Svg>
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Back of ID</Text>
                <Text style={styles.cardSubText}>Tap to scan</Text>
              </View>
            </View>
          )}

          {backState === 1 && (
            <View style={styles.readingBox}>
              <Text style={styles.readingText}>Reading your ID…</Text>
              <View style={styles.scanLine} />
            </View>
          )}

          {backState === 2 && (
            <View style={styles.cardContent}>
              {/* Back card preview */}
              <View style={styles.cardPreviewBox}>
                <View style={[styles.cardPreviewTop, { backgroundColor: "#3A3A3F" }]} />
                <View style={[styles.cardPreviewLine1, { left: 10, top: 36, width: 70 }]} />
                <View style={[styles.cardPreviewLine2, { left: 10, top: 48, width: 50 }]} />
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardMainText}>Back added</Text>
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
      </View>

      {/* Bottom Submit CTA */}
      <View style={styles.bottomWrap}>
        {isReady ? (
          <Pressable
            onPress={() => router.push("/(auth)/reviewing")}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </Pressable>
        ) : (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Add both sides to continue</Text>
          </View>
        )}
        <Text style={styles.disclaimerText}>
          Our lending partner checks it, usually within 2 working days.
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
    width: "50%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#E3CB4A",
  },
  titleWrap: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 40,
    color: INK,
  },
  privacyNote: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privacyText: {
    fontSize: 14,
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
  cameraIconBox: {
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
  cardPreviewBox: {
    width: 90,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    position: "relative",
  },
  cardPreviewTop: {
    height: 14,
    backgroundColor: "#F1DD6A",
  },
  cardPreviewAvatar: {
    position: "absolute",
    left: 8,
    top: 22,
    width: 20,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#E4E1D8",
  },
  cardPreviewLine1: {
    position: "absolute",
    left: 34,
    top: 24,
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9D6CC",
  },
  cardPreviewLine2: {
    position: "absolute",
    left: 34,
    top: 34,
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E4E1D8",
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
