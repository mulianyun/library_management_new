export interface BorrowingInput {
  member_id: number;
  book_id: number;
  due_date: string;
}

export type BorrowingInputResult = { ok: true; value: BorrowingInput } | { ok: false; error: string };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function validateBorrowingInput(body: unknown): BorrowingInputResult {
  if (!isRecord(body)) {
    return { ok: false, error: '请求体必须是 JSON 对象' };
  }

  const memberId = requiredId(body.member_id, '会员');
  const bookId = requiredId(body.book_id, '图书');
  if (!memberId.ok) return memberId;
  if (!bookId.ok) return bookId;

  const dueDate = body.due_date;
  if (typeof dueDate !== 'string' || !isValidDateOnly(dueDate)) {
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

function isValidDateOnly(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function requiredId(value: unknown, label: string): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return { ok: false, error: `${label}ID 必须是正整数` };
  }
  return { ok: true, value };
}
