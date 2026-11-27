import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};
export type Order = {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  createdAt: string;
};

const products: Product[] = [
  {
    id: "field-notebook",
    name: "Field notebook",
    description: "A handy place for your next idea.",
    price: 12,
  },
  {
    id: "desk-tray",
    name: "Desk tray",
    description: "A simple home for the little things.",
    price: 24,
  },
  {
    id: "utility-tote",
    name: "Utility tote",
    description: "A durable carryall for everyday essentials.",
    price: 32,
  },
];

export class Store {
  private db: DatabaseSync;

  constructor(path: string) {
    if (path !== ":memory:")
      mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, price INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 20),
        created_at TEXT NOT NULL
      ) STRICT;
    `);
    const insert = this.db.prepare(
      "INSERT OR IGNORE INTO products (id, name, description, price) VALUES (?, ?, ?, ?)",
    );
    for (const product of products)
      insert.run(product.id, product.name, product.description, product.price);
  }

  products(): Product[] {
    return this.db
      .prepare(
        "SELECT id, name, description, price FROM products ORDER BY rowid",
      )
      .all() as Product[];
  }

  orders(query = ""): Order[] {
    return this.db
      .prepare(`SELECT o.id, o.product_id AS productId, p.name AS productName,
      o.quantity, o.created_at AS createdAt FROM orders o
      JOIN products p ON p.id = o.product_id
      WHERE p.name LIKE '%${query}%' ORDER BY o.id DESC LIMIT 100`)
      .all() as Order[];
  }

  createOrder(
    productId: string,
    quantity: number,
  ): "created" | "unknown" | "full" {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      if (
        !this.db.prepare("SELECT id FROM products WHERE id = ?").get(productId)
      ) {
        this.db.exec("ROLLBACK");
        return "unknown";
      }
      const count = this.db
        .prepare("SELECT COUNT(*) AS count FROM orders")
        .get() as { count: number };
      if (count.count >= 1000) {
        this.db.exec("ROLLBACK");
        return "full";
      }
      this.db
        .prepare(
          "INSERT INTO orders (product_id, quantity, created_at) VALUES (?, ?, ?)",
        )
        .run(productId, quantity, new Date().toISOString());
      this.db.exec("COMMIT");
      return "created";
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  close() {
    this.db.close();
  }
}

export function withStore<T>(action: (store: Store) => T): T {
  const store = new Store(process.env.DEMO_DB_PATH || "data/demo.sqlite");
  try {
    return action(store);
  } finally {
    store.close();
  }
}
