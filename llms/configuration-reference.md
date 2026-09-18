# Configuration (`spectra.config.ts`)

> Full configuration schema reference for webConfig, androidConfig, iosConfig, and executionConfig.

**Platforms:** all · **Badge:** Config

## AI Summary

spectra.config.ts exports defineConfig with webConfig, androidConfig, iosConfig, and executionConfig.

---
## Complete Configuration Example

```typescript
import { defineConfig } from '@testspectra/cli';

export default defineConfig({
  // Web Platform Configuration (CDP)
  webConfig: {
    baseUrl: 'http://localhost:3000',
    hosts: {
      auth: 'http://localhost:3001',
      admin: 'http://localhost:3002',
    },
    devServers: [
      {
        name: 'web-app',
        command: 'pnpm nx serve web-app',
        url: 'http://localhost:3000',
        port: 3000,
        reuseExistingServer: true,
      },
    ],
    maxConcurrentSessions: 4,
    headless: true,
    implicitWait: 5000,
    parallelizationMode: 'suite', // 'suite' | 'testcase'
  },

  // Android Configuration (Zero-APK)
  androidConfig: {
    driverServer: 'tcp://127.0.0.1:8200',
    appPackage: 'dev.testspectra.app',
    appActivity: '.MainActivity',
    noReset: false,
    implicitWait: 10000,
    parallelizationMode: 'suite',
    devices: [
      {
        id: 'emulator-5554',
        name: 'Pixel 7 Pro Emulator',
        systemPort: 8200,
      },
    ],
  },

  // Execution & Diagnostics Settings
  executionConfig: {
    networkMonitoringEnabled: true,
    fastResponseTime: 200,
    normalResponseTime: 1000,
    monitoredDomains: [{ domain: 'api.testspectra.dev', enabled: true }],
    environmentVariables: {
      API_MODE: 'sandbox',
    },
  },
});
```

---

## Schema Breakdown

- **`webConfig.hosts`**: Dictionary of named host aliases (`auth`, `admin`) for microfrontend routing, used as `alias:/path`.
- **`webConfig.devServers`**: Automated child process management for local dev servers.
- **`webConfig.stepDelay`**: Slow-motion delay in ms after each command/assertion.
- **`executionConfig.monitoredDomains`**: `{ domain, enabled }` objects scoping network recording (empty captures everything).
- **`executionConfig.environmentVariables`**: Flat string dictionary exposed via typed global `Spectra.env`.
