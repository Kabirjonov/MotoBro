"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { useCartStore } from "@/stores/cart-store";

export function MiniCart() {
  const t = useTranslations("cart");
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      aria-label={t("miniCartAriaLabel", { count })}
      className="focus-visible:ring-ring relative grid size-10 place-items-center rounded-md text-white outline-none transition hover:bg-white/10 focus-visible:ring-2"
      href="/cart"
    >
      <ShoppingCart className="size-5" />
      {count > 0 ? (
        <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 min-w-5 rounded-full px-1 text-center text-[10px] leading-5 font-black">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
