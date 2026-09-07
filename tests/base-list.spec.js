import { test, expect } from '@playwright/test';

test.describe('基本リスト管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-action="nav-trips"]').click();
    await page.locator('[data-action="manage-items"]').click();
  });

  test('持ち物を追加できる', async ({ page }) => {
    await page.locator('[data-action="new-item"]').click();
    await page.locator('input[name="name"]').fill('テスト用アイテム');
    await page.locator('input[name="category"]').fill('テストカテゴリ');
    await page.locator('select[name="bag"]').selectOption('backpack');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.manage-row', { hasText: 'テスト用アイテム' })).toBeVisible();
  });

  test('持ち物の名前を編集できる', async ({ page }) => {
    await page.locator('[data-action="new-item"]').click();
    await page.locator('input[name="name"]').fill('編集前アイテム');
    await page.locator('input[name="category"]').fill('カテゴリ');
    await page.locator('button[type="submit"]').click();

    const row = page.locator('.manage-row', { hasText: '編集前アイテム' });
    await row.locator('[data-action="edit-item"]').click();
    await page.locator('input[name="name"]').fill('編集後アイテム');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.manage-row', { hasText: '編集後アイテム' })).toBeVisible();
    await expect(page.locator('.manage-row', { hasText: '編集前アイテム' })).toHaveCount(0);
  });

  test('使用停止にすると一覧から消え、「使用停止も表示」で再表示できる', async ({ page }) => {
    await page.locator('[data-action="new-item"]').click();
    await page.locator('input[name="name"]').fill('停止対象アイテム');
    await page.locator('input[name="category"]').fill('カテゴリ');
    await page.locator('button[type="submit"]').click();

    const row = page.locator('.manage-row', { hasText: '停止対象アイテム' });
    await row.locator('[data-action="edit-item"]').click();
    await page.locator('[data-action="archive-item"]').click();

    await expect(page.locator('.manage-row', { hasText: '停止対象アイテム' })).toHaveCount(0);

    await page.locator('[data-action="show-inactive"]').check();
    await expect(page.locator('.manage-row', { hasText: '停止対象アイテム（使用停止）' })).toBeVisible();
  });

  test('↑↓ボタンで並び替えできる', async ({ page }) => {
    const firstRowName = () => page.locator('.manage-row .manage-name').first().textContent();
    const before = await firstRowName();

    await page.locator('.manage-row').nth(1).locator('[data-action="move-up"]').click();

    const after = await firstRowName();
    expect(after).not.toBe(before);
  });
});
