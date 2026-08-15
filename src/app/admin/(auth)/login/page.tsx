import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminLoginForm } from "@/features/admin-auth/login-form";
import { getSafeInternalRedirect } from "@/schemas/auth";
import { getCurrentAdmin } from "@/server/auth/authorization";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return {
    robots: { follow: false, index: false },
    title: t("metadataTitle"),
  };
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/admin");
  }

  const { redirectTo } = await searchParams;
  const safeRedirect = getSafeInternalRedirect(redirectTo);
  const t = await getTranslations("auth.login");

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <section
        aria-labelledby="login-title"
        className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-xl sm:p-8"
      >
        <p className="text-primary text-sm font-bold tracking-[0.16em] uppercase">
          {t("protectedBadge")}
        </p>
        <h1 className="mt-3 text-3xl font-black" id="login-title">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {t("subtitle")}
        </p>
        <AdminLoginForm redirectTo={safeRedirect} />
      </section>
    </main>
  );
}
