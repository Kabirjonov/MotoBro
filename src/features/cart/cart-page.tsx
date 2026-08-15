"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatDecimalMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

import { calculateStoredCartSubtotal } from "./cart-summary";

export function CartPage() {
  const t = useTranslations("cart");
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.removeItem);

  if (!items.length)
    return (
      <div className="container grid min-h-[65vh] place-items-center py-12 text-center">
        <div>
          <h1 className="text-3xl font-black">{t("empty")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("emptySubtitle")}
          </p>
          <Link className={cn(buttonVariants(), "mt-6")} href="/catalog">
            {t("goToCatalog")}
          </Link>
        </div>
      </div>
    );

  const subtotal = calculateStoredCartSubtotal(items);
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-black">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">
        {t("disclaimer")}
      </p>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="grid gap-4">
          {items.map((item) => (
            <li
              className="bg-card grid grid-cols-[5rem_1fr] gap-4 rounded-2xl border p-4 sm:grid-cols-[7rem_1fr_auto]"
              key={item.productId}
            >
              {item.imageUrl ? (
                <Image
                  alt=""
                  className="aspect-square rounded-xl object-cover"
                  height={112}
                  src={item.imageUrl}
                  width={112}
                />
              ) : (
                <div className="bg-muted aspect-square rounded-xl" />
              )}
              <div>
                <h2 className="font-black">{item.name}</h2>
                <p className="text-muted-foreground text-xs">{item.sku}</p>
                <p className="text-primary mt-2 font-bold">
                  {formatDecimalMoney(item.price, "UZS")}
                </p>
                <div className="mt-3 flex w-fit items-center rounded-lg border">
                  <button
                    aria-label={t("decrease")}
                    className="grid size-9 place-items-center cursor-pointer"
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      setQuantity(item.productId, item.quantity - 1)
                    }
                    type="button"
                  >
                    <Minus className="size-4" />
                  </button>
                  <output className="w-9 text-center font-bold">
                    {item.quantity}
                  </output>
                  <button
                    aria-label={t("increase")}
                    className="grid size-9 place-items-center cursor-pointer"
                    disabled={item.quantity >= item.stock}
                    onClick={() =>
                      setQuantity(item.productId, item.quantity + 1)
                    }
                    type="button"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <button
                aria-label={`${t("remove")} ${item.name}`}
                className="text-destructive self-start p-2 cursor-pointer"
                onClick={() => remove(item.productId)}
                type="button"
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
        <aside className="bg-card sticky top-24 rounded-2xl border p-5">
          <h2 className="text-xl font-black">{t("summary")}</h2>
          <div className="mt-4 flex justify-between">
            <span>{t("subtotal")}</span>
            <strong>{formatDecimalMoney(subtotal, "UZS")}</strong>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {t("deliveryEstimate")}
          </p>
          <Link
            className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}
            href="/checkout"
          >
            {t("checkout")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
