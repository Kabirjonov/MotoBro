// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { PurchasePanel } from "@/features/storefront/purchase-panel";
import { useCartStore } from "@/stores/cart-store";

describe("accessible cart interactions", () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [] });
  });

  it("adds a bounded quantity and announces success", async () => {
    const user = userEvent.setup();
    render(
      <PurchasePanel
        name="QA helmet"
        price="100.00"
        productId="p1"
        sku="QA-1"
        stock={2}
      />,
    );
    await user.click(
      screen.getAllByRole("button", { name: "Miqdorni oshirish" })[0]!,
    );
    await user.click(
      screen.getAllByRole("button", { name: "Savatga qo‘shish" })[0]!,
    );
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
    expect(screen.getAllByRole("button", { name: /O‘tish/ })[0]).toBeInTheDocument();
  });

  it("disables purchase when stock is zero", () => {
    render(
      <PurchasePanel
        name="Unavailable"
        price="100.00"
        productId="p2"
        sku="QA-2"
        stock={0}
      />,
    );
    const button = screen.getAllByRole("button", { name: /Sotuvda yo‘q/ })[0]!;
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
