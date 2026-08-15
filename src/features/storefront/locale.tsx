"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";

import { type AppLocale, isAppLocale, localePath } from "@/i18n/routing";

function persistLocaleCookie(locale: AppLocale) {
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function StoreLocaleSwitcher({
  localizedPaths,
  variant = "select",
}: {
  localizedPaths?: Partial<Record<AppLocale, string>>;
  variant?: "buttons" | "compact" | "select";
}) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("locale");
  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (!saved || !isAppLocale(saved) || saved === locale) return;
    persistLocaleCookie(saved);
    window.location.reload();
  }, [locale]);
  function update(next: AppLocale) {
    localStorage.setItem("locale", next);
    persistLocaleCookie(next);
    startTransition(() => {
      const target = localizedPaths?.[next] ?? localePath(next, pathname);
      window.location.href = target;
    });
  }
  if (variant === "compact")
    return (
      <div
        aria-label={t("label")}
        className="flex items-center gap-3"
        role="group"
      >
        {(["uz", "ru", "en"] as const).map((item) => (
          <button
            aria-pressed={item === locale}
            className={
              item === locale
                ? "border-b-2 border-red-600 py-2 text-white"
                : "py-2 text-white/55 hover:text-white"
            }
            disabled={pending}
            key={item}
            onClick={() => update(item)}
            type="button"
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    );
  if (variant === "buttons")
    return (
      <div aria-label={t("label")} className="flex gap-1" role="group">
        {(["uz", "ru", "en"] as const).map((item) => (
          <button
            aria-pressed={item === locale}
            className="aria-pressed:bg-primary aria-pressed:text-primary-foreground rounded-md border px-2 py-1 text-xs font-bold"
            disabled={pending || !localizedPaths?.[item]}
            key={item}
            onClick={() => update(item)}
            type="button"
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    );
  return (
    <label>
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        className="border-input bg-background ml-2 rounded-md border px-2 py-2 text-sm"
        disabled={pending}
        onChange={(event) => update(event.target.value as AppLocale)}
        value={locale}
      >
        {(["uz", "ru", "en"] as const).map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
