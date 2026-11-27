import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, test } from "node:test";
import { getOrders, getProducts, postOrder } from "../lib/api";
import { Store } from "../lib/store";

const directory = mkdtempSync("test-data-unit-");
const db = join(directory, "demo.sqlite");
process.env.DEMO_DB_PATH = db;
after(() => rmSync(directory, { recursive: true, force: true }));
const origin = "http://127.0.0.1:3000";
function request(body: string, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/orders`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body,
  });
}

test("catalog and orders persist after reopening", async () => {
  const products = await getProducts().json();
  assert.ok(products.products.length > 0);
  const result = await postOrder(
    request(
      JSON.stringify({ productId: products.products[0].id, quantity: 2 }),
    ),
  );
  assert.equal(result.status, 201);
  const reopened = new Store(db);
  assert.equal(reopened.orders()[0].quantity, 2);
  assert.equal(reopened.orders()[0].productName, products.products[0].name);
  reopened.close();
  assert.equal((await getOrders().json()).orders.length, 1);
});

test("rejects malformed, extra, injection-like, unknown and out-of-range values", async () => {
  for (const body of [
    "{",
    JSON.stringify({ productId: "field-notebook", quantity: 1, name: "extra" }),
    JSON.stringify({ productId: "' OR 1=1 --", quantity: 1 }),
    JSON.stringify({ productId: "not-a-product", quantity: 1 }),
    JSON.stringify({ productId: "field-notebook", quantity: 0 }),
    JSON.stringify({ productId: "field-notebook", quantity: 1.5 }),
    JSON.stringify({ productId: "field-notebook", quantity: "1" }),
  ])
    assert.equal((await postOrder(request(body))).status, 400, body);
  assert.equal((await getOrders().json()).orders.length, 1);
});

test("rejects cross-origin, missing origin, non-JSON and oversized streaming bodies", async () => {
  assert.equal(
    (
      await postOrder(
        request("{}", {
          origin: "https://example.invalid",
          host: "127.0.0.1:3000",
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await postOrder(
        new Request(`${origin}/api/orders`, { method: "POST", body: "{}" }),
      )
    ).status,
    403,
  );
  assert.equal(
    (await postOrder(request("{}", { "content-type": "text/plain" }))).status,
    415,
  );
  assert.equal((await postOrder(request("x".repeat(1025)))).status, 413);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1025));
      controller.close();
    },
  });
  const streamed = new Request(`${origin}/api/orders`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit);
  assert.equal((await postOrder(streamed)).status, 413);
});

test("storage failures return a generic error", async () => {
  const file = join(directory, "not-a-directory");
  writeFileSync(file, "");
  process.env.DEMO_DB_PATH = join(file, "database.sqlite");
  try {
    const response = await postOrder(
      request(JSON.stringify({ productId: "field-notebook", quantity: 1 })),
    );
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "Something went wrong." });
  } finally {
    process.env.DEMO_DB_PATH = db;
  }
});
