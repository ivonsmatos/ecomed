import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getArticlesPaginated, getArticleCount } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

// Header usa auth() (lê cookies) → página deve ser dinâmica
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog Educativo | EcoMed",
  description: "Aprenda sobre descarte correto de medicamentos e saúde ambiental.",
  alternates: { canonical: "https://ecomed.eco.br/blog" },
};

const PER_PAGE = 12;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [articles, total] = await Promise.all([
    getArticlesPaginated(currentPage, PER_PAGE),
    getArticleCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-eco-teal/10 text-eco-teal-dark">
            <BookOpen className="size-6" />
          </div>
          <h1 className="text-3xl font-bold">Blog Educativo</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Conteúdo sobre descarte correto de medicamentos, legislação e saúde ambiental.
          </p>
          {total > 0 && (
            <p className="text-sm text-muted-foreground">
              {total} artigo{total !== 1 ? "s" : ""} publicado{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhum artigo publicado ainda.</p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const coverSrc = article.coverImage
                  ? urlFor(article.coverImage).width(640).height(320).url()
                  : null;

                return (
                  <Link
                    key={article._id}
                    href={`/blog/${article.slug}`}
                    className="group rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {coverSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverSrc}
                        alt={article.coverImage?.alt ?? article.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4 space-y-2">
                      {article.category && (
                        <Badge variant="secondary" className="text-xs">
                          {article.category.title}
                        </Badge>
                      )}
                      <h2 className="font-semibold leading-snug group-hover:text-eco-teal-dark transition-colors">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      )}
                      {article.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ── Paginação ─────────────────────────────────────── */}
            {totalPages > 1 && (
              <nav
                aria-label="Navegação de páginas"
                className="flex items-center justify-center gap-2 pt-4"
              >
                {/* Anterior */}
                <Link
                  href={`/blog?page=${safePage - 1}`}
                  aria-disabled={!hasPrev}
                  tabIndex={hasPrev ? undefined : -1}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1",
                    !hasPrev && "pointer-events-none opacity-40",
                  )}
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </Link>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === safePage;
                    return (
                      <Link
                        key={p}
                        href={`/blog?page=${p}`}
                        className={cn(
                          buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
                          "min-w-9",
                          isActive && "bg-eco-green hover:bg-eco-green/90 text-white border-eco-green",
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {/* Próxima */}
                <Link
                  href={`/blog?page=${safePage + 1}`}
                  aria-disabled={!hasNext}
                  tabIndex={hasNext ? undefined : -1}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1",
                    !hasNext && "pointer-events-none opacity-40",
                  )}
                >
                  Próxima
                  <ChevronRight className="size-4" />
                </Link>
              </nav>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
