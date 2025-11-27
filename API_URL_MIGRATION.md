# API URL Migration - Runtime Config

## Status: ✅ IN PROGRESS

Migrating from build-time `VITE_API_URL` to runtime `API_URL` configuration.

## Goal
Allow users to change API URL **after** Tauri app installation without rebuilding.

## Implementation

### ✅ Backend (Tauri/Rust)
- [x] Created `get_api_url()` command in `src-tauri/src/lib.rs`
- [x] Priority: ENV `API_URL` → Config file → Default
- [x] Config file location: `~/Library/Application Support/TestSpectra/config.json` (macOS)
- [x] Default fallback: `https://testspectra.mrndev.me/api`

### ✅ Frontend Helpers
- [x] Created `src/lib/config.ts` with `getApiUrl()` function
- [x] Caches result for performance

### ⏳ Services Migration
- [x] `api-client.ts` - Added async factory `getUserServiceClient()`
- [x] `definitions-service.ts` - Uses `getApiUrl()` in `fetchDefinitions()`
- [ ] Update components:
  - [ ] `QuickCreateDialog.tsx`
  - [ ] `TestCaseForm.tsx`
  - [ ] `TestCasesList.tsx`

## How Users Change API URL

### Option 1: ENV Variable (before launching app)

**macOS/Linux:**
```bash
API_URL="https://api.example.com" open -a TestSpectra
```

**Windows (via .bat file):**
```batch
@echo off
set API_URL=https://api.example.com
start "" "C:\Program Files\TestSpectra\TestSpectra.exe"
```

**Windows (via PowerShell):**
```powershell
$env:API_URL = "https://api.example.com"
& "C:\Program Files\TestSpectra\TestSpectra.exe"
```

### Option 2: Config File (persistent) - **Recommended**

**macOS:**
- Location: `~/Library/Application Support/TestSpectra/config.json`
- Full path: `/Users/<username>/Library/Application Support/TestSpectra/config.json`

**Windows:**
- Location: `%APPDATA%\TestSpectra\config.json`
- Full path: `C:\Users\<username>\AppData\Roaming\TestSpectra\config.json`
- Quick access: Type `%APPDATA%\TestSpectra` in File Explorer

**Linux:**
- Location: `~/.config/TestSpectra/config.json`
- Full path: `/home/<username>/.config/TestSpectra/config.json`

**File contents (all platforms):**
```json
{
  "api_url": "https://api.example.com"
}
```

Then restart app.

## Migration Checklist

### Files to Update
- [x] src-tauri/src/lib.rs
- [x] src/lib/config.ts
- [x] src/services/api-client.ts
- [x] src/services/definitions-service.ts  
- [ ] src/components/QuickCreateDialog.tsx
- [ ] src/components/TestCaseForm.tsx
- [ ] src/components/TestCasesList.tsx
- [ ] src/services/auth-service.ts (if it has hardcoded API_URL)
- [ ] src/services/test-case-service.ts (if it has hardcoded API_URL)

### Testing
- [ ] Build Tauri app locally
- [ ] Test with default (no config)
- [ ] Test with ENV variable
- [ ] Test with config file
- [ ] Test config file change + restart

## Notes
- Keep legacy `.env` file for documentation/reference only
- Eventually remove all `import.meta.env.VITE_API_URL` usage
- Components using `API_URL` directly: need to call `await getApiUrl()` in async functions
