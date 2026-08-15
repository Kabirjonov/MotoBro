"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("errorPage");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error({ name: error.name, digest: error.digest });
  }, [error]);

  return (
    <main className="container flex min-h-[70svh] items-center justify-center py-16">
      <div className="max-w-lg text-center">
        <p className="text-primary text-sm font-bold uppercase">{t("badge")}</p>
        <h1 className="mt-3 text-3xl font-black">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-4">
          {t("description")}
        </p>
        <Button className="mt-8 cursor-pointer" onClick={unstable_retry} type="button">
          {tCommon("retry")}
        </Button>
      </div>
    </main>
  );
}
