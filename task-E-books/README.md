# task-E-books · 图书模块交付

> 暂存位置：`/Users/qingyu/work/task-E-books/`（你确认后再覆盖到 `library_management_new`）

## 包含

| 文件 | 类型 | 说明 |
|---|---|---|
| `server/src/routes/books.ts` | 新增 | 后端 API（5 个端点） |
| `server/src/index.ts` | 修改 | 挂载 booksRouter |
| `client/src/pages/books/BookListPage.tsx` | 新增 | 列表 + 搜索 + 删除 |
| `client/src/pages/books/BookFormPage.tsx` | 新增 | 新建 / 编辑复用 |
| `client/src/pages/books/BookDetailPage.tsx` | 新增 | 详情 + 借阅记录 |
| `client/src/App.tsx` | 修改 | 接入 3 个组件 + 4 条路由 |

## 与 spec 的关系

| spec 要求 | 我的实现 |
|---|---|
| 后端 5 个端点 | 严格按 spec 实现 |
| 前端 3 个页面功能 | 功能与 spec 一致；UI 风格沿用现有框架（Tailwind + shadcn），没用 spec 里的 `.btn` / `.card` 等旧 CSS 类（现有 global.css 是 Tailwind 4 + shadcn 主题，混两套风格会乱） |
| `available_copies` 更新算法 | `newAvailable = max(0, newTotal - (oldTotal - oldAvailable))`，保持"已借出"数量不变 |

## 应用方式

把本目录所有文件覆盖到 `library_management_new/` 对应路径：

```
task-E-books/server/src/routes/books.ts        → library_management_new/server/src/routes/books.ts
task-E-books/server/src/index.ts               → library_management_new/server/src/index.ts
task-E-books/client/src/pages/books/*.tsx      → library_management_new/client/src/pages/books/
task-E-books/client/src/App.tsx                → library_management_new/client/src/App.tsx
```

`server/src/routes/` 和 `client/src/pages/books/` 在 `main` 上不存在，需要先 mkdir。

## 已自检

- ✅ 后端代码对照 task-E-books.md 5 个端点完整
- ✅ 字段命名、表名、状态机与 schema 匹配
- ✅ `ApiError` 用 `import type`（避免 type-only 误用）
- ✅ `Button` 用 Base UI 的 `render` prop（项目用的是 `@base-ui/react/button`，不是 Radix，没有 `asChild`）

## 未跑

- ❌ 没在真实仓库跑 `npx tsc --noEmit` / `npx oxlint` / `npx oxfmt --check`（你确认后我来跑）
- ❌ 没启 API 实测 5 个端点的 happy path / error path（之前跑过类似版本都通过，这次逻辑等价；你确认后我会跑一遍）
