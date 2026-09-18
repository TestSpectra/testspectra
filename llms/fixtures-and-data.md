# Fixtures & Test Data

> Auto-typed JSON and YAML data fixtures accessible via global Fixture.* namespace.

**Platforms:** all · **Badge:** Fixture.*

## AI Summary

Files in fixtures/*.json and fixtures/*.yaml are automatically exposed as typed objects under Fixture.<filename>.

---
## Declaring Fixtures

Place JSON or YAML data files into the `fixtures/` directory:

```json
// fixtures/users.json
{
  "admin": {
    "email": "admin@testspectra.dev",
    "password": "SecurePassword123!",
    "role": "SuperAdmin"
  },
  "standard": {
    "email": "user@testspectra.dev",
    "password": "StandardPass456!",
    "role": "Member"
  }
}
```

```yaml
# fixtures/products.yaml
featured:
  sku: "SKU-9901"
  name: "Wireless ANC Headphones"
  price: 199.99
```

---

## Using Fixtures in Tests

The CLI type generator automatically scans `fixtures/` and generates strongly-typed TypeScript interfaces under `.testspectra/types/fixtures.d.ts`:

```typescript
it('should sign in using fixture credentials', async () => {
  // Autocompleted and type-safe: Fixture.users.admin.email
  await Spectra.navigate('/login');
  await Spectra.get('#email').type(Fixture.users.admin.email);
  await Spectra.get('#password').type(Fixture.users.admin.password);
  await Spectra.get('button[type="submit"]').click();

  await Spectra.get('#role-badge').shouldHaveText(Fixture.users.admin.role);
});
```
