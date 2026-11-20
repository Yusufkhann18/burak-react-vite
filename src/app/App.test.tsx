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
  productImages: ["uploads/products/kebuli-rice.jpg"],
  productViews: 24,
  createdAt: "2026-09-01T00:00:00.000Z",
};
const fetchBurak = vi.fn<(input: string) => Promise<Response>>(async (input) => {
  const { pathname } = new URL(input, "http://localhost");
  if (pathname === "/api/product/all") {
    return Response.json([rice, { ...rice, _id: "64ab12345678901234567802" }]);
  }
  if (pathname === `/api/product/${riceId}`) return Response.json(rice);
  if (pathname === "/api/member/top-users") {
    return Response.json([{ _id: "64ab12345678901234567803", memberNick: "Ali" }]);
  }
  return new Response(null, { status: 404 });
});

beforeEach(() => {
  localStorage.clear();
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
  fireEvent.click(screen.getAllByRole("button", { name: "Add Kebuli Rice to basket" })[0]);
  fireEvent.click(screen.getByRole("link", { name: "Basket (1)" }));
  expect(screen.getByRole("heading", { name: "Your basket" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Increase Kebuli Rice" }));
  expect(JSON.parse(localStorage.getItem("burak-page-basket-v1")!)[0].quantity).toBe(2);
  expect(screen.getByRole("button", { name: "Increase Kebuli Rice" })).toBeDisabled();
  fireEvent.click(screen.getByRole("link", { name: "Close basket" }));
  fireEvent.click(screen.getByRole("button", { name: "DRINK" }));
  expect(screen.getByText("No products found")).toBeInTheDocument();
});
test("the menu retries a failed backend request", async () => {
  fetchBurak.mockResolvedValueOnce(new Response(null, { status: 503 }));
  open("/products");
  expect(await screen.findByRole("heading", { name: "Could not load products" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findAllByRole("button", { name: "Add Kebuli Rice to basket" })).toHaveLength(2);
});
test("both headers open the shared basket with live quantities and an order link", async () => {
  open("/");
  const homeBasketButton = screen.getByRole("button", { name: "Shopping basket" });
  homeBasketButton.focus();
  fireEvent.click(homeBasketButton);
  let basket = await screen.findByRole("dialog", { name: "Your basket" });
  expect(within(basket).getByText("Your basket is empty.")).toBeVisible();

  fireEvent.keyDown(basket, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(homeBasketButton).toHaveFocus());
  fireEvent.click(screen.getAllByRole("link", { name: "Products" })[0]);

  const addRice = (await screen.findAllByRole("button", { name: "Add Kebuli Rice to basket" }))[0];
  fireEvent.click(addRice);
  fireEvent.click(screen.getByRole("button", { name: "Shopping basket (1)" }));
  basket = await screen.findByRole("dialog", { name: "Your basket" });
  expect(within(basket).getByText("Total $15")).toBeVisible();
  fireEvent.click(within(basket).getByRole("button", { name: "Increase Kebuli Rice" }));
  expect(within(basket).getByText("Total $30")).toBeVisible();
  fireEvent.click(within(basket).getByRole("button", { name: "Decrease Kebuli Rice" }));
  expect(within(basket).getByText("Total $15")).toBeVisible();
  fireEvent.click(within(basket).getByRole("button", { name: "Remove Kebuli Rice" }));
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
test("product details from Burak add the backend product ID to the shared basket", async () => {
  open(`/products/${riceId}`);
  const add = await screen.findByRole("button", { name: "ADD TO BASKET" });
  await waitFor(() => expect(add).toBeEnabled());
  expect(screen.getByText(rice.productDesc)).toBeVisible();
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
test("profile edits are persisted and reflected in the profile card", () => {
  open("/member-page");
  fireEvent.change(screen.getByLabelText("Nickname"), { target: { value: "Ali" } });
  fireEvent.click(screen.getByRole("button", { name: "SAVE" }));
  expect(screen.getByRole("heading", { name: "Ali" })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("burak-profile-v1")!).name).toBe("Ali");
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
