"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order, Product } from "../lib/store";

async function getData<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("Request failed");
  return response.json() as Promise<T>;
}

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productState, setProductState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [orderState, setOrderState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selected, setSelected] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    setProductState("loading");
    try {
      const data = await getData<{ products: Product[] }>("/api/products");
      setProducts(data.products);
      setSelected((current) => current || data.products[0]?.id || "");
      setProductState("ready");
    } catch {
      setProductState("error");
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrderState("loading");
    try {
      const data = await getData<{ orders: Order[] }>("/api/orders");
      setOrders(data.orders);
      setOrderState("ready");
    } catch {
      setOrderState("error");
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadOrders();
  }, [loadProducts, loadOrders]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected,
          quantity: Number(quantity),
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setMessage("Order created.");
      setQuantity("1");
      await loadOrders();
    } catch {
      setMessage(
        "Could not create the order. Your selection is still here; please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap header-inner">
          <a className="brand" href="#top">
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span>
              ACME <span className="brand-label">Supply</span>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#collection">Products</a>
            <a href="#orders">Orders</a>
          </nav>
        </div>
      </header>
      <main id="top">
        <section className="hero">
          <div className="wrap hero-inner">
            <div>
              <p className="eyebrow">ACME SUPPLY / PRODUCT CATALOG</p>
              <h1>Supplies for the work ahead.</h1>
              <p className="intro">
                Browse the catalog and manage orders in one place. Select a
                product and quantity to create a local order record.
              </p>
              <a className="hero-link" href="#collection">
                Browse products <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="overview">
              <p className="overview-title">ORDER WORKSPACE</p>
              <div className="overview-row">
                <span>Catalog</span>
                <strong>Browse available products</strong>
              </div>
              <div className="overview-row">
                <span>Orders</span>
                <strong>Create and review records</strong>
              </div>
              <p className="overview-note">
                Records are stored locally. No payment or shipment is processed.
              </p>
            </div>
          </div>
        </section>
        <section id="collection" className="wrap section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PRODUCTS</p>
              <h2>Product catalog</h2>
              <p>Review available supplies and select an item to order.</p>
            </div>
            {productState === "ready" && (
              <span className="count">{products.length} PRODUCTS</span>
            )}
          </div>
          {productState === "loading" && <p role="status">Loading products…</p>}
          {productState === "error" && (
            <p role="alert">
              Could not load products.{" "}
              <button
                className="text-button"
                type="button"
                onClick={loadProducts}
              >
                Try again
              </button>
            </p>
          )}
          {productState === "ready" && products.length === 0 && (
            <p>No products available.</p>
          )}
          <div className="product-grid">
            {products.map((product, index) => (
              <article className="product" key={product.id}>
                <div className="product-number">
                  PRODUCT / {String(index + 1).padStart(2, "0")}
                </div>
                <div className="product-info">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                  </div>
                  <strong>${product.price}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="order-section" id="orders">
          <div className="wrap order-layout">
            <div>
              <p className="eyebrow">ORDER MANAGEMENT</p>
              <h2>Create an order</h2>
              <p className="order-copy">
                Select a product and quantity to add an order to the local order
                log.
              </p>
              <div className="note">
                <p>
                  <strong>Local records only</strong>
                  <br />
                  Orders do not involve checkout, payment, or shipping.
                </p>
              </div>
            </div>
            <div className="order-card">
              <h3>Order details</h3>
              <p>Choose a product and enter a quantity.</p>
              <form onSubmit={submit}>
                <label htmlFor="product">Product</label>
                <select
                  id="product"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                  required
                  disabled={
                    productState !== "ready" || !products.length || pending
                  }
                >
                  <option value="" disabled>
                    Select a product
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — ${product.price}
                    </option>
                  ))}
                </select>
                <label htmlFor="quantity">
                  Quantity <span className="quantity-hint">(1–20)</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  required
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  disabled={pending}
                />
                <button
                  className="submit"
                  disabled={pending || productState !== "ready" || !selected}
                  type="submit"
                >
                  {pending ? "Creating order…" : "Create order"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
                <p className="form-message" role="status" aria-live="polite">
                  {message}
                </p>
              </form>
            </div>
          </div>
        </section>
        <section className="wrap section recent">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ORDER HISTORY</p>
              <h2>Recent orders</h2>
              <p>Stored locally on this machine. Showing up to 100 orders.</p>
            </div>
          </div>
          {orderState === "loading" && <p role="status">Loading orders…</p>}
          {orderState === "error" && (
            <p role="alert">
              Could not load orders.{" "}
              <button
                className="text-button"
                type="button"
                onClick={loadOrders}
              >
                Try again
              </button>
            </p>
          )}
          {orderState === "ready" && orders.length === 0 && (
            <div className="empty">
              <div>
                <strong>No orders yet.</strong>
                <p>Create an order to see it here.</p>
              </div>
            </div>
          )}
          {orderState === "ready" && orders.length > 0 && (
            <ul className="order-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <div>
                    <strong>{order.productName}</strong>
                    <span>Order #{order.id}</span>
                  </div>
                  <div className="order-meta">
                    <strong>Qty {order.quantity}</strong>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <footer>
        <div className="wrap footer-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span>
              ACME <span className="brand-label">Supply</span>
            </span>
          </span>
          <p>Local order records only. No purchases or shipments.</p>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
