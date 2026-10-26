import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareFulltextQuery } from '../api/src/lib/fulltext-query.js';
import { dishQueries, queryState } from '../api/src/catalog.js';

test('fulltext extracts food keywords from common Vietnamese requests', () => {
  for (const [input, expected] of [
    ['nay toi muon an pho bo', 'pho bo'],
    ['Hôm nay tôi muốn ăn phở bò', 'pho bo'],
    ['Mình đang thèm ăn bún bò nhé', 'bun bo'],
    ['Tối nay em muốn ăn phở gà nha', 'pho ga'],
    ['Tìm giúp tôi món phở bò', 'pho bo'],
    ['Gợi ý cho mình món ăn có tỏi', 'co toi'],
    ['Cho tôi ăn phở bò với', 'pho bo'],
    ['Tôi muốn ăn "phở bò" OR bún -gà', '"pho bo" or bun -ga'],
  ]) assert.equal(prepareFulltextQuery(input), expected, input);
});

test('fulltext preserves food terms, explicit syntax and requests without keywords', () => {
  for (const input of ['bò xào tỏi', 'an', 'OR', '"tôi muốn ăn"', 'phở OR bún -gà', 'Tôi muốn ăn', 'nay toi muon an nhe']) {
    assert.equal(prepareFulltextQuery(input), input);
  }
});

test('only fulltext transforms conversational search; input stays parameterized', () => {
  const q = 'nay toi muon an pho bo';
  for (const mode of ['basic', 'advanced', 'fuzzy', 'fulltext']) {
    const sql = dishQueries(queryState({ mode, q }));
    assert.ok(sql.items.values.includes(mode === 'fulltext' ? 'pho bo' : q));
    assert.ok(sql.count.values.includes(mode === 'fulltext' ? 'pho bo' : q));
    assert.ok(!sql.items.text.includes(q));
  }
});
