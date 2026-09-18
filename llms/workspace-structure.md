# Workspace & Spec-as-Code Layout

> Understand the Spec-as-Code directory organization, platform file names, and zero-import TypeScript setup.

**Platforms:** all · **Badge:** Structure

## AI Summary

TestSpectra uses specs/, page-objects/, support/, fixtures/, and solution-style platform isolated tsconfigs.

---
## Default Directory Layout

TestSpectra enforces a **Git-first, Spec-as-Code** workspace structure:

```text
my-test-project/
├── .testspectra/               # Auto-managed cache, types, & reports (gitignored)
│   ├── tsconfig/               # Solution TSConfigs (web.json, android.json, etc.)
│   ├── types/                  # Auto-generated ambient TypeScript definitions
│   └── reports/                # report.json & network-resources.json
│
├── specs/                      # Test Suites & Test Cases
│   └── ShoppingCart/           # Suite Directory
│       ├── suite.md            # Suite description & platform metadata
│       ├── hooks/              # Suite lifecycle hooks (before, beforeEach...)
│       └── TC-0010-add-item/   # Test Case Directory
│           ├── spec.md         # Test case steps & documentation
│           ├── web.test.ts     # Web execution script
│           ├── android.test.ts # Android execution script
│           └── mobile.test.ts  # Shared Android + iOS script
│
├── page-objects/               # Page Object Model classes (auto-ambient)
│   ├── LoginPage.ts
│   └── CartPage.ts
│
├── support/                    # Reusable logic
│   ├── steps/                  # Business shared steps (Step.<name>)
│   └── actions/                # Low-level actions (Spectra.<action>)
│
├── fixtures/                   # JSON / YAML test data (Fixture.<name>)
│   ├── users.json
│   └── products.json
│
├── global-hooks/               # Workspace-wide setup & teardown
│   ├── before/
│   └── after/
│
├── spectra.config.ts           # Central configuration
└── tsconfig.json               # Solution root tsconfig
```

---

## Platform File Names

The test runner maps test scripts to their respective driver runtimes using deterministic file names (a test script contains exactly **one** `it()` block — `describe()` is forbidden because suites are defined by the directory hierarchy):

| File Name | Target Platform | Driver Runtime Engine | CodeLens Action in VS Code |
| :--- | :--- | :--- | :--- |
| **`web.test.ts`** | Web Browsers | Built-in Chrome automation | `▶ Run on Chrome` |
| **`android.test.ts`** | Android Devices | Built-in Zero-APK agent | `▶ Run on <Device>` |
| **`ios.test.ts`** | iOS Simulators/Devices | Xcode driver | `▶ Run on <Simulator>` |
| **`mobile.test.ts`** | Shared Mobile | One script for Android + iOS | `▶ Run on First Mobile` |
| **`common.test.ts`** | Universal | One script for Web + Mobile | `▶ Run on Available Target` |

> Test scripts use the platform stem as the **exact file name** (no custom prefix), e.g. `specs/Authentication/TC-0001-login/web.test.ts` — never `TC-0001-login.web.test.ts`.

---

## Zero-Import TS Solution

TestSpectra eliminates `import` boilerplate for framework APIs. In any test script, these are ambient globals (never imported manually):
- **`Spectra`**: Global automation engine (`Spectra.get()`, `Spectra.navigate()`, `Spectra.intercept()`).
- **`Step`**: Reusable business steps declared under `support/steps/` (e.g. `Step.loginAsAdmin()`).
- **`Fixture`**: Typed data payloads loaded from `fixtures/*.json` (e.g. `Fixture.users.admin`).
- **Page Objects**: Classes declared in `page-objects/` (e.g. `LoginPage.emailInput`).
- **Custom Actions**: `Spectra.<actionName>()` declared under `support/actions/`.
- **`Spectra.env`**: Typed environment variables declared in `spectra.config.ts`.

Only non-ambient helpers that fall outside the framework surface — e.g. `mount` from `@testspectra/react`, a component under test, or `defineConfig` in `spectra.config.ts` — are imported manually.
