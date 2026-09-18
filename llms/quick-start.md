# Quick Start Guide

> Install TestSpectra, verify system dependencies, and execute your first cross-platform test in under 3 minutes.

**Platforms:** all · **Badge:** 3 min

## AI Summary

Install @testspectra/cli, verify with spectra doctor --fix, scaffold with spectra init, and run with spectra run.

---
## 1. Installation

Install the TestSpectra CLI globally or locally in your project:

```bash
# Install globally via npm
npm install -g @testspectra/cli

# Or install locally in your repository
pnpm add -D @testspectra/cli
# or bun add -d @testspectra/cli
```

---

## 2. Preflight Doctor Check

Verify your environment readiness across Bun, Chromium, ADB, and drivers:

```bash
spectra doctor
```

> **Tip:** Pass `--fix` to automatically download compatible Chromium bundles, configure ADB paths, and provision Android device socket listeners.

```bash
spectra doctor --fix
```

---

## 3. Project Initialization

Scaffold a fresh TestSpectra test workspace:

```bash
mkdir my-test-project
cd my-test-project
spectra init
```

> `spectra init` scaffolds into the current directory (optional `-t default|nx|react-component`, `-f` to overwrite).

This generates the standard Spec-as-Code directory layout:
```text
my-test-project/
├── spectra.config.ts        # Central framework configuration
├── specs/                   # Test suites and test cases
│   └── Authentication/
│       ├── suite.md         # Suite documentation & tags
│       └── TC-0001-login/
│           ├── spec.md      # Test case specifications
│           ├── web.test.ts  # Web platform test script
│           └── android.test.ts # Android mobile test script
├── page-objects/            # Page Object Model classes
├── fixtures/                # JSON / YAML test data payloads
└── global-hooks/            # Workspace setup & teardown hooks
```

---

## 4. Authoring Your First Test

Open `specs/Authentication/TC-0001-login/web.test.ts`:

```typescript
it('should authenticate user and verify dashboard landing', async () => {
  // Navigate to page
  await Spectra.navigate('https://demo.testspectra.dev/login');

  // Type credentials using receiver-oriented element API
  await Spectra.get('#email').type('tester@testspectra.dev', { clearFirst: true });
  await Spectra.get('#password').type('Secret123!');
  await Spectra.get('button[type="submit"]').click();

    // Deterministic auto-waiting assertions
    await Spectra.get('#dashboard-header').shouldBeVisible();
    await Spectra.get('#dashboard-header').shouldHaveText('Welcome, Tester!');
});
```

---

## 5. Executing Tests

```bash
# Run tests on Web (Chrome)
spectra run -t web

# Run on connected Android device
spectra run -t android

# Run with 4 parallel worker processes
spectra run --concurrency 4

# Run in headed browser mode with 300ms visual step delay
spectra run --headed --step-delay 300
```
