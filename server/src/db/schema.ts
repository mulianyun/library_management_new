import db from "./connection.js";

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
