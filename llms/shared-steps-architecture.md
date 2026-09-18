# Shared Steps Architecture

> Encapsulate reusable, multi-statement business workflows under Step.* with YAML metadata.

**Platforms:** all · **Badge:** Step.*

## AI Summary

Shared steps live in support/steps/<name>/ with step.md metadata and anonymous export default web.step.ts.

---
## Concept & Philosophy

**Shared Steps** encapsulate multi-step business workflows (e.g. login as administrator, complete checkout, seed database) under the global ambient namespace `Step.<stepName>()`.

| Attribute | Shared Steps (`Step.*`) | Spectra Actions (`Spectra.*`) |
| :--- | :--- | :--- |
| **Level** | High-level business flow | Low-level technical utility |
| **Location** | `support/steps/<stepName>/` | `support/actions/<actionName>/` |
| **Metadata** | `step.md` with YAML frontmatter | None (`.action.ts` only) |
| **Invocation** | `await Step.loginAsAdmin(params)` | `await Spectra.safeClick('#btn')` |

---

## Step Metadata (`step.md`)

Create `support/steps/loginAsAdmin/step.md`:

```markdown
---
id: step-login-as-admin
name: loginAsAdmin
description: Authenticates user as an administrator and asserts landing dashboard
platform:
  - web
  - mobile
parameters:
  - name: email
    type: string
    required: false
    description: Admin email (defaults to Fixture.users.admin.email)
  - name: password
    type: string
    required: false
    description: Admin password (defaults to Fixture.users.admin.password)
---

# Login as Admin Step
Hardened authentication sequence for Web and Mobile test suites.
```

---

## Step Script Implementation

Create `support/steps/loginAsAdmin/web.step.ts`:

```typescript
// Standard anonymous async default export function
export default async function (params?: { email?: string; password?: string }) {
  const email = params?.email ?? Fixture.users.admin.email;
  const password = params?.password ?? Fixture.users.admin.password;

  await Spectra.navigate('/auth/login');
  await LoginPage.emailInput.type(email, { clearFirst: true });
  await LoginPage.passwordInput.type(password);
  await LoginPage.submitBtn.click();

  await DashboardPage.welcomeHeader.shouldBeVisible();
}
```

---

## Invoking Steps in Tests

No import required — `Step` is available globally:

```typescript
it('should change organization profile', async () => {
  // Invoke shared step
  await Step.loginAsAdmin();

  await DashboardPage.settingsNav.click();
  await Spectra.get('#org-name').type('Spectra Corp');
});
```
