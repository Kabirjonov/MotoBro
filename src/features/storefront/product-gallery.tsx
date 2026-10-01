"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bike, ChevronDown, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type GalleryImage = {
  alt: string;
  height: number;
  id: string;
  url: string;
  width: number;
};
export function ProductGallery({
  className,
  images,
}: {
  className?: string;
  images: GalleryImage[];
}) {
  const [active, setActive] = useState(0);
  const current = images[active];
  const reducedMotion = useReducedMotion();
  const hasMany = images.length > 1;
  function move(direction: -1 | 1) {
    if (!hasMany) return;
    setActive((value) => (value + direction + images.length) % images.length);
  }

  return (
    <section
      aria-label="Mahsulot rasmlari"
      className={cn("grid gap-3 md:grid-cols-[5.75rem_minmax(0,1fr)]", className)}
    >
      {hasMany ? (
        <div
          aria-label="Rasm tanlash"
          className="order-2 flex gap-2 overflow-x-auto md:order-1 md:grid md:max-h-[36rem] md:grid-rows-[repeat(5,5.25rem)_1.75rem] md:overflow-visible"
          role="list"
        >
          {images.slice(0, 5).map((image, index) => (
            <motion.button
              aria-label={`${index + 1}-rasmni ko‘rsatish`}
              aria-pressed={index === active}
              className="aria-pressed:border-red-600 aria-pressed:ring-red-500/20 bg-white relative size-20 shrink-0 overflow-hidden rounded-md border border-zinc-200 aria-pressed:ring-2 md:size-auto"
              key={image.id}
              onClick={() => setActive(index)}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Image
                alt=""
                className="h-full w-full object-contain p-1"
                height={image.height}
                sizes="96px"
                src={image.url}
                width={image.width}
              />
            </motion.button>
          ))}
          <button
            aria-label="Keyingi rasmlar"
            className="text-zinc-400 hover:text-[#e31e24] hidden place-items-center rounded-md transition md:grid"
            onClick={() => move(1)}
            type="button"
          >
            <ChevronDown className="size-5" />
          </button>
        </div>
      ) : null}
      <div className="bg-white relative order-1 flex items-center justify-center aspect-[4/3] sm:aspect-[3/2] overflow-hidden rounded-xl border border-zinc-200/80 md:order-2 shadow-sm p-2">
        {current ? (
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="h-full w-full"
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.03 }}
              key={current.id}
              transition={{ duration: reducedMotion ? 0 : 0.32 }}
            >
              <Image
                alt={current.alt}
                className="h-full w-full object-contain"
                height={current.height}
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                src={current.url}
                width={current.width}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <Bike
            aria-label="Rasm mavjud emas"
            className="text-muted-foreground size-20"
          />
        )}
        <button
          aria-label="Rasmni kattalashtirish"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition hover:bg-white"
          type="button"
        >
          <Expand className="size-4" />
        </button>
        {hasMany ? (
          <>
            <button
              aria-label="Oldingi rasm"
              className="absolute top-1/2 left-4 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition hover:bg-white"
              onClick={() => move(-1)}
              type="button"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              aria-label="Keyingi rasm"
              className="absolute top-1/2 right-4 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition hover:bg-white"
              onClick={() => move(1)}
              type="button"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
