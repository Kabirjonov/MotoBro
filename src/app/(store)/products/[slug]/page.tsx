import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/features/storefront/product-card";
import { ProductGallery } from "@/features/storefront/product-gallery";
import { InteractiveTabsSection } from "@/features/storefront/product-details-client";
import { PurchasePanel } from "@/features/storefront/purchase-panel";
import { SimilarProductsCarousel } from "@/features/storefront/similar-products-carousel";
import {
  Locale,
  ProductColor,
  ProductStatus,
  ProductType,
} from "@/generated/prisma/enums";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  productJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import {
  productDetailParamsSchema,
  productDetailQuerySchema,
} from "@/schemas/product-detail";
import { getCurrentAdmin } from "@/server/auth/authorization";
import { findActiveRedirect } from "@/server/repositories/redirect-repository";
import {
  getAdminPreviewProductDetail,
  getPublicProductDetail,
} from "@/server/repositories/storefront-product-detail";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; preview?: string }>;
};

async function load(props: Props) {
  const params = productDetailParamsSchema.safeParse(await props.params);
  const locale = await getLocale();
  const query = productDetailQuerySchema.parse({
    ...(await props.searchParams),
    lang: locale,
  });
  if (!params.success) return null;
  if (query.preview) {
    if (!(await getCurrentAdmin())) return null;
    const result = await getAdminPreviewProductDetail(
      params.data.slug,
      query.lang,
    );
    return result ? { ...result, preview: true } : null;
  }
  const result = await getPublicProductDetail(params.data.slug, query.lang);
  if (result) return { ...result, preview: false };
  const oldPath = `/products/${params.data.slug}`;
  const legacy = await findActiveRedirect(oldPath);
  if (legacy) {
    if (legacy.statusCode === "TEMPORARY_REDIRECT")
      redirect(legacy.destinationPath);
    permanentRedirect(legacy.destinationPath);
  }
  return null;
}

function selected<T extends { locale: Locale }>(
  translations: T[],
  locale: Locale,
) {
  return (
    translations.find((item) => item.locale === locale) ??
    translations.find((item) => item.locale === Locale.UZ) ??
    translations[0]
  );
}

function conditionLabel(condition: string | null) {
  if (!condition) return "—";
  return condition === "NEW"
    ? "Yangi"
    : condition === "USED"
      ? "Ishlatilgan"
      : condition;
}

const colorMeta: Record<ProductColor, { className: string; label: string }> = {
  BLACK: { className: "bg-neutral-950", label: "Qora" },
  BLUE: { className: "bg-blue-700", label: "Moviy" },
  BROWN: { className: "bg-amber-900", label: "Jigarrang" },
  GOLD: { className: "bg-yellow-500", label: "Tilla" },
  GRAY: { className: "bg-neutral-500", label: "Kulrang" },
  GREEN: { className: "bg-emerald-600", label: "Yashil" },
  MULTICOLOR: {
    className:
      "bg-[conic-gradient(#dc2626,#2563eb,#16a34a,#facc15,#dc2626)]",
    label: "Ko‘p rangli",
  },
  ORANGE: { className: "bg-orange-500", label: "Olovrang" },
  RED: { className: "bg-red-600", label: "Qizil" },
  SILVER: { className: "bg-zinc-300", label: "Kumush" },
  WHITE: { className: "bg-white", label: "Oq" },
  YELLOW: { className: "bg-yellow-300", label: "Sariq" },
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const data = await load(props);
  if (!data)
    return {
      title: (await getTranslations("metadata"))("notFound"),
      robots: { index: false, follow: false },
    };
  const translation = selected(data.product.translations, data.requestedLocale);
  const canonical = `/products/${translation?.slug}`;
  return {
    title: translation?.seoTitle || translation?.name,
    description:
      translation?.seoDescription || translation?.description.slice(0, 160),
    alternates: { canonical },
    robots:
      data.preview || data.product.status !== ProductStatus.ACTIVE
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      title: translation?.name,
      description:
        translation?.seoDescription || translation?.description.slice(0, 160),
      images: data.product.images[0]
        ? [
            {
              url: data.product.images[0].url,
              width: data.product.images[0].width,
              height: data.product.images[0].height,
              alt: data.product.images[0].altUz,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: translation?.name,
      description:
        translation?.seoDescription || translation?.description.slice(0, 160),
      images: data.product.images[0] ? [data.product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage(props: Props) {
  await connection();
  const data = await load(props);
  if (!data) notFound();
  const { product } = data;
  const translation = selected(product.translations, data.requestedLocale);
  const category = selected(
    product.category.translations,
    data.requestedLocale,
  );
  if (!translation) notFound();
  const localeCode =
    data.requestedLocale === Locale.RU
      ? "ru-RU"
      : data.requestedLocale === Locale.EN
        ? "en-US"
        : "uz-UZ";
  const price = new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency: product.currency,
    maximumFractionDigits: product.currency === "UZS" ? 0 : 2,
  }).format(Number(product.price));
  const images = product.images.map((image) => ({
    id: image.id,
    url: image.url,
    width: image.width,
    height: image.height,
    alt:
      (data.requestedLocale === Locale.RU
        ? image.altRu
        : data.requestedLocale === Locale.EN
          ? image.altEn
          : image.altUz) ?? image.altUz,
  }));
  const canonicalUrl = `/products/${translation.slug}`;
  const jsonLd = productJsonLd({
    name: translation.name,
    description: translation.description,
    sku: product.sku,
    images: product.images.map(({ url }) => url),
    brand: product.brand?.name,
    price: product.price,
    currency: product.currency,
    stock: product.stock,
    url: absoluteUrl(canonicalUrl),
  });
  const categorySlug = category?.slug;
  const breadcrumbLd = breadcrumbJsonLd([
    {
      name: "Motobike Market",
      url: absoluteUrl("/"),
    },
    {
      name: "Catalog",
      url: absoluteUrl("/catalog"),
    },
    ...(category && categorySlug
      ? [
          {
            name: category.name,
            url: absoluteUrl(`/categories/${categorySlug}`),
          },
        ]
      : []),
    { name: translation.name, url: absoluteUrl(canonicalUrl) },
  ]);
  const specRows: [string, string][] =
    product.type === ProductType.MOTORCYCLE && product.motorcycleSpec
      ? [
          ["Dvigatel hajmi", `${product.motorcycleSpec.engineCc} cc`],
          ["Marka", product.motorcycleSpec.make],
          ["Model", product.motorcycleSpec.model],
          ["Yil", product.motorcycleSpec.year.toString()],
          [
            "Yurgan masofa",
            `${product.motorcycleSpec.mileageKm.toLocaleString(localeCode)} km`,
          ],
          ["Holati", conditionLabel(product.condition)],
          ["Rang", product.color ? colorMeta[product.color].label : "—"],
          ["SKU", product.sku],
          ["Brend", product.brand?.name ?? "—"],
          ["Kategoriya", category?.name ?? "—"],
        ]
      : [
          ["SKU", product.sku],
          ["Brend", product.brand?.name ?? "—"],
          ["Kategoriya", category?.name ?? "—"],
          ["Part number", product.partSpec?.partNumber ?? "—"],
          ["Holati", conditionLabel(product.condition)],
          ["Rang", product.color ? colorMeta[product.color].label : "—"],
          ["Mavjudlik", product.stock > 0 ? `${product.stock} dona` : "Yo‘q"],
        ];
  const color = product.color ? colorMeta[product.color] : null;

  return (
    <div className="bg-[#f7f7f6] min-h-screen text-neutral-950 dark:bg-background dark:text-foreground">
      <script
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(jsonLd),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
        type="application/ld+json"
      />
      <main className="container pt-6 pb-28 lg:pb-16">
        {data.preview ? (
          <div
            className="border-primary bg-primary/10 mb-5 rounded-md border p-3 text-sm font-bold"
            role="status"
          >
            Admin preview · {product.status} · public indekslash o‘chirilgan
          </div>
        ) : null}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500"
        >
          <Link aria-label="Bosh sahifa" href="/" className="hover:text-zinc-900 transition-colors">
            <Home className="size-3.5" />
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href="/catalog" className="hover:text-zinc-900 transition-colors">Katalog</Link>
          {category ? (
            <>
              <span className="text-zinc-300">/</span>
              <Link
                href={`/categories/${selected(product.category.translations, Locale.UZ)?.slug}`}
                className="hover:text-zinc-900 transition-colors"
              >
                {category.name}
              </Link>
            </>
          ) : null}
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-800" aria-current="page">
            {translation.name}
          </span>
        </nav>
        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
          {/* Left Column: Gallery & Bottom Tabs Info */}
          <div className="grid gap-8">
            <Reveal direction="right">
              <ProductGallery images={images} />
            </Reveal>

            {/* Tabs and specs/description section (Large screens 2-col specs+description) */}
            <Reveal>
              <InteractiveTabsSection
                specRows={specRows}
                description={translation.description}
              />
            </Reveal>
          </div>

          {/* Right Column: Title, price, color, quantity and buy panel */}
          <Reveal direction="left">
            <aside className="lg:sticky lg:top-28">
              <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm grid gap-5">
                <section className="border-b border-zinc-100 pb-5">
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight">
                    {translation.name}
                  </h1>
                  <p className="text-[#e31e24] mt-3.5 text-2xl font-black">
                    {price}
                  </p>
                  {product.compareAtPrice ? (
                    <p className="mt-1 text-sm text-zinc-400 line-through">
                      {new Intl.NumberFormat(localeCode, {
                        style: "currency",
                        currency: product.currency,
                        maximumFractionDigits: 0,
                      }).format(Number(product.compareAtPrice))}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="size-3.5 fill-emerald-600 text-emerald-100" />
                    </span>
                    <span>
                      {product.stock > 0 ? "Sotuvda mavjud" : "Sotuvda yo‘q"}
                    </span>
                  </div>
                  
                </section>
                
                <PurchasePanel
                  productId={product.id}
                  name={translation.name}
                  price={product.price}
                  sku={product.sku}
                  stock={product.stock}
                  imageUrl={product.images[0]?.url}
                  initialColor={product.color || undefined}
                />
                
              </div>
            <div className="mt-6">
              <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-sm font-extrabold text-zinc-950 uppercase tracking-wider">Yetkazib berish</h2>
                <div className="grid gap-5 text-sm text-zinc-600">
                  <div className="flex gap-3">
                    <Truck className="mt-0.5 size-5 shrink-0 text-zinc-400" />
                    <div>
                      <b className="text-zinc-900 font-bold">Toshkent shahrida yetkazib berish</b>
                      <p className="text-zinc-500 text-xs mt-0.5">1-2 ish kuni ichida</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-zinc-400" />
                    <div>
                      <b className="text-zinc-900 font-bold">O‘zbekiston bo‘ylab yetkazib berish</b>
                      <p className="text-zinc-500 text-xs mt-0.5">2-5 ish kuni ichida</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Package className="mt-0.5 size-5 shrink-0 text-zinc-400" />
                    <div>
                      <b className="text-zinc-900 font-bold">Do‘kondan olib ketish</b>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Buyurtmangizni do‘konimizdan olib ketishingiz mumkin
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 pt-4 mt-2">
                    <Link href="/catalog" className="text-xs font-bold text-zinc-500 hover:text-red-600 underline">
                      Batafsil ma'lumot
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </Reveal>
        </div>

        {/* Bottom Specs & Delivery Cards side-by-side for desktop, hidden on mobile since tabs handle it */}
        {/**/}
        {/* Compatibility table for parts */}
      

        {/* Similar products section */}
        <Reveal>
          <SimilarProductsCarousel
            products={data.related}
            locale={data.requestedLocale === "RU" ? "RU" : data.requestedLocale === "EN" ? "EN" : "UZ"}
          />
        </Reveal>
      </main>
    </div>
  );
}
