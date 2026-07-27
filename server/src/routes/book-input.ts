import type { BookInput } from '../types/models.js';

export type BookInputResult = { ok: true; value: BookInput } | { ok: false; error: string };

export function validateBookInput(body: unknown): BookInputResult {
  if (!isRecord(body)) {
    return { ok: false, error: '请求体必须是 JSON 对象' };
  }

  const isbn = requiredString(body.isbn, 'ISBN');
  const title = requiredString(body.title, '书名');
  const author = requiredString(body.author, '作者');
  if (!isbn.ok) return isbn;
  if (!title.ok) return title;
  if (!author.ok) return author;

  const publisher = optionalString(body.publisher, '出版社');
  const category = optionalString(body.category, '分类');
  if (!publisher.ok) return publisher;
  if (!category.ok) return category;

  const totalCopies = body.total_copies ?? 1;
  if (typeof totalCopies !== 'number' || !Number.isInteger(totalCopies) || totalCopies < 1) {
    return { ok: false, error: '馆藏数量必须是大于等于 1 的整数' };
  }

  const publishedYear = body.published_year;
  if (
    publishedYear !== undefined &&
    publishedYear !== null &&
    (typeof publishedYear !== 'number' || !Number.isInteger(publishedYear) || publishedYear < 1 || publishedYear > 9999)
  ) {
    return { ok: false, error: '出版年份必须是 1 到 9999 之间的整数' };
  }

  return {
    ok: true,
    value: {
      isbn: isbn.value,
      title: title.value,
      author: author.value,
      publisher: publisher.value,
      published_year: publishedYear == null ? undefined : publishedYear,
      category: category.value,
      total_copies: totalCopies,
    },
  };
}

export function calculateAvailableCopies(totalCopies: number, borrowedCopies: number): number {
  if (totalCopies < borrowedCopies) {
    throw new RangeError(`馆藏数量不能少于当前借出数量（${borrowedCopies}）`);
  }
  return totalCopies - borrowedCopies;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, error: `${label}为必填项` };
  }
  return { ok: true, value: value.trim() };
}

function optionalString(
  value: unknown,
  label: string,
): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: undefined };
  }
  if (typeof value !== 'string') {
    return { ok: false, error: `${label}必须是字符串` };
  }
  return { ok: true, value: value.trim() || undefined };
}
