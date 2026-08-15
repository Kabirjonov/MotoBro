"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Phone, Send, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { SELLER_CONTACTS } from "@/config/contacts";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ContactModal({ isOpen, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when pressing Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // disable background scrolling
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = ""; // re-enable background scrolling
    };
  }, [isOpen, onClose]);

  // Close when clicking outside the modal box
  function handleOverlayClick(event: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition duration-200 cursor-pointer"
              aria-label="Yopish"
              type="button"
            >
              <X className="size-4.5" />
            </button>

            {/* Header */}
            <div className="mb-5 text-center sm:text-left">
              <h3 className="font-extrabold text-zinc-900 text-lg">Sotuvchi bilan bog‘lanish</h3>
              <p className="text-xs text-zinc-500 mt-1">O‘zingizga qulay aloqa usulini tanlang:</p>
            </div>

            {/* Contact list */}
            <div className="grid gap-3">
              {/* Telegram support link */}
              <a
                href={SELLER_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-[#f9fafb] p-3.5 hover:bg-[#eef2f6] hover:border-zinc-200 transition duration-300 group"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-[#24A1DE]/10 text-[#24A1DE] group-hover:scale-105 transition duration-300">
                  <Send className="size-5 fill-[#24A1DE] text-transparent translate-x-[-1px] translate-y-[1px]" />
                </span>
                <div className="text-left min-w-0">
                  <p className="font-extrabold text-xs text-zinc-900">Telegram</p>
                  <p className="text-[11px] text-zinc-500 group-hover:text-zinc-700 truncate">{SELLER_CONTACTS.telegramUsername}</p>
                </div>
              </a>

              {/* Phone call link */}
              <a
                href={`tel:${SELLER_CONTACTS.phoneDial}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-[#f9fafb] p-3.5 hover:bg-[#eef2f6] hover:border-zinc-200 transition duration-300 group"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-650 group-hover:scale-105 transition duration-300">
                  <Phone className="size-5 fill-emerald-650 text-transparent" />
                </span>
                <div className="text-left min-w-0">
                  <p className="font-extrabold text-xs text-zinc-900">Telefon qo‘ng‘iroq</p>
                  <p className="text-[11px] text-zinc-500 group-hover:text-zinc-700 truncate">{SELLER_CONTACTS.phoneDisplay}</p>
                </div>
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
