import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAvailableCopies, validateBookInput } from './book-input.js';

test('valid book input is normalized and defaults to one copy', () => {
  const result = validateBookInput({
    isbn: ' 978-7-111 ',
    title: ' 测试图书 ',
    author: ' 测试作者 ',
    publisher: '',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    isbn: '978-7-111',
    title: '测试图书',
    author: '测试作者',
    publisher: undefined,
    published_year: undefined,
    category: undefined,
    total_copies: 1,
  });
});

test('invalid inventory and publication years are rejected', async (t) => {
  const valid = { isbn: '978-7-111', title: '测试图书', author: '测试作者' };
  const cases = [
    { field: 'negative inventory', input: { ...valid, total_copies: -1 } },
    { field: 'fractional inventory', input: { ...valid, total_copies: 1.5 } },
    { field: 'string inventory', input: { ...valid, total_copies: '2' } },
    { field: 'invalid year', input: { ...valid, published_year: 10000 } },
  ];

  for (const { field, input } of cases) {
    await t.test(field, () => {
      assert.equal(validateBookInput(input).ok, false);
    });
  }
});

test('inventory resize preserves borrowed copies and rejects impossible totals', () => {
  assert.equal(calculateAvailableCopies(5, 2), 3);
  assert.throws(() => calculateAvailableCopies(1, 2), {
    name: 'RangeError',
    message: '馆藏数量不能少于当前借出数量（2）',
  });
});
