# Android (scaffold only)

The `android/` directory is a [Capacitor](https://capacitorjs.com/) wrapper that
loads this project's existing web build in a native WebView, so the same
offline-first PDF Magik app can run as an installable Android app. It is a
**scaffold, not a built or signed APK** — this repository and the environment
it was generated in has no JDK, Android SDK, or Gradle installed, so no `.apk`
or `.aab` has been compiled, and none is committed here.

## What is and isn't here

- `capacitor.config.ts` — app id `com.dangerkhan.pdfmagik`, app name "PDF
  Magik", web build directory `dist`.
- `android/` — a standard Capacitor Android Gradle project. `MainActivity` is
  Kotlin (the Kotlin Gradle plugin and stdlib were added to `android/build.gradle`
  and `android/app/build.gradle` for this). Generated build output, the
  synced copy of the web app, and `local.properties` are gitignored by
  Capacitor's own template; only the project source is tracked.

  **Unverified:** this environment has no JDK/Android SDK, so the Kotlin
  wiring above has not actually been built. Run `./gradlew assembleDebug`
  once you have the tooling (below) to confirm it compiles before relying on
  it.
- `assets/icon-only.png` — a 1024×1024 source image (cropped/squared from
  [src/assets/icon/source.png](src/assets/icon/source.png)) used to generate
  the Android launcher icons already present under `android/app/src/main/res/mipmap-*/`.
- No screenshots, no Play Store listing copy, no feature graphic, no privacy
  policy page, no signed release build, and no Play Console account setup.
  Capturing real screenshots needs the app actually running on a device or
  emulator; none of that exists in this environment.

## Observing the app without an Android build

A Flutter extension doesn't apply here and won't open or preview this APK —
Flutter is a separate framework (Dart, its own widget/rendering engine) with
no connection to Capacitor or this Kotlin/WebView project, so it has nothing
to point at. Two options that actually work:

- **Right now, no Android tooling at all:** the native app is just a WebView
  showing this same web build, so `npm run dev` (or `npm run build && npm run
  preview`) in a regular browser looks and behaves identically for anything
  that isn't Android-chrome-specific (status bar, back button, etc.).
- **To see the real APK on a device/emulator:** install
  [Android Studio](https://developer.android.com/studio). It bundles the JDK,
  SDK, an emulator, and Logcat — open `android/` as a project and press Run.
  That's the standard tool for this, not a VS Code extension.

## Building it

Requires a JDK (17+) and the Android SDK (easiest: install Android Studio,
which bundles both).

```bash
npm run build          # produces dist/
npx cap sync android    # copies dist/ into the native project
```

Then either open `android/` in Android Studio and run it, or from the command
line:

```bash
cd android
./gradlew assembleDebug   # unsigned debug APK, for local testing only
```

The debug APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Release build (signed, for distribution)

1. Generate a keystore once and keep it somewhere safe outside the repo —
   **if it's lost, you can never publish an update to the same app listing
   again**:
   ```bash
   keytool -genkeypair -v -keystore pdf-magik-release.jks -alias pdf-magik \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Configure signing in `android/app/build.gradle` (or a local
   `keystore.properties` file, kept out of git — `android/.gitignore` already
   has a reminder comment about this) and run `./gradlew bundleRelease` for
   the `.aab` Play Store expects, or `./gradlew assembleRelease` for a signed
   `.apk`.
3. Never commit the keystore or its passwords.

## Security notes from reviewing the generated project

- Production dependencies audit clean: `npm audit --omit=dev` reports 0
  vulnerabilities. The vulnerabilities `npm audit` reports otherwise are all
  in build-time dev tooling (`vitest`'s `tinypool`, `@capacitor/cli`'s
  `glob`/`minimatch`) — none of it ships inside the app.
- The generated `AndroidManifest.xml` requests `android.permission.INTERNET`,
  which is Capacitor's default. This app makes no network calls — same as the
  web version — so the permission is a candidate for removal, but that needs
  verifying on a real device/emulator first, which wasn't possible here;
  removing it blind risks silently breaking the WebView. Decide once you can
  actually build and run it.
- Capacitor's own Android template already keeps `local.properties`, Gradle
  build output, and any keystore files out of version control by default.

## If you want the full native Play Store SOP

The multi-stage native-Android / Play Store publishing process you pasted
(Kotlin/Jetpack Compose architecture, Firebase Crashlytics, Play Console
account setup, Data Safety forms, store graphics, closed testing tracks,
etc.) is written for a from-scratch native Android Studio project — it
doesn't map onto this repo, which is a React/Vite web app wrapped in a single
WebView activity. Treat that document as the checklist for *after* you have a
real build you can run, test, and screenshot on your own machine.
