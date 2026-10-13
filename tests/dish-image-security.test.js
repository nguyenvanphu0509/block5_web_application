import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { testDatabase } from './helpers.js';

test('menu CSP permits selected replacement images without widening script permissions', async () => {
  const { db, storage } = testDatabase();
  const { entries } = JSON.parse(await readFile(new URL('../data/dish-image-replacements.json', import.meta.url), 'utf8'));
  storage.dish[0].imagePath = entries[0].imagePath;
  storage.dish[0].photoType = 'Ảnh minh họa';
  storage.dish[0].restaurantId = 1;
  const app = createApp({ db });
  const response = await request(app).get('/dishes').expect(200);
  const policy = response.headers['content-security-policy'];
  const imageRule = policy.split(';').map(part => part.trim()).find(part => part.startsWith('img-src '));
  const allowed = new Set(imageRule.split(/\s+/).slice(1));
  for (const row of entries.filter(row => row.status === 'candidate')) {
    assert.ok(allowed.has(new URL(row.imagePath).origin), `CSP blocks dish #${row.id}`);
  }
  assert.ok(!allowed.has('*') && !allowed.has('https:'));
  assert.match(policy, /script-src 'self';/);
  assert.doesNotMatch(response.text, /class="image-caption"/);
  const detail = await request(app).get('/dishes/1').expect(200);
  assert.doesNotMatch(detail.text, /<figcaption>|Ảnh hồ sơ quán|Không xác định tên món từ ảnh/);
  assert.doesNotMatch(detail.text, /GIÁ DEMO · BÀI TẬP/);
});
