import { useMemo, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { products, usePageState } from "../../components/pages/PageState";
import "../../../css/products.css";
export function ProductsPage() {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const [search, setSearch] = useState(params.get("q") || "");
  const query = params.get("q") || "";
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("NEW");
  const { add, basket, change, clear } = usePageState();
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
    [category, query, sort],
  );
  const total = basket.reduce(
    (sum, item) => sum + (products.find((p) => p.id === item.id)?.price || 0) * item.quantity,
    0,
  );
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
          <span role="status">{notice}</span>
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
            Basket ({basket.reduce((sum, x) => sum + x.quantity, 0)})
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
                {value}
              </button>
            ))}
          </nav>
          <div className="menu-grid">
            {filtered.map((product) => (
              <article className="menu-card" key={product.id}>
                <Link className="menu-photo-link" to={`/products/${product.id}`}>
                  <img src={`/img/pages/${product.image}.webp`} alt={product.name} />
                  <span className="menu-size">LARGE size</span>
                </Link>
                <button
                  type="button"
                  className="menu-add"
                  aria-label={`Add ${product.name} to basket`}
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
              </article>
            ))}
            {!filtered.length && (
              <div className="page-empty">
                <h2>No products found</h2>
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
          {basket.length ? (
            <>
              <ul>
                {basket.map((item) => {
                  const p = products.find((p) => p.id === item.id)!;
                  return (
                    <li key={item.id}>
                      <img src={`/img/pages/${p.image}.webp`} alt="" />
                      <div>
                        <strong>{p.name}</strong>
                        <span>${p.price * item.quantity}</span>
                        <div className="quantity-controls">
                          <button
                            aria-label={`Decrease ${p.name}`}
                            onClick={() => change(item.id, -1)}
                          >
                            −
                          </button>
                          <output>{item.quantity}</output>
                          <button
                            aria-label={`Increase ${p.name}`}
                            disabled={item.quantity >= 99}
                            onClick={() => change(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="basket-total">
                Total <strong>${total}</strong>
              </p>
              <Link className="page-button" to="/orders">
                Review order
              </Link>
              <button className="text-button" onClick={clear}>
                Clear basket
              </button>
            </>
          ) : (
            <p>Your basket is empty. Add a dish from the menu.</p>
          )}
        </section>
      )}
    </main>
  );
}
export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const product = products.find((p) => p.id === productId);
  const { add } = usePageState();
  const [added, setAdded] = useState(false);
  if (!product)
    return (
      <main className="inner-page detail-page page-container">
        <h1>Product not found</h1>
        <Link to="/products">Back to menu</Link>
      </main>
    );
  return (
    <main className="inner-page detail-page">
      <div className="page-container">
        <h1 className="page-title">Product Detail</h1>
        <div className="product-detail-grid">
          <img
            className="product-detail-photo"
            src={`/img/pages/${product.image}.webp`}
            alt={product.name}
          />
          <section className="product-detail-card">
            <h2>{product.name}</h2>
            <div className="product-rating">
              <span aria-label="3 out of 5 stars">★★★☆☆</span>
              <span>{product.views} views</span>
            </div>
            <p>This is {product.name} from our Turkish menu.</p>
            <div className="detail-price">
              <strong>Price:</strong>
              <strong>$ {product.price}</strong>
            </div>
            <button
              className="page-button"
              onClick={() => {
                add(product.id);
                setAdded(true);
              }}
            >
              ADD TO BASKET
            </button>
            <p role="status">
              {added && (
                <>
                  Added to basket. <Link to="/products?basket=1">View basket</Link>
                </>
              )}
            </p>
          </section>
        </div>
        <Link className="back-link" to="/products">
          ← Back to menu
        </Link>
      </div>
    </main>
  );
}
