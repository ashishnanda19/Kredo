/**
 * Voice-over for the scripted scenarios: reads captions aloud with the browser's own speech synthesis, so a presenter
 * (or someone who can't read the screen) can follow along. Nothing is sent anywhere.
 */

/** Rewrites a caption so it sounds right when spoken: amounts, codes, references and minus signs. */
export function spokenText(text: string): string {
  return text
    .replace(/₹\s?(\d[\d,]*)/g, "$1 rupees")
    .replace(/\bUTR\d+\b/g, "a bank reference")
    .replace(/\bSET-[A-Za-z0-9-]+/g, "the settlement")
    .replace(/\b([A-Z]{2,}(?:_[A-Z0-9]+)+)\b/g, (m) => m.toLowerCase().replaceAll("_", " "))
    .replace(/(^|[\s(])-(\d)/g, "$1minus $2")
    .replace(/\s+/g, " ")
    .trim();
}

export const speechSupported = (): boolean => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

export function speak(text: string): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(spokenText(text));
  u.lang = "en-IN";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
