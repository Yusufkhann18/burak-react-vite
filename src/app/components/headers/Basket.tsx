import { Badge, Button, IconButton, Popover } from "@mui/material";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { usePageState } from "../pages/PageState";
import { formatMoney, freeShippingThreshold, getDeliveryCost } from "../../basket/pricing";
import "../../../css/navbar-basket.css";

export function Basket() {
  const { basket, basketItems, catalogStatus, retryCatalog, change, remove, clear } = usePageState();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const isOpen = anchor !== null;
  const close = () => setAnchor(null);

  const count = basketItems.reduce((sum, { quantity }) => sum + quantity, 0);
  const subtotal = basketItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0,
  );
  const shipping = getDeliveryCost(subtotal);

  return (
    <>
      <IconButton
        className="navbar-basket"
        aria-label={count ? `Shopping basket (${count})` : "Shopping basket"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dialogId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Badge badgeContent={count} color="secondary" aria-hidden="true">
          <img src="/icons/shopping-cart.svg" alt="" />
        </Badge>
      </IconButton>
      <Popover
        anchorEl={anchor}
        open={isOpen}
        onClose={close}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        slotProps={{
          paper: {
            id: dialogId,
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": titleId,
            className: "navbar-basket-popover",
          },
        }}
      >
        <div className="navbar-basket-heading">
          <h2 id={titleId}>Your basket</h2>
          {basket.length > 0 && <Button onClick={clear}>Clear basket</Button>}
          <IconButton aria-label="Close basket" size="small" onClick={close}>
            <img src="/icons/close.svg" alt="" width="16" height="16" />
          </IconButton>
        </div>
        {basketItems.length > 0 && (
          <ul className="navbar-basket-items">
            {basketItems.map(({ id, product, quantity }) => (
              <li key={id}>
                <img src={product.image} alt="" />
                <div className="navbar-basket-item">
                  <strong>{product.name}</strong>
                  <span>{`${formatMoney(product.price)} × ${quantity}`}</span>
                  <div className="navbar-basket-quantity">
                    <Button
                      aria-label={`Decrease ${product.name}`}
                      onClick={() => change(id, -1)}
                    >
                      −
                    </Button>
                    <output aria-label={`${product.name} quantity`}>{quantity}</output>
                    <Button
                      aria-label={`Increase ${product.name}`}
                      disabled={quantity >= Math.min(99, product.stock)}
                      onClick={() => change(id, 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <IconButton
                  aria-label={`Remove ${product.name}`}
                  size="small"
                  onClick={() => remove(id)}
                >
                  <img src="/icons/close.svg" alt="" width="12" height="12" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        {catalogStatus === "loading" && (
          <div className="navbar-basket-empty">
            <output>Checking basket items…</output>
          </div>
        )}
        {catalogStatus === "error" && (
          <p className="navbar-basket-empty">
            Could not check basket items.
            <Button onClick={retryCatalog}>Try again</Button>
          </p>
        )}
        {catalogStatus === "ready" && basket.length > basketItems.length && (
          <p className="navbar-basket-empty">Some saved items are no longer available.</p>
        )}
        {catalogStatus === "ready" && basket.length === 0 && (
          <p className="navbar-basket-empty">Your basket is empty.</p>
        )}
        {basketItems.length > 0 && (
          <div className="navbar-basket-summary">
            <p>
              {shipping > 0
                ? `Add ${formatMoney(freeShippingThreshold - subtotal)} for free shipping.`
                : "Free shipping"}
            </p>
            <progress
              aria-label="Free shipping progress"
              value={Math.min(subtotal, freeShippingThreshold)}
              max={freeShippingThreshold}
            />
            <dl>
              <div><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
              <div><dt>Shipping</dt><dd>{shipping ? formatMoney(shipping) : "Free"}</dd></div>
            </dl>
            <strong aria-live="polite">{`Total ${formatMoney(subtotal + shipping)}`}</strong>
          </div>
        )}
        <div className="navbar-basket-actions">
          <Button component={Link} to="/products?basket=1" onClick={close}>
            View basket
          </Button>
          {basketItems.length > 0 && (
            <Button component={Link} to="/orders" variant="contained" onClick={close}>
              Order
            </Button>
          )}
        </div>
      </Popover>
    </>
  );
}
