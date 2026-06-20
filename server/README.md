# 计件猫后端服务

MVP backend for the WeChat Mini Program.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
```

The default server address is:

```text
http://127.0.0.1:3000
```

The mini program request layer uses this address by default. To override it in DevTools:

```js
wx.setStorageSync('api_base_url', 'http://127.0.0.1:3000')
```

## Current Implementation

- Fastify + TypeScript service
- JWT auth
- In-memory repository for immediate development and UI integration
- Prisma schema prepared for SQLite/PostgreSQL persistence
- MVP APIs for auth, factories, employees, processes, products, routes, reports, audits, salaries, subscriptions, payments, bills, invoices, and messages

## Next Step

Replace the in-memory repository with Prisma module-by-module without changing public API paths.
