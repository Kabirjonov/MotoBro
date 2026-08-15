"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CreditCard, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart } from "lucide-react";
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
  name: string;
  price: string;
  productId: string;
  sku: string;
  stock: number;
  initialColor?: string;
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
  const [selectedColor, setSelectedColor] = useState(initialColor || "BLUE");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const addItem = useCartStore((state) => state.addItem);
  const unavailable = stock <= 0;

  function add() {
    if (unavailable) return;
    addItem({ productId, name, price, sku, stock, imageUrl, quantity });
    setMessage(`${quantity} dona savatga qo‘shildi.`);
    setTimeout(() => setMessage(""), 3000);
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
            Rang: <span className="font-bold text-zinc-900">{colorLabels[selectedColor] || selectedColor}</span>
          </span>
          <div className="flex items-center gap-3">
            {availableColors.map((color) => {
              const isActive = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`relative flex size-9 items-center justify-center rounded-full border transition hover:scale-105 ${
                    isActive ? "border-blue-600 ring-2 ring-blue-600/20" : "border-zinc-200"
                  }`}
                  type="button"
                  aria-label={`${colorLabels[color]} rangini tanlash`}
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

      {/* Quantity & Add to Cart Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500 mr-2">Miqdor:</span>
          <div className="flex h-11 items-center rounded-md border border-zinc-200 bg-white">
            <button
              aria-label="Miqdorni kamaytirish"
              className="grid size-10 place-items-center cursor-pointer text-zinc-500 hover:text-zinc-900 disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              type="button"
            >
              <Minus className="size-4" />
            </button>
            <output aria-label="Miqdor" className="w-10 text-center font-bold text-zinc-950">
              {quantity}
            </output>
            <button
              aria-label="Miqdorni oshirish"
              className="grid size-10 place-items-center text-zinc-500 hover:text-zinc-900 disabled:opacity-40"
              disabled={quantity >= stock}
              onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              type="button"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Savatga qo'shish Button */}
      <div className="grid gap-3">
        <div className="hidden gap-3 lg:flex">
          <Button
            className="h-12 flex-1 rounded-md bg-[#e31e24] hover:bg-[#c2141a] text-white font-bold text-base transition-colors"
            disabled={unavailable}
            onClick={add}
            size="lg"
            type="button"
          >
            <ShoppingCart className="mr-2 size-5" />
            {unavailable ? "Sotuvda yo‘q" : "Savatga qo‘shish"}
          </Button>
          <button
            onClick={() => setIsContactOpen(true)}
            className="h-12 px-6 flex items-center justify-center rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-base transition-colors border border-zinc-200 cursor-pointer"
            type="button"
          >
            Bog'lanish
          </button>
        </div>
        <AnimatePresence>
          {message ? (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-bold shadow-sm"
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.98, y: 4 }}
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96, y: 8 }}
              key={message}
              role="status"
              transition={{ duration: reducedMotion ? 0 : 0.22 }}
            >
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Floating mobile add-to-cart */}
      <div className="bg-white/95 border-zinc-200 fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t p-3 backdrop-blur lg:hidden shadow-lg">
        <div className="flex h-11 items-center rounded-md border border-zinc-200 bg-white">
          <button
            className="grid size-10 place-items-center cursor-pointer text-zinc-500 disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            type="button"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center font-bold text-zinc-950">{quantity}</span>
          <button
            className="grid size-10 place-items-center text-zinc-500 disabled:opacity-40"
            disabled={quantity >= stock}
            onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
            type="button"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          className="h-11 flex-1 rounded-md bg-[#e31e24] hover:bg-[#c2141a] text-white font-bold"
          disabled={unavailable}
          onClick={add}
          type="button"
        >
          <ShoppingCart className="mr-2 size-4" />
          {unavailable ? "Sotuvda yo‘q" : "Savatga qo‘shish"}
        </Button>
        <button
          onClick={() => setIsContactOpen(true)}
          className="h-11 px-4 flex items-center justify-center rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm transition-colors border border-zinc-200 cursor-pointer"
          type="button"
        >
          Bog'lanish
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 divide-x divide-zinc-100 rounded-md border border-zinc-200 bg-[#fcfcfc] text-center text-[10px] md:text-xs">
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
