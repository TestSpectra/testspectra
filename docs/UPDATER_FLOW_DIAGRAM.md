# Tauri Updater Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TestSpectra App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  VersionGuard    │────────▶│  Version Service │             │
│  │  (UI Component)  │         │  (Compatibility) │             │
│  └──────────────────┘         └──────────────────┘             │
│           │                             │                        │
│           │                             ▼                        │
│           │                    ┌──────────────────┐             │
│           └───────────────────▶│ Tauri Update     │             │
│                                │ Service          │             │
│                                └──────────────────┘             │
│                                         │                        │
└─────────────────────────────────────────┼────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
          ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
          │  Backend Server  │  │ GitHub Releases  │  │  Tauri Updater   │
          │  /version API    │  │  latest.json     │  │  Plugin          │
          └──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Version Check Flow

```
App Start
   │
   ▼
┌─────────────────────────────────┐
│ Check Server Version            │
│ GET /version                    │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Server Response:                │
│ {                               │
│   version: "0.1.25",            │
│   minClientVersion: "0.1.0"     │
│ }                               │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Compare Versions                │
│ Client: 0.1.20                  │
│ Min Required: 0.1.0             │
└─────────────────────────────────┘
   │
   ├─────────────────┬─────────────────┐
   │                 │                 │
   ▼                 ▼                 ▼
Compatible      Incompatible      Check Tauri
   │                 │             Updates
   │                 │                 │
   ▼                 ▼                 ▼
Continue        Show Update      Download from
App             Dialog           GitHub
```

## Update Installation Flow

```
User Clicks "Download & Install Update"
   │
   ▼
┌─────────────────────────────────┐
│ Check GitHub Releases           │
│ GET latest.json                 │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Update Available?               │
└─────────────────────────────────┘
   │
   ├─────────────────┬─────────────────┐
   │                 │                 │
   ▼                 ▼                 ▼
  Yes               No            Error
   │                 │                 │
   ▼                 ▼                 ▼
Download         No Action      Fallback to
Update                          Manual Download
   │
   ▼
┌─────────────────────────────────┐
│ Download Progress               │
│ ████████░░░░░░░░░░ 40%         │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Verify Signature                │
│ (Using public key)              │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Install Update                  │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Restart Application             │
└─────────────────────────────────┘
   │
   ▼
Updated App Running!
```

## Version Compatibility Logic

```
Server Version: 0.1.25
   │
   ▼
Extract Major.Minor
   │
   ▼
Min Client Version: 0.1.0
   │
   ▼
┌─────────────────────────────────────────────────────┐
│ Client Version Check                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Client 0.1.5  → Major: 0, Minor: 1, Patch: 5     │
│  Min    0.1.0  → Major: 0, Minor: 1, Patch: 0     │
│                                                     │
│  ✓ Major matches (0 == 0)                         │
│  ✓ Minor matches (1 == 1)                         │
│  ✓ Patch ignored (always compatible)              │
│                                                     │
│  Result: COMPATIBLE ✅                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Client 0.0.9  → Major: 0, Minor: 0, Patch: 9     │
│  Min    0.1.0  → Major: 0, Minor: 1, Patch: 0     │
│                                                     │
│  ✓ Major matches (0 == 0)                         │
│  ✗ Minor too low (0 < 1)                          │
│                                                     │
│  Result: INCOMPATIBLE ❌                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## GitHub Release Structure

```
GitHub Release: v0.1.25
│
├── latest.json ─────────────────┐
│   {                            │
│     "version": "0.1.25",       │ ◀── Tauri checks this
│     "platforms": {             │
│       "darwin-x86_64": {...},  │
│       "windows-x86_64": {...}  │
│     }                          │
│   }                            │
│                                │
├── TestSpectra_0.1.25_x64.dmg  │
├── TestSpectra_0.1.25_x64.dmg.sig ◀── Signature verification
│                                │
├── TestSpectra_0.1.25_x64-setup.exe
├── TestSpectra_0.1.25_x64-setup.exe.sig
│
└── TestSpectra_0.1.25_amd64.AppImage
    TestSpectra_0.1.25_amd64.AppImage.sig
```

## Periodic Check Timeline

```
Time: 00:00 ─────────────────────────────────────────────────────▶
      │         │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼         ▼
   App Start  +5 min   +10 min   +15 min   +20 min   +25 min
      │         │         │         │         │         │
      └─────────┴─────────┴─────────┴─────────┴─────────┴────▶
              Check Version & Updates Every 5 Minutes
```

## Security Flow

```
┌─────────────────────────────────┐
│ Developer Creates Release       │
│ (Local Machine)                 │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Sign with Private Key           │
│ ~/.tauri/testspectra.key        │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Upload to GitHub                │
│ - Binary                        │
│ - Signature (.sig)              │
│ - latest.json                   │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ User Downloads Update           │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Verify with Public Key          │
│ (in tauri.conf.json)            │
└─────────────────────────────────┘
   │
   ├─────────────────┬─────────────────┐
   │                 │                 │
   ▼                 ▼                 ▼
Valid           Invalid          Install
Signature       Signature        Update
   │                 │
   ▼                 ▼
Install          Reject &
Update           Show Error
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                      VersionGuard.tsx                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ State Management                                       │  │
│  │ - isCompatible                                         │  │
│  │ - isUpdating                                           │  │
│  │ - updateProgress                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                │
│         │                 │                 │                │
│         ▼                 ▼                 ▼                │
│  ┌──────────┐    ┌──────────────┐   ┌──────────────┐       │
│  │ Version  │    │    Tauri     │   │   Update     │       │
│  │ Service  │    │   Update     │   │     UI       │       │
│  │          │    │   Service    │   │   Dialog     │       │
│  └──────────┘    └──────────────┘   └──────────────┘       │
│       │                 │                    │               │
└───────┼─────────────────┼────────────────────┼───────────────┘
        │                 │                    │
        ▼                 ▼                    ▼
   Check Server    Check GitHub         Show Progress
   Compatibility   Releases             & Install
```
