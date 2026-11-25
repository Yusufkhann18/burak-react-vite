import { Button } from "@mui/material";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { OrderApiError } from "../api/orders";
import { useAuth } from "../auth/AuthProvider";
import { usePageState } from "../components/pages/PageState";

export function CheckoutButton({ onLeave }: { onLeave?: () => void }) {
  const { catalogStatus, checkoutIssue, isCheckingOut, placeOrder, retryCatalog } = usePageState();
  const { member, status, setMember, openLogin, isLoggingOut } = useAuth();
  const history = useHistory();
  const [failure, setFailure] = useState<"rejected" | "unconfirmed" | null>(null);

  async function checkout() {
    if (!member) {
      onLeave?.();
      openLogin();
      return;
    }
    setFailure(null);
    try {
      if (await placeOrder()) {
        onLeave?.();
        history.push("/orders");
      }
    } catch (error) {
      if (error instanceof OrderApiError && (error.status === 401 || error.status === 403)) {
        setMember(null);
        onLeave?.();
        openLogin();
      } else if (error instanceof OrderApiError && error.status === 400) {
        setFailure("rejected");
        retryCatalog();
      } else {
        setFailure("unconfirmed");
      }
    }
  }

  const disabled = status === "loading" || isLoggingOut || isCheckingOut ||
    catalogStatus !== "ready" || Boolean(checkoutIssue);

  return (
    <div>
      {checkoutIssue && <p>{checkoutIssue}</p>}
      {failure === "rejected" && <p role="alert">Check the current basket quantities and try again.</p>}
      {failure === "unconfirmed" && (
        <p role="alert">
          Could not confirm the order. <Link to="/orders" onClick={onLeave}>Check your orders</Link>{" "}
          before placing it again.
        </p>
      )}
      <Button type="button" variant="contained" disabled={disabled} onClick={() => void checkout()}>
        {isCheckingOut ? "Placing order…" : member ? "Place order" : "Log in to place order"}
      </Button>
    </div>
  );
}
