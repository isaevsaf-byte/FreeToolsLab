"use client";

import { useState } from "react";
import { X, Copy, Check, Coffee, CreditCard } from "lucide-react";
import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { LAB_CONFIG } from "@/lib/config";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { lang } = useLabStore();
  const t = dictionary[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyUSDT = () => {
    navigator.clipboard.writeText(LAB_CONFIG.support.crypto_usdt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="font-mono text-lg text-slate-200 mb-2">
          {t.support_modal.title}
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {t.support_modal.text}
        </p>

        <div className="space-y-3">
          {LAB_CONFIG.support.buymeacoffee !== "https://buymeacoffee.com/YOUR_LINK" && (
            <a
              href={LAB_CONFIG.support.buymeacoffee}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border border-slate-800 rounded hover:border-slate-700 hover:bg-slate-800/50 transition-colors group"
            >
              <Coffee className="h-4 w-4 text-slate-500 group-hover:text-amber-500" />
              <span className="font-mono text-xs text-slate-300 group-hover:text-slate-200">
                {t.support_modal.coffee}
              </span>
            </a>
          )}

          {LAB_CONFIG.support.stripe !== "https://buy.stripe.com/YOUR_LINK" && (
            <a
              href={LAB_CONFIG.support.stripe}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border border-slate-800 rounded hover:border-slate-700 hover:bg-slate-800/50 transition-colors group"
            >
              <CreditCard className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              <span className="font-mono text-xs text-slate-300 group-hover:text-slate-200">
                {t.support_modal.stripe}
              </span>
            </a>
          )}

          {LAB_CONFIG.support.crypto_usdt !== "TRC20_WALLET_ADDRESS_HERE" && (
            <button
              onClick={copyUSDT}
              className="flex items-center gap-3 p-3 border border-slate-800 rounded hover:border-slate-700 hover:bg-slate-800/50 transition-colors group w-full text-left"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              )}
              <span className="font-mono text-xs text-slate-300 group-hover:text-slate-200 flex-1">
                {t.support_modal.crypto}
              </span>
              {copied && (
                <span className="font-mono text-xs text-green-400">Copied</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
