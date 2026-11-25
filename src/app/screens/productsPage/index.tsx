import { useEffect, useRef, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import {
  getProduct,
  getProductPage,
  maxProductSearchLength,
  menuPageSize,
  productCollections,
} from "../../api/catalog";
import type { Product } from "../../api/catalog";
import { getRestaurant } from "../../api/member";
import type { Member } from "../../api/member";
import { formatMoney, getDeliveryCost } from "../../basket/pricing";
import { CheckoutButton } from "../../basket/CheckoutButton";
import { usePageState } from "../../components/pages/PageState";
import "../../../css/products.css";

const sorts = [
  { label: "NEW", value: "createdAt" },
  { label: "PRICE", value: "productPrice" },
  { label: "VIEWS", value: "productViews" },
] as const;

type MenuResults =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; products: Product[]; hasNext: boolean };

type MenuInquiry = Parameters<typeof getProductPage>[0];

function useMenuResults({ page, order, collection, search }: MenuInquiry) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ key: string; result: MenuResults }>();
  const key = JSON.stringify([page, order, collection, search, attempt]);

  useEffect(() => {
    const request = new AbortController();
    getProductPage({ page, order, collection, search }, request.signal).then(
      (data) => {
        if (!request.signal.aborted) setSettled({ key, result: { status: "ready", ...data } });
      },
      () => {
        if (!request.signal.aborted) setSettled({ key, result: { status: "error" } });
      },
    );
    return () => request.abort();
  }, [key, page, order, collection, search]);

  const result: MenuResults = settled?.key === key ? settled.result : { status: "loading" };
  return { result, retry: () => setAttempt((value) => value + 1) };
}

function menuUrl(current: URLSearchParams, updates: Record<string, string>) {
  const params = new URLSearchParams(current);
  for (const [name, value] of Object.entries(updates)) {
    if (value) params.set(name, value);
    else params.delete(name);
  }
  const search = params.toString();
  return search ? `/products?${search}` : "/products";
}

function useRestaurant() {
  const [restaurant, setRestaurant] = useState<Member | null>(null);
  useEffect(() => {
    const request = new AbortController();
    getRestaurant(request.signal).then(
      (data) => {
        if (!request.signal.aborted) setRestaurant(data);
      },
      () => { /* Restaurant details are optional for browsing products. */ },
    );
    return () => request.abort();
  }, []);
  return restaurant;
}

function ProductSearch({ initial, onSearch }: { initial: string; onSearch: (text: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) input.current.value = initial;
  }, [initial]);
  return (
    <form
      className="menu-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(input.current?.value.trim() ?? "");
      }}
    >
      <input
        aria-label="Search products"
        placeholder="Type here"
        maxLength={maxProductSearchLength}
        ref={input}
        defaultValue={initial}
        onChange={(event) => {
          if (!event.target.value && initial) onSearch("");
        }}
      />
      <button type="submit">SEARCH ⌕</button>
    </form>
  );
}

export function ProductsPage() {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const query = (params.get("q") ?? "").slice(0, maxProductSearchLength);
  const category = productCollections.find((value) => value === params.get("category"));
  const sort = sorts.find(({ value }) => value === params.get("sort")) ?? sorts[0];
  const requestedPage = Number(params.get("page") ?? 1);
  const validPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 &&
    Number.isSafeInteger((requestedPage + 1) * menuPageSize);
  const page = validPage ? requestedPage : 1;
  const { products, catalogStatus, retryCatalog, add, basket, basketItems, change,
    clear, removeUnavailable, isCheckingOut } = usePageState();
  const [notice, setNotice] = useState("");
  const isBasket = params.get("basket") === "1";
  const { result, retry } = useMenuResults({
    page,
    order: sort.value,
    collection: category,
    search: query,
  });
  const restaurant = useRestaurant();
  const restaurantMap = restaurant?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name}, ${restaurant.address}`)}`
    : undefined;
  const catalogStock = new Map(products.map(({ id, stock }) => [id, stock]));
  const quantities = new Map(basket.map(({ id, quantity }) => [id, quantity]));
  const subtotal = basketItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0,
  );
  const delivery = getDeliveryCost(subtotal);
  const unavailable = catalogStatus === "ready" && basket.length > basketItems.length;
  const navigateMenu = (updates: Record<string, string>) => {
    const url = menuUrl(params, updates);
    if (url !== `${location.pathname}${location.search}`) {
      setNotice("");
      history.push(url);
    }
  };
  return (
    <main className="inner-page products-page">
      <section className="page-container menu-section">
        <div className="menu-heading">
          <h1>Burak Restaurant</h1>
          <ProductSearch
            initial={query}
            onSearch={(text) => navigateMenu({ q: text, page: "" })}
          />
        </div>
        <div className="menu-toolbar">
          <output>{notice}</output>
          <div className="sort-controls" aria-label="Sort products">
            {sorts.map(({ label, value }) => (
              <button
                type="button"
                key={value}
                aria-pressed={sort.value === value}
                onClick={() => navigateMenu({ sort: value, page: "" })}
              >
                {label}
              </button>
            ))}
          </div>
          <Link className="basket-link" to={menuUrl(params, { basket: "1" })}>
            Basket ({basketItems.reduce((sum, { quantity }) => sum + quantity, 0)})
          </Link>
        </div>
        <div className="menu-layout">
          <nav className="category-controls" aria-label="Product categories">
            {["", ...productCollections].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={(category ?? "") === value}
                onClick={() => navigateMenu({ category: value, page: "" })}
              >
                {value === "DESERT" ? "DESSERT" : value || "ALL"}
              </button>
            ))}
          </nav>
          <div className="menu-grid">
            {result.status === "ready" && result.products.map((product) => {
              const stock = Math.min(99, product.stock, catalogStock.get(product.id) ?? 0);
              const variant = product.category === "DRINK" && product.volume
                ? `${product.volume} L`
                : product.size && `${product.size} size`;
              return (
                <article className="menu-card" key={product.id}>
                  <Link className="menu-photo-link" to={`/products/${product.id}`}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                    {variant && <span className="menu-size">{variant}</span>}
                  </Link>
                  <button
                    type="button"
                    className="menu-add"
                    aria-label={`Add ${product.name} to basket`}
                    disabled={isCheckingOut || (quantities.get(product.id) ?? 0) >= stock}
                    onClick={() => {
                      add(product.id);
                      setNotice(`${product.name} added to basket`);
                    }}
                  >
                    +
                  </button>
                  <h2>
                    <Link to={`/products/${product.id}`}>{product.name}</Link>
                  </h2>
                  <p className="menu-price">
                    <span>$</span>
                    {product.price}
                  </p>
                  <small className="menu-views">{product.views} views</small>
                  {product.stock < 1 && <small className="menu-stock">Out of stock</small>}
                </article>
              );
            })}
            {result.status === "loading" && (
              <div className="page-empty">
                <output>Loading products…</output>
              </div>
            )}
            {result.status === "error" && (
              <div className="page-empty" role="alert">
                <h2>Could not load products</h2>
                <button
                  type="button"
                  className="page-button"
                  onClick={() => {
                    retry();
                    if (catalogStatus === "error") retryCatalog();
                  }}
                >
                  Try again
                </button>
              </div>
            )}
            {result.status === "ready" && !result.products.length && (
              <div className="page-empty">
                <h2>No products found</h2>
                {query || category || page > 1 ? (
                  <>
                    <p>Try another search or category.</p>
                    <button
                      className="page-button"
                      onClick={() => navigateMenu({ q: "", category: "", page: "" })}
                    >
                      Show all products
                    </button>
                  </>
                ) : (
                  <p>There are no products in the menu yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
        {result.status === "ready" && (page > 1 || result.hasNext) && (
          <nav className="menu-pagination" aria-label="Product pages">
            <button
              type="button"
              disabled={page === 1}
              aria-label="Previous page"
              onClick={() => navigateMenu({ page: page === 2 ? "" : String(page - 1) })}
            >
              ←
            </button>
            <span aria-current="page" aria-label={`Page ${page}`}>{page}</span>
            <button
              type="button"
              disabled={!result.hasNext}
              aria-label="Next page"
              onClick={() => navigateMenu({ page: String(page + 1) })}
            >
              →
            </button>
          </nav>
        )}
        {result.status === "ready" && result.products.length > 0 && catalogStatus === "error" && (
          <p>
            Basket availability could not be checked. {" "}
            <button type="button" className="text-button" onClick={retryCatalog}>
              Reload basket availability
            </button>
          </p>
        )}
      </section>
      <section className="family-brands">
        <div className="page-container">
          <h2 className="page-title">Our Family Brands</h2>
          <div className="brand-grid">
            {["gurme", "seafood", "sweets", "burak"].map((brand) => (
              <div key={brand}>
                <img src={`/img/pages/brand-${brand}.webp`} alt={`Burak ${brand}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="page-container restaurant-location">
        <h2 className="page-title">Our address</h2>
        {restaurantMap && restaurant ? (
          <p className="restaurant-address">
            <a href={restaurantMap}>{restaurant.address}</a>
          </p>
        ) : (
          <img src="/img/pages/map.webp" alt="Map illustration" loading="lazy" />
        )}
      </section>
      {isBasket && (
        <section className="basket-panel" aria-labelledby="basket-title">
          <div className="basket-panel-heading">
            <h2 id="basket-title">Your basket</h2>
            <Link to={menuUrl(params, { basket: "" })} aria-label="Close basket">
              ×
            </Link>
          </div>
          {basketItems.length > 0 && (
            <>
              <ul>
                {basketItems.map(({ id, product, quantity }) => (
                  <li key={id}>
                    <img src={product.image} alt="" />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{formatMoney(product.price * quantity)}</span>
                      <div className="quantity-controls">
                        <button
                          aria-label={`Decrease ${product.name}`}
                          disabled={isCheckingOut}
                          onClick={() => change(id, -1)}
                        >
                          −
                        </button>
                        <output>{quantity}</output>
                        <button
                          aria-label={`Increase ${product.name}`}
                          disabled={isCheckingOut || quantity >= Math.min(99, product.stock)}
                          onClick={() => change(id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="basket-price-breakdown">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(subtotal)}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>{delivery ? formatMoney(delivery) : "Free"}</dd>
                </div>
                <div className="basket-total">
                  <dt>Total</dt>
                  <dd><strong>{formatMoney(subtotal + delivery)}</strong></dd>
                </div>
              </dl>
            </>
          )}
          {catalogStatus === "loading" && <output>Checking basket items…</output>}
          {catalogStatus === "error" && (
            <p>
              Could not check basket items.{" "}
              <button type="button" className="text-button" onClick={retryCatalog}>
                Try again
              </button>
            </p>
          )}
          {unavailable && (
            <p>
              Some saved items are no longer available.{" "}
              <button type="button" className="text-button" onClick={removeUnavailable}>
                Remove unavailable items
              </button>
            </p>
          )}
          {catalogStatus === "ready" && basket.length === 0 && (
            <p>Your basket is empty. Add a dish from the menu.</p>
          )}
          {basket.length > 0 && (
            <>
              <CheckoutButton />
              <button className="text-button" disabled={isCheckingOut} onClick={clear}>
                Clear basket
              </button>
            </>
          )}
        </section>
      )}
    </main>
  );
}
export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  return <ProductDetails key={productId} productId={productId} />;
}

type ProductDetailResult =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; product: Product | null };

function ProductPhotos({ product }: { product: Product }) {
  const [selected, setSelected] = useState(0);
  const { images, name } = product;

  return (
    <div className="product-gallery">
      <img
        className="product-detail-photo"
        src={images[selected]}
        alt={images.length > 1 ? `${name}, photo ${selected + 1} of ${images.length}` : name}
      />
      {images.length > 1 && (
        <ul aria-label="Product photos" className="product-gallery-thumbnails">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <img src={image} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductDetails({ productId }: { productId: string }) {
  const { products, catalogStatus, retryCatalog, basket, add, isCheckingOut } = usePageState();
  const [detail, setDetail] = useState<ProductDetailResult>({ status: "loading" });
  const restaurant = useRestaurant();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (detail.status !== "loading") return;
    const controller = new AbortController();
    getProduct(productId, controller.signal).then(
      (product) => {
        if (!controller.signal.aborted) setDetail({ status: "ready", product });
      },
      () => {
        if (!controller.signal.aborted) setDetail({ status: "error" });
      },
    );
    return () => controller.abort();
  }, [productId, detail.status]);

  if (detail.status === "loading")
    return (
      <main className="inner-page detail-page page-container">
        <output>Loading product…</output>
      </main>
    );
  if (detail.status === "error")
    return (
      <main className="inner-page detail-page page-container">
        <h1 role="alert">Could not load product</h1>
        <button
          type="button"
          className="page-button"
          onClick={() => setDetail({ status: "loading" })}
        >
          Try again
        </button>
      </main>
    );

  const { product } = detail;
  if (!product)
    return (
      <main className="inner-page detail-page page-container">
        <h1>Product not found</h1>
        <Link to="/products">Back to menu</Link>
      </main>
    );

  const catalogProduct = products.find(({ id }) => id === product.id);
  const stock = Math.min(product.stock, catalogProduct?.stock ?? 0);
  const quantity = basket.find(({ id }) => id === product.id)?.quantity ?? 0;
  const canAdd = catalogStatus === "ready" && quantity < Math.min(stock, 99);
  const drinkVolume = product.category === "DRINK" ? product.volume : undefined;
  const restaurantPhone = restaurant?.phone.replace(/[^0-9+]/g, "");

  return (
    <main className="inner-page detail-page">
      <div className="page-container">
        <h1 className="page-title">Product Detail</h1>
        <div className="product-detail-grid">
          <ProductPhotos product={product} />
          <section className="product-detail-card">
            <h2>{product.name}</h2>
            {restaurant && (
              <address className="product-restaurant">
                <span>{restaurant.name}</span>
                {restaurantPhone && <a href={`tel:${restaurantPhone}`}>{restaurant.phone}</a>}
              </address>
            )}
            <div className="product-rating">
              <span>{product.views} views</span>
            </div>
            <dl className="product-attributes">
              <div>
                <dt>Category</dt>
                <dd>{product.category === "DESERT" ? "DESSERT" : product.category}</dd>
              </div>
              {drinkVolume ? (
                <div>
                  <dt>Volume</dt>
                  <dd>{drinkVolume} L</dd>
                </div>
              ) : product.size && (
                <div>
                  <dt>Size</dt>
                  <dd>{product.size}</dd>
                </div>
              )}
            </dl>
            {product.description && <p>{product.description}</p>}
            <div className="detail-price">
              <strong>Price:</strong>
              <strong>{formatMoney(product.price)}</strong>
            </div>
            <button
              type="button"
              className="page-button"
              disabled={!canAdd || isCheckingOut}
              onClick={() => {
                add(product.id);
                setAdded(true);
              }}
            >
              ADD TO BASKET
            </button>
            {catalogStatus === "loading" && <output>Checking availability…</output>}
            {catalogStatus === "error" && (
              <p>
                Could not check availability.{" "}
                <button type="button" className="text-button" onClick={retryCatalog}>
                  Try again
                </button>
              </p>
            )}
            {catalogStatus === "ready" && stock < 1 && <p>Out of stock</p>}
            {catalogStatus === "ready" && stock > 0 && !canAdd && (
              <p>The basket has the maximum available quantity.</p>
            )}
            <output>
              {added && (
                <>
                  Added to basket. <Link to="/products?basket=1">View basket</Link>
                </>
              )}
            </output>
          </section>
        </div>
        <Link className="back-link" to="/products">
          ← Back to menu
        </Link>
      </div>
    </main>
  );
}
