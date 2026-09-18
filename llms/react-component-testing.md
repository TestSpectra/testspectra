# React Component Testing

> Mount React components with Spectra.mount() and assert with the full Spectra DSL, running on the same Spectra runner engine as E2E.

**Platforms:** web · **Badge:** Component

## AI Summary

Write specs/<Suite>/<TC-ID>/web.test.tsx with a single it() using Spectra.mount(); run with spectra test.

---
## Component Testing Model

Component tests run on the **Spectra runner** — the same engine as E2E —
so the full `Spectra.*` vocabulary works unchanged. The only new command is `Spectra.mount()`.

---

## Writing Component Tests

Create `specs/Button/TC-0001-render/web.test.tsx` next to its `spec.md` (one `it()` per file, no
`describe()`, title matches `spec.md`). Static imports are allowed for the component under test,
React, and ordinary helpers — Page Objects (named Component Objects here), Steps, and Fixtures stay
ambient globals:

```tsx
import { Button } from './Button';

it('should render button with label', async () => {
  const component = await Spectra.mount(<Button label="Save" />);

  await component.shouldBeVisible();
  await component.shouldHaveText('Save');

  await component.click();
  await ButtonComponent.root.shouldBeVisible();
});
```

> `spectra run` discovers only `.test.ts`; `spectra test` discovers only `.test.tsx`.
> `spectra lint` scans both and enforces the same structural rules.

---

## Running Component Tests

```bash
# Run component tests (Spectra runner is the default)
spectra test

# Target a single spec file
spectra test -s TC-0001-render
```
