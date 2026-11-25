import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getProducts } from "../../api/catalog";
import type { Product } from "../../api/catalog";
import { createOrder } from "../../api/orders";

export type BasketItem = { id: string; quantity: number };
type CatalogStatus = "loading" | "ready" | "error";
type Catalog = { products: Product[]; status: CatalogStatus; attempt: number };

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
    const saved = localStorage.getItem(key);
    const value: unknown = JSON.parse(saved ?? localStorage.getItem("cartData") ?? "[]");
    if (!Array.isArray(value)) return [];

    const items = new Map<string, BasketItem>();
    for (const entry of value) {
      const id = saved === null ? entry?.["_id"] : entry?.id;
      const quantity = entry?.quantity;
      if (typeof id === "string" && id.length && Number.isInteger(quantity) && quantity > 0) {
        items.set(id, { id, quantity: Math.min(99, quantity) });
      }
    }
    return [...items.values()];
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
  basketItems: (BasketItem & { product: Product })[];
  products: Product[];
  catalogStatus: CatalogStatus;
  retryCatalog: () => void;
  add: (id: string) => void;
  change: (id: string, amount: number) => void;
  remove: (id: string) => void;
  removeUnavailable: () => void;
  clear: () => void;
  isCheckingOut: boolean;
  checkoutIssue: string;
  placeOrder: () => Promise<boolean>;
} | null>(null);
export function PageStateProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState(readBasket);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkoutPending = useRef(false);
  const [catalog, setCatalog] = useState<Catalog>({
    products: [],
    status: "loading",
    attempt: 0,
  });
  const { products, status: catalogStatus, attempt } = catalog;

  useEffect(() => {
    const request = new AbortController();
    const settle = (status: "ready" | "error", results: Product[]) => {
      if (request.signal.aborted) return;
      setCatalog((current) =>
        current.attempt === attempt ? { products: results, status, attempt } : current,
      );
    };
    getProducts(request.signal).then(
      (results) => settle("ready", results),
      () => settle("error", []),
    );
    return () => request.abort();
  }, [attempt]);

  const retryCatalog = () =>
    setCatalog((current) => ({ products: [], status: "loading", attempt: current.attempt + 1 }));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(basket));
    } catch {
      /* The basket still works in this session. */
    }
  }, [basket]);

  const productsById = new Map(products.map((product) => [product.id, product]));
  const basketItems = basket.flatMap((item) => {
    const product = productsById.get(item.id);
    return product ? [{ ...item, product }] : [];
  });
  let checkoutIssue = "";
  if (catalogStatus === "ready" && basket.length > 0) {
    if (basketItems.length !== basket.length) checkoutIssue = "Remove unavailable items to continue.";
    else if (basketItems.some(({ product, quantity }) => quantity > product.stock)) {
      checkoutIssue = "Adjust quantities to match available stock.";
    } else if (basket.length > 100) checkoutIssue = "An order can contain up to 100 different products.";
  }

  async function placeOrder() {
    if (checkoutPending.current || !basket.length || catalogStatus !== "ready" || checkoutIssue) {
      return false;
    }
    checkoutPending.current = true;
    setIsCheckingOut(true);
    try {
      await createOrder(basket.map(({ id, quantity }) => ({ productId: id, itemQuantity: quantity })));
      setBasket([]);
      return true;
    } finally {
      checkoutPending.current = false;
      setIsCheckingOut(false);
    }
  }

  const stockLimit = (id: string) => Math.min(99, productsById.get(id)?.stock ?? 0);
  const add = (id: string) => {
    const limit = stockLimit(id);
    if (checkoutPending.current || limit < 1) return;
    setBasket((items) =>
      items.some((x) => x.id === id)
        ? items.map((x) => (x.id === id && x.quantity < limit ? { ...x, quantity: x.quantity + 1 } : x))
        : [...items, { id, quantity: 1 }],
    );
  };
  const change = (id: string, amount: number) => {
    if (checkoutPending.current) return;
    const limit = stockLimit(id);
    setBasket((items) =>
      items
        .map((item) => {
          if (item.id !== id) return item;
          const quantity = amount > 0
            ? Math.min(item.quantity + amount, Math.max(item.quantity, limit))
            : item.quantity + amount;
          return { ...item, quantity };
        })
        .filter((item) => item.quantity > 0),
    );
  };
  const remove = (id: string) => {
    if (!checkoutPending.current) setBasket((items) => items.filter((item) => item.id !== id));
  };
  const removeUnavailable = () => {
    if (!checkoutPending.current && catalogStatus === "ready") {
      setBasket((items) => items.filter((item) => productsById.has(item.id)));
    }
  };
  return (
    <Context.Provider value={{
      basket,
      basketItems,
      products,
      catalogStatus,
      retryCatalog,
      add,
      change,
      remove,
      removeUnavailable,
      clear: () => {
        if (!checkoutPending.current) setBasket([]);
      },
      isCheckingOut,
      checkoutIssue,
      placeOrder,
    }}>
      {children}
    </Context.Provider>
  );
}
export function usePageState() {
  const state = useContext(Context);
  if (!state) throw new Error("PageStateProvider is required");
  return state;
}
