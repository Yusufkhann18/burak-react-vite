import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const riceId = "64ab12345678901234567801";
const rice = {
  _id: riceId,
  productName: "Kebuli Rice",
  productCollection: "DISH",
  productPrice: 15,
  productLeftCount: 2,
  productSize: "LARGE",
  productDesc: "Rice from the restaurant menu",
  productImages: ["uploads/products/kebuli-rice.jpg", "uploads/products/kebuli-detail.jpg"],
  productViews: 24,
  createdAt: "2026-09-01T00:00:00.000Z",
};
const account = {
  _id: "64ab12345678901234567804",
  memberNick: "Ali",
  memberPhone: "821012345678",
  memberAddress: "Busan",
  memberDesc: "",
  memberImage: "uploads/members/ali.png",
};
const orderId = "64ab12345678901234567805";
const order = {
  _id: orderId,
  orderStatus: "PAUSE",
  orderTotal: 22,
  orderDelivery: 5,
  createdAt: "2026-11-25T01:00:00.000Z",
  updatedAt: "2026-11-25T01:00:00.000Z",
};
const orderItems = [{
  _id: "64ab12345678901234567806", productId: riceId, itemQuantity: 1, itemPrice: 17,
}];
let storedOrders: (typeof order)[];
let createGate: Promise<void> | null;
let failOrderCreation: boolean;
let catalog: typeof rice[];
let failNextMenuRequest: boolean;
let signedIn: typeof account | null;
const fetchBurak = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(async (input, init) => {
  const { pathname, searchParams } = new URL(input, "http://localhost");
  if (pathname === "/api/product/all") {
    const limit = Number(searchParams.get("limit"));
    if (limit === 8 && failNextMenuRequest) {
      failNextMenuRequest = false;
      return new Response(null, { status: 503 });
    }
    const page = Number(searchParams.get("page"));
    const collection = searchParams.get("productCollection");
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const matches = catalog.filter((product) =>
      (!collection || product.productCollection === collection) &&
      product.productName.toLowerCase().includes(search),
    );
    return Response.json(matches.slice((page - 1) * limit, page * limit));
  }
  if (pathname === `/api/product/${riceId}`) return Response.json(rice);
  if (pathname === "/api/member/top-users") {
    return Response.json([{ _id: "64ab12345678901234567803", memberNick: "Ali" }]);
  }
  if (pathname === "/api/member/detail") {
    return signedIn ? Response.json(signedIn) : new Response(null, { status: 401 });
  }
  if (pathname === "/api/member/login" && init?.method === "POST") {
    signedIn = account;
    return Response.json({ member: account });
  }
  if (pathname === "/api/member/logout" && init?.method === "POST") {
    signedIn = null;
    return new Response(null, { status: 204 });
  }
  if (pathname === "/api/member/update" && init?.method === "POST" && signedIn) {
    const { memberNick } = JSON.parse(String(init.body));
    signedIn = { ...signedIn, memberNick };
    return Response.json(signedIn);
  }
  if (pathname === "/api/member/restaurant") {
    return Response.json({ ...account, memberNick: "Restaurant contact" });
  }
  if (pathname.startsWith("/api/order/") && !signedIn) return new Response(null, { status: 401 });
  if (pathname === "/api/order/create" && init?.method === "POST") {
    await createGate;
    if (failOrderCreation) return new Response(null, { status: 503 });
    storedOrders = [order];
    return Response.json(order, { status: 201 });
  }
  if (pathname === "/api/order/all") {
    const limit = Number(searchParams.get("limit"));
    const page = Number(searchParams.get("page"));
    return Response.json(storedOrders
      .filter((value) => value.orderStatus === searchParams.get("orderStatus"))
      .slice((page - 1) * limit, page * limit)
      .map((value) => ({ ...value, orderItems, productData: [rice] })));
  }
  if (pathname === "/api/order/update" && init?.method === "POST") {
    const { orderId: id, orderStatus } = JSON.parse(String(init.body));
    const current = storedOrders.find((value) => value["_id"] === id);
    if (!current) return new Response(null, { status: 404 });
    const saved = { ...current, orderStatus };
    storedOrders = storedOrders.map((value) => value["_id"] === id ? saved : value);
    return Response.json(saved);
  }
  return new Response(null, { status: 404 });
});

beforeEach(() => {
  localStorage.clear();
  catalog = [rice, { ...rice, _id: "64ab12345678901234567802" }];
  failNextMenuRequest = false;
  storedOrders = [];
  failOrderCreation = false;
  createGate = null;
  signedIn = null;
  fetchBurak.mockClear();
  vi.stubGlobal("fetch", fetchBurak);
});
afterEach(() => vi.unstubAllGlobals());
function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
test("home page renders dishes and active members from Burak", async () => {
  open("/");
  expect(screen.getByText("World's Most Delicious Cousine")).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  expect(await screen.findAllByRole("heading", { name: "Kebuli Rice" })).toHaveLength(4);
  expect(await screen.findByText("Ali")).toBeVisible();
});
test("menu search, empty categories and basket quantity work", async () => {
  open("/products");
  fireEvent.change(screen.getByRole("textbox", { name: "Search products" }), {
    target: { value: "Kebuli" },
  });
  fireEvent.click(screen.getByRole("button", { name: /SEARCH/ }));
  expect(await screen.findAllByRole("button", { name: "Add Kebuli Rice to basket" })).toHaveLength(2);
  const addRice = screen.getAllByRole("button", { name: "Add Kebuli Rice to basket" })[0];
  await waitFor(() => expect(addRice).toBeEnabled());
  fireEvent.click(addRice);
  fireEvent.click(screen.getByRole("link", { name: "Basket (1)" }));
  expect(screen.getByRole("heading", { name: "Your basket" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Increase Kebuli Rice" }));
  expect(JSON.parse(localStorage.getItem("burak-page-basket-v1")!)[0].quantity).toBe(2);
  expect(screen.getByRole("button", { name: "Increase Kebuli Rice" })).toBeDisabled();
  fireEvent.click(screen.getByRole("link", { name: "Close basket" }));
  fireEvent.click(screen.getByRole("button", { name: "DRINK" }));
  expect(await screen.findByText("No products found")).toBeInTheDocument();
});
test("the menu retries a failed backend request", async () => {
  failNextMenuRequest = true;
  open("/products");
  expect(await screen.findByRole("heading", { name: "Could not load products" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findAllByRole("button", { name: "Add Kebuli Rice to basket" })).toHaveLength(2);
});
test("the menu fetches the next page and retains its sort", async () => {
  catalog = Array.from({ length: 9 }, (_, index) => ({
    ...rice,
    _id: String(index + 1).padStart(24, "0"),
    productName: `Menu item ${index + 1}`,
  }));
  open("/products?sort=productPrice");
  fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
  expect(await screen.findByRole("heading", { name: "Menu item 9" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Menu item 1" })).not.toBeInTheDocument();
  expect(fetchBurak.mock.calls.some(([url]) => {
    const query = new URL(url, "http://localhost").searchParams;
    return query.get("page") === "2" && query.get("order") === "productPrice";
  })).toBe(true);
});
test("both headers share basket quantities and prompt guests to log in before checkout", async () => {
  open("/");
  const homeBasketButton = screen.getByRole("button", { name: "Shopping basket" });
  homeBasketButton.focus();
  fireEvent.click(homeBasketButton);
  let basket = await screen.findByRole("dialog", { name: "Your basket" });
  expect(await within(basket).findByText("Your basket is empty.")).toBeVisible();

  fireEvent.keyDown(basket, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(homeBasketButton).toHaveFocus());
  fireEvent.click(screen.getAllByRole("link", { name: "Products" })[0]);

  const addRice = (await screen.findAllByRole("button", { name: "Add Kebuli Rice to basket" }))[0];
  fireEvent.click(addRice);
  fireEvent.click(screen.getByRole("button", { name: "Shopping basket (1)" }));
  basket = await screen.findByRole("dialog", { name: "Your basket" });
  expect(within(basket).getByText("Total $20.00")).toBeVisible();
  fireEvent.click(within(basket).getByRole("button", { name: "Increase Kebuli Rice" }));
  expect(within(basket).getByText("Total $35.00")).toBeVisible();
  fireEvent.click(within(basket).getByRole("button", { name: "Decrease Kebuli Rice" }));
  expect(within(basket).getByText("Total $20.00")).toBeVisible();
  fireEvent.click(within(basket).getByRole("button", { name: "Clear basket" }));
  expect(within(basket).getByText("Your basket is empty.")).toBeVisible();
  expect(localStorage.getItem("burak-page-basket-v1")).toBe("[]");

  fireEvent.click(within(basket).getByRole("button", { name: "Close basket" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(addRice);
  fireEvent.click(screen.getByRole("button", { name: "Shopping basket (1)" }));
  basket = await screen.findByRole("dialog", { name: "Your basket" });
  fireEvent.click(within(basket).getByRole("button", { name: "Log in to place order" }));
  expect(await screen.findByRole("dialog", { name: "Log in" })).toBeVisible();
  expect(localStorage.getItem("burak-page-basket-v1")).toBe(JSON.stringify([{ id: riceId, quantity: 1 }]));
  expect(fetchBurak.mock.calls.some(([url]) => url === "/api/order/create")).toBe(false);
});
test("imports the original CRA cart and applies free shipping when eligible", async () => {
  localStorage.setItem("cartData", JSON.stringify([{ _id: riceId, quantity: 1 }]));
  catalog = [{ ...rice, productPrice: 100 }];
  open("/");
  fireEvent.click(await screen.findByRole("button", { name: "Shopping basket (1)" }));
  const basket = await screen.findByRole("dialog", { name: "Your basket" });
  expect(within(basket).getByText("Free shipping", { exact: true })).toBeVisible();
  expect(within(basket).getByText("Total $100.00")).toBeVisible();
  expect(JSON.parse(localStorage.getItem("burak-page-basket-v1")!)).toEqual([
    { id: riceId, quantity: 1 },
  ]);
});
test("product details from Burak add the backend product ID to the shared basket", async () => {
  open(`/products/${riceId}`);
  const add = await screen.findByRole("button", { name: "ADD TO BASKET" });
  await waitFor(() => expect(add).toBeEnabled());
  expect(screen.getByText(rice.productDesc)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show photo 2" }));
  expect(screen.getByRole("img", { name: "Kebuli Rice, photo 2 of 2" })).toHaveAttribute(
    "src", "/uploads/products/kebuli-detail.jpg",
  );
  expect(await screen.findByText("Restaurant contact")).toBeVisible();
  expect(fetchBurak).toHaveBeenCalledWith(`/api/product/${riceId}`, expect.any(Object));
  fireEvent.click(add);
  expect(screen.getByText(/Added to basket/)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("burak-page-basket-v1")!)).toEqual([
    { id: riceId, quantity: 1 },
  ]);
});
test("checkout places one order, clears the basket on success and loads server totals", async () => {
  signedIn = account;
  localStorage.setItem("cartData", JSON.stringify([{ _id: riceId, quantity: 1 }]));
  let finishCheckout!: () => void;
  createGate = new Promise<void>((resolve) => { finishCheckout = resolve; });
  open("/products?basket=1");
  const place = await screen.findByRole("button", { name: "Place order" });
  await waitFor(() => expect(place).toBeEnabled());
  fireEvent.click(place);
  expect(screen.getByRole("button", { name: "Placing order…" })).toBeDisabled();
  fireEvent.click(place);
  const calls = fetchBurak.mock.calls.filter(([url]) => url === "/api/order/create");
  expect(calls).toHaveLength(1);
  expect(calls[0][1]).toMatchObject({
    method: "POST", credentials: "include",
    body: JSON.stringify([{ productId: riceId, itemQuantity: 1 }]),
  });
  expect(localStorage.getItem("burak-page-basket-v1")).toBe(JSON.stringify([{ id: riceId, quantity: 1 }]));
  finishCheckout();
  expect(await screen.findByRole("tab", { name: "Paused Order" })).toBeVisible();
  expect(await screen.findByRole("heading", { name: "Kebuli Rice" })).toBeVisible();
  expect(screen.getByText("$22.00")).toBeVisible();
  expect(localStorage.getItem("burak-page-basket-v1")).toBe("[]");
});
test("an unconfirmed checkout preserves the basket and does not retry the POST", async () => {
  signedIn = account;
  failOrderCreation = true;
  localStorage.setItem("cartData", JSON.stringify([{ _id: riceId, quantity: 1 }]));
  open("/products?basket=1");
  const place = await screen.findByRole("button", { name: "Place order" });
  await waitFor(() => expect(place).toBeEnabled());
  fireEvent.click(place);
  expect(await screen.findByRole("alert")).toHaveTextContent(/Could not confirm the order/);
  expect(localStorage.getItem("burak-page-basket-v1")).toBe(JSON.stringify([{ id: riceId, quantity: 1 }]));
  expect(fetchBurak.mock.calls.filter(([url]) => url === "/api/order/create")).toHaveLength(1);
});
test("an authenticated member processes and completes an order without a payment charge", async () => {
  signedIn = account;
  storedOrders = [order];
  open("/orders");
  fireEvent.click(await screen.findByRole("button", { name: "Start processing" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirm processing" }));
  expect(await screen.findByRole("tab", { name: "Process Order", selected: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.click(await screen.findByRole("button", { name: "Mark as received" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirm receipt" }));
  expect(await screen.findByRole("tab", { name: "Finished Orders", selected: true })).toBeVisible();
  expect(await screen.findByRole("heading", { name: "Kebuli Rice" })).toBeVisible();
  expect(fetchBurak.mock.calls.filter(([url]) => url === "/api/order/update").map(([, init]) => init?.body))
    .toEqual([
      JSON.stringify({ orderId, orderStatus: "PROCESS" }),
      JSON.stringify({ orderId, orderStatus: "FINISH" }),
    ]);
});
test("cancelling a paused order persists the cancellation and refreshes the list", async () => {
  signedIn = account;
  storedOrders = [order];
  open("/orders");
  fireEvent.click(await screen.findByRole("button", { name: "Cancel order" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirm cancellation" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Kebuli Rice" })).not.toBeInTheDocument());
  expect(storedOrders[0]?.orderStatus).toBe("DELETE");
});
test("guests cannot load or change another member's orders", async () => {
  open("/orders");
  expect(await screen.findByText("Log in to view your orders.")).toBeVisible();
  expect(within(screen.getByRole("main")).getByRole("button", { name: "Log in" })).toBeVisible();
  expect(fetchBurak.mock.calls.some(([url]) => url.startsWith("/api/order/"))).toBe(false);
});
test("guest profile edits are persisted in the browser", async () => {
  open("/member-page");
  fireEvent.change(await screen.findByLabelText("Nickname"), { target: { value: "Ali" } });
  fireEvent.click(screen.getByRole("button", { name: "SAVE" }));
  expect(screen.getByRole("heading", { name: "Ali" })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("burak-profile-v1")!).name).toBe("Ali");
});
test("logs in from the navbar, saves to the member API, and logs out", async () => {
  open("/member-page");
  const login = await screen.findByRole("button", { name: "Login" });
  await waitFor(() => expect(login).toBeEnabled());
  fireEvent.click(login);
  const dialog = await screen.findByRole("dialog", { name: "Log in" });
  fireEvent.change(within(dialog).getByLabelText(/Nickname/), { target: { value: "Ali" } });
  fireEvent.change(within(dialog).getByLabelText(/Password/), { target: { value: "test-pass" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Log in" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(await screen.findByRole("button", { name: "Account for Ali" })).toBeVisible();
  fireEvent.change(screen.getByLabelText("Nickname"), { target: { value: "Ali Updated" } });
  fireEvent.click(screen.getByRole("button", { name: "SAVE" }));
  expect(await screen.findByRole("heading", { name: "Ali Updated" })).toBeVisible();
  expect(localStorage.getItem("burak-profile-v1")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Account for Ali Updated" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Log out" }));
  expect(await screen.findByRole("button", { name: "Login" })).toBeVisible();
});
test("FAQ expands and contact does not claim a message was sent", () => {
  open("/help");
  fireEvent.click(screen.getByRole("button", { name: /How long does delivery/ }));
  expect(screen.getByText(/Delivery time depends/)).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "CONTACT" }));
  fireEvent.change(screen.getByLabelText("Ism"), { target: { value: "Ali" } });
  fireEvent.change(screen.getByLabelText("Elektron Manzil"), {
    target: { value: "ali@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Xabar", { exact: true }), { target: { value: "Hello" } });
  fireEvent.click(screen.getByRole("button", { name: "SEND" }));
  expect(screen.getByText(/Your message has not been sent/)).toBeVisible();
});
