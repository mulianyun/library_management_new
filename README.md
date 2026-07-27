# 图书管理系统

简单的图书管理系统，支持图书管理、会员管理、借阅管理。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Node.js 26 + Express 4 + TypeScript |
| 数据库 | SQLite (better-sqlite3) |
| 前端 | React 19 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Lint | oxlint |
| 格式化 | oxfmt |
| CI | GitHub Actions |

## 快速开始

```bash
# 1. 安装依赖
npm install && cd client && npm install && cd ..

# 2. 启动开发服务器（前后端同时启动）
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 命令

```bash
npm start        # 仅启动后端 API
npm run dev      # 启动开发服务器（前后端同时启动）
npm run check    # TypeScript 类型检查（前后端同时）
npm run lint     # oxlint 静态检查
npm run fmt      # oxfmt 格式化代码
npm run fmt:check # 检查代码格式但不修改文件
```

## 项目结构

```
.
├── server/                     # 后端 Express API (:3000)
│   └── src/
│       ├── index.ts            # 入口 + 中间件 + 路由占位
│       ├── types/models.ts     # 共享类型定义
│       ├── db/
│       │   ├── connection.ts   # SQLite 连接
│       │   └── schema.ts       # 建表
│       └── routes/             # API 路由（待实现）
├── client/                     # 前端 React SPA (:5173)
│   └── src/
│       ├── App.tsx             # 路由表
│       ├── api/client.ts       # fetch 封装
│       ├── types/models.ts     # 前端类型
│       ├── components/         # 公共组件
│       │   ├── Layout.tsx      # 页面布局
│       │   ├── Navbar.tsx      # 导航栏
│       │   └── Loading.tsx     # 加载状态
│       ├── pages/              # 页面（待实现）
│       │   ├── books/
│       │   ├── members/
│       │   └── borrowings/
│       └── styles/global.css   # Tailwind + shadcn 主题
├── plans/                      # 方案文档（按阶段分拆）
└── .github/workflows/ci.yml    # CI：lint + typecheck
```

## API 接口

所有接口前缀 `/api`，返回格式：

```json
{ "data": {} }       // 成功
{ "error": "..." }   // 失败
```

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/books` | 图书列表 `?search=` |
| GET | `/api/books/:id` | 图书详情 (含借阅记录) |
| POST | `/api/books` | 创建图书 |
| PUT | `/api/books/:id` | 更新图书 |
| DELETE | `/api/books/:id` | 删除图书 |
| GET | `/api/members` | 会员列表 `?search=` |
| GET | `/api/members/:id` | 会员详情 (含借阅记录) |
| POST | `/api/members` | 创建会员 |
| PUT | `/api/members/:id` | 更新会员 |
| DELETE | `/api/members/:id` | 删除会员 |
| GET | `/api/dashboard/stats` | 统计数据 |
| GET | `/api/borrowings` | 当前借阅列表 |
| GET | `/api/borrowings/history` | 借阅历史 |
| POST | `/api/borrowings` | 借书 |
| POST | `/api/borrowings/:id/return` | 还书 |

## 协作开发

### 任务划分

项目按 DAG 拓扑划分为 8 个独立任务，详见 `plans/` 目录：

```
A (项目初始化)     ← ✅
│
├──► B (数据库层) ─┐
├──► C (API 骨架) ─┤    ← ✅ 已完成
└──► D (React 骨架)┘
                    │
                    ├──► E (图书模块) ──┐
                    ├──► F (会员模块) ──┼──► H (借阅模块)
                    └──► G (仪表盘)     │
                                        │
                        待认领 ──────────┘
```

### 工作流

1. 认领一个就绪的任务（依赖已完成），创建分支 `git checkout -b task/X`
2. 阅读 `plans/` 下对应任务文档，按接口契约实现
3. `npm run check && npm run lint` 通过后提 PR
4. 后端路由在 `server/src/index.ts` 取消注释挂载
5. 前端页面在 `client/src/App.tsx` 添加路由

### 约定

- 后端路由各自独立文件，前端页面各自独立目录，互不冲突
- API 统一 `{ data, error }` 响应格式
- 借书/还书必须在数据库事务中完成
- 共享类型 `models.ts` 修改需沟通

## 待实现

- [ ] E: 图书管理 (API + 3 页面)
- [ ] F: 会员管理 (API + 3 页面)
- [ ] G: 仪表盘 (API + 首页)
- [ ] H: 借阅管理 (API + 3 页面)
