# Multi-Host & Dev Servers

> Typed environment variables (Spectra.env), microfrontend host routing, and dev server orchestration.

**Platforms:** web · **Badge:** Spectra.env

## AI Summary

Declare named hosts and devServers in spectra.config.ts. Read typed env via Spectra.env.<KEY>.

---
## Typed Environment Variables (`Spectra.env`)

Declare environment variables in `spectra.config.ts`:

```typescript
export default defineConfig({
  executionConfig: {
    environmentVariables: {
      API_BASE_URL: 'https://staging-api.testspectra.dev',
      API_KEY: 'test-secret-key-12345',
    },
  },
});
```

In your tests, read them via the typed global `Spectra.env`:

```typescript
// Fully autocompleted and type-checked (not untyped process.env)
const apiUrl = Spectra.env.API_BASE_URL;
```

---

## Named Host Aliases

For microfrontend applications or multi-domain routing, define named host aliases:

```typescript
// spectra.config.ts
webConfig: {
  baseUrl: 'http://localhost:3000',
  hosts: {
    auth: 'http://localhost:3001',
    admin: 'http://localhost:3002',
    payment: 'https://sandbox.payment.dev',
  },
}
```

In tests, navigate using the `<alias>:/<path>` prefix (a relative path resolves against `baseUrl`, a full URL navigates directly):

```typescript
// Navigates to http://localhost:3001/login
await Spectra.navigate('auth:/login');

// Navigates to http://localhost:3002/users
await Spectra.navigate('admin:/users');
```

---

## Dev Server Orchestration

Automatically spin up local development servers and wait for health checks before executing tests:

```typescript
// spectra.config.ts
webConfig: {
  devServers: [
    {
      name: 'frontend',
      command: 'pnpm nx serve customer-portal',
      url: 'http://localhost:4200',
      port: 4200,
      reuseExistingServer: true, // Do not restart if already running
    },
  ],
}
```
