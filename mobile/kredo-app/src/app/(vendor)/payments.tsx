import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { Glow } from "@/components/glow";
import { VendorNav } from "@/components/vendor-nav";

const INK = "#0B0B0C";
const YELLOW = "#F5D832";
const SHEET_BG = "#FAF9F6";
const BORDER = "#ECEAE4";

type PaymentItem = {
  id: string;
  name: string;
  init: string;
  when: string;
  amt: number;
  st: "Awaiting" | "Paid out" | "Refunded";
};

const INITIAL_PAYMENTS: PaymentItem[] = [
  { id: "a", name: "Aarav", init: "A", when: "1:42 pm", amt: 125, st: "Awaiting" },
  { id: "m", name: "Meera", init: "M", when: "11:05 am", amt: 60, st: "Awaiting" },
  { id: "r", name: "Rohan", init: "R", when: "Yesterday, 4:10 pm", amt: 210, st: "Paid out" },
  { id: "s", name: "Sana", init: "S", when: "Yesterday, 12:30 pm", amt: 95, st: "Paid out" },
  { id: "k", name: "Kabir", init: "K", when: "Yesterday, 9:05 am", amt: 175, st: "Paid out" },
];

const CHIPS = ["All", "Awaiting", "Paid out", "Refunded"];

export default function VendorPayments() {
  const [filter, setFilter] = useState("All");
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_PAYMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const shown = filter === "All" ? payments : payments.filter((p) => p.st === filter);
  const selectedPayment = payments.find((p) => p.id === selectedId);

  const handleRefund = () => {
    if (!selectedId) return;
    setPayments((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, st: "Refunded" as const } : p))
    );
    setSelectedId(null);
    setToast("Refunded. Removed from payout.");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Background glow and sheet */}
      <Glow style={styles.glow} />
      <View style={styles.sheetBg} />

      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>Today</Text>
        </View>
      </View>

      {/* Toast Alert */}
      {toast && (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {CHIPS.map((chip) => {
          const isSelected = chip === filter;
          return (
            <Pressable
              key={chip}
              onPress={() => setFilter(chip)}
              style={[styles.chip, isSelected ? styles.chipActive : styles.chipInactive]}
            >
              <Text style={[styles.chipText, isSelected ? styles.chipTextActive : styles.chipTextInactive]}>
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Payments List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.paymentsCard}>
          {shown.map((row, idx) => {
            const isAwaiting = row.st === "Awaiting";
            const isPaid = row.st === "Paid out";
            const isRefunded = row.st === "Refunded";

            let badgeBg = "#ECEAE4";
            let badgeFg = "#6B6B70";
            if (isAwaiting) {
              badgeBg = "#FBF3C4";
              badgeFg = INK;
            } else if (isPaid) {
              badgeBg = "#E3F2E8";
              badgeFg = "#1B6B3A";
            }

            return (
              <Pressable
                key={row.id}
                onPress={() => {
                  if (isAwaiting) setSelectedId(row.id);
                }}
                style={[styles.paymentRow, idx > 0 && styles.paymentBorder]}
              >
                <View style={[styles.avatarBox, { backgroundColor: isAwaiting ? "#F1DD6A" : "#F1EFE9" }]}>
                  <Text style={styles.avatarText}>{row.init}</Text>
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{row.name}</Text>
                  <Text style={styles.paymentTime}>{row.when}</Text>
                </View>

                <View style={styles.paymentEnd}>
                  <Text style={[styles.amountText, isRefunded && styles.amountStrike]}>
                    ₹{row.amt}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeFg }]}>
                      {row.st}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.listDisclaimer}>
          Tap a payment that is awaiting payout to refund it. Once it is paid out, refunds go through support.
        </Text>
      </ScrollView>

      {/* Refund Bottom Sheet Modal */}
      {selectedPayment && (
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => setSelectedId(null)} style={styles.modalBackdrop} />
          <View style={styles.sheetBox}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetMeta}>Refund to {selectedPayment.name}</Text>
            <Text style={styles.sheetAmount}>₹{selectedPayment.amt}</Text>
            <Text style={styles.sheetExplanation}>
              Because this payment has not been paid out yet, it is simply removed. The student does not owe it, and it will not be in your payout.
            </Text>

            <Pressable onPress={handleRefund} style={styles.sheetRefundBtn}>
              <Text style={styles.sheetRefundText}>Refund ₹{selectedPayment.amt}</Text>
            </Pressable>

            <Pressable onPress={() => setSelectedId(null)} style={styles.sheetCancelBtn}>
              <Text style={styles.sheetCancelText}>Keep the payment</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Floating Bottom Nav */}
      <VendorNav active="payments" />
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
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: INK,
  },
  todayBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
  },
  toastWrap: {
    position: "absolute",
    top: 92,
    alignSelf: "center",
    zIndex: 20,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  chipsScroll: {
    marginTop: 18,
    maxHeight: 44,
  },
  chipsRow: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: INK,
    borderColor: INK,
  },
  chipInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  chipTextInactive: {
    color: INK,
  },
  scrollArea: {
    flex: 1,
    marginTop: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  paymentsCard: {
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
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
  },
  paymentBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1EFE9",
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  paymentTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B70",
    marginTop: 2,
  },
  paymentEnd: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
  },
  amountStrike: {
    textDecorationLine: "line-through",
    color: "#9A9AA0",
  },
  statusBadge: {
    marginTop: 4,
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  listDisclaimer: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
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
    backgroundColor: "rgba(11,11,12,0.4)",
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
  sheetMeta: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: "700",
    color: "#6B6B70",
  },
  sheetAmount: {
    marginTop: 4,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -2.86,
    fontWeight: "800",
    color: INK,
  },
  sheetExplanation: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    color: "#6B6B70",
  },
  sheetRefundBtn: {
    marginTop: 20,
    height: 56,
    borderRadius: 28,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRefundText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  sheetCancelBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
});
