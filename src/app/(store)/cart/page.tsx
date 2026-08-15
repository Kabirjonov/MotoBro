import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CartPage } from "@/features/cart/cart-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default function Page() {
  return <CartPage />;
}
