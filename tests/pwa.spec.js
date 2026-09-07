import { test, expect } from '@playwright/test';

test.describe('PWA設定', () => {
  test('manifestに192/512pxのPNGアイコンが含まれる', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    const sizes = manifest.icons.map(icon => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('apple-touch-iconが読み込める', async ({ request }) => {
    const response = await request.get('/icons/apple-touch-icon.png');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('Service Workerが登録される', async ({ page }) => {
    await page.goto('/');
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration.active);
    });
    expect(registered).toBe(true);
  });
});
