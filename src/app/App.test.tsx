import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { beforeEach, test, expect } from "vitest";
beforeEach(() => localStorage.clear());
function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
test("home page and shared footer render inside the router", () => {
  open("/");
  expect(screen.getByText("World's Most Delicious Cousine")).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
});
test("menu search, empty categories and basket quantity work", () => {
  open("/products");
  fireEvent.change(screen.getByRole("textbox", { name: "Search products" }), {
    target: { value: "Kebuli" },
  });
  fireEvent.click(screen.getByRole("button", { name: /SEARCH/ }));
  expect(screen.getAllByRole("button", { name: "Add Kebuli Rice to basket" })).toHaveLength(2);
  fireEvent.click(screen.getAllByRole("button", { name: "Add Kebuli Rice to basket" })[0]);
  fireEvent.click(screen.getByRole("link", { name: "Shopping basket" }));
  expect(screen.getByRole("heading", { name: "Your basket" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Increase Kebuli Rice" }));
  expect(JSON.parse(localStorage.getItem("burak-page-basket-v1")!)[0].quantity).toBe(2);
  fireEvent.click(screen.getByRole("link", { name: "Close basket" }));
  fireEvent.click(screen.getByRole("button", { name: "DRINK" }));
  expect(screen.getByText("No products found")).toBeInTheDocument();
});
test("product details add to the shared basket", () => {
  open("/products/rice");
  fireEvent.click(screen.getByRole("button", { name: "ADD TO BASKET" }));
  expect(screen.getByText(/Added to basket/)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("burak-page-basket-v1")!)).toEqual([
    { id: "rice", quantity: 1 },
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
