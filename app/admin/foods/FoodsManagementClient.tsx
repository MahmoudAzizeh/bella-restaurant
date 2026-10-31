
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Food = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  available: boolean;
};

type FoodForm = {
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
};

const categories = [
  "Pizza",
  "Burgers",
  "Pasta",
  "Sides",
  "Drinks",
  "Desserts",
];

const initialForm: FoodForm = {
  name: "",
  price: "",
  category: "Pizza",
  imageUrl: "",
  description: "",
};

async function readResponse(response: Response) {
  const text = await response.text();

  let data: { error?: string } & Record<string, unknown>;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Server returned an unexpected response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export default function FoodsManagementClient() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [form, setForm] = useState<FoodForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/foods", {
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!Array.isArray(data)) {
        throw new Error("The foods API did not return a list.");
      }

      setFoods(data as Food[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load foods."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFoods();
  }, [loadFoods]);

  function updateField<K extends keyof FoodForm>(
    field: K,
    value: FoodForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEdit(food: Food) {
    setEditingId(food.id);
    setForm({
      name: food.name,
      price: String(food.price),
      category: food.category,
      imageUrl: food.imageUrl ?? "",
      description: food.description ?? "",
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setError("Please enter a food name.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(price) || price <= 0 || price > 100000) {
      setError("Enter a valid price greater than zero.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        editingId ? `/api/foods/${editingId}` : "/api/foods",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            price,
            category: form.category,
            imageUrl: form.imageUrl.trim() || null,
            description: form.description.trim() || null,
          }),
        }
      );

      await readResponse(response);

      setMessage(
        editingId
          ? "Food updated successfully."
          : "Food added successfully."
      );

      resetForm();
      await loadFoods();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save food.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(food: Food) {
    setBusyId(food.id);
    setError("");
    setMessage("");

    const nextAvailable = !food.available;

    try {
      const response = await fetch(`/api/foods/${food.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: nextAvailable }),
      });

      const updatedFood = (await readResponse(response)) as unknown as Food;

      setFoods((current) =>
        current.map((item) =>
          item.id === food.id ? updatedFood : item
        )
      );

      setMessage(
        nextAvailable
          ? `${food.name} is visible again.`
          : `${food.name} has been hidden.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update visibility."
      );
    } finally {
      setBusyId(null);
    }
  }

  const availableCount = foods.filter((food) => food.available).length;
  const hiddenCount = foods.filter((food) => !food.available).length;

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
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span>▦</span>
            Dashboard
          </a>

          <a
            href="/admin/foods"
            className="flex items-center gap-3 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white"
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
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div>
            <p className="text-sm font-medium text-orange-600">
              Menu Management
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Manage Foods
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add, edit and manage your restaurant menu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadFoods()}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>

            <a
              href="/admin"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Dashboard
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
          {/* Alerts */}
          {error && (
            <div
              role="alert"
              className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="break-words rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            >
              {message}
            </div>
          )}

          {/* Statistics */}
          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold">Menu Statistics</h3>
              <p className="mt-1 text-sm text-slate-500">
                Overview of your restaurant menu items.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Total Foods
                  </p>
                  <span className="rounded-xl bg-orange-100 p-3 text-xl">
                    🍽
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold">{foods.length}</p>
                <p className="mt-1 text-xs text-slate-400">
                  All menu items
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Available
                  </p>
                  <span className="rounded-xl bg-green-100 p-3 text-xl">
                    ✓
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-green-600">
                  {availableCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Visible to customers
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Hidden
                  </p>
                  <span className="rounded-xl bg-slate-200 p-3 text-xl">
                    ◉
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-600">
                  {hiddenCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Not visible to customers
                </p>
              </div>
            </div>
          </section>

          {/* Add / Edit Form */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <p className="text-sm font-medium text-orange-600">
                {editingId ? "UPDATE MENU ITEM" : "MENU EDITOR"}
              </p>
              <h3 className="mt-1 text-xl font-bold">
                {editingId ? "Edit Food" : "Add New Food"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update the details of this menu item."
                  : "Fill in the details to add a new item to your menu."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Food Name *
                </span>
                <input
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  placeholder="Chocolate Cake"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Price ($) *
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  placeholder="6"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Category *
                </span>
                <select
                  required
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Image URL
                </span>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) => updateField("imageUrl", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  placeholder="https://example.com/food.jpg"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  placeholder="Describe this food..."
                />
              </label>

              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "+ Add Food"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Menu Items */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h3 className="text-xl font-bold">Menu Items</h3>
                <p className="mt-1 text-sm text-slate-500">
                  All your restaurant food items.
                </p>
              </div>

              <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                {foods.length} Items
              </span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading foods...
              </div>
            ) : foods.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl">🍽</p>
                <h4 className="mt-4 text-lg font-bold">No foods found</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first food item using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-bold">Food</th>
                      <th className="px-5 py-4 font-bold">Category</th>
                      <th className="px-5 py-4 font-bold">Price</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-5 py-4 font-bold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {foods.map((food) => (
                      <tr
                        key={food.id}
                        className={`transition hover:bg-slate-50 ${
                          !food.available ? "bg-slate-50/70" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {food.name}
                          </div>
                          <div className="mt-1 max-w-xs text-xs text-slate-500">
                            {food.description || "No description"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {food.category}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-800">
                          ${Number(food.price).toFixed(2)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              food.available
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {food.available ? "Available" : "Hidden"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(food)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={busyId === food.id}
                              onClick={() => void toggleAvailability(food)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50 ${
                                food.available
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {busyId === food.id
                                ? "Saving..."
                                : food.available
                                  ? "Hide"
                                  : "Show"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
