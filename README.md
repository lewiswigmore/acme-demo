# ACME Supply

A generic local full-stack demo for exploring code review. Browse a synthetic catalog and create orders. There is no checkout, payment, account, deployment, or real customer data.

## Get started

Use Node.js 22.13 or later in the Node 22 line, or Node 24 or later, and npm. The app uses Node's built-in `node:sqlite`, which is experimental in Node 22 and may emit a warning. No database server, credentials, or configuration is required.

```sh
npm ci --ignore-scripts
npm run dev
```

Open **http://127.0.0.1:3000**. The server binds to loopback only; use this exact address, not `localhost`, so order requests have the expected origin. For a production-mode local run, use `npm run build` followed by `npm start`.

The database is created at `data/demo.sqlite` on first request. Stop the server and delete the `data` directory to reset all orders. It will be recreated with synthetic products. The database and generated files are ignored by Git.

## How it works

The Next.js app renders a client-side catalog, order form, and product-name search for recent orders. Route handlers use Node's built-in SQLite module. An empty database gets a fixed schema and synthetic catalog. Orders contain only a catalog ID, quantity, generated ID, and timestamp. There are no text fields for personal information.

| Endpoint            | Behavior                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/products` | Returns `{ "products": [...] }`.                                                                                                                      |
| `GET /api/orders`   | Returns `{ "orders": [...] }`, newest first, at most 100. Optional `q` searches product names, up to 120 characters; an empty query lists all orders. |
| `POST /api/orders`  | Accepts JSON with exactly `productId` (catalog ID) and `quantity` (integer from 1 to 20). Returns 201 on success.                                     |

POST requires `Origin: http://127.0.0.1:3000`, JSON content type, and at most 1,024 body bytes. Responses use `{ "error": "..." }` for errors: 400 invalid input or unknown product, 403 disallowed origin, 413 oversized body, 415 unsupported content type, 409 when the 1,000-order storage limit is reached, or 500 for an internal failure. Server error logs do not include request bodies or exception details.

## Local security boundary

This is a shared, unauthenticated demo intended only for a trusted local machine. Anyone with local access can read, create, or delete its synthetic data. Do not expose it to a network, proxy it publicly, or enter sensitive information. The fixed origin check protects browser mutations against cross-origin requests; it is not authentication and does not protect against local clients. There is no CORS policy or outbound application integration. The provided Next.js scripts disable framework telemetry. Browser responses include a nonce-based content security policy and other defensive headers. Development mode permits `unsafe-eval` for Next.js development tooling.

## Checks

```sh
npm run lint
npm run lint:fix
npm run typecheck
npm test
npm run build
npx --no-install playwright install chromium
npm run test:e2e
```

The end-to-end test starts the already-built production app on port 3000 with its own resettable `test-data` database. Stop other services using that port first. On Linux, Playwright may also need system packages (`npx --no-install playwright install --with-deps chromium`). The test database can be deleted after the run. `npm audit --audit-level=low` checks dependency advisories.
