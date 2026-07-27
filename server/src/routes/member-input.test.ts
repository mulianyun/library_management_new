import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMemberInput } from './member-input.js';

test('valid member input is trimmed and empty optional fields are omitted', () => {
  const result = validateMemberInput({
    name: '  张三  ',
    email: ' zhang@example.com ',
    phone: '',
    address: null,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    name: '张三',
    email: 'zhang@example.com',
    phone: undefined,
    address: undefined,
  });
});

test('invalid request bodies and field types are rejected', async (t) => {
  const cases = [
    { name: 'missing body', input: undefined },
    { name: 'null body', input: null },
    { name: 'array body', input: [] },
    { name: 'missing name', input: { email: 'a@example.com' } },
    { name: 'numeric name', input: { name: 123 } },
    { name: 'blank name', input: { name: '   ' } },
    { name: 'object email', input: { name: '张三', email: {} } },
    { name: 'numeric phone', input: { name: '张三', phone: 123 } },
    { name: 'array address', input: { name: '张三', address: [] } },
  ];

  for (const { name, input } of cases) {
    await t.test(name, () => {
      assert.equal(validateMemberInput(input).ok, false);
    });
  }
});
