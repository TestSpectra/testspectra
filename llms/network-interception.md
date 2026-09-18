# Network Interception & Mocking

> Mock APIs and simulate failures or slow networks on Web and Mobile — no backend changes needed.

**Platforms:** web, android · **Badge:** Mocking

## AI Summary

Use Spectra.intercept({ url, method, response: { status, body, delayMs } }) to stub APIs.

---
## Stubbing Responses

Mock REST and GraphQL API responses directly at the browser network layer without altering backend infrastructure:

```typescript
it('should display mocked user profile', async () => {
  // Define intercept rule before navigation
  await Spectra.intercept({
    url: '**/api/v1/user/profile',
    method: 'GET',
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'usr_77',
        name: 'Sarah Connor',
        role: 'Admin',
      }),
    },
  });

  await Spectra.navigate('/profile');
  await Spectra.get('[data-testid="user-name"]').shouldHaveText('Sarah Connor');
});
```

---

## Simulating Failures & Latency

```typescript
// Simulate 503 Service Unavailable
await Spectra.intercept({
  url: '**/api/v1/checkout',
  method: 'POST',
  response: {
    status: 503,
    body: JSON.stringify({ message: 'Payment gateway temporarily offline' }),
  },
});

// Inject 2.5s network delay to test loading skeletons
await Spectra.intercept({
  url: '**/api/v1/reports',
  delayMs: 2500,
});
```

---

## Interception Options Reference

| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string | RegExp` | Yes | URL glob pattern or regex to intercept. |
| `method` | `'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'` | No | HTTP method filter (matches all if omitted). |
| `response.status` | `number` | No | HTTP status code (default: `200`). |
| `response.body` | `string | object` | No | Mock payload string or JSON object. |
| `response.headers` | `Record<string, string>` | No | Custom HTTP response headers. |
| `delayMs` | `number` | No | Artificial latency in milliseconds before response. |

Mock rules are cleared automatically after each test. To clear manually, call `await Spectra.clearMocks()`.
