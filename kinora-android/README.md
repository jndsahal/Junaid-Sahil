# Kinora — Android foundation

Original parental-control project. Working brand only; domain and trademark availability are unverified.

## Implemented
- Native parent/child mode selection with persisted local settings.
- Explicit Android Usage Access permission flow.
- Foreground usage estimates for this device, top ten apps, empty and permission-denied states.
- Editable daily goal with validation, mode switching and local settings deletion.
- No Internet permission, data uploads, embedded credentials or hidden monitoring.

## Not implemented
Cross-device pairing, authentication, remote location sharing, notifications, app blocking and backend storage. The parent screen explicitly shows that no devices are connected. Daily goals are advisory, not enforced. This is not a finished FlashGet Kids equivalent.

## Build
Open this directory in Android Studio with JDK 17, Android SDK 35 and Gradle 8.9.
A wrapper is not bundled. With Gradle 8.9 installed:
`gradle :app:assembleDebug`
APK: `app/build/outputs/apk/debug/app-debug.apk`.
Minimum Android 8.0. No third-party runtime dependencies.

## Device validation
1. Launch, choose each role and restart; selected mode should persist.
2. Deny usage access; no usage should appear.
3. Grant access via Android settings, return and refresh; real device estimates appear.
4. Revoke access and return; permission prompt replaces usage.
5. Goals 1 and 1440 save; empty, 0, 1441 and oversized values show validation.
6. Cancel erase leaves settings intact; confirm erase returns to onboarding.
7. Check large fonts, screen rotation, gesture navigation and Android 15 edge-to-edge.
8. Parent mode must never claim remote connection or show invented child data.

## Next implementation milestone
Use authenticated parent accounts and individually registered child devices. Pair using short-lived, single-use server tokens, rate limits and explicit child-device confirmation. Enforce family ownership server-side on every read and write; include revocation and deletion. Add foreground, opt-in location sharing only after a backend and retention policy exist. Test on two physical Android devices before claiming remote monitoring works.

## Validation status
Source prepared and reviewed. Android build/device testing has not run in the authoring environment because Gradle and the Android SDK were unavailable.
