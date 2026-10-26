import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.__reactErrors = [];
  page.on('console', message => { if (message.type() === 'error' && /controlled|unique.*key|React.*error/i.test(message.text())) page.__reactErrors.push(message.text()); });
  await page.route('https://**', route => route.abort());
});
test.afterEach(async ({ page }) => { expect(page.__reactErrors).toEqual([]); });

test('review pagination keeps the layout while loading and replaces the reviews', async ({ page }) => {
  await page.goto('/?destinationQ=pho#reviews');
  await expect(page.locator('.review-person strong').first()).toHaveText('Mai An');
  const cards = page.locator('.review-card');
  const restaurants = page.locator('.restaurant-card');
  const restaurantCount = await restaurants.count();
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  await page.route('**/api/home?**reviewPage=2*', async route => {
    await waiting;
    await route.continue();
  });
  const pager = page.getByRole('navigation', { name: 'Phân trang cảm hứng' });
  try {
    await pager.getByRole('link', { name: 'Trang 2', exact: true }).click();
    await expect(page.locator('#reviews')).toHaveAttribute('aria-busy', 'true');
    await expect(cards).toHaveCount(3);
    await expect(restaurants).toHaveCount(restaurantCount);
    await expect(page.locator('.review-person strong').first()).toHaveText('Mai An');
  } finally { release(); }
  await expect(page.locator('.review-person strong')).toHaveText(['Thảo Vy', 'Quốc Nam', 'Ngọc Hà']);
  await expect(pager.getByRole('link', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/destinationQ=pho&reviewPage=2#reviews/);
  await expect.poll(() => page.locator('#reviews').evaluate(el => Math.abs(el.getBoundingClientRect().top - 30))).toBeLessThan(2);
  await page.goBack();
  await expect(page.locator('.review-person strong')).toHaveText(['Mai An', 'Hải Minh', 'Linh Chi']);
});

test('direct URLs, reload, notFound and technical errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/dishes', '/dishes/1', '/admin/dishes', '/admin/dishes/new', '/admin/dishes/1/edit', '/admin/dishes/1/delete', '/admin/chefs', '/admin/ingredients', '/admin/restaurants', '/restaurants/1']) {
    await page.goto(path); await expect(page.getByText('Đang tải…')).toHaveCount(0);
    await expect(page.locator('main')).toBeVisible();
    await page.reload(); await expect(page.getByText('Đang tải…')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('Không thể tải dữ liệu');
  }
  await page.goto('/dishes/999999'); await expect(page.getByRole('heading', { name: 'Không tìm thấy bản ghi' })).toBeVisible();
  await page.goto('/unknown'); await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  await page.route('http://localhost:3100/api/dishes*', route => route.fulfill({ status: 500, json: { message: 'failed' }, headers: { 'Access-Control-Allow-Origin': 'http://localhost:5174' } }));
  await page.goto('/dishes'); await expect(page.getByRole('heading', { name: 'Không thể tải dữ liệu' })).toBeVisible();
  await page.unroute('http://localhost:3100/api/dishes*'); await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.locator('.dish-card').first()).toBeVisible();
  await page.route('http://localhost:3100/api/dishes*', route => route.abort());
  await page.reload(); await expect(page.getByRole('heading', { name: 'Không thể tải dữ liệu' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('search, sort dialog, URL state and navigation do not reload document', async ({ page }) => {
  await page.goto('/dishes'); await expect(page.locator('.dish-card').first()).toBeVisible();
  await page.evaluate(() => window.__documentMarker = 'same');
  await page.getByRole('searchbox', { name: 'Tìm món ăn' }).fill('pho');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page).toHaveURL(/q=pho/); await expect(page.locator('.dish-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Sắp xếp' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Sắp xếp' })).toBeFocused();
  await page.getByRole('button', { name: 'Sắp xếp' }).click();
  await page.getByRole('link', { name: 'Giá giảm dần' }).click();
  await expect(page).toHaveURL(/sort=price-desc/);
  await page.locator('.dish-card h2 a').first().click(); await expect(page).toHaveURL(/\/dishes\/\d+$/);
  await expect(page.locator('.dish-detail')).toBeVisible();
  await page.goBack(); await expect(page.getByRole('searchbox')).toHaveValue('pho');
  expect(await page.evaluate(() => window.__documentMarker)).toBe('same');
});

for (const [resource, label, extra] of [['chefs', 'đầu bếp', 'Chuyên môn'], ['ingredients', 'nguyên liệu', 'Đơn vị'], ['dishes', 'món ăn', 'Giá món (VND)'], ['restaurants', 'nhà hàng', 'Loại ẩm thực']]) {
  test(`${resource}: validation, create/edit/delete and cancellation`, async ({ page }) => {
    const name = `E2E ${resource}`;
    await page.goto(`/admin/${resource}/new`);
    await expect(page.getByRole('button', { name: 'Thêm bản ghi' })).toBeVisible();
    await page.evaluate(() => window.__documentMarker = 'same');
    await page.getByRole('button', { name: 'Thêm bản ghi' }).click();
    await expect(page.locator('.error-summary')).toBeVisible();
    await page.locator('#name').fill(name);
    if (resource === 'chefs') await page.locator('#specialty').fill('Việt');
    if (resource === 'ingredients') await page.locator('#unit').fill('g');
    if (resource === 'restaurants') await page.locator('#cuisine').fill('Việt');
    if (resource === 'dishes') { await page.locator('#price').fill('12000'); await page.locator('#available').uncheck(); }
    await page.getByRole('button', { name: 'Thêm bản ghi' }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Đã thêm bản ghi');
    expect(await page.evaluate(() => window.__documentMarker)).toBe('same');
    const url = page.url();
    await page.getByRole('link', { name: 'Sửa bản ghi' }).click();
    await expect(page.locator('#name')).toHaveValue(name);
    if (resource === 'dishes') await expect(page.locator('#available')).not.toBeChecked();
    await page.locator('#name').fill(`${name} edited`);
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByRole('heading', { name: `${name} edited`, exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Xóa', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Xác nhận xóa' })).toBeVisible();
    await page.getByRole('link', { name: 'Hủy', exact: true }).click();
    await expect(page.getByRole('link', { name: `${name} edited`, exact: true })).toBeVisible();
    await page.goto(`${url}/delete`);
    await page.getByRole('button', { name: 'Xóa bản ghi' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/${resource}$`));
    await expect(page.getByRole('link', { name: `${name} edited`, exact: true })).toHaveCount(0);
  });
}

test('server field errors preserve values and duplicate submit is locked', async ({ page }) => {
  await page.goto('/admin/chefs/new'); await page.locator('#name').fill('Keep my value');
  let requests = 0;
  await page.route('http://localhost:3100/api/chefs', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    requests++;
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': 'http://localhost:5174' }, json: { ok: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid', fields: { name: 'Server field error' } } } });
  });
  await page.getByRole('button', { name: 'Thêm bản ghi' }).click();
  await expect(page.getByRole('button', { name: 'Đang lưu' })).toBeDisabled();
  await expect(page.locator('#name-error')).toHaveText('Server field error');
  await expect(page.locator('#name')).toHaveValue('Keep my value'); expect(requests).toBe(1);
});

test('home, image form and layouts fit mobile, tablet and desktop', async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/dishes', '/admin/dishes', '/admin/dishes/1/edit', '/restaurants/1']) {
      await page.goto(path); await expect(page.getByText('Đang tải…')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (width === 1440 && (path === '/' || path === '/admin/dishes/1/edit')) await page.screenshot({ path: `artifacts/block6-${path === '/' ? 'home' : 'form'}-${width}.png`, fullPage: true });
    }
    await page.goto('/dishes'); await expect(page.locator('.dish-card').first()).toBeVisible();
    await page.screenshot({ path: `artifacts/block6-dishes-${width}.png`, fullPage: true });
  }
  await page.goto('/admin/dishes/1/edit');
  await page.getByLabel('Tải file từ máy').check();
  await page.locator('#imageFile').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') });
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('#imageFile-error')).toContainText('JPG');
});

test('new dish relations, image upload and empty ingredient PATCH through the form', async ({ page }) => {
  await page.goto('/admin/dishes/new');
  await page.locator('#name').fill('E2E relation dish'); await page.locator('#price').fill('15000');
  await page.locator('#newRestaurantName').fill('E2E new restaurant');
  await page.locator('#newChefName').fill('E2E new chef');
  await page.locator('#new-name-0').fill('E2E new ingredient'); await page.locator('#new-unit-0').fill('g');
  await page.getByLabel('Tải file từ máy').check();
  await page.locator('#imageFile').setInputFiles({ name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('fixture image') });
  await page.getByRole('button', { name: 'Thêm bản ghi' }).click();
  await expect(page.getByRole('heading', { name: 'E2E relation dish', exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('E2E new chef');
  await expect(page.locator('main')).toContainText('E2E new ingredient');
  await expect(page.locator('main')).toContainText('/images/greens.svg');
  const recordUrl = page.url();
  await page.getByRole('link', { name: 'Sửa bản ghi' }).click();
  await page.getByLabel('E2E new ingredient (g)', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('heading', { name: 'E2E relation dish', exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('E2E new ingredient');
  await page.goto(`${recordUrl}/delete`); await page.getByRole('button', { name: 'Xóa bản ghi' }).click();
  await expect(page).toHaveURL(/\/admin\/dishes$/);
});

test('preview locks mutations and stale detail requests cannot overwrite a new route', async ({ page }) => {
  await page.route('http://localhost:3100/api/config', async route => { const response = await route.fetch(); const body = await response.json(); body.data.preview = true; await route.fulfill({ response, json: body }); });
  await page.goto('/admin/chefs/new');
  await expect(page.getByRole('button', { name: 'Thêm bản ghi' })).toBeDisabled();
  await page.unroute('http://localhost:3100/api/config');
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  await page.route('http://localhost:3100/api/dishes/1', async route => { const response = await route.fetch(); await waiting; await route.fulfill({ response }).catch(() => {}); });
  await page.goto('/dishes/1'); await expect(page.getByText('Đang tải…')).toBeVisible();
  await page.getByRole('link', { name: 'Món ăn', exact: true }).click();
  await page.locator('.dish-card h2 a').nth(1).click();
  await expect(page).toHaveURL(/\/dishes\/2$/); await expect(page.getByRole('heading', { name: 'Cơm tấm Sài Gòn', exact: true })).toBeVisible();
  release();
  await expect(page.getByRole('heading', { name: 'Cơm tấm Sài Gòn', exact: true })).toBeVisible();
});

test('landing search suggestions and review state stay in the URL', async ({ page }) => {
  await page.goto('/?reviewTab=gallery&reviewPage=2');
  await expect(page.locator('.restaurant-card').first()).toBeVisible();
  const input = page.getByRole('combobox'); await input.fill('pho');
  await expect(page.getByRole('listbox')).toBeVisible();
  await input.press('ArrowDown'); await input.press('Enter');
  await expect(page).toHaveURL(/destinationQ=/); await expect(page).toHaveURL(/reviewTab=gallery/);
  await expect(page).toHaveURL(/reviewPage=2/);
  await expect(page.locator('.restaurant-card').first()).toBeVisible();
});
