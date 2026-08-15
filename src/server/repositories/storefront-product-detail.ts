import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { Locale, ProductStatus } from "@/generated/prisma/enums";
import { getPrismaClient } from "@/server/db/client";
import {
  productCardSelect,
  serializeProductCards,
} from "@/server/repositories/storefront-catalog";

const detailSelect = {
  id: true,
  sku: true,
  type: true,
  status: true,
  condition: true,
  color: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  stock: true,
  archivedAt: true,
  categoryId: true,
  brandId: true,
  brand: { select: { name: true, slug: true } },
  category: {
    select: {
      translations: { select: { locale: true, name: true, slug: true } },
    },
  },
  translations: {
    select: {
      locale: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
    },
  },
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    select: {
      id: true,
      altUz: true,
      altRu: true,
      altEn: true,
      height: true,
      width: true,
      url: true,
      isPrimary: true,
    },
  },
  motorcycleSpec: {
    select: {
      make: true,
      model: true,
      year: true,
      engineCc: true,
      mileageKm: true,
    },
  },
  partSpec: { select: { partNumber: true } },
  compatibilities: {
    orderBy: [{ make: "asc" as const }, { model: "asc" as const }],
    select: {
      id: true,
      make: true,
      model: true,
      yearFrom: true,
      yearTo: true,
      engineCc: true,
      note: true,
    },
  },
} satisfies Prisma.ProductSelect;

function localeEnum(locale: string) {
  return locale === "ru" ? Locale.RU : locale === "en" ? Locale.EN : Locale.UZ;
}

async function queryProduct(
  slug: string,
  locale: string,
  includeNonActive: boolean,
) {
  const db = getPrismaClient();
  const selectedLocale = localeEnum(locale);
  const translation = await db.productTranslation.findUnique({
    where: { locale_slug: { locale: selectedLocale, slug } },
    select: { product: { select: detailSelect } },
  });
  const product = translation?.product;
  if (
    !product ||
    (!includeNonActive &&
      (product.status !== ProductStatus.ACTIVE || product.archivedAt))
  )
    return null;
  let related = await db.product.findMany({
    where: {
      id: { not: product.id },
      status: ProductStatus.ACTIVE,
      archivedAt: null,
      OR: [
        { categoryId: product.categoryId },
        ...(product.brandId ? [{ brandId: product.brandId }] : []),
      ],
    },
    select: productCardSelect,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  // If there are fewer than 4 related products, fill the list with fallback active products
  if (related.length < 4) {
    const existingIds = [product.id, ...related.map((r) => r.id)];
    const fallback = await db.product.findMany({
      where: {
        id: { notIn: existingIds },
        status: ProductStatus.ACTIVE,
        archivedAt: null,
      },
      select: productCardSelect,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8 - related.length,
    });
    related = [...related, ...fallback];
  }

  return {
    product: {
      ...product,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() ?? null,
    },
    related: serializeProductCards(related),
    requestedLocale: selectedLocale,
  };
}

export async function getPublicProductDetail(slug: string, locale: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return queryProduct(slug, locale, false);
}

export async function getAdminPreviewProductDetail(
  slug: string,
  locale: string,
) {
  return queryProduct(slug, locale, true);
}
