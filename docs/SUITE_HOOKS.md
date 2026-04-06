# Suite Hooks — Feature Documentation

> **TestSpectra · Script Editor**  
> Feature: Suite Lifecycle Hooks  
> Status: Implemented (frontend) · Backend file path: `hooks/{suiteId}/{hookType}.hook.ts`

---

## 1. Concept

**Suite Hooks** are TypeScript functions that run at **lifecycle points** around the test cases in a suite. They let you set up shared state, authenticate, reset data, or clean up resources — without duplicating code in every test case.

There are four hook types, mirroring the WebdriverIO Mocha runner API:

| Hook | When it Runs |
|------|--------------|
| `before()` | **Once**, before the first test case in the suite begins |
| `after()` | **Once**, after the last test case in the suite completes |
| `beforeEach()` | Before **every** test case in the suite |
| `afterEach()` | After **every** test case in the suite |

### Execution Order

```
before()                    ← runs once
  ├─ beforeEach()           ← runs before every test
  │    ├─ it('TC-1001')     ← individual test case
  │    └─ afterEach()       ← runs after every test
  ├─ beforeEach()
  │    ├─ it('TC-1002')
  │    └─ afterEach()
  └─ ...
after()                     ← runs once
```

### Key Points

- Hooks are **per-suite** — they apply to all test cases in that suite.
- Each test case file (`TC-XXXX.spec.ts`) contains **only** the `it()` block. Hooks are managed separately and injected at runtime.
- Hooks are **optional** — a suite works fine without any hooks defined.
- The **function signature is read-only** — the `export default async function () {` header and closing `}` cannot be deleted. Only the body is editable.

---

## 2. Using the UI

### Opening a Hook

1. Open the **Script Editor** (`/scripts` route).
2. In the **File Explorer sidebar** (Files icon, or `Cmd+Shift+E`), expand a **suite folder**.
3. Inside the suite, expand the **Hooks** sub-folder.
4. Click any hook (`before()`, `after()`, `beforeEach()`, `afterEach()`) to open it in the editor.

The hook opens as a **tab** in the editor with a ⚡ amber Zap icon.

### Editing a Hook

- **Line 1** (`export default async function () {`) — **read-only**.
- **Last line** (`}`) — **read-only**.
- **Body lines** — fully editable.

Example:
```ts
export default async function () {
  await browser.url('/login');
  await loginPage.login('admin', 'password');
}
```

### Saving / Draft System

Hooks use the **same draft/publish system** as test cases and page objects:
- Autosaved as a **draft** (500ms debounce).
- Bottom status bar shows: Unsaved → Draft Saved → Published.
- To publish, use the Git sidebar (`Ctrl+Shift+G`) and commit the hook file.
- To discard, use the Discard button in the Git sidebar.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+S` | Save draft immediately |
| `Cmd/Ctrl+W` | Close tab |
| `Cmd/Ctrl+Shift+T` | Reopen last closed hook tab |

---

## 3. File Structure

```
hooks/
  {suiteId}/              ← UUID of the suite
    before.hook.ts
    after.hook.ts
    beforeEach.hook.ts
    afterEach.hook.ts
```

The File Explorer shows all four hooks under every suite. Clicking an unwritten hook opens it with a template (the file isn't created on disk until first save).

---

## 4. Template

```ts
// Runs once before all tests in this suite.
export default async function () {

}
```

---

## 5. Implementation Notes (Developer Reference)

### New Files

- `src/services/suite-hook-service.ts` — hook service (openHook, saveHookDraft, discardHookDraft, helpers)

### Modified Files

- `src/components/editor/MonacoEditor.tsx` — added `"suite-hook"` to `RESTRICTION_REGISTRY` and `fileType` union
- `src/components/editor/FileExplorerSidebar.tsx` — added Hooks sub-folder per suite, hook node type, `onOpenSuiteHook` prop
- `src/components/UnifiedScriptEditor.tsx` — added `"suite-hook"` to `OpenFile.type`, `handleOpenSuiteHook`, title bar hook display, tab Zap icon

### RESTRICTION_REGISTRY entry for suite-hook

```ts
"suite-hook": {
  isRestricted: true,
  getSelectableRange: (count, m) => new monaco.Range(2, 1, count-1, m.getLineMaxColumn(count-1)),
  getRestrictions: (count, m) => [{ range: [2, 1, count-1, ...], allowMultiline: true, label: "hookBody" }],
  isLineRestricted: (line, count) => line === 1 || line >= count,
}
```

### Backend API

Hook editing uses the existing `POST /scripts/open` endpoint with file path `hooks/{suiteId}/{hookType}.hook.ts`.  
No backend changes are required for the editor to work.

Optional future endpoint:
- `GET /scripts/suite-hooks/{suiteId}` → `{ "existingHooks": ["before", "beforeEach"] }` — used to mark which hooks exist in the explorer.

---

## 6. Future Improvements

- [ ] Backend endpoint to show which hooks exist on disk (visual dot in File Explorer).
- [ ] Dot/badge on hook nodes when a draft is pending.
- [ ] "Reset to Template" action in the editor.
- [ ] Bulk publish hooks with test case files in the version control sidebar.
