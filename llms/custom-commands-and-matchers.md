# Commands & Receiver Matchers

> Receiver-oriented element interactions, fluent actions, and auto-waiting semantic assertions.

**Platforms:** all · **Badge:** Core

## AI Summary

Element actions: .click(), .type(), .hover(). Matchers: .shouldBeVisible(), .shouldHaveText(), .shouldBeEnabled().

---
## Element Actions

Element queries are performed via `Spectra.get(selector)` (single element) and `Spectra.getAll(selector)` (collections). Actions are executed directly on the element proxy:

```typescript
const submitBtn = Spectra.get('#submit-button');

// Click actions
await submitBtn.click();
await submitBtn.doubleClick();
await submitBtn.rightClick();

// Input typing and clearing
await Spectra.get('#email').type('user@testspectra.dev', { clearFirst: true });
await Spectra.get('#notes').clear();

// Dropdown selection
await Spectra.get('#country-dropdown').select('Canada');

// Mouse & touch gestures
await Spectra.get('#avatar').hover();
await Spectra.get('#draggable').dragDrop('#drop-zone');
await Spectra.get('#card').longPress(1000); // 1000ms long press
await Spectra.get('#footer').scrollIntoView();
```

---

## Semantic Matchers

Every assertion is receiver-oriented and automatically retries with adaptive polling until the element satisfies the condition or hits timeout (default: 5000ms):

```typescript
// Visibility & DOM Existence
await Spectra.get('#modal').shouldBeVisible();
await Spectra.get('#skeleton-loader').shouldNotBeVisible();
await Spectra.get('#cookie-banner').shouldExist();
await Spectra.get('#temp-alert').shouldNotExist();

// Interactive State
await Spectra.get('#submit-btn').shouldBeEnabled();
await Spectra.get('#disabled-input').shouldBeDisabled();
await Spectra.get('#terms-checkbox').shouldBeChecked();
await Spectra.get('#promo-checkbox').shouldNotBeChecked();
await Spectra.get('#email-input').shouldBeFocused();

// Text & Value Content
await Spectra.get('#toast-message').shouldHaveText('Order placed successfully!');
await Spectra.get('#status-badge').shouldContainText('Active');
await Spectra.get('#search-field').shouldHaveValue('Laptop Pro');
await Spectra.get('a#download').shouldHaveAttribute('href', '/latest.tar.gz');
```

> **Per-Assertion Timeout Override:** Pass `{ timeoutMs: N }` to override timeout for slow asynchronous operations:

```typescript
await Spectra.get('#async-result').shouldHaveText('Processed', { timeoutMs: 10000 });
```

---

## Scoped Lookups (`.get()` / `.getAll()`)

Any element proxy can scope child queries to its own DOM/Accessibility subtree without writing complex compound selectors:

```typescript
// Query inside a specific card
const secondCard = Spectra.getAll('.product-card').nth(1);
await secondCard.get('#buy-button').click();
await secondCard.get('#item-price').shouldHaveText('$49.99');

// Chain from Page Object properties
await LoginPage.modalContainer.get('#close-btn').click();
```
