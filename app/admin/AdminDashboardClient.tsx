
"use client";

import { useCallback, useEffect, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  food: {
    name: string;
  };
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

async function readResponse(response: Response) {
  const text = await response.text();

  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid server response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}

function statusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "preparing":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminDashboardClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!Array.isArray(data)) {
        throw new Error("Orders API did not return a list.");
      }

      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      setError("");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      await readResponse(response);

      window.location.href = "/admin/login";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Logout failed."
      );
      setLoggingOut(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      setUpdatingId(id);
      setError("");

      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await readResponse(response);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === id ? { ...order, status: data.status } : order
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const totalRevenue = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const preparingOrders = orders.filter(
    (order) => order.status === "preparing"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">

      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="border-b border-white/10 px-6 py-7">
          <h1 className="text-2xl font-black tracking-wide">
            Bella<span className="text-orange-500">.</span>
          </h1>
          <p className="mt-1 text-xs tracking-widest text-slate-400">
            RESTAURANT MANAGEMENT
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-4 lg:flex-col">
          <a
            href="/admin"
            className="flex items-center gap-3 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <span>▦</span>
            Dashboard
          </a>

          <a
            href="/admin/foods"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span>🍽</span>
            Manage Foods
          </a>
        </nav>

        <div className="mt-auto hidden border-t border-white/10 p-5 lg:block">
          <p className="text-sm font-semibold">Bella Restaurant</p>
          <p className="mt-1 text-xs text-slate-400">
            Admin Control Panel
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">

        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div>
            <p className="text-sm font-medium text-orange-600">
              Welcome back!
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your restaurant orders and performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchOrders()}
              disabled={loading || loggingOut}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Statistics */}
          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold">Restaurant Statistics</h3>
              <p className="mt-1 text-sm text-slate-500">
                A quick overview of your orders.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Total Orders
                  </p>
                  <span className="rounded-xl bg-orange-100 p-3 text-xl">
                    📦
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold">
                  {orders.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  All customer orders
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Pending Orders
                  </p>
                  <span className="rounded-xl bg-amber-100 p-3 text-xl">
                    ⏳
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-amber-600">
                  {pendingOrders}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Waiting for processing
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Preparing Orders
                  </p>
                  <span className="rounded-xl bg-blue-100 p-3 text-xl">
                    👨‍🍳
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-blue-600">
                  {preparingOrders}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Currently being prepared
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Completed Revenue
                  </p>
                  <span className="rounded-xl bg-green-100 p-3 text-xl">
                    💰
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-green-600">
                  ${totalRevenue.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {completedOrders} completed orders
                </p>
              </div>

            </div>
          </section>

          {/* Orders */}
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">Customer Orders</h3>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage your latest customer orders.
                </p>
              </div>

              <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                {orders.length} Orders
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-4xl">📋</p>
                <h4 className="mt-4 text-lg font-bold">
                  No orders yet
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  Customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-100 p-5 sm:p-6">

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-bold">
                            {order.customerName}
                          </h4>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          📞 {order.customerPhone}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          📍 {order.customerAddress}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>

                        <p className="mt-2 break-all font-mono text-xs text-slate-400">
                          Order ID: {order.id}
                        </p>
                      </div>

                      <div className="w-full sm:w-auto">
                        <label
                          htmlFor={`status-${order.id}`}
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                          Update Status
                        </label>

                        <select
                          id={`status-${order.id}`}
                          value={order.status}
                          disabled={
                            updatingId === order.id || loggingOut
                          }
                          onChange={(event) =>
                            void updateStatus(order.id, event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-50 sm:w-44"
                        >
                          {statuses.map((status) => (
                            <option
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </option>
                          ))}
                        </select>

                        {updatingId === order.id && (
                          <p className="mt-2 text-xs text-orange-600">
                            Updating status...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <h5 className="mb-4 text-sm font-bold text-slate-800">
                        Order Items
                      </h5>

                      <div className="space-y-3">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-4 text-sm"
                          >
                            <span className="text-slate-600">
                              {item.food?.name ?? "Food item"} ×{" "}
                              {item.quantity}
                            </span>

                            <span className="font-semibold text-slate-800">
                              $
                              {(
                                Number(item.price) *
                                Number(item.quantity)
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="font-bold text-slate-700">
                          Order Total
                        </span>
                        <span className="text-xl font-black text-orange-600">
                          ${Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Bella Restaurant. Admin Panel.
          </footer>

        </div>
      </div>
    </main>
  );
}
