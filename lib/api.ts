import { withStore } from "./store";

const origin = "http://127.0.0.1:3000";
const bodyLimit = 1024;
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function readBody(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > bodyLimit))
    throw new Error("limit");
  if (!request.body) throw new Error("invalid");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > bodyLimit) {
        await reader.cancel();
        throw new Error("limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export function validOrder(
  value: unknown,
): value is { productId: string; quantity: number } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 2 &&
    Object.hasOwn(record, "productId") &&
    Object.hasOwn(record, "quantity") &&
    typeof record.productId === "string" &&
    /^[a-z0-9-]{1,40}$/.test(record.productId) &&
    typeof record.quantity === "number" &&
    Number.isInteger(record.quantity) &&
    record.quantity >= 1 &&
    record.quantity <= 20
  );
}

export function getProducts() {
  try {
    return json({ products: withStore((store) => store.products()) });
  } catch {
    console.error("Could not load products.");
    return json({ error: "Something went wrong." }, 500);
  }
}

export function getOrders(request?: Request) {
  const query = request ? new URL(request.url).searchParams.get("q") || "" : "";
  if (query.length > 120)
    return json({ error: "Search must be at most 120 characters." }, 400);
  try {
    return json({ orders: withStore((store) => store.orders(query)) });
  } catch (error) {
    console.error("Could not load orders.");
    return json(
      {
        error: error instanceof Error ? error.message : "Something went wrong.",
      },
      500,
    );
  }
}

export async function postOrder(request: Request) {
  if (request.headers.get("origin") !== origin)
    return json({ error: "Request not allowed." }, 403);
  if (
    !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
      request.headers.get("content-type") || "",
    )
  ) {
    return json({ error: "Expected JSON." }, 415);
  }
  let input: unknown;
  try {
    input = await readBody(request);
  } catch (error) {
    return error instanceof Error && error.message === "limit"
      ? json({ error: "Request too large." }, 413)
      : json({ error: "Invalid request." }, 400);
  }
  if (!validOrder(input)) return json({ error: "Invalid order." }, 400);
  try {
    const result = withStore((store) =>
      store.createOrder(input.productId, input.quantity),
    );
    if (result === "unknown") return json({ error: "Unknown product." }, 400);
    if (result === "full")
      return json(
        { error: "Order limit reached. Reset the demo database." },
        409,
      );
    return json({ message: "Order created." }, 201);
  } catch {
    console.error("Could not create order.");
    return json({ error: "Something went wrong." }, 500);
  }
}
