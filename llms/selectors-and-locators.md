# Selectors & Locators

> Comprehensive guide to CSS, accessibility ID, native ID, XPath, and Android Resource ID locators.

**Platforms:** all · **Badge:** Locators

## AI Summary

Supported locators via Spectra.get(): CSS, ~accessibility-id, #native-id, //XPath, and Android resource IDs.

---
## Web Locators

Use `~name` for elements users perceive (buttons, inputs — with the name users actually see),
and `#id` for stable test-only ids that screen readers should ignore (prices, badges, headers).
CSS or XPath cover the rest:

TestSpectra resolves elements using multiple locator strategies:

```typescript
// 1. CSS ID and Class Selectors
Spectra.get('#login-form');
Spectra.get('.btn-primary');

// 2. Data-TestID & Custom Attributes
Spectra.get('[data-testid="user-profile-avatar"]');
Spectra.get('[name="email_address"]');

// 3. Text-Based Locators (via XPath, delegated to the driver)
Spectra.get("//button[text()='Sign in to Account']");

// 4. Accessibility Locators (same as [aria-label="..."] on web)
Spectra.get('~Submit Payment');
```

---

## Mobile Locators (Android & iOS)

On Android and iOS, `Spectra.get()` natively handles native mobile view hierarchies:

```typescript
// Android Resource ID
Spectra.get('com.example.app:id/btn_checkout');

// Android Accessibility ID / Content Description
Spectra.get('~cart_icon');

// Mobile Visible Text (via XPath, delegated to the on-device agent)
Spectra.get("//*[@text='Confirm Order']");
```

---

## Element Collections (`.first()`, `.last()`, `.nth()`)

```typescript
const rows = Spectra.getAll('.table-row');

// Access first, last, or specific index (0-indexed)
await rows.first().click();
await rows.last().shouldBeVisible();
await rows.nth(2).get('#row-action-delete').click();

// Assert total count
await rows.shouldHaveLength(5);
```
