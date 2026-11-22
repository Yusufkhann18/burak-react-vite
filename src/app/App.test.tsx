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
  return new Response(null, { status: 404 });
});

beforeEach(() => {
  localStorage.clear();
  catalog = [rice, { ...rice, _id: "64ab12345678901234567802" }];
  failNextMenuRequest = false;
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
test("both headers open the shared basket with live quantities and an order link", async () => {
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
  fireEvent.click(within(basket).getByRole("link", { name: "Order" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("tab", { name: "Paused Order" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Your basket" })).toBeVisible();
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
test("order preview moves between states without charging payment", () => {
  open("/orders");
  fireEvent.click(screen.getAllByRole("button", { name: "PAYMENT" })[0]);
  expect(screen.getByRole("tab", { name: "Process Order" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByText(/No payment was charged/)).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "VERIFY TO FULFIL" })[0]);
  expect(screen.getByRole("tab", { name: "Finished Orders" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
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
