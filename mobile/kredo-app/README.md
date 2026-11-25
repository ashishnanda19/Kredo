# Kredo mobile app (iOS and Android)

Expo SDK 58, React Native 0.88, expo-router. Every screen is built from the Claude Design export in `../Kredo mobile app-project.zip` (40 artboards, 390 by 844). Demo world only: simulated data, no real money, no network calls. The demo code is always `123456`.

## Run it on your phones (fastest way)

1. On each phone, install **Expo Go** (App Store or Play Store).
2. On the Mac, in this folder:

   ```bash
   npm install        # first time only
   npm run phone      # starts the app server and prints a QR code
   ```

3. Connect each phone to the **same Wi-Fi** as the Mac, then:
   - iPhone: open the Camera app, point it at the QR code, tap the banner.
   - Android: open Expo Go and tap **Scan QR code**.

The app opens on the yellow splash. Keep the terminal open while you demo. Edits on the Mac reload on the phones.

**Different networks** (venue Wi-Fi that blocks devices, or phones on mobile data): run `npm run phone:anywhere` instead. It goes through a tunnel, so it works from anywhere but loads a little slower.

## Install it without the Mac (Android)

`npm run build:apk` builds an installable APK in Expo's cloud (needs a free Expo account: `npx eas-cli login` first). It prints a link; open it on any Android phone to install. No laptop needed after that.

An installable iPhone build needs an Apple Developer account (paid), then `npx eas-cli build -p ios --profile preview`. Until then, use Expo Go on iPhone.

## Demo path

Splash → Welcome (swipes through 3 slides) → Get started → Send code → Demo code 123456 → scan both sides of the ID → Submit → Continue → Start using Kredo → Home.

From Home: scan button → Pay next to Campus Cafe → Slide to pay → Paid → receipt. Dues → Repay now → Slide to repay → Repaid → See my Aura → Quests. Avatar → Profile → Log out → Vendor tab for the stall side (Today, stall QR, tap the QR to see a payment arrive, Payouts countdown, Insights).

Once you finish onboarding, the app remembers you and opens on Home. Log out from Profile to start again.

## Checks

```bash
npm run typecheck   # TypeScript
npm run doctor      # Expo config and dependency check (20/20)
npx expo export --platform ios --platform android   # proves both native bundles build
```
