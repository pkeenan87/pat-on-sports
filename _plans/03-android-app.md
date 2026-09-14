# Plan 3 — Pat on Sports for Android and Google Play

**Status:** proposed · **Written:** 2026-09-14 · **Depends on:** Plan 2 (shared Expo codebase and site API); Plan 1 for comments

## Goal

Ship the same reader app to Google Play from the Expo codebase built in
Plan 2, handling the parts that are genuinely different on Android: the
platform conventions, the notification plumbing, background audio rules,
App Links, and Google Play's publishing process, which for a new personal
account includes a mandatory closed-testing period that has to be scheduled,
not just done.

## What carries over from Plan 2 unchanged

- The site's JSON API, `/privacy`, `/support`, and the push broadcast
  workflow.
- Every screen, the Markdown renderer, the Pros & Cons panels, offline cache,
  audio player logic, TanStack Query + MMKV + SQLite, comments UI.
- EAS Build, EAS Submit, EAS Update, the test suite.

If Plan 2 is built with Expo as recommended, roughly ninety percent of this
plan is configuration, store paperwork and testing rather than code.

## Start here: the closed-testing clock

Google Play requires personal developer accounts created after
13 November 2023 to run a **closed test with at least 12 testers opted in
continuously for 14 days** before the account can apply for production
access. Organisation accounts and older personal accounts are exempt.

If you do not already have a Play developer account, this is the long pole in
the schedule, so:

1. Create the Play Console account ($25 one-time) on day one of this plan,
   while the app is still being configured. Identity verification can take a
   few days on its own.
2. Line up testers early. Twelve real people with Gmail accounts who will
   install the app and keep it installed. Readers of the site are the natural
   pool: add a "Test the Android app" call-out on the About page with a
   Google Group or email-list opt-in link. Friends and family fill the gap.
3. The 14 days only count while 12 or more testers remain opted in. If two
   drop out on day 10, the clock stalls. Recruit 15 to 20.

Everything else in this plan can proceed in parallel with that clock.

---

## Part A — Android configuration in the Expo project

### A1. Identity and app config

- `android.package`: `com.patonsports.app` (same as the iOS bundle ID; keeps
  EAS and the API's `manifest.json` simple).
- `android.versionCode` managed by EAS (`appVersionSource: "remote"`), so
  every production build increments automatically.
- Adaptive icon: foreground layer with the wordmark, background navy, plus a
  **monochrome** layer so Android 13+ themed icons look right. Same IP rules
  as Plan 2 B8: no team or league marks.
- Splash screen via `expo-splash-screen`, navy background, wordmark centred.

### A2. Target SDK and edge-to-edge

Google Play requires new apps and updates to target an API level within one
year of the latest Android release. The current Expo SDK's default target
satisfies this; do not pin it lower. Two consequences to handle:

- **Edge-to-edge is enforced** at recent target levels. Expo enables it
  through `react-native-edge-to-edge`; every screen must use safe-area insets
  for the status bar and the gesture navigation bar. The tab bar and the audio
  mini-player are the two places this bites.
- **Predictive back**: opt in (`android:enableOnBackInvokedCallback`, which
  Expo sets), then test that the article screen and the mini-player respond to
  the system back gesture the way Expo Router expects. Android users will use
  back far more than the header chevron.

### A3. Notifications

Android needs a Firebase project purely as the transport for push; Expo's push
service delivers to Android through Firebase Cloud Messaging.

1. Create a Firebase project "Pat on Sports", add an Android app with the
   package name, download `google-services.json`.
2. Store it as an EAS file secret (`eas secret:create --type file`) and
   reference it from `app.json` `android.googleServicesFile`. Never commit it.
3. Upload the FCM V1 service-account key to EAS (`eas credentials`) so Expo's
   push service can send.
4. `POST_NOTIFICATIONS` is a runtime permission on Android 13+. Use the same
   soft prompt as iOS (after two articles read) and then the system prompt.
5. Create one notification channel, "New posts", importance default, so users
   can tune it in system settings. Android surfaces channels prominently;
   naming it well is the whole UX.
6. Tapping a notification deep-links to the article, as on iOS.

The site-side broadcast (Plan 2 A5) is platform-agnostic: Expo push tokens
carry the platform, and the same `POST /api/push/broadcast` reaches both.

### A4. Background audio

Android is stricter than iOS about background work:

- `expo-audio` needs `FOREGROUND_SERVICE` and
  `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions (Android 14+ requires the
  typed variant) and a media-session notification while playing. Expo's config
  plugin adds these when background playback is enabled; verify they appear
  in the merged manifest of a built APK.
- The media notification should show title, "Pat on Sports", hero art, and
  play/pause/±15 s. Bluetooth and Android Auto controls come for free once the
  media session is correct.
- Battery optimisation on some OEMs (Samsung, Xiaomi) kills background audio
  aggressively. The foreground service is the correct mitigation; nothing more
  is needed for a podcast-style player.
- Downloads use the same `expo-file-system` code; on Android the app's
  scoped storage means no storage permission prompt.

### A5. App Links

The Android equivalent of Universal Links:

- Serve `public/.well-known/assetlinks.json` from the site with
  `Content-Type: application/json`, listing the package name and the SHA-256
  fingerprint of the **Play App Signing key**, not the upload key. This is the
  most common App Links mistake: the fingerprint you need is in Play Console →
  Setup → App signing, and it only exists after the first upload.
- `android.intentFilters` in `app.json` with `autoVerify: true` for
  `patonsports.com` paths `/blog/*`, `/category/*`, `/tag/*`.
- Verify with `adb shell pm get-app-links com.patonsports.app` after install
  from an internal-testing build.

### A6. Platform look and feel

Keep the brand, respect the platform:

- Ripple feedback on pressables (`android_ripple`), Material-style bottom tab
  bar heights, and system font fallbacks (the site's Barlow Condensed and IBM
  Plex load as bundled fonts via `expo-font`; the serif body falls back
  gracefully).
- Share uses the Android share sheet; "Copy link" is a menu item since Android
  has no built-in copy action in the sheet.
- Back gesture handling as in A2.
- Respect the system dark theme if Plan 2 adopts dark mode.

### A7. Testing

- Android Studio's emulator on this Mac for daily work (Pixel profile, latest
  system image). The Expo dev client runs on it directly.
- At least one physical device, ideally a Samsung, because OEM battery and
  notification behaviour differs from Pixel. A used mid-range phone is a
  cheaper long-term tool than guessing.
- Maestro flows from Plan 2 run on Android with no changes.
- After each upload, read Play Console's **pre-launch report**: Google runs the
  build on real devices and reports crashes, accessibility issues and
  screenshots. It is free and catches OEM-specific problems early.

---

## Part B — Google Play

### B1. Play Console setup

- Developer account, personal, $25 one-time. Complete identity verification
  and, if prompted, the D-U-N-S / organisation questions as "individual".
- Create the app: name "Pat on Sports", default language en-US, app (not
  game), free.
- **Play App Signing** is mandatory for new apps. Let Google hold the signing
  key; EAS manages the upload key. Record the App Signing SHA-256 for A5.

### B2. Store listing

- Short description (80 chars): "Patriots and UCLA recaps, Pros & Cons and
  narrated articles from Pat."
- Full description: the site's About text, the feature list, and the
  not-affiliated line. No team or league marks in any asset.
- Assets: icon 512×512, **feature graphic 1024×500** (required, Play-only;
  wordmark on navy), phone screenshots from the same five screens as iOS,
  captured on a Pixel emulator at a 16:9-ish aspect.
- Category **Sports**. Tags: sports news, NFL, college football.
- Contact email (the `/support` address), privacy policy URL (`/privacy`).

### B3. Policy declarations

Each of these is a form in Play Console → Policy → App content. Answer them
before the first closed-testing release; the release is blocked until they are
complete.

| Declaration | Answer for this app |
|---|---|
| **Privacy policy** | `/privacy` URL |
| **Ads** | No ads |
| **App access** | All functionality available without login |
| **Content rating (IARC)** | Questionnaire: no violence, no gambling, "users can interact / share content" = Yes if comments ship. Expect "Everyone" or "Teen" depending on the interaction answer. |
| **Target audience** | 18 and over is the simplest honest answer for a commentary site; choosing 13+ triggers the Families policy review. |
| **News apps** | Play's News policy applies to apps that self-describe as news apps. Declare it as a news app only if you categorise it that way; if you do, the About screen must show ownership ("published by Patrick Keenan") and contact info, and the app must not present unverified claims as reporting. Listing under Sports with commentary framing avoids the declaration. |
| **Data safety** | Collected: device or other IDs (push token) for app functionality, not shared, deletable by disabling notifications. If comments ship: name and email (optional), user-generated content, for app functionality, not shared. No location, no financial, no health. Data encrypted in transit: yes. Deletion request path: the `/support` email. |
| **Government apps / Financial features / Health** | Not applicable |

### B4. Releases and tracks

1. **Internal testing** (up to 100 testers, no review delay): first
   `eas build -p android --profile production --auto-submit` lands here. Use it
   to confirm push, background audio and App Links on real devices.
2. **Closed testing**: promote the same build. Add the tester list (Gmail
   addresses or a Google Group). Share the opt-in link. Start the 14-day
   clock and check the tester count in the console every few days.
3. **Apply for production access** from the dashboard once the console shows
   the requirement met. Google asks a few questions about testing and
   readiness; answer with specifics (what testers found, what changed).
4. **Production** with a staged rollout: 20 % → 50 % → 100 % over a few days,
   watching Android vitals for crash rate and ANRs.

Subsequent releases: `eas update` for JS-only changes; a new AAB through
internal → production for native changes. Google's review for updates is
usually hours, sometimes a couple of days.

### B5. Fallback: Trusted Web Activity

Google, unlike Apple, accepts a **Trusted Web Activity** on Play: the website
itself, full screen, with Digital Asset Links proving ownership. Bubblewrap
generates the project in minutes. It gets a Play listing, web push and
home-screen presence with almost no code.

It is listed here so the option is explicit, not as the recommendation. It
would not have offline articles, downloaded audio with a media session, or
parity with the iOS app, and it still needs the same account, the same
closed-testing period and the same policy forms. The shared Expo app costs
more up front and is the better product. Use the TWA only if Plan 2 stalls
and a Play presence is wanted anyway.

---

## Phases and effort

| Phase | Work | Effort |
|---|---|---|
| 0 | Play account, identity verification, tester recruitment starts | 1 hour plus waiting |
| 1 | App config: icon, splash, package, edge-to-edge, back handling | 1 session |
| 2 | Firebase + FCM + notification channel + permission flow | 1 session |
| 3 | Background audio permissions and media notification, device testing | 1 session |
| 4 | App Links (needs first upload for the signing key) | half a session |
| 5 | Store listing, policy forms, data safety, content rating | 1 session |
| 6 | Internal → closed testing → 14-day wait → production access → staged rollout | 3 weeks minimum, calendar-bound |

Calendar: about a week of work spread across the closed-testing fortnight,
then production access, then rollout. If Plan 2 is at TestFlight, expect
Android on Play roughly three to four weeks later.

## Costs

| Item | Cost |
|---|---|
| Google Play developer account | $25 one-time |
| Firebase (FCM only) | Free |
| EAS | Shared with Plan 2 |
| A physical test device | Optional; a used Pixel or Samsung, $100–200 |

## Risks

- **Tester attrition** stalls the 14-day clock. Recruit more than 12 and
  message them at day 7.
- **App Links fail silently** if the fingerprint is the upload key. Verify
  with `adb` before closed testing.
- **OEM battery killers** stop background audio on some phones. The foreground
  service is the fix; test on a Samsung.
- **Data safety mismatch**: if comments ship later, the form must be updated
  in the same release or Play flags the discrepancy.
- **News policy** if categorised as News. Choose Sports.

## Acceptance criteria

- `adb shell pm get-app-links` shows `patonsports.com` verified.
- A notification arrives on a Samsung and a Pixel after a post is published
  and opens the article.
- Audio keeps playing with the screen off for 30 minutes on both devices;
  the media notification controls work; Bluetooth play/pause works.
- Airplane-mode reading and downloaded-audio playback match the iOS criteria.
- Pre-launch report shows no crashes and no accessibility errors.
- Play Console shows the closed-testing requirement met and production access
  granted.
- Store listing contains no NFL, Patriots, UCLA or NCAA marks.

## Sources

- Play testing requirements for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- 12 testers / 14 days explained: https://ontest.app/blog/google-play-12-testers-14-days-requirement-explained
- EAS Submit for Google Play: https://docs.expo.dev/submit/android/
- EAS Build: https://docs.expo.dev/build/introduction/
