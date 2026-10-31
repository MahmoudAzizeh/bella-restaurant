
"use client";

import { useEffect, useState } from "react";

type Food = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
};

type Cart = Record<string, number>;

type OrderResponse = {
  id?: string;
  total?: number;
  error?: string;
};

const fallbackImages: Record<string, string> = {
  "Margherita Pizza":
    "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80",
  "Classic Burger":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
  "Chicken Burger": "/images/chicken-burger.png",
  "Creamy Pasta":
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80",
  "French Fries":
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80",
};

export default function Home() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Cart>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isLoadingFoods, setIsLoadingFoods] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [foodError, setFoodError] = useState("");

  useEffect(() => {
    async function loadFoods() {
      try {
        const response = await fetch("/api/foods");

        if (!response.ok) {
          throw new Error("Could not load the menu.");
        }

        const data: Food[] = await response.json();
        setFoods(data);
      } catch (error) {
        console.error("Loading foods failed:", error);
        setFoodError("Could not load the menu. Please refresh the page.");
      } finally {
        setIsLoadingFoods(false);
      }
    }

    loadFoods();
  }, []);

  const availableCategories = [
    "All",
    ...Array.from(new Set(foods.map((food) => food.category))),
  ];

  const filteredFoods =
    category === "All"
      ? foods
      : foods.filter((food) => food.category === category);

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = foods.reduce(
    (sum, food) => sum + food.price * (cart[food.id] || 0),
    0
  );

  function addToCart(id: string) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  }

  function decreaseFromCart(id: string) {
    setCart((current) => {
      const quantity = current[id] || 0;

      if (quantity <= 1) {
        const updated = { ...current };
        delete updated[id];
        return updated;
      }

      return { ...current, [id]: quantity - 1 };
    });
  }

  async function handlePlaceOrder(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setErrorMessage("");

    if (cartCount === 0) {
      setErrorMessage("Please add items to your cart first.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const items = Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([foodId, quantity]) => ({ foodId, quantity }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          items,
        }),
      });

      const result: OrderResponse = await response.json();

      if (!response.ok || !result.id) {
        throw new Error(result.error || "Failed to save your order.");
      }

      const orderItems = foods
        .filter((food) => (cart[food.id] || 0) > 0)
        .map(
          (food) =>
            `${food.name} x ${cart[food.id]} = $${(
              food.price * cart[food.id]
            ).toFixed(2)}`
        )
        .join("\n");

      const savedTotal =
        typeof result.total === "number" ? result.total : total;

      const message = `New Order - Bella Restaurant
Order ID: ${result.id}

Customer: ${customerName}
Phone: ${customerPhone}
Address: ${customerAddress}

Order:
${orderItems}

Total: $${savedTotal.toFixed(2)}`;

      const restaurantWhatsApp = "96170375018";

      const whatsappUrl =
        `https://wa.me/${restaurantWhatsApp}?text=` +
        encodeURIComponent(message);

      window.open(whatsappUrl, "_blank");

      alert(`Order saved successfully!\nOrder ID: ${result.id}`);
      setCart({});
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    } catch (error) {
      console.error("Order submission failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] text-[#29231f]">
      <nav className="flex items-center justify-between border-b border-orange-100 bg-white px-6 py-5 md:px-12">
        <a href="#home" className="text-2xl font-black text-orange-600">
          Bella<span className="text-stone-800">.</span>
        </a>

        <div className="hidden gap-6 font-medium md:flex">
          <a href="#home" className="hover:text-orange-600">Home</a>
          <a href="#menu" className="hover:text-orange-600">Our Menu</a>
          <a href="#about" className="hover:text-orange-600">About</a>
          <a href="#checkout" className="hover:text-orange-600">Checkout</a>
        </div>

        <a
          href="#cart"
          className="rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
        >
          🛒 Cart ({cartCount})
        </a>
      </nav>

      <section
        id="home"
        className="relative flex min-h-[490px] items-center overflow-hidden bg-stone-900 px-6 py-20 text-white md:px-16"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1800&auto=format&fit=crop&q=85')",
          }}
        />

        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 font-bold uppercase tracking-[0.3em] text-orange-300">
            Welcome to Bella Restaurant
          </p>
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Good food.
            <br />
            Great mood.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-stone-200">
            Fresh ingredients, unforgettable flavors, and a little love
            in every bite. Your next favorite meal is waiting.
          </p>
          <a
            href="#menu"
            className="mt-8 inline-block rounded-full bg-orange-500 px-8 py-4 font-bold text-white transition hover:bg-orange-600"
          >
            Explore Our Menu →
          </a>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-7xl px-6 py-16 md:px-12">
        <div className="mb-8 text-center">
          <p className="font-bold uppercase tracking-widest text-orange-600">
            Made with love
          </p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">
            Our Delicious Menu
          </h2>
          <p className="mt-4 text-stone-500">
            Discover something delicious for every craving.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {availableCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-6 py-3 font-semibold transition ${
                category === item
                  ? "bg-orange-600 text-white"
                  : "border border-orange-200 bg-white hover:bg-orange-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {isLoadingFoods ? (
          <p className="py-12 text-center text-stone-500">
            Loading menu...
          </p>
        ) : foodError ? (
          <p role="alert" className="py-12 text-center text-red-600">
            {foodError}
          </p>
        ) : filteredFoods.length === 0 ? (
          <p className="py-12 text-center text-stone-500">
            No food items found in this category.
          </p>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {filteredFoods.map((food) => (
              <article
                key={food.id}
                className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={
                    food.imageUrl?.trim() ||
                    fallbackImages[food.name] ||
                    "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&auto=format&fit=crop&q=80"
                  }
                  alt={food.name}
                  className="h-52 w-full object-cover"
                />
                <div className="p-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                    {food.category}
                  </span>
                  <h3 className="mt-2 text-xl font-extrabold">{food.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-stone-500">
                    {food.description || "Freshly prepared with care."}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-2">
                    <span className="text-xl font-black text-orange-600">
                      ${food.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(food.id)}
                      className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
                    >
                      + Add ({cart[food.id] || 0})
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div id="cart" className="mt-12 rounded-2xl bg-orange-100 p-6">
          <h3 className="text-center text-2xl font-black">Your Shopping Cart</h3>

          {cartCount === 0 ? (
            <p className="mt-4 text-center text-stone-600">
              Your cart is empty. Add your favorite dishes!
            </p>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                {foods
                  .filter((food) => (cart[food.id] || 0) > 0)
                  .map((food) => (
                    <div
                      key={food.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4"
                    >
                      <div>
                        <h4 className="font-bold">{food.name}</h4>
                        <p className="text-sm text-stone-500">
                          ${(food.price * cart[food.id]).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => decreaseFromCart(food.id)}
                          aria-label={`Decrease ${food.name} quantity`}
                          className="rounded-full bg-stone-200 px-3 py-1 font-bold"
                        >
                          −
                        </button>
                        <span className="font-bold">{cart[food.id]}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(food.id)}
                          aria-label={`Increase ${food.name} quantity`}
                          className="rounded-full bg-orange-600 px-3 py-1 font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-lg font-semibold">Total Items: {cartCount}</p>
                <p className="mt-2 text-3xl font-black text-orange-700">
                  ${total.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <section id="checkout" className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm md:p-10">
          <p className="text-center font-bold uppercase tracking-widest text-orange-600">
            Almost there!
          </p>
          <h2 className="mt-3 text-center text-4xl font-black">Checkout</h2>
          <p className="mt-3 text-center text-stone-500">
            Enter your details to complete your order.
          </p>

          <form onSubmit={handlePlaceOrder} className="mt-8 space-y-5">
            <div>
              <label htmlFor="customerName" className="mb-2 block font-semibold">
                Full Name
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                required
                maxLength={100}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="mb-2 block font-semibold">
                Phone Number
              </label>
              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+961 XX XXX XXX"
                required
                maxLength={30}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="customerAddress" className="mb-2 block font-semibold">
                Delivery Address
              </label>
              <textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter your full delivery address"
                required
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <div className="rounded-xl bg-orange-50 p-5">
              <p className="text-stone-600">Order total</p>
              <p className="mt-1 text-3xl font-black text-orange-600">
                ${total.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {cartCount} item(s) · Delivery fee not included
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={cartCount === 0 || isSubmitting || isLoadingFoods}
              className="w-full rounded-full bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isSubmitting ? "Saving Your Order..." : "Send Order via WhatsApp"}
            </button>
          </form>
        </div>
      </section>

      <section id="about" className="bg-stone-900 px-6 py-12 text-center text-white">
        <h2 className="text-3xl font-black">Made fresh. Served with love.</h2>
        <p className="mt-3 text-stone-300">
          Bella Restaurant · Great food, happy moments.
        </p>
        <p className="mt-8 text-sm text-stone-500">
          © 2026 Bella Restaurant. All rights reserved.
        </p>
      </section>
    </main>
  );
}
