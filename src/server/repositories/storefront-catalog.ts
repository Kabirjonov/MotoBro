import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { ProductStatus } from "@/generated/prisma/enums";
import type { StorefrontCatalogQuery } from "@/schemas/storefront-catalog";
import { getPrismaClient } from "@/server/db/client";

export const productCardSelect = {
  id: true,
  sku: true,
  type: true,
  condition: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  stock: true,
  isFeatured: true,
  brand: { select: { name: true, slug: true } },
  category: {
    select: {
      translations: { select: { locale: true, name: true, slug: true } },
    },
  },
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 5,
    select: {
      altEn: true,
      altRu: true,
      altUz: true,
      height: true,
      url: true,
      width: true,
    },
  },
  translations: { select: { locale: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;
export type ProductCardData = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;
export type StorefrontProductCard = Omit<
  ProductCardData,
  "price" | "compareAtPrice"
> & { price: string; compareAtPrice: string | null };
export function serializeProductCards(
  items: ProductCardData[],
): StorefrontProductCard[] {
  return items.map((item) => ({
    ...item,
    price: item.price.toString(),
    compareAtPrice: item.compareAtPrice?.toString() ?? null,
  }));
}

export function buildStorefrontWhere(
  query: StorefrontCatalogQuery,
): Prisma.ProductWhereInput {
  return {
    archivedAt: null,
    status: ProductStatus.ACTIVE,
    type: query.type,
    condition: query.condition,
    category: query.category
      ? { translations: { some: { slug: query.category } } }
      : undefined,
    brand: query.brand ? { slug: query.brand } : undefined,
    price:
      query.minPrice !== undefined || query.maxPrice !== undefined
        ? { gte: query.minPrice, lte: query.maxPrice }
        : undefined,
    OR: query.q
      ? [
          { sku: { contains: query.q, mode: "insensitive" } },
          {
            translations: {
              some: { name: { contains: query.q, mode: "insensitive" } },
            },
          },
          { brand: { name: { contains: query.q, mode: "insensitive" } } },
        ]
      : undefined,
  };
}

function orderBy(
  sort: StorefrontCatalogQuery["sort"],
): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { price: "asc" };
  if (sort === "price-desc") return { price: "desc" };
  return { createdAt: "desc" };
}

export async function listStorefrontProducts(query: StorefrontCatalogQuery) {
  const db = getPrismaClient();
  const pageSize = 12;
  const where = buildStorefrontWhere(query);
  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      select: productCardSelect,
      orderBy: orderBy(query.sort),
      skip: (query.page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);
  return {
    items: serializeProductCards(items),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}

export async function getStorefrontFacets() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog-facets");
  const db = getPrismaClient();
  const [categories, brands] = await Promise.all([
    db.category.findMany({
      where: { archivedAt: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        translations: { select: { locale: true, name: true, slug: true } },
      },
    }),
    db.brand.findMany({
      where: { archivedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  return { brands, categories };
}

export async function getHomeCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "catalog-facets");
  const db = getPrismaClient();
  const [motorcycles, parts, gear, accessories, categories] = await Promise.all([
    db.product.findMany({
      where: { archivedAt: null, status: ProductStatus.ACTIVE, type: "MOTORCYCLE" },
      select: productCardSelect,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.product.findMany({
      where: { archivedAt: null, status: ProductStatus.ACTIVE, type: "PART" },
      select: productCardSelect,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.product.findMany({
      where: { archivedAt: null, status: ProductStatus.ACTIVE, type: "GEAR" },
      select: productCardSelect,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.product.findMany({
      where: { archivedAt: null, status: ProductStatus.ACTIVE, type: "ACCESSORY" },
      select: productCardSelect,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.category.findMany({
      where: { archivedAt: null, isActive: true },
      select: {
        id: true,
        translations: { select: { locale: true, name: true, slug: true } },
        _count: {
          select: {
            products: {
              where: { status: ProductStatus.ACTIVE, archivedAt: null },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
  ]);
  return {
    categories,
    motorcycles: serializeProductCards(motorcycles),
    parts: serializeProductCards(parts),
    gear: serializeProductCards(gear),
    accessories: serializeProductCards(accessories),
  };
}

export async function findCategoryLanding(slug: string) {
  const db = getPrismaClient();
  return db.categoryTranslation.findFirst({
    where: { slug, category: { archivedAt: null, isActive: true } },
    select: {
      categoryId: true,
      name: true,
      description: true,
      category: {
        select: {
          translations: {
            select: { locale: true, name: true, slug: true, description: true },
          },
        },
      },
    },
  });
}
export async function findBrandLanding(slug: string) {
  return getPrismaClient().brand.findFirst({
    where: { slug, archivedAt: null, isActive: true },
    select: { id: true, name: true, slug: true, websiteUrl: true },
  });
}
