import { test, expect } from '@playwright/test';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.route('https://**', route => route.abort());
  const responses = []; page.__evidence = responses;
  page.on('response', async res => {
    if (res.url().includes('/api/dishes?')) {
      try { responses.push({ url: res.url(), status: res.status(), body: await res.json() }); } catch {}
    }
  });
});
test.afterEach(async ({ page }, info) => {
  await mkdir('artifacts/block7', { recursive: true });
  const name = info.title.split(':')[0];
  await writeFile(`artifacts/block7/${name}-network.json`, JSON.stringify(page.__evidence, null, 2));
  await page.screenshot({ path: `artifacts/block7/${name}.png`, fullPage: true });
  const video = page.video(); await page.context().close();
  if (video) await copyFile(await video.path(), `artifacts/block7/${name}.webm`);
});

test('01-pages: advanced search, sort, page two and reload preserve URL', async ({ page }) => {
  await page.goto('/dishes');
  await expect(page.locator('.dish-card')).toHaveCount(12);
  await page.getByText('Bộ lọc nâng cao', { exact: true }).click();
  await page.getByRole('searchbox').fill('pho');
  await page.getByLabel('Loại món', { exact: true }).fill('Món nước');
  await page.getByLabel('Giá từ', { exact: true }).fill('0');
  await page.getByLabel('Giá đến', { exact: true }).fill('24000');
  await page.getByLabel('Trạng thái', { exact: true }).selectOption('true');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.getByText('20 món phù hợp', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sắp xếp' }).click();
  await page.getByRole('link', { name: 'Giá giảm dần' }).click();
  await expect(page.locator('.dish-card h2').first()).toHaveText('Phở demo 25');
  await page.getByRole('link', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.dish-card')).toHaveCount(8);
  const names = await page.locator('.dish-card h2').allTextContents();
  const url = page.url(); await page.reload();
  await expect(page.locator('.dish-card')).toHaveCount(8);
  expect(page.url()).toBe(url); expect(await page.locator('.dish-card h2').allTextContents()).toEqual(names);
  await expect(page.getByRole('searchbox')).toHaveValue('pho');
  expect(new URL(url).searchParams.get('sort')).toBe('price-desc');
  const response = page.__evidence.at(-1).body.data;
  expect(response.page).toBe(2); expect(response.total).toBe(20); expect(response.items.length).toBe(8);
});

test('04-search-sort: fulltext and fuzzy keep search and filters when sorting', async ({ page }) => {
  for (const mode of ['fulltext', 'fuzzy']) {
    await page.goto(`/dishes?mode=${mode}&q=pho&category=${encodeURIComponent('Món nước')}&available=true&page=2`);
    await expect(page.locator('.dish-card')).toHaveCount(8);
    await page.getByRole('button', { name: 'Sắp xếp' }).click();
    await page.getByRole('link', { name: 'Giá giảm dần' }).click();
    await expect(page.locator('.dish-card h2').first()).toHaveText('Phở demo 25');
    const params = new URL(page.url()).searchParams;
    expect(params.get('q')).toBe('pho');
    expect(params.get('mode')).toBe(mode);
    expect(params.get('category')).toBe('Món nước');
    expect(params.get('available')).toBe('true');
    expect(params.get('page')).toBe('1');
    expect(params.get('sort')).toBe('price-desc');
    await expect(page.locator('.dish-card')).toHaveCount(12);
    await page.getByRole('button', { name: 'Sắp xếp' }).click();
    await page.getByRole('link', { name: 'Giá tăng dần' }).click();
    await expect(page.locator('.dish-card h2').first()).toHaveText('Phở demo 2');
  }
});

test('05-fulltext-syntax: submit OR, phrases and exclusions through the search form', async ({ page }) => {
  await page.goto('/dishes');
  await page.getByLabel('Cách tìm', { exact: true }).selectOption('fulltext');
  await expect(page.locator('#search-method-help')).toContainText('phở OR bún');
  for (const [query, total] of [['nay toi muon an pho demo', 25], ['Hôm nay tôi muốn ăn thảo mộc nhé', 25], ['Tôi muốn ăn "pho demo" OR "khong co"', 25], ['pho -demo', 0], ['"demo pho"', 0]]) {
    await page.getByRole('searchbox').fill(query);
    const response = page.waitForResponse(res => {
      const url = new URL(res.url());
      return url.pathname === '/api/dishes' && url.searchParams.get('q') === query;
    });
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();
    const body = await (await response).json();
    expect(body.ok).toBe(true);
    expect(body.data.total).toBe(total);
    await expect(page.locator('.dish-card')).toHaveCount(Math.min(total, 12));
    await expect(page.getByRole('button', { name: 'Sắp xếp' })).toBeVisible();
  }
});

test('02-more: append distinct items and ignore a stale search response', async ({ page }) => {
  await page.goto('/dishes?view=more');
  await expect(page.locator('.dish-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Tải thêm', exact: true }).click();
  await expect(page.locator('.dish-card')).toHaveCount(24);
  const links = await page.locator('.dish-card h2 a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  expect(new Set(links).size).toBe(24);
  let release; const gate = new Promise(resolve => { release = resolve; });
  let started; const fetched = new Promise(resolve => { started = resolve; });
  await page.route('**/api/dishes?**', async route => {
    if (new URL(route.request().url()).searchParams.get('page') !== '3') return route.continue();
    const response = await route.fetch(); started(); await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.getByRole('button', { name: 'Tải thêm', exact: true }).click(); await fetched;
  await page.getByRole('searchbox').fill('không tồn tại');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.getByText('Chưa có món phù hợp ở trang này.')).toBeVisible();
  release();
  await expect(page.locator('.dish-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Xóa điều kiện' }).click();
  await expect(page.locator('.dish-card')).toHaveCount(12);
});

test('03-infinite: scroll appends, stops at end, and clearing resets', async ({ page }) => {
  await page.goto('/dishes?view=infinite&page=3');
  await expect(page.locator('.dish-card')).toHaveCount(12);
  await expect(page).toHaveURL(/page=1/);
  await page.locator('#menu-results > div[aria-hidden]').scrollIntoViewIfNeeded();
  await expect(page.locator('.dish-card')).toHaveCount(24);
  await page.locator('#menu-results > div[aria-hidden]').scrollIntoViewIfNeeded();
  await expect(page.locator('.dish-card')).toHaveCount(25);
  await expect(page.getByText('Đã tải hết kết quả.')).toBeVisible();
  const links = await page.locator('.dish-card h2 a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  expect(new Set(links).size).toBe(25);
  expect(page.__evidence.filter(x => x.body.data?.items).every(x => x.body.data.items.length <= 12)).toBe(true);
  await page.getByRole('button', { name: 'Xóa điều kiện' }).click();
  await expect(page.locator('.dish-card')).toHaveCount(12);
  await expect(page.getByRole('link', { name: 'Trang 1', exact: true })).toBeVisible();
});
