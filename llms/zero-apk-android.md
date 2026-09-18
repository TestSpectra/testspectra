# Zero-APK Android Automation

> Drive Android apps with nothing installed on the device — only Bun and ADB needed on your machine.

**Platforms:** android · **Badge:** Zero-APK

## AI Summary

Zero-APK Android automation connects to spectra-agent.jar via TCP binary protocol on port 8200 (+worker index) over ADB.

---
## Zero-APK Architecture

TestSpectra drives the device directly with a tiny agent file — no app installation, no setup dialogs:

1. Pushes `spectra-agent.jar` (`~590 KB`) to a temp folder on the Android device.
2. Talks to it directly over a fast ADB connection (port `8200`, + worker index for parallel devices).

**What you get:**
- **Nothing installed on the device**: No APKs, no leftover test apps.
- **Almost zero setup**: Only Bun and ADB on your machine.
- **Fast**: Taps and checks execute in milliseconds.
- **Inspect while testing**: The live VS Code Mobile Inspector keeps working during runs.

---

## Authoring Android Tests

Create `specs/Checkout/TC-0005/android.test.ts`:

```typescript
it('should add product to cart and verify snackbar', async () => {
  // Android Resource ID locator
  const addToCartBtn = Spectra.get('com.example.store:id/btn_add_to_cart');
  await addToCartBtn.click();

    // Verify confirmation snackbar by visible text
    const snackbar = Spectra.get("//*[@text='Added to Cart']");
    await snackbar.shouldBeVisible();
});
```

---

## Device Discovery & Multi-Device

```bash
# List all connected USB and Wi-Fi ADB devices
spectra devices

# Run on a specific device by serial or IP
spectra run -t android -d emulator-5554

# Concurrently broadcast test run across all connected devices
spectra run -t android --all-devices
```
