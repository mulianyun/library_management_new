# 任务 B — 数据库层 + 共享类型定义

| 属性 | 值 |
|---|---|
| 阶段 | phase-2-foundation |
| 上游依赖 | A（better-sqlite3 + @types 已安装） |
| 可并行 | C（API 骨架）, D（React 骨架） |
| 下游被依赖 | C, E, F, G, H |

## 产出文件

```
server/src/types/models.ts    # 所有共享接口
server/src/db/connection.ts   # SQLite 单例
server/src/db/schema.ts       # 建表函数
```

---

## 1. `server/src/types/models.ts`

```ts
/** 图书 */
export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  published_year: number | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

/** 创建/更新图书的输入 */
export interface BookInput {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  published_year?: number;
  category?: string;
  total_copies: number;
}

/** 会员 */
export interface Member {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  membership_date: string;
  created_at: string;
  updated_at: string;
}

/** 创建/更新会员的输入 */
export interface MemberInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/** 借阅记录（数据库原始行） */
export interface BorrowingRecord {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned';
  created_at: string;
}

/** 借阅记录视图（JOIN 后的完整信息，供前端展示） */
export interface BorrowingRecordView extends BorrowingRecord {
  book_title: string;
  member_name: string;
}

/** 仪表盘统计 */
export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeBorrows: number;
  overdue: number;
}

/** API 统一响应格式 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
```

---

## 2. `server/src/db/connection.ts`

```ts
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'library.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
```

---

## 3. `server/src/db/schema.ts`

```ts
import db from './connection.js';

export function initDB(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn             TEXT    NOT NULL UNIQUE,
      title            TEXT    NOT NULL,
      author           TEXT    NOT NULL,
      publisher        TEXT,
      published_year   INTEGER,
      category         TEXT,
      total_copies     INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      email           TEXT,
      phone           TEXT,
      address         TEXT,
      membership_date TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS borrowing_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id     INTEGER NOT NULL REFERENCES books(id),
      member_id   INTEGER NOT NULL REFERENCES members(id),
      borrow_date TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      due_date    TEXT    NOT NULL,
      return_date TEXT,
      status      TEXT    NOT NULL DEFAULT 'borrowed' CHECK(status IN ('borrowed','returned')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_borrowing_book   ON borrowing_records(book_id);
    CREATE INDEX IF NOT EXISTS idx_borrowing_member ON borrowing_records(member_id);
    CREATE INDEX IF NOT EXISTS idx_borrowing_status ON borrowing_records(status);
  `);
}
```

## 接口契约

### 导出
- `initDB()` — 应用启动时调用一次，幂等
- `db`（default export from connection.ts）— better-sqlite3 实例，下游直接 `import db from '../db/connection.js'`
- `Book, BookInput, Member, MemberInput, BorrowingRecord, BorrowingRecordView, DashboardStats, ApiResponse` — 类型，下游 `import type { ... } from '../types/models.js'`

### 查询规范（约定）
- `db.prepare(sql).all(...params): T[]` — 查多条
- `db.prepare(sql).get(...params): T | undefined` — 查单条
- `db.prepare(sql).run(...params): { changes, lastInsertRowid }` — 写操作
- `db.transaction(() => { ... })()` — 事务

## 完成标准

- [ ] `server/src/types/models.ts` 内容正确
- [ ] `server/src/db/connection.ts` 可正常 import，WAL 和 foreign_keys 开启
- [ ] `server/src/db/schema.ts` 调用 `initDB()` 后 library.db 中三张表存在
- [ ] `npx tsc --noEmit` 类型检查通过
