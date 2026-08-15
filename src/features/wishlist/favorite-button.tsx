"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWishlistStore, type WishlistItem } from "@/stores/wishlist-store";

export function FavoriteButton({
  item,
  className = "",
}: {
  item: WishlistItem;
  className?: string;
}) {
  const t = useTranslations("wishlist");
  const liked = useWishlistStore((state) =>
    state.items.some((entry) => entry.productId === item.productId),
  );
  const toggleItem = useWishlistStore((state) => state.toggleItem);

  return (
    <button
      aria-label={
        liked ? t("removeFromWishlist") : t("addToWishlist")
      }
      aria-pressed={liked}
      className={`bg-background/90 grid size-10 place-items-center rounded-full border shadow-sm transition hover:scale-105 ${className} cursor-pointer`}
      onClick={() => toggleItem(item)}
      type="button"
    >
      <Heart className={`size-5 ${liked ? "fill-red-600 text-red-600" : ""}`} />
    </button>
  );
}
