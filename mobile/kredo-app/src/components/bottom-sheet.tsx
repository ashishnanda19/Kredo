import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

/**
 * The designs' bottom dialog: a dimmed backdrop that closes on tap and a white
 * sheet with a grab handle that slides up (`.fade` and `.sheet` in the artboards).
 */
export function BottomSheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) setShown(true);
    const a = Animated.timing(v, {
      toValue: open ? 1 : 0,
      duration: open ? 450 : 220,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    });
    a.start(({ finished }) => finished && !open && setShown(false));
    return () => a.stop();
  }, [open, v]);

  if (!shown) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, s.dim, { opacity: v }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel={label}
        style={[s.sheet, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] }]}
      >
        <View style={s.handle} />
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  dim: { backgroundColor: "rgba(11,11,12,0.4)", zIndex: 20 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 21,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#0B0B0C",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#E4E1D8", alignSelf: "center" },
});
