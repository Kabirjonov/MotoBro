import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { WishlistPage } from "@/features/wishlist/wishlist-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishlist");
  return {
    title: t("title"),
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <WishlistPage />;
}
