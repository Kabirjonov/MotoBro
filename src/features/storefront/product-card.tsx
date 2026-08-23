"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bike, ChevronLeft, ChevronRight, PackageCheck, PackageX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { FavoriteButton } from "@/features/wishlist/favorite-button";
import type { StorefrontProductCard } from "@/server/repositories/storefront-catalog";

function translated<T extends { locale: string }>(values: T[], locale: string) {
  return (
    values.find((item) => item.locale === locale) ??
    values.find((item) => item.locale === "UZ") ??
    values[0]
  );
}

export function formatStorefrontPrice(
  value: string | number,
  currency: string,
  locale: "UZ" | "RU" | "EN",
) {
  const locales = { UZ: "uz-UZ", RU: "ru-RU", EN: "en-US" };
  return new Intl.NumberFormat(locales[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "UZS" ? 0 : 2,
  }).format(Number(value));
}

export function ProductCard({ product }: { product: StorefrontProductCard }) {
  const locale = useLocale().toUpperCase() as "UZ" | "RU" | "EN";
  const translation = translated(product.translations, locale);

  const images = product.images ?? [];
  const hasMultipleImages = images.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-carousel timer (every 3.5 seconds) if multiple images exist and not hovered
  useEffect(() => {
    if (!hasMultipleImages || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [hasMultipleImages, isHovered, images.length]);

  const activeImage = images[currentIndex] ?? images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  return (
    <motion.article
      className="bg-card border-border group relative overflow-hidden rounded-2xl border shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ scale: 1.018, y: -5 }}
      whileTap={{ scale: 0.99 }}
    >
      <FavoriteButton
        className="absolute top-3 right-3 z-20"
        item={{
          currency: product.currency,
          imageAlt:
            (locale === "RU"
              ? activeImage?.altRu
              : locale === "EN"
                ? activeImage?.altEn
                : activeImage?.altUz) ??
            activeImage?.altUz ??
            translation?.name ??
            product.sku,
          imageUrl: activeImage?.url,
          name: translation?.name ?? product.sku,
          price: product.price.toString(),
          productId: product.id,
          sku: product.sku,
          slug: translation?.slug ?? product.sku,
          stock: product.stock,
        }}
      />
      <Link
        className="focus-visible:ring-ring block rounded-2xl outline-none focus-visible:ring-2"
        href={`/products/${translation?.slug ?? product.sku}`}
      >
        <div className="bg-muted relative aspect-[4/3] overflow-hidden">
          {activeImage ? (
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1 }}
                className="h-full w-full"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={activeImage.url}
                transition={{ duration: 0.25 }}
              >
                <Image
                  alt={
                    (locale === "RU"
                      ? activeImage.altRu
                      : locale === "EN"
                        ? activeImage.altEn
                        : activeImage.altUz) ?? activeImage.altUz
                  }
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  height={activeImage.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  src={activeImage.url}
                  width={activeImage.width}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="grid h-full place-items-center">
              <Bike
                aria-hidden="true"
                className="text-muted-foreground size-12"
              />
            </div>
          )}

          <span className="bg-background/90 z-10 absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-black">
            {product.type}
          </span>

          {/* Carousel Arrows (Visible on hover when multiple images exist) */}
          {hasMultipleImages && (
            <>
              <button
                aria-label="Oldingi rasm"
                className="bg-black/40 hover:bg-black/70 text-white z-10 absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-0 transition duration-200 group-hover:opacity-100"
                onClick={handlePrev}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>

              <button
                aria-label="Keyingi rasm"
                className="bg-black/40 hover:bg-black/70 text-white z-10 absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-0 transition duration-200 group-hover:opacity-100"
                onClick={handleNext}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>

              {/* Carousel Indicators / Dots */}
              <div className="z-10 absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2 py-1 backdrop-blur-xs">
                {images.map((_, idx) => (
                  <button
                    aria-label={`Rasm ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-4 bg-white"
                        : "w-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                    key={idx}
                    onClick={(e) => handleDotClick(e, idx)}
                    onMouseEnter={(e) => handleDotClick(e, idx)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-3 p-4">
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase">
              {product.brand?.name ?? product.type}
            </p>
            <h2 className="mt-1 line-clamp-2 text-lg font-black">
              {translation?.name ?? product.sku}
            </h2>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-primary text-lg font-black">
                {formatStorefrontPrice(
                  product.price.toString(),
                  product.currency,
                  locale,
                )}
              </p>
              {product.compareAtPrice ? (
                <p className="text-muted-foreground text-xs line-through">
                  {formatStorefrontPrice(
                    product.compareAtPrice.toString(),
                    product.currency,
                    locale,
                  )}
                </p>
              ) : null}
            </div>
            <span
              className={
                product.stock > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-destructive"
              }
            >
              {product.stock > 0 ? (
                <PackageCheck aria-label="Mavjud" className="size-5" />
              ) : (
                <PackageX aria-label="Tugagan" className="size-5" />
              )}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
