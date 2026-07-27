import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBorrowingInput } from './borrowing-input.js';

test('valid borrowing input passes through unchanged', () => {
  const result = validateBorrowingInput({ member_id: 1, book_id: 2, due_date: '2026-08-26' });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, { member_id: 1, book_id: 2, due_date: '2026-08-26' });
});

test('invalid ids and due dates are rejected', async (t) => {
  const valid = { member_id: 1, book_id: 2, due_date: '2026-08-26' };
  const cases = [
    { field: 'non-object body', input: 'not-an-object' },
    { field: 'missing member_id', input: { book_id: 2, due_date: '2026-08-26' } },
    { field: 'string member_id', input: { ...valid, member_id: '1' } },
    { field: 'zero book_id', input: { ...valid, book_id: 0 } },
    { field: 'fractional book_id', input: { ...valid, book_id: 1.5 } },
    { field: 'missing due_date', input: { member_id: 1, book_id: 2 } },
    { field: 'malformed due_date', input: { ...valid, due_date: '2026/08/26' } },
    { field: 'impossible due_date', input: { ...valid, due_date: '2026-13-99' } },
    { field: 'non-leap February 29', input: { ...valid, due_date: '2026-02-29' } },
    { field: 'February 30', input: { ...valid, due_date: '2026-02-30' } },
    { field: 'April 31', input: { ...valid, due_date: '2026-04-31' } },
  ];

  for (const { field, input } of cases) {
    await t.test(field, () => {
      assert.equal(validateBorrowingInput(input).ok, false);
    });
  }
});

test('leap-day due date is accepted', () => {
  assert.equal(validateBorrowingInput({ member_id: 1, book_id: 2, due_date: '2024-02-29' }).ok, true);
});
