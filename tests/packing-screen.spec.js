import { test, expect } from '@playwright/test';

test.describe('パッキング画面（オフラインの端末内保存モード）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('デモ旅行と持ち物、進捗が表示される', async ({ page }) => {
    await expect(page.locator('.trip-title')).toHaveText('ニューヨーク');
    await expect(page.locator('.check-row')).not.toHaveCount(0);
    await expect(page.locator('.progress-label')).toHaveText(/\d+ \/ \d+ 準備済み/);
  });

  test('チェックすると進捗が増え、済み表示になる', async ({ page }) => {
    const progressLabel = page.locator('.progress-label');
    const [beforeChecked, beforeTotal] = await readProgress(progressLabel);

    const { checkbox, name } = await checkFirstUnchecked(page);

    const [afterChecked, afterTotal] = await readProgress(progressLabel);
    expect(afterChecked).toBe(beforeChecked + 1);
    expect(afterTotal).toBe(beforeTotal);

    await expect(checkbox).toBeChecked();
    await expect(page.locator('.check-row.done', { hasText: name })).toBeVisible();
  });

  test('タブでスーツケース／バックパック／行先別を絞り込める', async ({ page }) => {
    await page.locator('[data-action="filter"][data-filter="suitcase"]').click();
    await expect(page.locator('.bag-chip', { hasText: 'バックパック' })).toHaveCount(0);
    await expect(page.locator('.bag-chip', { hasText: 'スーツケース' }).first()).toBeVisible();

    await page.locator('[data-action="filter"][data-filter="all"]').click();
    await expect(page.locator('.bag-chip', { hasText: 'バックパック' }).first()).toBeVisible();
  });

  test('未確認だけ表示をオンにするとチェック済みが隠れる', async ({ page }) => {
    await checkFirstUnchecked(page);
    const doneCountBefore = await page.locator('.check-row.done').count();
    expect(doneCountBefore).toBeGreaterThan(0);

    await page.locator('[data-action="unchecked-only"]').check();
    await expect(page.locator('.check-row.done')).toHaveCount(0);

    await page.locator('[data-action="unchecked-only"]').uncheck();
    await expect(page.locator('.check-row.done')).toHaveCount(doneCountBefore);
  });

  test('チェック状態はリロード後も保持される（localStorage）', async ({ page }) => {
    const { name } = await checkFirstUnchecked(page);

    await page.reload();

    await expect(page.locator('.check-row.done', { hasText: name })).toBeVisible();
  });
});

async function readProgress(progressLabel) {
  const text = await progressLabel.textContent();
  const match = text.match(/(\d+) \/ (\d+)/);
  return [Number(match[1]), Number(match[2])];
}

// Checking an item re-sorts it to the bottom of its group, which would make a
// dynamic locator like `.check-row:not(.done)').first()` a moving target for
// Playwright's action-retry loop. Resolve the target item's id once, up
// front, then act on a locator scoped to that fixed id.
async function checkFirstUnchecked(page) {
  const target = page.locator('.check-row:not(.done)').first();
  const name = await target.locator('.check-name').textContent();
  const id = await target.locator('input[type="checkbox"]').getAttribute('data-id');
  const checkbox = page.locator(`input[type="checkbox"][data-id="${id}"]`);
  await checkbox.check();
  return { checkbox, name };
}
