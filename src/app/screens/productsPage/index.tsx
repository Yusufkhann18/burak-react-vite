import { useEffect, useMemo, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { getProduct, type Product } from "../../api/catalog";
import { usePageState } from "../../components/pages/PageState";
import "../../../css/products.css";
export function ProductsPage() {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const [search, setSearch] = useState(params.get("q") || "");
  const query = params.get("q") || "";
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("NEW");
  const { products, catalogStatus, retryCatalog, add, basket, basketItems, change, clear } =
    usePageState();
  const [notice, setNotice] = useState("");
  const isBasket = params.get("basket") === "1";
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (category === "ALL" || p.category === category) &&
            p.name.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "PRICE" ? a.price - b.price : sort === "VIEWS" ? b.views - a.views : 0,
        ),
    [category, products, query, sort],
  );
  const quantities = new Map(basket.map(({ id, quantity }) => [id, quantity]));
  const total = basketItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  const unavailable = catalogStatus === "ready" && basket.length > basketItems.length;
  return (
    <main className="inner-page products-page">
      <section className="page-container menu-section">
        <div className="menu-heading">
          <h1>Burak Restaurant</h1>
          <form
            className="menu-search"
            onSubmit={(e) => {
              e.preventDefault();
              history.replace(`/products?q=${encodeURIComponent(search.trim())}`);
            }}
          >
            <input
              aria-label="Search products"
              placeholder="Type here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">SEARCH ⌕</button>
          </form>
        </div>
        <div className="menu-toolbar">
          <output>{notice}</output>
          <div className="sort-controls" aria-label="Sort products">
            {["NEW", "PRICE", "VIEWS"].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={sort === value}
                onClick={() => setSort(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <Link className="basket-link" to="/products?basket=1">
            Basket ({basketItems.reduce((sum, { quantity }) => sum + quantity, 0)})
          </Link>
        </div>
        <div className="menu-layout">
          <nav className="category-controls" aria-label="Product categories">
            {["ALL", "DISH", "SALAD", "DRINK", "DESERT", "OTHER"].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value === "DESERT" ? "DESSERT" : value}
              </button>
            ))}
          </nav>
          <div className="menu-grid">
            {filtered.map((product) => (
              <article className="menu-card" key={product.id}>
                <Link className="menu-photo-link" to={`/products/${product.id}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  {product.size && <span className="menu-size">{product.size} size</span>}
                </Link>
                <button
                  type="button"
                  className="menu-add"
                  aria-label={`Add ${product.name} to basket`}
                  disabled={(quantities.get(product.id) ?? 0) >= Math.min(99, product.stock)}
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
                {product.stock < 1 && <small className="menu-stock">Out of stock</small>}
              </article>
            ))}
            {catalogStatus === "loading" && (
              <div className="page-empty">
                <output>Loading products…</output>
              </div>
            )}
            {catalogStatus === "error" && (
              <div className="page-empty" role="alert">
                <h2>Could not load products</h2>
                <button type="button" className="page-button" onClick={retryCatalog}>
                  Try again
                </button>
              </div>
            )}
            {catalogStatus === "ready" && !filtered.length && (
              <div className="page-empty">
                <h2>No products found</h2>
                {products.length ? (
                  <>
                    <p>Try another search or category.</p>
                    <button
                      className="page-button"
                      onClick={() => {
                        setCategory("ALL");
                        setSearch("");
                        history.replace("/products");
                      }}
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
        <nav className="menu-pagination" aria-label="Product pages">
          <button disabled aria-label="Previous page">
            ←
          </button>
          <button aria-current="page">1</button>
          <button disabled aria-label="Next page">
            →
          </button>
        </nav>
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
        <img
          src="/img/pages/map.webp"
          alt="Restaurant location map from the Burak design"
          loading="lazy"
        />
      </section>
      {isBasket && (
        <section className="basket-panel" aria-labelledby="basket-title">
          <div className="basket-panel-heading">
            <h2 id="basket-title">Your basket</h2>
            <Link to="/products" aria-label="Close basket">
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
                      <span>${Number((product.price * quantity).toFixed(2))}</span>
                      <div className="quantity-controls">
                        <button
                          aria-label={`Decrease ${product.name}`}
                          onClick={() => change(id, -1)}
                        >
                          −
                        </button>
                        <output>{quantity}</output>
                        <button
                          aria-label={`Increase ${product.name}`}
                          disabled={quantity >= Math.min(99, product.stock)}
                          onClick={() => change(id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="basket-total">
                Total <strong>${Number(total.toFixed(2))}</strong>
              </p>
              <Link className="page-button" to="/orders">
                Review order
              </Link>
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
          {unavailable && <p>Some saved items are no longer available.</p>}
          {catalogStatus === "ready" && basket.length === 0 && (
            <p>Your basket is empty. Add a dish from the menu.</p>
          )}
          {basket.length > 0 && (
            <button className="text-button" onClick={clear}>
              Clear basket
            </button>
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

function ProductDetails({ productId }: { productId: string }) {
  const { products, catalogStatus, retryCatalog, basket, add } = usePageState();
  const [detail, setDetail] = useState<ProductDetailResult>({ status: "loading" });
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

  const catalogProduct = products.find(({ id }) => id === productId);
  const stock = Math.min(product.stock, catalogProduct?.stock ?? 0);
  const quantity = basket.find(({ id }) => id === productId)?.quantity ?? 0;
  const canAdd = catalogStatus === "ready" && quantity < Math.min(stock, 99);

  return (
    <main className="inner-page detail-page">
      <div className="page-container">
        <h1 className="page-title">Product Detail</h1>
        <div className="product-detail-grid">
          <img
            className="product-detail-photo"
            src={product.image}
            alt={product.name}
          />
          <section className="product-detail-card">
            <h2>{product.name}</h2>
            <div className="product-rating">
              <span>{product.views} views</span>
            </div>
            {product.description && <p>{product.description}</p>}
            <div className="detail-price">
              <strong>Price:</strong>
              <strong>$ {product.price}</strong>
            </div>
            <button
              type="button"
              className="page-button"
              disabled={!canAdd}
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
