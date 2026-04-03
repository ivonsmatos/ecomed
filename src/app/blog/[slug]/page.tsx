import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug }, select: { title: true, excerpt: true, coverUrl: true } });
  if (!article) return {};
  return {
    title: `${article.title} | EcoMed`,
    description: article.excerpt ?? undefined,
    openGraph: { images: article.coverUrl ? [article.coverUrl] : [] },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug, published: true },
    select: { title: true, content: true, category: true, coverUrl: true, publishedAt: true, excerpt: true },
  });

  if (!article) notFound();

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-12 space-y-8">
        <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2"}>
          ← Blog
        </Link>

        {article.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverUrl} alt={article.title} className="w-full rounded-xl h-56 object-cover" />
        )}

        <div className="space-y-3">
          {article.category && <Badge variant="secondary">{article.category}</Badge>}
          <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
          {article.publishedAt && (
            <p className="text-sm text-muted-foreground">
              Publicado em {new Date(article.publishedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        <article className="prose prose-green dark:prose-invert max-w-none">
          {/* O conteúdo é texto simples / Markdown — renderizar como HTML requer um parser Markdown */}
          {article.content.split("\n").map((line, i) => (
            <p key={i}>{line || <br />}</p>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
