# Android (Flutter wrapper, scaffold only)

`flutter_app/` is a [Flutter](https://flutter.dev/) app that displays this
project's existing web build in a WebView, so the same offline-first PDF
Magik app can run as an installable Android app. The web app itself (React/
TypeScript, built with Vite) is unchanged — this is a thin native shell
around it, not a rewrite.

This is a **scaffold, not a built or signed APK**. The environment this was
generated in has no Flutter SDK, Dart SDK, JDK, or Android SDK installed, so
none of it has been run, built, or verified to compile, and no `.apk`/`.aab`
is committed here.

## What's here, and what isn't

- `flutter_app/pubspec.yaml` — app metadata and the one real dependency,
  [`webview_flutter`](https://pub.dev/packages/webview_flutter).
- `flutter_app/lib/main.dart` — the entire native-side app: a single screen
  that loads `assets/web/index.html` in a WebView via `loadFlutterAsset`.
- `flutter_app/assets/web/` — a bundled copy of this project's `dist/` build
  output (run `npm run build` at the repo root to regenerate it, then re-copy
  into `flutter_app/assets/web/` before rebuilding the Flutter app).
- **No `flutter_app/android/` directory.** Unlike the npm/Vite tooling this
  repo already uses, there's no Flutter CLI available in this environment to
  run `flutter create`, and that command normally generates dozens of
  interlocking files (Gradle wrapper, a binary `gradle-wrapper.jar`, Flutter's
  Gradle plugin wiring via `local.properties`) that are never meant to be
  hand-written — doing that from memory, unverified, would be more likely to
  produce a broken project than a working one. Generating it for real is one
  command (below) once you have Flutter installed.
- **Kotlin**: you don't need to add anything for this. `flutter create` has
  defaulted to a Kotlin `MainActivity` for every new Android project since
  2020 — running the command below gives you Kotlin automatically.
- No screenshots, no Play Store listing, no signed release, no Play Console
  setup. These need a real device/emulator and a Play Developer account,
  neither of which exist in this environment.
- [assets/icon-only.png](assets/icon-only.png) (1024×1024, repo root) is the
  source art for the app icon, already cropped square. Not yet wired up as
  the Android launcher icon — once `android/` exists, the
  [`flutter_launcher_icons`](https://pub.dev/packages/flutter_launcher_icons)
  package can generate the full mipmap set from it, the same way
  `@capacitor/assets` did for the earlier Capacitor scaffold.

## Building it

Requires the [Flutter SDK](https://docs.flutter.dev/get-started/install)
(which bundles Dart) and the Android SDK/JDK (Android Studio bundles both;
`flutter doctor` tells you what's missing).

```bash
cd flutter_app
flutter create --platforms=android --org com.dangerkhan .
```

This fills in the missing `android/` native host next to the `lib/`,
`pubspec.yaml`, and `assets/` already here — it does **not** overwrite them.
Run `flutter doctor` afterward and resolve anything it flags before
continuing.

```bash
flutter pub get
flutter run              # on a connected device/emulator
flutter build apk        # unsigned debug-signed APK for local testing
```

The APK lands at `flutter_app/build/app/outputs/flutter-apk/app-release.apk`
(or `app-debug.apk` for `flutter build apk --debug`).

### Keeping the bundled web app current

`flutter_app/assets/web/` is a snapshot, not a live reference to `dist/`. Any
time the web app changes:

```bash
npm run build                                   # from the repo root
rm -rf flutter_app/assets/web
cp -r dist flutter_app/assets/web
```

Then rebuild the Flutter app.

### Release build (signed, for distribution)

1. Generate a keystore once and keep it somewhere safe outside the repo —
   if it's lost, you can never publish an update to the same app listing
   again:
   ```bash
   keytool -genkeypair -v -keystore pdf-magik-release.jks -alias pdf-magik \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Follow Flutter's own
   [Android release signing guide](https://docs.flutter.dev/deployment/android#signing-the-app)
   to wire the keystore into `android/app/build.gradle.kts` via a
   `key.properties` file kept out of git, then run `flutter build appbundle`
   for the `.aab` Play Store expects (or `flutter build apk --release` for a
   signed `.apk`).
3. Never commit the keystore or its passwords.

## Security notes

- Production npm dependencies (the actual web app that gets bundled) audit
  clean: `npm audit --omit=dev` reports 0 vulnerabilities.
- Once `flutter create` generates the Android host, its default
  `AndroidManifest.xml` will request `android.permission.INTERNET` — this app
  makes no network calls, same as the web version, so that permission is a
  candidate for removal, but verify the WebView still works after removing it
  (some WebView engine internals use it even for local content) on a real
  device before shipping, since that couldn't be tested here.
- Keep the generated `android/local.properties` and any keystore
  (`.jks`/`.keystore`) files out of version control — Flutter's default
  `.gitignore` (added by `flutter create`) already excludes
  `local.properties`; double-check it also covers wherever you put the
  keystore.
- `loadFlutterAsset` serves the bundled web app over a synthetic HTTPS-like
  origin on Android, so the web app's service worker (`sw.js`) registration
  may attempt to run inside the WebView too. This hasn't been verified here —
  it's unlikely to cause problems since the content is already fully bundled
  in the APK (no offline-caching benefit needed), but if you see odd behavior
  on first load, check whether disabling the service worker registration for
  this build specifically resolves it.

## If you want the full native Play Store SOP

[APK_Dev_Checklist.md](APK_Dev_Checklist.md) — the native-Android/Play Store
publishing process (Jetpack Compose architecture, Firebase Crashlytics, Play
Console account setup, Data Safety forms, store graphics, closed testing
tracks, etc.) — is written for a from-scratch native Android Studio project.
Most of it still applies once you have a real, running Flutter build to test:
the release-signing, store-listing, and Play Console sections are
framework-agnostic. The architecture/Jetpack Compose sections don't apply
here, since the actual app logic lives in the existing React web app, not in
native Dart or Kotlin UI code.
