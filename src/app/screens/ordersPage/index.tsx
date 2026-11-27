import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material"
import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { Link, Redirect, useLocation } from "react-router-dom"
import { getOrders, OrderApiError, updateOrder } from "../../api/orders"
import type { Order } from "../../api/orders"
import { useAuth } from "../../auth/AuthProvider"
import { formatMoney } from "../../basket/pricing"
import { ProfileCard } from "../../components/pages/ProfileCard"
import "../../../css/orders.css"

const tabs = [
  { status: "PAUSE", label: "Paused Order" },
  { status: "PROCESS", label: "Process Order" },
  { status: "FINISH", label: "Finished Orders" },
] as const
type OrderTab = (typeof tabs)[number]["status"]

const actions = {
  DELETE: {
    question: "Cancel this order?",
    confirmLabel: "Confirm cancellation",
    success: "Order cancelled.",
  },
  PROCESS: {
    question: "Start processing this order?",
    confirmLabel: "Confirm processing",
    success: "Order moved to processing.",
  },
  FINISH: {
    question: "Have you received this order?",
    confirmLabel: "Confirm receipt",
    success: "Order marked as received.",
  },
} as const
type OrderAction = keyof typeof actions
type OrderFailure = { message: string; needsLogin: boolean }
type OrderListing =
  | { key: string; orders: Order[]; error?: never }
  | { key: string; orders?: never; error: OrderFailure }

const ordersPerPage = 10

function orderFailure(error: unknown, fallback: string): OrderFailure {
  if (error instanceof OrderApiError && (error.status === 401 || error.status === 403)) {
    return { message: "Your session has expired.", needsLogin: true }
  }
  return {
    message: error instanceof OrderApiError ? error.message : fallback,
    needsLogin: false,
  }
}

export default function OrdersPage() {
  const { member, openLogin, status } = useAuth()
  const { key: routeKey } = useLocation()

  if (status === "guest") return <Redirect to="/" />

  if (!member) {
    return (
      <main className="inner-page orders-page">
        <div className="page-container page-empty">
          <h1 className="page-title">Your orders</h1>
          {status === "loading" ? (
            <output>Checking your session…</output>
          ) : (
            <>
              <p role="alert">Could not check your session. Log in to view your orders.</p>
              <button type="button" className="page-button" onClick={openLogin}>
                Log in
              </button>
            </>
          )}
        </div>
      </main>
    )
  }

  return <AuthenticatedOrders key={`${member.id}:${routeKey ?? "initial"}`} />
}

function AuthenticatedOrders() {
  const { isLoggingOut, openLogin, setMember } = useAuth()
  const [tab, setTab] = useState<OrderTab>("PAUSE")
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [listing, setListing] = useState<OrderListing | null>(null)
  const [pending, setPending] = useState<{
    id: string
    action: OrderAction
  } | null>(null)
  const [updating, setUpdating] = useState(false)
  const [actionError, setActionError] = useState<OrderFailure | null>(null)
  const [notice, setNotice] = useState("")
  const updateRequest = useRef<AbortController | null>(null)
  const requestKey = `${tab}:${page}:${revision}`
  const result = listing?.key === requestKey ? listing : null

  useEffect(() => {
    const request = new AbortController()
    void getOrders(
      { orderStatus: tab, page, limit: ordersPerPage },
      request.signal,
    ).then(
      orders => {
        if (!request.signal.aborted) setListing({ key: requestKey, orders })
      },
      (error: unknown) => {
        if (!request.signal.aborted) {
          setListing({
            key: requestKey,
            error: orderFailure(error, "Could not load your orders."),
          })
        }
      },
    )
    return () => request.abort()
  }, [tab, page, requestKey])

  useEffect(() => () => updateRequest.current?.abort(), [])

  function signInAgain() {
    setMember(null)
    openLogin()
  }

  function selectTab(status: OrderTab) {
    if (status === tab) return
    setTab(status)
    setPage(1)
    setNotice("")
  }

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const lastIndex = tabs.length - 1
    let nextIndex: number
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = index === 0 ? lastIndex : index - 1
        break
      case "ArrowRight":
        nextIndex = index === lastIndex ? 0 : index + 1
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = lastIndex
        break
      default:
        return
    }
    event.preventDefault()
    const { status } = tabs[nextIndex]
    selectTab(status)
    document.getElementById(`order-tab-${status}`)?.focus()
  }

  async function confirmAction() {
    if (!pending || updateRequest.current || isLoggingOut) return
    const request = new AbortController()
    updateRequest.current = request
    const { action, id } = pending
    setUpdating(true)
    setActionError(null)
    try {
      await updateOrder(id, action, request.signal)
      if (request.signal.aborted) return
      if (action !== "DELETE") setTab(action)
      setPage(1)
      setRevision(value => value + 1)
      setPending(null)
      setNotice(actions[action].success)
    } catch (error) {
      if (!request.signal.aborted) {
        setActionError(
          orderFailure(error, "Could not update the order. Try again."),
        )
      }
    } finally {
      if (!request.signal.aborted) {
        updateRequest.current = null
        setUpdating(false)
      }
    }
  }

  const orders = result?.orders ?? []
  const hasNextPage = orders.length === ordersPerPage

  return (
    <main className="inner-page orders-page">
      <div className="page-container orders-layout">
        <section>
          <h1 className="page-title orders-title">Your orders</h1>
          <div className="order-tabs" role="tablist" aria-label="Order status">
            {tabs.map(({ status, label }, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab === status}
                aria-controls="order-list"
                id={`order-tab-${status}`}
                key={status}
                tabIndex={tab === status ? 0 : -1}
                onClick={() => selectTab(status)}
                onKeyDown={event => onTabKeyDown(event, index)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="order-payment-notice">
            Online payments are unavailable.
          </p>
          {notice && <output className="page-status">{notice}</output>}
          <div
            id="order-list"
            role="tabpanel"
            aria-labelledby={`order-tab-${tab}`}
            aria-busy={!result}
            className="order-list"
          >
            {!result && (
              <output className="page-status">Loading orders…</output>
            )}
            {result?.error && (
              <div className="page-empty">
                <p role="alert">{result.error.message}</p>
                {result.error.needsLogin ? (
                  <button
                    type="button"
                    className="page-button"
                    onClick={signInAgain}
                  >
                    Log in again
                  </button>
                ) : (
                  <button
                    type="button"
                    className="page-button"
                    onClick={() => setRevision(value => value + 1)}
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                disabled={isLoggingOut}
                onAction={action => {
                  setActionError(null)
                  setPending({ id: order.id, action })
                }}
              />
            ))}
            {result?.orders && orders.length === 0 && (
              <div className="page-empty">
                <p>No orders in this section.</p>
                {page === 1 && (
                  <Link className="page-button" to="/products">
                    Explore menu
                  </Link>
                )}
              </div>
            )}
            {(page > 1 || hasNextPage) && (
              <nav className="order-pagination" aria-label="Order pages">
                <button
                  type="button"
                  className="page-button"
                  disabled={page === 1 || !result}
                  onClick={() => setPage(value => value - 1)}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  className="page-button"
                  disabled={!hasNextPage}
                  onClick={() => setPage(value => value + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        </section>
        <aside className="order-sidebar">
          <ProfileCard />
        </aside>
      </div>
      {pending && (
        <Dialog
          open
          onClose={updating ? undefined : () => setPending(null)}
          aria-labelledby="order-confirmation-title"
        >
          <DialogTitle id="order-confirmation-title">
            {actions[pending.action].question}
          </DialogTitle>
          {actionError && (
            <DialogContent>
              <p role="alert">{actionError.message}</p>
            </DialogContent>
          )}
          <DialogActions>
            <Button disabled={updating} onClick={() => setPending(null)}>
              Close
            </Button>
            {actionError?.needsLogin ? (
              <Button variant="contained" onClick={signInAgain}>
                Log in again
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={updating || isLoggingOut}
                onClick={() => void confirmAction()}
              >
                {updating ? "Updating…" : actions[pending.action].confirmLabel}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </main>
  )
}

function OrderCard({
  order,
  disabled,
  onAction,
}: {
  order: Order
  disabled: boolean
  onAction: (action: OrderAction) => void
}) {
  const createdAt = new Date(order.createdAt)
  return (
    <article className="order-card">
      <header className="order-card-header">
        <h2>Order #{order.id.slice(-8)}</h2>
        {Number.isFinite(createdAt.getTime()) && (
          <time dateTime={createdAt.toISOString()}>
            {createdAt.toLocaleString()}
          </time>
        )}
      </header>
      <ul className="order-items">
        {order.items.map(item => (
          <li className="order-row" key={item.id}>
            <img src={item.image} alt="" />
            <h3>{item.name}</h3>
            <span>{formatMoney(item.price)}</span>
            <span>× {item.quantity}</span>
            <strong>{formatMoney(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>
      <div className="order-summary">
        <div>
          <span>
            Product price <b>{formatMoney(order.total - order.delivery)}</b>
          </span>
          <span>
            Delivery cost{" "}
            <b>{order.delivery ? formatMoney(order.delivery) : "Free"}</b>
          </span>
          <span>
            Total <b>{formatMoney(order.total)}</b>
          </span>
        </div>
        {order.status === "PAUSE" && (
          <div className="order-actions">
            <button
              type="button"
              className="order-cancel"
              disabled={disabled}
              onClick={() => onAction("DELETE")}
            >
              Cancel order
            </button>
            <button
              type="button"
              className="page-button"
              disabled={disabled}
              onClick={() => onAction("PROCESS")}
            >
              Start processing
            </button>
          </div>
        )}
        {order.status === "PROCESS" && (
          <button
            type="button"
            className="page-button"
            disabled={disabled}
            onClick={() => onAction("FINISH")}
          >
            Mark as received
          </button>
        )}
        {order.status === "FINISH" && (
          <span className="finished-label">Completed</span>
        )}
      </div>
    </article>
  )
}
