"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SELLER_CONTACTS } from "@/config/contacts";

export function StoreContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close widget when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={widgetRef} className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3 select-none">
      {/* Contact Card Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-72 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="font-extrabold text-zinc-900 text-sm">Aloqa va qo‘llab-quvvatlash</h3>
              <p className="text-xs text-zinc-500 mt-1">Savollaringiz bormi? Biz bilan bog‘laning:</p>
            </div>

            {/* Support List */}
            <div className="grid gap-2">
              {/* Telegram Link */}
              <a
                href={SELLER_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-xl border border-zinc-100 bg-[#f9fafb] p-3 hover:bg-[#eef2f6] hover:border-zinc-200 transition duration-300 group"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#24A1DE]/10 text-[#24A1DE] group-hover:scale-105 transition duration-300">
                  <Send className="size-4.5 fill-[#24A1DE] text-transparent translate-x-[-1px] translate-y-[1px]" />
                </span>
                <div className="text-left min-w-0">
                  <p className="font-extrabold text-xs text-zinc-900">Telegram</p>
                  <p className="text-[11px] text-zinc-500 group-hover:text-zinc-700 truncate">
                    {SELLER_CONTACTS.telegramUsername}
                  </p>
                </div>
              </a>

              {/* Phone Link */}
              <a
                href={`tel:${SELLER_CONTACTS.phoneDial}`}
                className="flex items-center gap-3.5 rounded-xl border border-zinc-100 bg-[#f9fafb] p-3 hover:bg-[#eef2f6] hover:border-zinc-200 transition duration-300 group"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-650 group-hover:scale-105 transition duration-300">
                  <Phone className="size-4.5 fill-emerald-600 text-transparent" />
                </span>
                <div className="text-left min-w-0">
                  <p className="font-extrabold text-xs text-zinc-900">Telefon qo‘ng‘iroq</p>
                  <p className="text-[11px] text-zinc-500 group-hover:text-zinc-700 truncate">
                    {SELLER_CONTACTS.phoneDisplay}
                  </p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`grid size-14 place-items-center rounded-full text-white shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
          isOpen
            ? "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-900/10"
            : "bg-[#e31e24] hover:bg-[#c2141a] shadow-red-500/20"
        }`}
        aria-label="Sotuvchi bilan bog‘lanish"
        type="button"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="size-6" />
            </motion.span>
          ) : (
            <motion.span
              key="message"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="size-6 fill-white/10" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
