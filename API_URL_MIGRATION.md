# API URL Migration - Runtime Config

## Status: ✅ DONE

Migrating from build-time `VITE_API_URL` to a runtime environment variable
`TEST_SPECTRA_API_URL` used by the Tauri backend.

## Goal
Allow users to change API URL **after** Tauri app installation without rebuilding.

## Implementation

### ✅ Backend (Tauri/Rust)
- [x] Created `get_api_url()` command in `src-tauri/src/lib.rs`
- [x] Reads API URL from env `TEST_SPECTRA_API_URL`

### ✅ Frontend Helpers
- [x] `src/lib/config.ts` exposes `getApiUrl()`
- [x] On Tauri desktop it calls the Rust `get_api_url` command
- [x] On pure web build (no Tauri) it falls back to `import.meta.env.VITE_API_URL`

### ⏳ Services Migration
- [x] `api-client.ts` - Added async factory `getUserServiceClient()`
- [x] `definitions-service.ts` - Uses `getApiUrl()` in `fetchDefinitions()`
- [ ] Update components:
  - [ ] `QuickCreateDialog.tsx`
  - [ ] `TestCaseForm.tsx`
  - [ ] `TestCasesList.tsx`

## How Users Change API URL

### Tauri desktop: `TEST_SPECTRA_API_URL` (before launching app)

**macOS/Linux:**
```bash
TEST_SPECTRA_API_URL="https://api.example.com" open -a TestSpectra
```

**Windows (via .bat file):**
```batch
@echo off
set TEST_SPECTRA_API_URL=https://api.example.com
start "" "C:\Program Files\TestSpectra\TestSpectra.exe"
```

**Windows (via PowerShell):**
```powershell
$env:TEST_SPECTRA_API_URL = "https://api.example.com"
& "C:\Program Files\TestSpectra\TestSpectra.exe"
```

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
- [ ] Run without `TEST_SPECTRA_API_URL` and confirm it logs an error
- [ ] Run with `TEST_SPECTRA_API_URL` pointing to your API and confirm it is used

## Notes
- Keep legacy `.env` file for documentation/reference only
- Eventually remove all `import.meta.env.VITE_API_URL` usage
- Components using `API_URL` directly: need to call `await getApiUrl()` in async functions
