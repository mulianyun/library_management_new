# 图书管理系统 — 开发方案总览

## 技术栈

| 层 | 技术 |
|---|---|
| 后端运行时 | Node.js 26 + tsx |
| 后端框架 | Express 4（纯 REST JSON API） |
| 数据库 | SQLite（better-sqlite3，同步 API） |
| 前端框架 | React 19 + TypeScript |
| 前端构建 | Vite |
| UI | shadcn/ui + Tailwind CSS |
| 路由 | React Router v7 |
| Lint | oxlint |
| 格式化 | oxfmt |
| 语言 | TypeScript（前后端统一） |

## 架构

```
浏览器 ──► localhost:5173 (Vite Dev) ──proxy /api──► localhost:3000 (Express)
```

- 后端 `server/` 目录，端口 3000，所有路由 `/api` 前缀
- 前端 `client/` 目录，端口 5173（Vite dev），proxy `/api` 到后端
- 前后端共享类型定义（各自维护一份 `types/models.ts`，内容一致）

## DAG 拓扑图

```
A (项目初始化)
│
├──► B (数据库层 + 类型) ──┐
├──► C (API 骨架)         ──┤
└──► D (React 骨架)       ──┤
                              ├──► E (图书模块) ──┐
                              ├──► F (会员模块) ──┼──► H (借阅模块)
                              └──► G (仪表盘)     │
                                                  │
                              ┌───────────────────┘
                              │
                  H 的前端依赖 D，后端的 books/members 表由 B 保证
```

## 拓扑序列

> **A → B, C, D → E, F, G → H**

## 依赖矩阵

```
        A   B   C   D   E   F   G   H
    A   -   .   .   .   .   .   .   .
    B   X   -   .   .   .   .   .   .
    C   X   .   -   .   .   .   .   .
    D   X   .   .   -   .   .   .   .
    E   .   X   X   X   -   .   .   .
    F   .   X   X   X   .   -   .   .
    G   .   X   X   X   .   .   -   .
    H   .   X   X   X   .   .   .   -
```

## 任务一览

| 任务 | 名称 | 阶段 | 依赖 | 可并行 |
|---|---|---|---|---|
| A | 项目初始化 | phase-1 | 无 | — | ✅ |
| B | 数据库层 + 类型 | phase-2 | A | C, D | ✅ |
| C | API 骨架 | phase-2 | A | B, D | ✅ |
| D | React 骨架 | phase-2 | A | B, C | ✅ |
| E | 图书模块（前后端） | phase-3 | B, C, D | F, G | — |
| F | 会员模块（前后端） | phase-3 | B, C, D | E, G | — |
| G | 仪表盘（前后端） | phase-3 | B, C, D | E, F | — |
| H | 借阅模块（前后端） | phase-4 | B, C, D | — | — |

## API 一览

| 方法 | 路径 | 任务 | 说明 |
|---|---|---|---|
| GET | `/api/books` | E | 图书列表 `?search=` |
| GET | `/api/books/:id` | E | 图书详情（含借阅记录） |
| POST | `/api/books` | E | 创建图书 |
| PUT | `/api/books/:id` | E | 更新图书 |
| DELETE | `/api/books/:id` | E | 删除图书 |
| GET | `/api/members` | F | 会员列表 `?search=` |
| GET | `/api/members/:id` | F | 会员详情（含借阅记录） |
| POST | `/api/members` | F | 创建会员 |
| PUT | `/api/members/:id` | F | 更新会员 |
| DELETE | `/api/members/:id` | F | 删除会员 |
| GET | `/api/dashboard/stats` | G | 统计数据 |
| GET | `/api/borrowings` | H | 当前借阅列表 |
| GET | `/api/borrowings/history` | H | 借阅历史 |
| POST | `/api/borrowings` | H | 借书 |
| POST | `/api/borrowings/:id/return` | H | 还书 |

## 前端路由一览

| 路径 | 页面组件 | 任务 |
|---|---|---|
| `/` | HomePage | G |
| `/books` | BookListPage | E |
| `/books/new` | BookFormPage | E |
| `/books/:id` | BookDetailPage | E |
| `/books/:id/edit` | BookFormPage | E |
| `/members` | MemberListPage | F |
| `/members/new` | MemberFormPage | F |
| `/members/:id` | MemberDetailPage | F |
| `/members/:id/edit` | MemberFormPage | F |
| `/borrowings` | BorrowingListPage | H |
| `/borrowings/new` | BorrowingNewPage | H |
| `/borrowings/history` | BorrowingHistoryPage | H |

## 协作分工建议

| 人数 | 分工 |
|---|---|
| **2人** | 人1: A→B→C→D→E→H; 人2: F→G |
| **3人** | 人1: A→B→C→D→H; 人2: E; 人3: F→G |
| **4人** | 人1: A→B→C; 人2: D→E; 人3: F; 人4: G→H |

## 协作规范
1. 每人独立分支开发，PR 到 main
2. 后端路由文件在 `server/src/routes/` 下互相独立，不会冲突
3. 前端页面组件在 `client/src/pages/` 下目录隔离，不会冲突
4. 共享类型 `models.ts` 由 B 任务先定义，其他人只读引用
5. `server/index.ts` 的路由挂载和 `client/src/App.tsx` 的路由表，由最后合入的人整合
6. `.gitignore` 忽略 `node_modules/`, `dist/`, `library.db`

## 验证

```bash
npm run dev                       # 前后端同时启动 :5173

# 端到端测试
# 1. 添加图书   2. 添加会员   3. 借书
# 4. 查看仪表盘  5. 还书       6. 查看历史
```

## 文件清单

```
项目根目录/
├── package.json           (A)
├── tsconfig.json          (A)
├── .gitignore             (A)
├── server/
│   ├── index.ts           (C)
│   ├── db/
│   │   ├── connection.ts  (B)
│   │   └── schema.ts      (B)
│   ├── types/
│   │   └── models.ts      (B)
│   └── routes/
│       ├── books.ts       (E)
│       ├── members.ts     (F)
│       ├── dashboard.ts   (G)
│       └── borrowings.ts  (H)
├── client/
│   ├── package.json       (A)
│   ├── tsconfig.json      (D)
│   ├── vite.config.ts     (D)
│   ├── index.html         (D)
│   └── src/
│       ├── main.tsx       (D)
│       ├── App.tsx         (D)
│       ├── api/
│       │   └── client.ts  (D)
│       ├── types/
│       │   └── models.ts  (D)
│       ├── components/
│       │   ├── Layout.tsx  (D)
│       │   ├── Navbar.tsx  (D)
│       │   ├── StatCard.tsx(G)
│       │   └── Loading.tsx (D)
│       ├── pages/
│       │   ├── HomePage.tsx           (G)
│       │   ├── books/
│       │   │   ├── BookListPage.tsx   (E)
│       │   │   ├── BookFormPage.tsx   (E)
│       │   │   └── BookDetailPage.tsx (E)
│       │   ├── members/
│       │   │   ├── MemberListPage.tsx   (F)
│       │   │   ├── MemberFormPage.tsx   (F)
│       │   │   └── MemberDetailPage.tsx (F)
│       │   └── borrowings/
│       │       ├── BorrowingListPage.tsx   (H)
│       │       ├── BorrowingNewPage.tsx    (H)
│       │       └── BorrowingHistoryPage.tsx(H)
│       └── styles/
│           └── global.css  (D)
```
