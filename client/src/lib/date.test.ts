import assert from 'node:assert/strict';
import test from 'node:test';
import { formatLocalDate, isOverdueDate } from './date.js';

test('formatLocalDate keeps the local calendar date', () => {
  assert.equal(formatLocalDate(new Date(2026, 6, 27, 0, 30)), '2026-07-27');
});

test('only dates before today are overdue', () => {
  const today = '2026-07-27';

  assert.equal(isOverdueDate('2026-07-26', today), true);
  assert.equal(isOverdueDate('2026-07-27', today), false);
  assert.equal(isOverdueDate('2026-07-28', today), false);
});
