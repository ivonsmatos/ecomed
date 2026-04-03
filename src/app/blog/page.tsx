import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Educativo | EcoMed",
  description: "Aprenda sobre descarte correto de medicamentos e saúde ambiental.",
};

export default async function BlogPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { id: true, slug: true, title: true, excerpt: true, category: true, coverUrl: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <BookOpen className="size-6" />
          </div>
          <h1 className="text-3xl font-bold">Blog Educativo</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Conteúdo sobre descarte correto de medicamentos, legislação e saúde ambiental.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhum artigo publicado ainda.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="group rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                {article.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.coverUrl} alt={article.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  {article.category && <Badge variant="secondary" className="text-xs">{article.category}</Badge>}
                  <h2 className="font-semibold leading-snug group-hover:text-green-700 transition-colors">{article.title}</h2>
                  {article.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>}
                  {article.publishedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(article.publishedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
