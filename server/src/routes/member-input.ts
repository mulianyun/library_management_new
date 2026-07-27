import type { MemberInput } from '../types/models.js';

export type MemberInputResult = { ok: true; value: MemberInput } | { ok: false; error: string };

export function validateMemberInput(body: unknown): MemberInputResult {
  if (!isRecord(body)) {
    return { ok: false, error: '请求体必须是 JSON 对象' };
  }

  if (typeof body.name !== 'string' || !body.name.trim()) {
    return { ok: false, error: '姓名为必填项' };
  }

  const email = optionalString(body.email, '邮箱');
  const phone = optionalString(body.phone, '电话');
  const address = optionalString(body.address, '地址');
  if (!email.ok) return email;
  if (!phone.ok) return phone;
  if (!address.ok) return address;

  return {
    ok: true,
    value: {
      name: body.name.trim(),
      email: email.value,
      phone: phone.value,
      address: address.value,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(
  value: unknown,
  label: string,
): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== 'string') return { ok: false, error: `${label}必须是字符串` };

  return { ok: true, value: value.trim() || undefined };
}
