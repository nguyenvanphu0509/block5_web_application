import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { testDatabase } from './helpers.js';

test('browser scripts do not send asynchronous HTTP requests', async () => {
  const folder = new URL('../public/js/', import.meta.url);
  for (const name of await readdir(folder)) {
    if (!name.endsWith('.js')) continue;
    const source = await readFile(new URL(name, folder), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|axios\.|\$\.ajax\s*\(/, name);
  }
});
test('home search and quick links navigate through GET and preserve review state', async () => {
  const { db } = testDatabase();
  const page = await request(createApp({db})).get('/?destinationPage=2&reviewPage=2&reviewTab=gallery').expect(200);
  assert.match(page.text, /class="search-form" method="GET" action="\/#destinations"/);
  assert.match(page.text, /name="reviewTab" value="gallery"/);
  assert.match(page.text, /name="reviewPage" value="2"/);
  const quick = page.text.match(/class="quick-search"[\s\S]*?<\/div>/)[0];
  assert.equal([...quick.matchAll(/<a /g)].length,5);
  assert.match(quick,/reviewTab=gallery/);
  assert.match(quick,/reviewPage=2/);
  assert.doesNotMatch(quick,/destinationPage=2|<button/);
  assert.doesNotMatch(page.text,/role="combobox"|restaurant-suggestions|src="\/js\/(home|restaurant-search)\.js"/);
});
