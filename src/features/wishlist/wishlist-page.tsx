"use client";

import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { formatStorefrontPrice } from "@/features/storefront/product-card";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export function WishlistPage() {
  const t = useTranslations("wishlist");
  const tCommon = useTranslations("common");
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const locale = useLocale().toUpperCase() as "UZ" | "RU" | "EN";
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);

  if (!mounted) {
    return <div className="container min-h-[50vh] py-12">{tCommon("loading")}</div>;
  }

  return (
    <main className="container min-h-[55vh] py-10 sm:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-black uppercase">
            {t("tagline")}
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {t("countProducts", { count: items.length })}
        </p>
      </div>

      {items.length === 0 ? (
        <section className="grid place-items-center rounded-2xl border border-dashed py-20 text-center">
          <Heart className="text-muted-foreground size-12" />
          <h2 className="mt-4 text-xl font-black">
            {t("empty")}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t("emptySubtitle")}
          </p>
          <Button asChild className="mt-6">
            <Link href="/catalog">{t("viewCatalog")}</Link>
          </Button>
        </section>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article
              className="bg-card overflow-hidden rounded-2xl border shadow-sm"
              key={item.productId}
            >
              <Link
                className="bg-muted relative block aspect-[4/3]"
                href={`/products/${item.slug}`}
              >
                {item.imageUrl ? (
                  <Image
                     alt={item.imageAlt}
                     className="object-cover"
                     fill
                     sizes="(max-width: 640px) 100vw, 33vw"
                     src={item.imageUrl}
                  />
                ) : null}
              </Link>
              <div className="grid gap-4 p-4">
                <div>
                  <Link
                    className="hover:text-primary line-clamp-2 text-lg font-black"
                    href={`/products/${item.slug}`}
                  >
                    {item.name}
                  </Link>
                  <p className="text-primary mt-2 font-black">
                    {formatStorefrontPrice(item.price, item.currency, locale)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 cursor-pointer"
                    disabled={item.stock <= 0}
                    onClick={() =>
                      addItem({
                        imageUrl: item.imageUrl,
                        name: item.name,
                        price: item.price,
                        productId: item.productId,
                        quantity: 1,
                        sku: item.sku,
                        stock: item.stock,
                      })
                    }
                    type="button"
                  >
                    <ShoppingCart className="size-4" />
                    {t("addToCart")}
                  </Button>
                  <Button
                    aria-label={t("removeFromWishlist")}
                    onClick={() => removeItem(item.productId)}
                    size="icon"
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
