import { Badge, Button, IconButton, Popover } from "@mui/material";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { products, usePageState } from "../pages/PageState";
import "../../../css/navbar-basket.css";

export function Basket() {
  const { basket, change, remove } = usePageState();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const isOpen = anchor !== null;
  const close = () => setAnchor(null);

  const items = basket.map(({ id, quantity }) => ({
    id,
    quantity,
    product: products.find((product) => product.id === id)!,
  }));
  const count = items.reduce((sum, { quantity }) => sum + quantity, 0);
  const total = items.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0,
  );

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
          <IconButton aria-label="Close basket" size="small" onClick={close}>
            <img src="/icons/close.svg" alt="" width="16" height="16" />
          </IconButton>
        </div>
        {items.length > 0 ? (
          <ul className="navbar-basket-items">
            {items.map(({ id, product, quantity }) => (
              <li key={id}>
                <img src={`/img/pages/${product.image}.webp`} alt="" />
                <div className="navbar-basket-item">
                  <strong>{product.name}</strong>
                  <span>{`$${product.price} × ${quantity}`}</span>
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
                      disabled={quantity >= 99}
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
        ) : (
          <p className="navbar-basket-empty">Your basket is empty.</p>
        )}
        <div className="navbar-basket-actions">
          <strong aria-live="polite">{`Total $${total}`}</strong>
          <Button component={Link} to="/products?basket=1" onClick={close}>
            View basket
          </Button>
          {items.length > 0 && (
            <Button component={Link} to="/orders" variant="contained" onClick={close}>
              Order
            </Button>
          )}
        </div>
      </Popover>
    </>
  );
}
