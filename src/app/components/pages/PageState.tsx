import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export const products = [
  {
    id: "spicy-noodles",
    name: "Korean Spicy Soup",
    image: "noodles",
    category: "DISH",
    price: 15,
    views: 21,
  },
  {
    id: "vegetarian",
    name: "Vegetarian Soup",
    image: "vegetarian-soup",
    category: "SALAD",
    price: 15,
    views: 18,
  },
  {
    id: "salmon",
    name: "Salmon Pasta",
    image: "salmon-pasta",
    category: "DISH",
    price: 15,
    views: 12,
  },
  { id: "rice", name: "Kebuli Rice", image: "rice", category: "DISH", price: 15, views: 32 },
  {
    id: "spicy-soup",
    name: "Korean Spicy Soup",
    image: "spicy-soup",
    category: "DISH",
    price: 15,
    views: 17,
  },
  { id: "steak", name: "Vegetarian Soup", image: "steak", category: "DISH", price: 15, views: 11 },
  { id: "salad", name: "Salmon Pasta", image: "salad", category: "SALAD", price: 15, views: 8 },
  {
    id: "kebuli",
    name: "Kebuli Rice",
    image: "kebuli-rice",
    category: "DISH",
    price: 15,
    views: 26,
  },
];
export type Product = (typeof products)[number];
export type BasketItem = { id: string; quantity: number };
export type Profile = {
  name: string;
  description: string;
  phone: string;
  address: string;
  image: string;
};
export const defaultProfile: Profile = {
  name: "Justin",
  description: "The best man",
  phone: "8210 2469 4424",
  address: "South Korea, Busan",
  image: "/img/pages/profile.webp",
};
const key = "burak-page-basket-v1";
function readBasket(): BasketItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (x): x is BasketItem =>
            !!x &&
            typeof x.id === "string" &&
            products.some((p) => p.id === x.id) &&
            Number.isInteger(x.quantity) &&
            x.quantity > 0 &&
            x.quantity <= 99,
        )
      : [];
  } catch {
    return [];
  }
}
export function readProfile(): Profile {
  try {
    const p = JSON.parse(localStorage.getItem("burak-profile-v1") || "null");
    if (p && Object.keys(defaultProfile).every((k) => typeof p[k] === "string")) return p;
  } catch {
    /* Use design defaults when storage is unavailable. */
  }
  return defaultProfile;
}
const Context = createContext<{
  basket: BasketItem[];
  add: (id: string) => void;
  change: (id: string, amount: number) => void;
  clear: () => void;
} | null>(null);
export function PageStateProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState(readBasket);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(basket));
    } catch {
      /* The basket still works in this session. */
    }
  }, [basket]);
  const add = (id: string) =>
    setBasket((items) =>
      items.some((x) => x.id === id)
        ? items.map((x) => (x.id === id ? { ...x, quantity: Math.min(99, x.quantity + 1) } : x))
        : [...items, { id, quantity: 1 }],
    );
  const change = (id: string, amount: number) =>
    setBasket((items) =>
      items
        .map((x) => (x.id === id ? { ...x, quantity: Math.min(99, x.quantity + amount) } : x))
        .filter((x) => x.quantity > 0),
    );
  return (
    <Context.Provider value={{ basket, add, change, clear: () => setBasket([]) }}>
      {children}
    </Context.Provider>
  );
}
export function usePageState() {
  const state = useContext(Context);
  if (!state) throw new Error("PageStateProvider is required");
  return state;
}
