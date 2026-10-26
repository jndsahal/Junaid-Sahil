# Kinora 0.2 — connected Android pilot

Original family-control application with a Java Android shell and a shared parent/child web interface. Existing repository application remains separate.

## Implemented

- Parent registration/login, child device pairing, revocation and account deletion.
- Native Android connection to your HTTPS backend; origin-restricted WebView and native bridge.
- Installed-app inventory and optional Android usage reports.
- Parent block/unblock commands; native Device Owner enforcement with honest applied/failed/unsupported results. System apps, default dialer, launcher, Kinora and active accessibility services are protected.
- Front/back camera requests with child confirmation, video-only WebRTC, local preview, Stop controls, five-minute maximum and foreground-only capture.
- One-time, explicitly requested location sharing; no background location tracking.
- Background app-policy reconciliation using Android JobScheduler (15-minute minimum, OS scheduling may delay it); foreground synchronization while connected.
- Native offline disconnect button releases Kinora's blocks and attempts to remove its Device Owner management.
- HTTPS + authenticated TURN deployment configuration and reproducible development APK build.

## Start the server

For local UI/API testing: `cd backend && python server.py`, then open `http://127.0.0.1:8080/ui`.
Android requires a real HTTPS server origin. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for DNS, Docker, HTTPS and TURN configuration.

## Connect the phones

1. Install the development APK on both Android 8+ phones. Use an up-to-date Android System WebView/Chrome.
2. Tap **Open connected family space** and enter the HTTPS origin of your Kinora server.
3. On the parent phone, register/sign in and select **Add a device**.
4. On the child phone, enter the displayed code, name the device and confirm pairing.
5. Camera sessions require separate confirmation on the child phone every time. Grant camera permission when prompted, then retry the request if Android interrupts the first permission flow.
6. Usage reports require granting Usage Access from Kinora's local home screen. Location is shared only using **Share my location once**.

## Enable real app blocking

An ordinary APK install cannot suspend other apps. Kinora uses Android's Device Owner `setPackagesSuspended` capability. On a spare, eligible test device with USB debugging and no conflicting device management, install Kinora and use:

```sh
adb shell dpm set-device-owner app.kinora.family/.KinoraAdmin
```

Android may reject enrollment on an already provisioned device or one with accounts. Do not wipe your everyday phone to test this. Use a dedicated test device or Android emulator. Merely granting legacy Device Admin is insufficient. Kinora deliberately does not use an Accessibility overlay to pretend an app is blocked.

Keep the child app open for immediate commands and camera prompts. Background app commands use OS-scheduled jobs; they are not instant push notifications. Phone offline means queued commands, not successful enforcement. Desired policy is reconciled after reconnect. Local **Connection settings / disconnect** provides offline recovery; remote revocation is observed on the next device sync.

## Build

Preferred development build: Android Studio, JDK 17, SDK 35 and Gradle 8.9, then `gradle :app:assembleDebug`.

Dependency-free alternative, verified in the authoring environment:

```sh
export JAVA_HOME=/path/to/jdk17
export ANDROID_HOME=/path/to/android-sdk
python build_apk.py
```

Requires SDK `platforms;android-35` and `build-tools;35.0.0`. Output: `build/manual/Kinora-0.2.0-debug.apk`. This is signed with a development key, not a Play Store release key. Retain your development key for compatible updates. Never commit release keys or real credentials.

## Verification and remaining deployment work

- Android Java compilation, resource packaging, DEX generation and APK signature verification passed using official SDK tools.
- 15 backend tests passed, including authentication, replay/race protection, tenant isolation, camera lifecycle, device reports and TURN credential generation.
- UI/API integration test passed with **mocked media**: pairing, inventory, command status, both camera lens requests, consent/decline, offer/answer exchange and stop from either side.
- Real Chromium/WebRTC test is included but could not execute here: browser startup was blocked by the environment's socket restrictions.
- Gradle dependency resolution was unavailable here; the standalone SDK build succeeded instead.
- Not yet verified on physical phones: actual camera images, cross-network TURN connectivity, Android management enforcement, location sensor accuracy, background scheduling and WebView lifecycle behavior.
- A real server, DNS name, deployed TURN relay and physical device enrollment still require your infrastructure/devices. No live server has been provisioned by this change.

This is a development pilot, not a completed production/Play Store launch. Email verification/recovery, instant push delivery, enforced time schedules, production monitoring and store review are not included. Existing daily goals remain advisory.
