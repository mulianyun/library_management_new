# 任务 A — 项目初始化

| 属性 | 值 |
|---|---|
| 阶段 | phase-1-init |
| 上游依赖 | 无 |
| 可并行 | — |
| 下游被依赖 | B, C, D |

## 产出文件

```
├── package.json           # 后端依赖
├── tsconfig.json          # 后端 TS 配置
├── .gitignore
├── .node-version          # Node.js 版本声明（本地 26）
├── .oxlintrc.json         # oxlint 规则配置
├── .oxfmtrc.json          # oxfmt 格式化配置
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI
├── server/
│   ├── index.ts           # 占位（任务 C 覆盖）
│   ├── db/                # 空目录
│   ├── types/             # 空目录
│   └── routes/            # 空目录
└── client/                # Vite + React 脚手架
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/           # 空目录
        ├── types/         # 空目录
        ├── components/    # 空目录
        ├── pages/
        │   ├── books/
        │   ├── members/
        │   └── borrowings/
        └── styles/
```

## 根 package.json

```jsonc
{
  "name": "library-management",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx server/index.ts",
    "check": "tsc --noEmit",
    "lint": "oxlint",
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  },
  "dependencies": {
    "better-sqlite3": "^13.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "oxlint": "^0.15.0",
    "oxfmt": "^0.15.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

## 根 tsconfig.json

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "server",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["server/**/*.ts"],
  "exclude": ["node_modules", "dist", "client"]
}
```

## .gitignore

```
node_modules/
dist/
library.db
*.db-journal
*.db-wal
```

## .node-version

```
26
```

## .oxlintrc.json

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "import"],
  "rules": {
    "typescript/no-explicit-any": "warn",
    "typescript/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "react/jsx-no-target-blank": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

## .oxfmtrc.json

```jsonc
{
  "printWidth": 120,
  "tabWidth": 2,
  "quoteStyle": "single",
  "trailingComma": "all",
  "semicolons": true
}
```

## .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'npm'
      - run: npm ci
      - run: cd client && npm ci
      - run: npx oxlint
      - run: npx oxfmt --check .

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'npm'
      - run: npm ci
      - run: cd client && npm ci
      - run: npx tsc --noEmit
      - run: cd client && npx tsc --noEmit
```

## client/ 脚手架

### 创建方式

```bash
cd client
npm create vite@latest . -- --template react-ts
```

这会生成 `client/package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`。

### client/package.json（Vite 生成后补充）

确保依赖包含：
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

### client/vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 目录创建

```bash
mkdir -p client/src/{api,types,components,pages/{books,members,borrowings},styles}
```

## 完成标准

- [ ] `npm install` 在根目录成功（后端依赖装好）
- [ ] `cd client && npm install` 成功（前端依赖装好）
- [ ] `mkdir -p` 创建所有空目录
- [ ] `.gitignore` 包含 library.db
- [ ] `npm run lint` 可执行（oxlint 无报错）
- [ ] `npm run fmt` 可执行（oxfmt 格式化通过）
