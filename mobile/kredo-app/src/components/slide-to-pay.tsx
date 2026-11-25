import { View, Text, PanResponder, Animated, StyleSheet, Pressable } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface SlideToPayProps {
  onConfirm: () => void;
  label?: string;
  total?: string;
  disabled?: boolean;
  className?: string;
}

const TRAVEL = 260;
const THUMB_SIZE = 56;
const TRACK_HEIGHT = 64;

export function SlideToPay({ onConfirm, label = "Slide to pay", total, disabled, className }: SlideToPayProps) {
  const panX = new Animated.Value(0);
  const fillWidth = panX.interpolate({
    inputRange: [0, TRAVEL],
    outputRange: [THUMB_SIZE + 4, TRAVEL + THUMB_SIZE + 4],
  });
  const labelOpacity = panX.interpolate({
    inputRange: [0, 45],
    outputRange: [1, 0],
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const dx = Math.max(0, Math.min(TRAVEL, gesture.dx));
      panX.setValue(dx);
    },
    onPanResponderRelease: (_, gesture) => {
      if (disabled) return;
      if (gesture.dx >= 96) {
        panX.setValue(TRAVEL);
        setTimeout(() => onConfirm(), 450);
      } else {
        Animated.timing(panX, { toValue: 0, duration: 250, useNativeDriver: false }).start();
      }
    },
  });

  const thumbLeft = panX.interpolate({
    inputRange: [0, TRAVEL],
    outputRange: [4, TRAVEL + 4],
  });

  return (
    <Pressable disabled={disabled} style={styles.wrapper} className={cn("w-full", className)}>
      <Animated.View style={[styles.track, { borderRadius: 32, overflow: "hidden" }]}>
        <Animated.View style={[styles.fill, { backgroundColor: disabled ? "#ECEAE4" : "#E3CB4A", width: fillWidth }]} />
        <Animated.View
          style={[
            styles.label,
            { opacity: labelOpacity, paddingLeft: 40 },
          ]}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: disabled ? "#9A9AA0" : "#FFFFFF" }}>
            {label}{total ? ` ${total}` : ""}
          </Text>
          <ArrowRight size={18} color={disabled ? "#9A9AA0" : "#F1DD6A"} strokeWidth={2.4} />
        </Animated.View>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: thumbLeft }], backgroundColor: disabled ? "#ECEAE4" : "#F1DD6A" },
          ]}
          {...panResponder.panHandlers}
        >
          <ArrowRight size={24} color="#0B0B0C" strokeWidth={2.6} />
        </Animated.View>
      </Animated.View>
      {!disabled && (
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B6B70", textAlign: "center", marginTop: 8 }}>
          You repay our lending partner, not Kredo.
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#ECEAE4",
    position: "relative",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
