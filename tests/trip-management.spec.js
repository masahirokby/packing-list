import { test, expect } from '@playwright/test';

test.describe('旅行・出張の作成・編集・削除', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-action="nav-trips"]').click();
  });

  test('新規作成すると一覧に追加され、そのパッキングリストが開く', async ({ page }) => {
    await page.locator('[data-action="new-trip"]').click();
    await page.locator('input[name="name"]').fill('テスト旅行');
    await page.locator('input[name="startDate"]').fill('2027-01-10');
    await page.locator('input[name="endDate"]').fill('2027-01-15');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.trip-title')).toHaveText('テスト旅行');
    await expect(page.locator('.trip-dates')).toContainText('2027年1月10日〜1月15日');

    await page.locator('[data-action="nav-trips"]').click();
    await expect(page.locator('.trip-card', { hasText: 'テスト旅行' })).toBeVisible();
  });

  test('帰宅日が出発日より前だとエラーになり作成されない', async ({ page }) => {
    await page.locator('[data-action="new-trip"]').click();
    await page.locator('input[name="name"]').fill('日付エラー旅行');
    await page.locator('input[name="startDate"]').fill('2027-02-10');
    await page.locator('input[name="endDate"]').fill('2027-02-01');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('.toast')).toHaveText('帰宅日は出発日以降にしてください。');
    await expect(page.locator('h1')).toHaveText('新しい旅行・出張');
  });

  test('名前と日程を編集できる', async ({ page }) => {
    await page.locator('[data-action="new-trip"]').click();
    await page.locator('input[name="name"]').fill('編集前旅行');
    await page.locator('input[name="startDate"]').fill('2027-03-01');
    await page.locator('input[name="endDate"]').fill('2027-03-05');
    await page.locator('button[type="submit"]').click();
    await page.locator('[data-action="nav-trips"]').click();

    const card = page.locator('.trip-card', { hasText: '編集前旅行' });
    await card.locator('[data-action="trip-menu"]').click();
    await card.locator('[data-action="edit-trip"]').click();

    await page.locator('input[name="name"]').fill('編集後旅行');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.trip-title')).toHaveText('編集後旅行');
    await page.locator('[data-action="nav-trips"]').click();

    await expect(page.locator('.trip-card', { hasText: '編集後旅行' })).toBeVisible();
    await expect(page.locator('.trip-card', { hasText: '編集前旅行' })).toHaveCount(0);
  });

  test('確認ダイアログで承認すると削除される', async ({ page }) => {
    await page.locator('[data-action="new-trip"]').click();
    await page.locator('input[name="name"]').fill('削除対象旅行');
    await page.locator('input[name="startDate"]').fill('2027-04-01');
    await page.locator('input[name="endDate"]').fill('2027-04-03');
    await page.locator('button[type="submit"]').click();
    await page.locator('[data-action="nav-trips"]').click();

    page.once('dialog', dialog => dialog.accept());
    const card = page.locator('.trip-card', { hasText: '削除対象旅行' });
    await card.locator('[data-action="trip-menu"]').click();
    await card.locator('[data-action="delete-trip"]').click();

    await expect(page.locator('.trip-card', { hasText: '削除対象旅行' })).toHaveCount(0);
  });

  test('全項目をチェックすると旅行が完了扱いになる', async ({ page }) => {
    await page.locator('[data-action="new-trip"]').click();
    await page.locator('input[name="name"]').fill('全部チェック旅行');
    await page.locator('input[name="startDate"]').fill('2027-05-01');
    await page.locator('input[name="endDate"]').fill('2027-05-03');
    await page.locator('button[type="submit"]').click();

    const checkboxes = page.locator('.check-row input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i += 1) {
      await checkboxes.nth(i).check();
    }

    await page.locator('[data-action="nav-trips"]').click();
    const card = page.locator('.trip-card', { hasText: '全部チェック旅行' });
    await expect(card.locator('.status')).toHaveText('完了');
  });
});
