import {
  ArrowRight,
  BadgeCheck,
  Bike,
  ChevronRight,
  Headphones,
  PackageCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { HomeHeroCarousel } from "@/features/storefront/home-hero-carousel";
import { HomeProductCarousel } from "@/features/storefront/home-product-carousel";
import { absoluteUrl, localizedMetadata, serializeJsonLd } from "@/lib/seo";
import { getHomeCatalog } from "@/server/repositories/storefront-catalog";

const homeSeo = {
  uz: {
    title: "Mototsikllar va ehtiyot qismlar",
    description:
      "Mototsikllar, ehtiyot qismlar, aksessuarlar va himoya jihozlarini Motobike Market’dan toping.",
  },
  ru: {
    title: "Мотоциклы и запчасти",
    description: "Мотоциклы, запчасти, аксессуары и экипировка.",
  },
  en: {
    title: "Motorcycles and parts",
    description: "Motorcycles, parts, accessories and riding gear.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as keyof typeof homeSeo;
  return localizedMetadata({ locale, ...homeSeo[locale] });
}

function Sprite({ index }: { index: number }) {
  return (
    <div
      aria-hidden="true"
      className="home-product-sprite"
      style={{ backgroundPosition: `${index * 20}% center` }}
    />
  );
}

export default async function HomePage() {
  await connection();
  const { categories, motorcycles, parts, gear, accessories } = await getHomeCatalog();
  const allFeatured = [...motorcycles, ...parts, ...gear, ...accessories];
  const locale = (await getLocale()) as "uz" | "ru" | "en";
  const localeEnum = locale.toUpperCase();
  const t = await getTranslations("home");

  const categoryFallbacks = [
    [t("categories.motorcycles").replace(/^(Barcha|Все|All)\s+/i, ""), t("categories.motorcycles")],
    [t("categories.parts").replace(/^(Barcha|Все|All)\s+/i, ""), t("categories.parts")],
    [t("categories.accessories").replace(/^(Barcha|Все|All)\s+/i, ""), t("categories.accessories")],
    [t("categories.gear").replace(/^(Barcha|Все|All)\s+/i, ""), t("categories.gear")],
  ];

  const trustItems = [
    [ShieldCheck, t("trust.paymentsTitle"), t("trust.paymentsText")],
    [BadgeCheck, t("trust.brandsTitle"), t("trust.brandsText")],
    [Headphones, t("trust.supportTitle"), t("trust.supportText")],
    [PackageCheck, t("trust.expertizaTitle"), t("trust.expertizaText")],
  ] as const;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Motobike Market",
      url: absoluteUrl("/"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Motobike Market",
      url: absoluteUrl("/"),
      inLanguage: locale,
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/catalog")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <div className="bg-[#f7f7f6] text-[#111]">
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        type="application/ld+json"
      />

      <HomeHeroCarousel />

      <div className="relative z-20 container -mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categoryFallbacks.map(([fallbackName, subtitle], index) => {
          const category = categories[index];
          const translation = category?.translations.find(
            (item) => item.locale === localeEnum,
          );
          const uz = category?.translations.find(
            (item) => item.locale === "UZ",
          );
          return (
            <Reveal
              className="h-full"
              delay={index * 0.08}
              direction={index % 2 ? "left" : "right"}
              key={fallbackName}
            >
              <Link
                className="group relative flex h-28 overflow-hidden rounded-md border border-zinc-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-lg"
                href={
                  category
                    ? `/categories/${translation?.slug ?? uz?.slug}`
                    : "/catalog"
                }
              >
                <div className="relative z-10 max-w-[55%]">
                  <h2 className="text-base font-extrabold capitalize">
                    {translation?.name ?? fallbackName}
                  </h2>
                  <p className="mt-2 flex items-center text-[11px] text-zinc-500">
                    {subtitle} <ChevronRight className="size-3" />
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-7 h-28 w-36 transition duration-500 group-hover:scale-110 group-hover:-rotate-2">
                  <Sprite index={index === 0 ? 5 : Math.min(index + 2, 5)} />
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* 1. Ommabop mahsulotlar Carousel */}
      <HomeProductCarousel
        title={t("popularTitle")}
        viewAllLink="/catalog"
        products={allFeatured}
      />

      {/* 2. Tavsiya etilgan mototsikllar Carousel */}
      <HomeProductCarousel
        title={t("motorcyclesTitle")}
        viewAllLink="/catalog?type=MOTORCYCLE"
        products={motorcycles}
      />

      {/* 3. Moylar va ehtiyot qismlar Carousel */}
      <HomeProductCarousel
        title={t("partsTitle")}
        viewAllLink="/catalog?type=PART"
        products={parts}
      />

      {/* 4. Ekipirovka va aksessuarlar Carousel */}
      <HomeProductCarousel
        title={t("gearTitle")}
        viewAllLink="/catalog?type=GEAR"
        products={[...gear, ...accessories]}
      />

      <section className="container grid gap-4 pb-7 lg:grid-cols-[1.15fr_0.95fr]">
        <Reveal direction="right">
          <div className="grid h-full gap-5 rounded-md border border-zinc-200 bg-white px-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(([Icon, title, text], index) => (
              <div
                className="flex items-start gap-3 transition duration-300 hover:-translate-y-1"
                key={title}
                style={{ transitionDelay: `${index * 35}ms` }}
              >
                <Icon className="mt-0.5 size-7 shrink-0" strokeWidth={1.6} />
                <div>
                  <strong className="block text-[11px] leading-4">
                    {title}
                  </strong>
                  <p className="mt-1 text-[10px] text-zinc-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal direction="left">
          <div className="home-editorial group relative h-full overflow-hidden rounded-md px-7 py-5 text-white transition-shadow hover:shadow-2xl">
            <p className="text-[9px] font-bold tracking-wider text-red-500 uppercase">
              {t("editorial.badge")}
            </p>
            <h2 className="mt-1 text-2xl font-black">{t("editorial.title")}</h2>
            <p className="text-xs text-white/65">
              {t("editorial.subtitle")}
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-2 rounded border border-white/60 px-3 py-1 text-[10px] transition hover:bg-white hover:text-black"
              href="/catalog"
            >
              {t("editorial.button")} <ArrowRight className="size-3" />
            </Link>
            <Bike className="absolute right-12 bottom-5 size-20 text-red-600/70 transition duration-500 group-hover:-translate-x-3" />
            <Send className="absolute right-6 bottom-5 size-5 text-white/30 transition group-hover:translate-x-2 group-hover:-translate-y-2" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
