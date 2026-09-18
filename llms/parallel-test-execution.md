# Parallel Batch Execution

> Suites run in parallel automatically with safe worker sizing — control it with --concurrency or maxConcurrentSessions.

**Platforms:** all · **Badge:** Parallel

## AI Summary

Rust core runner parallelizes suites with automatic container-safe sizing; override via --concurrency or maxConcurrentSessions; group via parallelizationMode suite|testcase; retry failures with --failed.

---
## Automatic Worker Sizing

TestSpectra picks a safe number of parallel workers from your machine and container limits, so CI
runners neither sit idle nor crash from overload. You only step in when you want explicit control:

```bash
# Let TestSpectra decide (default)
spectra run -t web

# Cap it yourself
spectra run -t web --concurrency 4
```

```typescript
// spectra.config.ts — per-platform cap
webConfig: {
  maxConcurrentSessions: 4,
},
```

---

## Suite vs Testcase Parallelization

Suites run concurrently on separate workers. Within a suite, choose how browser sessions are shared:

```typescript
// spectra.config.ts — per platform (webConfig, androidConfig, iosConfig)
webConfig: {
  // 'suite' (share one session per suite) | 'testcase' (isolated session per test)
  parallelizationMode: 'suite',
},
```

- **`suite` Mode**: Test cases within the same suite directory run sequentially in a single browser session (hooks execute between tests). Faster — the browser is not restarted per test.
- **`testcase` Mode**: Every test case spawns a clean, isolated browser instance. Use it when tests must never share state.

---

## Smart Retry (`--failed`)

When 2 out of 50 test cases fail, re-running all 50 tests wastes compute time. TestSpectra carries over passed tests:

```bash
# Re-run only failed tests from previous session
spectra run --failed

# Re-run a specific failed test case ID
spectra run --failed TC-0003
```

1. Filters only test cases with status `failed` or `error`.
2. Preserves passed test durations and outputs into the new session.
3. Only dispatches failed tests to workers.
4. Generates a unified, consolidated `report.json`.
