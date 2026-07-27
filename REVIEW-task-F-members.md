# 代码审查报告 · 任务 F（会员模块）

- **审查对象**：`library_management_new` 任务 F —— 会员模块
- **审查范围**：仅任务 F 相关文件（依约定不动 E/G/H）
- **审查重点**：规范符合度（军规）+ 功能正确性 + 安全性
- **审查日期**：2026-07-27
- **审查方式**：静态通读源码 + `tsc --noEmit` 类型检查 + `oxlint` 代码检查

---

## 一、文件清单（改动集）

| 文件 | 类型 | 说明 |
|------|------|------|
| `server/src/routes/members.ts` | 新增 | 会员后端路由，5 个接口 |
| `server/src/index.ts` | 修改 | 挂载 `membersRouter` 到 `/api/members` |
| `client/src/App.tsx` | 修改 | 接入 3 个会员页面路由 |
| `client/src/pages/members/MemberListPage.tsx` | 新增 | 会员列表页 |
| `client/src/pages/members/MemberFormPage.tsx` | 新增 | 会员新增/编辑页 |
| `client/src/pages/members/MemberDetailPage.tsx` | 新增 | 会员详情 + 借阅记录页 |

> `git status` 确认：仅上述 4 处（2 改 + 2 新增目录）改动，dashboard/borrowings 等 E/G/H 相关代码未触碰，符合「Surgical Changes」约定。

---

## 二、验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 后端类型检查 | `tsc --noEmit` (server) | ✅ exit 0，0 错误 |
| 前端类型检查 | `tsc --noEmit` (client) | ✅ exit 0，0 错误 |
| 代码规范/lint | `oxlint` | ✅ 0 warnings / 0 errors |

---

## 三、规范符合度评估（对照军规）

| 军规条目 | 结论 | 证据 |
|----------|------|------|
| Surgical Changes（只改相关文件） | ✅ 通过 | 仅 F 相关文件改动，EGH 未动 |
| 显式类型 / 禁止 `any` | ✅ 通过 | `Member`/`MemberInput`/`FormState` 均有显式接口；全文无 `any` |
| 不可变更新 | ✅ 通过 | `MemberListPage` 删除后 `setMembers(prev => prev.filter(...))` |
| React 范式（函数组件/PascalCase/解构 props） | ✅ 通过 | 三个页面均为函数组件，组件名 PascalCase，props 解构 |
| Hook 在条件返回之前 | ✅ 通过 | `MemberFormPage` / `MemberDetailPage` 的 `useEffect` 均在 `if (loading) return` 之前 |
| SQL 注入防护（参数化） | ✅ 通过 | 全部查询使用 `.prepare(...).get/All/run(?, ?, ...)`，搜索 `LIKE` 也作为绑定参数传入 |
| 遵循既有范式 | ✅ 通过 | 后端对齐 `routes/books.ts` 风格；前端对齐 `Book*Page` 的 Tailwind + `Button`/`Loading`/`lucide` 范式 |

---

## 四、功能正确性

| 接口 / 页面 | 行为 | 结论 |
|-------------|------|------|
| `GET /api/members?search=` | 按 `name LIKE` 模糊匹配，无搜索词则返回全部（按 `created_at DESC`） | ✅ 正确 |
| `GET /api/members/:id` | 返回会员 + 借阅记录（JOIN books/members），不存在返回 404 | ✅ 正确 |
| `POST /api/members` | 校验 `name` 非空，插入并返回新 id | ✅ 正确 |
| `PUT /api/members/:id` | 校验存在 + `name` 非空，更新并刷新 `updated_at` | ✅ 正确 |
| `DELETE /api/members/:id` | 存在性校验 → 有未归还借阅返回 409 → 先删借阅记录再删会员 | ✅ 逻辑完整 |
| 列表页 | 受控搜索（`useSearchParams`）、删除确认、空态处理 | ✅ 正确 |
| 表单页 | 编辑回填、提交前 `trim`、空字段转 `undefined` | ✅ 正确 |
| 详情页 | 会员信息 + 借阅记录表（借出中/已归还状态徽章） | ✅ 正确 |

前后端数据契约一致：后端统一返回 `{ data: ... }`，`api` 客户端已解包 `.data`，前端取用结构匹配（`api.get<Member[]>`、`api.get<{member,records}>` 等）。

---

## 五、安全性

- **SQL 注入**：所有用户输入均经参数化绑定，无字符串拼接 SQL。✅
- **权限/越权**：本模块无鉴权中间件（与 books 模块一致，属项目当前阶段约定），无越权读写的逻辑缺陷。
- **删除保护**：删除会员前校验未归还借阅（409 拒绝），避免悬空外键 / 误删。✅
- **输入校验**：`name` 必填且 `trim` 后判空；`email/phone/address` 允许为空并归一为 `null`。✅

---

## 六、发现的问题清单

| # | 严重度 | 位置 | 问题 | 建议 |
|---|--------|------|------|------|
| 1 | ✅ 已修复 | `server/src/routes/members.ts:83-87` | 原 `DELETE` 两步删除非原子，失败会留孤本记录 | 已用 `db.transaction(() => { ... })()` 包裹两步删除，保证原子性 |
| 2 | ✅ 已修复 | 全路由 `:id` | 原 `req.params.id` 以字符串直接传入 INTEGER 主键列，依赖 SQLite 类型亲和工作 | 新增 `parseId()` 校验并转正整数，非法 id 返回 400，提前拦截 |
| 3 | 信息 | `members.ts:40,52` | 校验为手写 `if (!name || !name.trim())`，未使用 Zod | 与 `book-input.ts` 保持一致即可；若后续统一校验层，可迁移到 Zod schema |
| 4 | 信息 | `members.ts:13` | 列表搜索 `LIKE %search%` 前后通配，无索引优化 | 当前数据量无碍；数据量大时可考虑前缀索引或全文检索 |

> 以上均为非阻断项，无安全漏洞、无阻断性 Bug。问题 #1（删除事务化）与 #2（id 类型归一）已于审查后修复并通过 `tsc` + `oxlint` 校验；#3/#4 属与既有代码保持一致的合理取舍，维持现状。

---

## 七、总结

任务 F 实现**完整、规范、可编译、零 lint 告警**，与项目既有范式（books 模块）高度一致，未波及其他任务。审查发现的 #1（删除事务化）与 #2（id 类型归一）均已修复并复验通过；#3（Zod 校验）/ #4（LIKE 性能）属与既有代码一致的合理取舍，维持现状。整体质量达标，可进入提交/集成阶段。
