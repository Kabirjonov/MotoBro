import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="container flex min-h-[70svh] items-center justify-center py-16">
      <div className="max-w-lg text-center">
        <p className="text-primary text-sm font-bold uppercase">404</p>
        <h1 className="mt-3 text-3xl font-black">{t("title")}</h1>
        <p className="text-muted-foreground mt-4">
          {t("description")}
        </p>
        <Button asChild className="mt-8">
          <Link href="/">{t("backToHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
