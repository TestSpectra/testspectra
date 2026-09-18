# Framework Overview

> Write one test and run it on Web, Android, and iOS — fast, stable, and easy to maintain.

**Platforms:** all · **Badge:** v2.0

## AI Summary

TestSpectra is a 3-pillar test framework featuring Rust core runner, CDP web driver, Zero-APK Android driver, and VS Code extension.

---
## Core Philosophy

TestSpectra v2 is built to make cross-platform testing fast, stable, and easy to maintain — one test syntax for Web, Android, and iOS.

- **Write Once, Run Anywhere**: Use `Spectra.get()` and run the same test on Web and Mobile with no syntax changes.
- **No Import Boilerplate**: `Spectra`, `Step`, `Fixture`, and Page Objects just work with full IDE autocomplete — no `import` statements.
- **Fast by Default**: Suites run in parallel with automatic, CI-safe worker sizing.
- **No More Flaky Sleeps**: Built-in auto-retry matchers (`shouldBeVisible()`, `shouldHaveText()`) wait for your app instead of arbitrary `sleep()` calls.

---

## 3-Pillar Architecture

TestSpectra is structured into three strictly isolated architectural pillars:

1. **Test Runner (CLI)**
   - Runs your suites in parallel on Web and Android, picks a safe worker count automatically, and produces a single consolidated report.
2. **VS Code Extension (IDE)**
   - Run tests from your editor with 1-click buttons, check/fix your setup visually, pair devices, and inspect your app's live screen.
3. **Cloud TestOps (Dashboard)**
   - Collects CI runs in one place with video replays of failures and flaky-test tracking across branches.

---

## Key Innovations

| What you get | Why it matters |
| :--- | :--- |
| **No Appium or Java to install** | Test Android with only Bun and ADB on your machine. |
| **No flaky `sleep()` calls** | Assertions auto-retry until your app is ready. |
| **One syntax for Web and Mobile** | Learn once, cover every platform. |
| **Safe parallelism out of the box** | Fast CI runs without crashes or manual tuning. |

---

## Driver & Platform Matrix

| Platform | What you need on your machine |
| :--- | :--- |
| **Web** | Google Chrome / Chromium |
| **Android** | Android Debug Bridge (ADB) |
| **iOS** | Xcode / macOS (iOS Simulators) |
