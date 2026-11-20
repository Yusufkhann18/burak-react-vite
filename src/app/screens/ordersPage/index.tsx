import { useState } from "react";
import { Link } from "react-router-dom";
import { products, usePageState } from "../../components/pages/PageState";
import { ProfileCard } from "../../components/pages/ProfileCard";
import "../../../css/orders.css";
type Status = "paused" | "process" | "finished";
type Order = {
  id: string;
  status: Status;
  items: { name: string; price: number; quantity: number; image: string }[];
};
const sampleItems = [
  { name: "Steak", price: 10, quantity: 2, image: "steak" },
  { name: "Fried chicken", price: 10, quantity: 2, image: "salmon-pasta" },
  { name: "Winner", price: 10, quantity: 2, image: "rice" },
];
const initialOrders: Order[] = ["paused", "process", "finished"].flatMap((status) =>
  [1, 2].map((i) => ({ id: `demo-${status}-${i}`, status: status as Status, items: sampleItems })),
);
export function OrdersPage() {
  const [tab, setTab] = useState<Status>("paused");
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");
  const { basket, clear } = usePageState();
  const current: Order | undefined = basket.length
    ? {
        id: "basket",
        status: "paused",
        items: basket.map((item) => {
          const p = products.find((p) => p.id === item.id)!;
          return { name: p.name, price: p.price, quantity: item.quantity, image: p.image };
        }),
      }
    : undefined;
  const visible = [...(current ? [current] : []), ...orders].filter(
    (order) => order.status === tab,
  );
  function advance(order: Order) {
    const status = order.status === "paused" ? "process" : "finished";
    setOrders((list) =>
      order.id === "basket"
        ? [{ ...order, id: `demo-${Date.now()}`, status }, ...list]
        : list.map((x) => (x.id === order.id ? { ...x, status } : x)),
    );
    if (order.id === "basket") clear();
    setMessage(
      status === "process"
        ? "Demo order moved to Process. No payment was charged."
        : "Demo order marked as finished.",
    );
    setTab(status);
  }
  return (
    <main className="inner-page orders-page">
      <div className="page-container orders-layout">
        <section>
          <div className="order-tabs" role="tablist" aria-label="Order status">
            {(
              [
                ["paused", "Paused Order"],
                ["process", "Process Order"],
                ["finished", "Finished Orders"],
              ] as const
            ).map(([value, label]) => (
              <button
                role="tab"
                aria-selected={tab === value}
                aria-controls="order-list"
                id={`order-tab-${value}`}
                key={value}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="demo-notice">Design preview · sample orders · no real payments</p>
          <p role="status" className="page-status">
            {message}
          </p>
          <div
            id="order-list"
            role="tabpanel"
            aria-labelledby={`order-tab-${tab}`}
            className="order-list"
          >
            {visible.map((order) => {
              const subtotal = order.items.reduce((s, x) => s + x.price * x.quantity, 0);
              return (
                <article className="order-card" key={order.id}>
                  {order.id === "basket" && <h2>Your basket</h2>}
                  {order.items.map((item, index) => (
                    <div className="order-row" key={`${item.name}-${index}`}>
                      <img src={`/img/pages/${item.image}.webp`} alt="" />
                      <h3>{item.name}</h3>
                      <span>${item.price}</span>
                      <span>× {item.quantity}</span>
                      <strong>${item.price * item.quantity}</strong>
                    </div>
                  ))}
                  <div className="order-summary">
                    <div>
                      <span>
                        Product price <b>${subtotal}</b>
                      </span>
                      <span>
                        Delivery cost <b>$5</b>
                      </span>
                      <span>
                        Total <b>${subtotal + 5}</b>
                      </span>
                    </div>
                    {tab === "paused" && (
                      <div className="order-actions">
                        <button
                          className="order-cancel"
                          onClick={() => {
                            if (order.id === "basket") clear();
                            else setOrders((list) => list.filter((x) => x.id !== order.id));
                            setMessage("Demo order cancelled.");
                          }}
                        >
                          CANCEL
                        </button>
                        <button className="page-button" onClick={() => advance(order)}>
                          PAYMENT
                        </button>
                      </div>
                    )}
                    {tab === "process" && (
                      <button className="page-button" onClick={() => advance(order)}>
                        VERIFY TO FULFIL
                      </button>
                    )}
                    {tab === "finished" && <span className="finished-label">Completed</span>}
                  </div>
                </article>
              );
            })}
            {!visible.length && (
              <div className="page-empty">
                <p>No orders in this section.</p>
                <Link className="page-button" to="/products">
                  Explore menu
                </Link>
              </div>
            )}
          </div>
        </section>
        <aside className="order-sidebar">
          <ProfileCard />
          <section className="payment-preview" aria-label="Payment method preview">
            <div className="payment-placeholder">Card number: •••• •••• •••• 7495</div>
            <div className="payment-pair">
              <div className="payment-placeholder">MM / YY</div>
              <div className="payment-placeholder">CVV: •••</div>
            </div>
            <div className="payment-placeholder">Justin Robertson</div>
            <div className="payment-brands">
              {["western", "master", "paypal", "visa"].map((name) => (
                <img key={name} src={`/icons/${name}-card.svg`} alt={name} />
              ))}
            </div>
            <small>Payment integration is not connected.</small>
          </section>
        </aside>
      </div>
    </main>
  );
}
