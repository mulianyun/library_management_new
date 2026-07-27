export interface BorrowingInput {
  member_id: number;
  book_id: number;
  due_date: string;
}

export type BorrowingInputResult = { ok: true; value: BorrowingInput } | { ok: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateBorrowingInput(body: unknown): BorrowingInputResult {
  if (!isRecord(body)) {
    return { ok: false, error: '请求体必须是 JSON 对象' };
  }

  const memberId = requiredId(body.member_id, '会员');
  const bookId = requiredId(body.book_id, '图书');
  if (!memberId.ok) return memberId;
  if (!bookId.ok) return bookId;

  const dueDate = body.due_date;
  if (typeof dueDate !== 'string' || !DATE_PATTERN.test(dueDate) || Number.isNaN(Date.parse(dueDate))) {
    return { ok: false, error: '应还日期必须是 YYYY-MM-DD 格式的有效日期' };
  }

  return {
    ok: true,
    value: { member_id: memberId.value, book_id: bookId.value, due_date: dueDate },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredId(value: unknown, label: string): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return { ok: false, error: `${label}ID 必须是正整数` };
  }
  return { ok: true, value };
}
