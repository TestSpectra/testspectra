# Fast Session & Auth Seeding

> Skip repetitive UI logins with an explicit Spectra.seedSession() support action (host-side API login, no login form touched).

**Platforms:** web, android · **Badge:** Auth

## AI Summary

Call await Spectra.seedSession() (support/actions/seedSession/) to start tests authenticated; web injects HttpOnly cookies via CDP, mobile uses a debug-only deep link.

---
## Seeding via Support Action

Session seeding is packaged as a support action (`support/actions/seedSession/`), so it is an
explicit call in the test body — not a hidden global-hook side effect:

```typescript
it('should open dashboard as an authenticated user', async () => {
  // Logs in via a direct host-side API call — no login form is ever touched
  await Spectra.seedSession();

  await Spectra.navigate('/dashboard');
  await Spectra.get('#role-badge').shouldHaveText('Authenticated');
});
```

---

## Web: HttpOnly Cookie Injection

The default `web.action.ts` performs a host-side (Bun) `fetch()` login — free from CORS and
credential restrictions — then applies the raw `Set-Cookie` headers straight into the browser
cookie jar via CDP, `HttpOnly` included:

```typescript
// support/actions/seedSession/web.action.ts
export default async function (this: any) {
  const res = await fetch('http://localhost:5200/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@testspectra.dev', password: 'demo-password' }),
  });
  if (!res.ok) {
    throw new Error(`seedSession: login failed (${res.status})`);
  }
  await this.browser.setCookies(res.headers.getSetCookie(), res.url);
}
```

> Inside an action, `this` is `Spectra` itself, so `this.browser.setCookies(...)` is the same
> as `Spectra.browser.setCookies(...)`. Pass the login response URL so cookie
> `Domain`/`Path` defaults resolve correctly.

---

## Android: Debug-Only Deep Link

A native app has no cookie jar — its session lives in the app's own secure storage. Seeding asks
the app itself to authenticate via a **debug-only** deep-link route (excluded from release builds
via a separate build flavor, never accepting a caller-supplied token):

```typescript
// support/actions/seedSession/mobile.action.ts
export default async function (this: any) {
  await this.navigate('testspectra-demo://seed-session');
  await this.get('~auth-status-badge').waitForElement(10000);
}
```
