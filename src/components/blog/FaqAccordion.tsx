"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Perguntas Frequentes</h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border-l-4 border-amber-400 bg-white rounded-r-lg shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              aria-expanded={open === i}
            >
              <span className="font-semibold text-[#1e3a5f] text-sm leading-snug">
                {faq.question}
              </span>
              <ChevronDown
                className={`shrink-0 text-amber-500 transition-transform duration-200 ${
                  open === i ? "rotate-180" : ""
                }`}
                size={18}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-gray-700 leading-relaxed border-t border-gray-100">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
