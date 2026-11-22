import { View, Pressable, StyleSheet, ScrollView, TextInput } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";

const INK = "#0B0B0C";
const YELLOW = "#F8DE45";
const SHEET = "#FAF9F6";
const BORDER = "#ECEAE4";

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [topic, setTopic] = useState("A payment");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const faqs = [
    {
      q: "When do I repay?",
      a: "By the due date shown before you confirm, to the lending partner. We remind you the day before.",
    },
    {
      q: "What is the ₹5 fee?",
      a: "A flat fee shown on every payment before you confirm. There are no hidden charges.",
    },
    {
      q: "Why did my limit change?",
      a: "Limits move with how you repay. Every change has a plain reason on the Aura screen.",
    },
  ];

  const topics = ["A payment", "Repayment", "My limit", "Account"];
  const ready = msg.trim().length > 3;

  return (
    <View style={s.root}>
      {/* Backgrounds */}
      <View style={s.sheetBg} />
      <View style={s.radialGlow} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
        </Pressable>
        <Text style={s.topTitle}>Help</Text>
        <View style={s.spacer44} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {sent ? (
          <View style={s.ticketSuccessCard}>
            <View style={s.ticketSuccessIcon}>
              <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#F1DD6A" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12.5l4.5 4.5L19 7" />
              </Svg>
            </View>
            <Text style={s.ticketTitle}>Ticket raised</Text>
            <Text style={s.ticketSub}>
              Ticket #KR-2048 on "{topic}". We reply within 2 working days. If it is not solved in 7 days, you can take it to the grievance officer.
            </Text>
            <Pressable
              onPress={() => {
                setSent(false);
                setMsg("");
              }}
              style={s.backToHelpBtn}
            >
              <Text style={s.backToHelpText}>Back to help</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={s.headSection}>
              <Text style={s.headTitle}>{"How can\nwe help?"}</Text>
            </View>

            {/* Quick Answers FAQs */}
            <View style={s.sectionWrap}>
              <Text style={s.sectionHeader}>Quick answers</Text>
              <View style={s.faqCard}>
                {faqs.map((f, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <View key={idx}>
                      <Pressable
                        onPress={() => setOpenFaq(isOpen ? null : idx)}
                        style={s.faqQuestionRow}
                      >
                        <Text style={s.faqQ}>{f.q}</Text>
                        <Svg
                          width={18}
                          height={18}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6B6B70"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                        >
                          <Path d="M6 9l6 6 6-6" />
                        </Svg>
                      </Pressable>
                      {isOpen && (
                        <View style={s.faqAnswerBox}>
                          <Text style={s.faqA}>{f.a}</Text>
                        </View>
                      )}
                      {idx < faqs.length - 1 && <View style={s.divider} />}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Raise a Ticket */}
            <View style={s.sectionWrap}>
              <Text style={s.sectionHeader}>Still stuck? Raise a ticket</Text>
              <View style={s.ticketCard}>
                <View style={s.topicChipsRow}>
                  {topics.map((t) => {
                    const active = topic === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setTopic(t)}
                        style={[s.topicChip, active ? s.topicActive : s.topicInactive]}
                      >
                        <Text style={[s.topicText, active ? s.topicTextActive : s.topicTextInactive]}>
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  style={s.textArea}
                  value={msg}
                  onChangeText={setMsg}
                  placeholder="Tell us what happened"
                  placeholderTextColor="#9A9AA0"
                  multiline
                  numberOfLines={4}
                />

                <Pressable
                  onPress={() => {
                    if (ready) setSent(true);
                  }}
                  disabled={!ready}
                  style={[s.sendBtn, ready ? s.sendBtnActive : s.sendBtnDisabled]}
                >
                  <Text style={[s.sendBtnText, ready ? s.sendTextActive : s.sendTextDisabled]}>
                    Send ticket
                  </Text>
                </Pressable>
              </View>

              <Text style={s.disclaimer}>
                Not solved in 7 days? Escalate to the lending partner's grievance officer from the ticket.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  sheetBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 92,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: SHEET,
  },
  radialGlow: {
    position: "absolute",
    left: "50%",
    top: -60,
    width: 460,
    height: 300,
    marginLeft: -230,
    borderRadius: 230,
    backgroundColor: "rgba(255,246,205,0.75)",
  },
  topBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  topTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: INK,
  },
  spacer44: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headSection: {
    paddingBottom: 8,
  },
  headTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 34,
    color: INK,
  },
  sectionWrap: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B6B70",
    paddingBottom: 8,
  },
  faqCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 58,
    paddingVertical: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  faqAnswerBox: {
    paddingBottom: 16,
  },
  faqA: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B6B70",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1EFE9",
  },
  ticketCard: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  topicChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  topicActive: {
    backgroundColor: INK,
  },
  topicInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  topicText: {
    fontSize: 13,
    fontWeight: "800",
  },
  topicTextActive: {
    color: "#FFFFFF",
  },
  topicTextInactive: {
    color: INK,
  },
  textArea: {
    marginTop: 14,
    height: 96,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAF9F6",
    fontSize: 15,
    fontWeight: "500",
    color: INK,
    textAlignVertical: "top",
  },
  sendBtn: {
    marginTop: 14,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: INK,
  },
  sendBtnDisabled: {
    backgroundColor: "#ECEAE4",
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  sendTextActive: {
    color: "#FFFFFF",
  },
  sendTextDisabled: {
    color: "#9A9AA0",
  },
  disclaimer: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B70",
    textAlign: "center",
  },
  ticketSuccessCard: {
    padding: 26,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    textAlign: "center",
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  ticketSuccessIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: INK,
  },
  ticketSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B6B70",
    textAlign: "center",
  },
  backToHelpBtn: {
    marginTop: 20,
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  backToHelpText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
