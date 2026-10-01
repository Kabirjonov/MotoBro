"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ContactModal } from "@/features/storefront/contact-modal";
import { useCartStore } from "@/stores/cart-store";

// Color mapping for Uzbek labels
const colorLabels: Record<string, string> = {
  BLUE: "Moviy",
  BLACK: "Qora",
  GRAY: "Kulrang",
  RED: "Qizil",
  WHITE: "Oq",
  GREEN: "Yashil",
  ORANGE: "Olovrang",
  YELLOW: "Sariq",
  SILVER: "Kumush",
  GOLD: "Tilla",
  BROWN: "Jigarrang",
  MULTICOLOR: "Ko‘p rangli",
};

const colorClasses: Record<string, string> = {
  BLUE: "bg-blue-600",
  BLACK: "bg-neutral-900",
  GRAY: "bg-neutral-500",
  RED: "bg-red-600",
  WHITE: "bg-white",
  GREEN: "bg-emerald-600",
  ORANGE: "bg-orange-500",
  YELLOW: "bg-yellow-300",
  SILVER: "bg-zinc-300",
  GOLD: "bg-yellow-500",
  BROWN: "bg-amber-900",
  MULTICOLOR: "bg-[conic-gradient(#dc2626,#2563eb,#16a34a,#facc15,#dc2626)]",
};

type Props = {
  imageUrl?: string;
  initialColor?: string;
  name: string;
  price: string;
  productId: string;
  sku: string;
  stock: number;
};

export function PurchasePanel({
  productId,
  name,
  price,
  sku,
  stock,
  imageUrl,
  initialColor,
}: Props) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    router = null;
  }
  const [selectedColor, setSelectedColor] = useState(initialColor || "BLUE");
  const [localQuantity, setLocalQuantity] = useState(1);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const setCartQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const cartItem = cartItems.find((item) => item.productId === productId);
  const isInCart = Boolean(cartItem);
  const currentQuantity = cartItem ? cartItem.quantity : localQuantity;
  const unavailable = stock <= 0;

  function navigateToCart() {
    if (router) {
      router.push("/cart");
    } else if (typeof window !== "undefined") {
      window.location.href = "/cart";
    }
  }

  function handleAddToCart() {
    if (unavailable) return;
    addItem({
      productId,
      name,
      price,
      sku,
      stock,
      imageUrl,
      quantity: localQuantity,
    });
  }

  function handleQuantityChange(delta: number) {
    const newQty = currentQuantity + delta;
    if (newQty < 1) {
      if (isInCart) {
        removeItem(productId);
      } else {
        setLocalQuantity(1);
      }
      return;
    }
    if (newQty > stock) return;

    if (isInCart) {
      setCartQuantity(productId, newQty);
    } else {
      setLocalQuantity(newQty);
    }
  }

  // Predefined options matching the mockup: BLUE, BLACK, GRAY
  const availableColors = ["BLUE", "BLACK", "GRAY"];
  if (initialColor && !availableColors.includes(initialColor)) {
    availableColors.unshift(initialColor);
  }

  return (
    <div className="grid gap-6">
      {/* Color Selector */}
      {initialColor ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-500">
            Rang:{" "}
            <span className="font-bold text-zinc-900">
              {colorLabels[selectedColor] || selectedColor}
            </span>
          </span>
          <div className="flex items-center gap-3">
            {availableColors.map((color) => {
              const isActive = selectedColor === color;
              return (
                <button
                  aria-label={`${colorLabels[color]} rangini tanlash`}
                  className={`relative flex size-9 items-center justify-center rounded-full border transition hover:scale-105 ${
                    isActive
                      ? "border-blue-600 ring-2 ring-blue-600/20"
                      : "border-zinc-200"
                  }`}
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  type="button"
                >
                  <span
                    className={`size-6 rounded-full border border-black/10 ${
                      colorClasses[color] || "bg-zinc-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Main Action Area */}
      <div className="grid gap-3">
        {isInCart ? (
          /* STATE 2: ALREADY IN CART -> Show Stepper + Go to Cart Button (O'tish) */
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-white px-1 shadow-xs sm:w-36 justify-between">
              <button
                aria-label="Miqdorni kamaytirish"
                className="grid size-10 place-items-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                onClick={() => handleQuantityChange(-1)}
                type="button"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-base font-bold text-zinc-950">
                {currentQuantity}
              </span>
              <button
                aria-label="Miqdorni oshirish"
                className="grid size-10 place-items-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                disabled={currentQuantity >= stock}
                onClick={() => handleQuantityChange(1)}
                type="button"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              className="h-12 flex-1 rounded-xl bg-red-50 hover:bg-red-100 text-[#e31e24] border border-red-200 font-bold text-base transition-all shadow-xs"
              onClick={navigateToCart}
              type="button"
            >
              <ShoppingBag className="mr-2 size-5" />
              O‘tish
            </Button>
          </div>
        ) : (
          /* STATE 1: NOT IN CART -> Show Quantity Selector + Add to Cart Button */
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-500">Miqdor:</span>
              <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-white px-1">
                <button
                  aria-label="Miqdorni kamaytirish"
                  className="grid size-9 place-items-center cursor-pointer rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                  disabled={currentQuantity <= 1}
                  onClick={() => handleQuantityChange(-1)}
                  type="button"
                >
                  <Minus className="size-4" />
                </button>
                <output aria-label="Miqdor" className="w-9 text-center font-bold text-zinc-950">
                  {currentQuantity}
                </output>
                <button
                  aria-label="Miqdorni oshirish"
                  className="grid size-9 place-items-center cursor-pointer rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                  disabled={currentQuantity >= stock}
                  onClick={() => handleQuantityChange(1)}
                  type="button"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div className="hidden gap-3 lg:flex">
              <Button
                className="h-12 flex-1 rounded-xl bg-[#e31e24] hover:bg-[#c2141a] text-white font-bold text-base transition-colors shadow-md shadow-red-500/10"
                disabled={unavailable}
                onClick={handleAddToCart}
                size="lg"
                type="button"
              >
                <ShoppingCart className="mr-2 size-5" />
                {unavailable ? "Sotuvda yo‘q" : "Savatga qo‘shish"}
              </Button>
              <button
                className="h-12 px-6 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-base transition-colors border border-zinc-200 cursor-pointer"
                onClick={() => setIsContactOpen(true)}
                type="button"
              >
                Bog'lanish
              </button>
            </div>
          </div>
        )}

        {/* Availability Badge */}
        {!unavailable ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50/80 border border-emerald-200/80 px-3 py-2 text-xs font-semibold text-emerald-800">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>{stock} dona xarid qilish mumkin</span>
          </div>
        ) : null}
      </div>

      {/* Floating mobile add-to-cart */}
      <div className="bg-white/95 border-zinc-200 fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t p-3 backdrop-blur lg:hidden shadow-lg">
        {isInCart ? (
          <>
            <div className="flex h-11 items-center rounded-lg border border-zinc-200 bg-white">
              <button
                className="grid size-9 place-items-center cursor-pointer text-zinc-500 disabled:opacity-40"
                onClick={() => handleQuantityChange(-1)}
                type="button"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold text-zinc-950">{currentQuantity}</span>
              <button
                className="grid size-9 place-items-center text-zinc-500 disabled:opacity-40"
                disabled={currentQuantity >= stock}
                onClick={() => handleQuantityChange(1)}
                type="button"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              className="h-11 flex-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#e31e24] border border-red-200 font-bold"
              onClick={navigateToCart}
              type="button"
            >
              <ShoppingBag className="mr-2 size-4" />
              O‘tish
            </Button>
          </>
        ) : (
          <>
            <div className="flex h-11 items-center rounded-lg border border-zinc-200 bg-white">
              <button
                className="grid size-9 place-items-center cursor-pointer text-zinc-500 disabled:opacity-40"
                disabled={currentQuantity <= 1}
                onClick={() => handleQuantityChange(-1)}
                type="button"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold text-zinc-950">{currentQuantity}</span>
              <button
                className="grid size-9 place-items-center text-zinc-500 disabled:opacity-40"
                disabled={currentQuantity >= stock}
                onClick={() => handleQuantityChange(1)}
                type="button"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              className="h-11 flex-1 rounded-lg bg-[#e31e24] hover:bg-[#c2141a] text-white font-bold"
              disabled={unavailable}
              onClick={handleAddToCart}
              type="button"
            >
              <ShoppingCart className="mr-2 size-4" />
              {unavailable ? "Sotuvda yo‘q" : "Savatga qo‘shish"}
            </Button>
          </>
        )}
        <button
          className="h-11 px-4 flex items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm transition-colors border border-zinc-200 cursor-pointer"
          onClick={() => setIsContactOpen(true)}
          type="button"
        >
          Bog'lanish
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 divide-x divide-zinc-100 rounded-xl border border-zinc-200 bg-[#fcfcfc] text-center text-[10px] md:text-xs">
        <div className="flex flex-col items-center gap-1.5 p-3.5">
          <ShieldCheck className="size-5 text-zinc-700" strokeWidth={1.5} />
          <b className="font-extrabold text-zinc-900 leading-tight">Rasmiy kafolat</b>
          <span className="text-zinc-500 leading-none">24 oy kafolat</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3.5">
          <CreditCard className="size-5 text-zinc-700" strokeWidth={1.5} />
          <b className="font-extrabold text-zinc-900 leading-tight">Xavfsiz to‘lov</b>
          <span className="text-zinc-500 leading-none">100% himoyalangan</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3.5">
          <RotateCcw className="size-5 text-zinc-700" strokeWidth={1.5} />
          <b className="font-extrabold text-zinc-900 leading-tight">Qulay qaytarish</b>
          <span className="text-zinc-500 leading-none">14 kun ichida</span>
        </div>
      </div>

      {/* Reusable Contact Modal */}
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
