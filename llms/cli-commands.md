# CLI Commands Reference

> Complete reference for spectra run, lint, test, doctor, refactor, upgrade, devices, and sync-types.

**Platforms:** all · **Badge:** CLI

## AI Summary

CLI reference: spectra run -t web|android|ios, spectra lint [--strict], spectra test, spectra doctor [--fix], spectra refactor <type> <old> <new>, spectra upgrade, spectra devices, spectra sync-types.

---
## `spectra run`

Executes test suites across target platforms:

```bash
spectra run [options] [paths...]
```

### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `-t, --target` | `web | android | ios | common` | `web` | Target execution platform. |
| `-s, --spec <path>` | `string` | — | Spec file path (or filter) to execute. |
| `-c, --concurrency` | `number` | Auto | Maximum parallel worker concurrency. |
| `--failed [targets]` | `string` | — | Re-runs only failed tests (IDs or paths). |
| `--headed` / `--headless` | `boolean` | Headless | Visible vs headless Chromium. |
| `--step-delay / --delay` | `number` | `0` | Slow-motion delay in ms between steps. |
| `--host <name>` | `string` | — | Start only the named dev server. |
| `--base-url <url>` | `string` | — | Override `webConfig.baseUrl`. |
| `-d, --device <id>` | `string` | First | Target a specific Android/iOS device. |
| `--all-devices` / `--devices <list>` | — | — | Run across all / listed devices. |
| `--demo` | `boolean` | `false` | Auto-launch the built-in demo web app. |
| `-o, --output <path>` | `string` | — | Custom report JSON output path. |

---

## `spectra lint`

Validates spec schemas, frontmatter, step parity, and script structure (zero-import, single
`it()`, no `describe()`/`test()`, title alignment):

```bash
# Scan the workspace
spectra lint

# Scan one suite or test case
spectra lint specs/Authentication

# CI gate: warnings become errors (exit 1)
spectra lint --strict

# Machine-readable output for IDE/AI agents
spectra lint --json
```

---

## `spectra test`

Runs React component tests (`web.test.tsx`):

```bash
# Spectra runner (same engine as E2E)
spectra test

# Target a single spec
spectra test -s TC-0001-render
```

---

## `spectra doctor`

Runs preflight diagnostics and auto-repair:

```bash
# Standard diagnostic check
spectra doctor

# Auto-repair missing tools (Chromium, ADB, agent)
spectra doctor --fix

# Check one category or specific dependencies
spectra doctor --scope mobile
spectra doctor --only chrome

# Machine-readable output for CI/Agents
spectra doctor --json
```

---

## `spectra refactor`

Atomically renames Page Objects, Steps, Actions, and Fixtures across scripts, markdown, and
ambient types:

```bash
spectra refactor step loginAsAdmin authenticateAdmin
spectra refactor page-object LoginPage AuthPage
spectra refactor fixture users accounts

# Preview without modifying files
spectra refactor step loginAsAdmin authenticateAdmin --dry-run
```

---

## `spectra upgrade`

Upgrades ecosystem packages and system drivers to the latest versions:

```bash
# Check only, upgrade everything, or scope the upgrade
spectra upgrade --check
spectra upgrade
spectra upgrade --packages-only
spectra upgrade --drivers-only
```

---

## `spectra devices`

Lists all connected USB and wireless ADB devices:

```bash
spectra devices [--json]
```

---

## `spectra sync-types`

Regenerates Solution TSConfigs (`.testspectra/tsconfig/`) and ambient definitions (`.testspectra/types/`):

```bash
spectra sync-types
```
