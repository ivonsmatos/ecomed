"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

export function BlogSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(q: string) {
    const termo = q.trim();
    // Evita navegação redundante para o termo já aplicado na URL
    if (termo === initialQuery.trim()) return;
    startTransition(() => {
      router.push(termo ? `/blog?q=${encodeURIComponent(termo)}` : "/blog");
    });
  }

  function onChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(next), 350);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(value);
  }

  function clear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    navigate("");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="mx-auto w-full max-w-md">
      <label htmlFor="blog-search" className="sr-only">
        Buscar no blog
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="blog-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por tema, ex.: antibióticos, descarte, agulhas…"
          className="w-full rounded-full border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-eco-teal focus:ring-2 focus:ring-eco-teal/30"
        />
        {isPending ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
