import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import type { Metadata } from "next";
import { PortableText } from "@portabletext/react";
import { getArticleBySlug, getArticleSlugs } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";

interface Params { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const coverUrl = article.coverImage ? urlFor(article.coverImage).width(1200).height(630).url() : undefined;
  return {
    title: `${article.title} | EcoMed`,
    description: article.excerpt ?? undefined,
    openGraph: { images: coverUrl ? [coverUrl] : [] },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const coverUrl = article.coverImage
    ? urlFor(article.coverImage).width(800).height(450).url()
    : null;

  const CATEGORY_LABEL: Record<string, string> = {
    descarte: "Descarte",
    legislacao: "Legislação",
    "saude-ambiental": "Saúde Ambiental",
    dicas: "Dicas",
    ecomed: "EcoMed",
  };

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-12 space-y-8">
        <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2"}>
          ← Blog
        </Link>

        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={article.coverImage?.alt ?? article.title}
            className="w-full rounded-xl h-56 object-cover"
          />
        )}

        <div className="space-y-3">
          {article.category && (
            <Badge variant="secondary">
              {CATEGORY_LABEL[article.category] ?? article.category}
            </Badge>
          )}
          <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
          {article.publishedAt && (
            <p className="text-sm text-muted-foreground">
              Publicado em{" "}
              {new Date(article.publishedAt).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <article className="prose prose-green dark:prose-invert max-w-none">
          <PortableText value={article.body} />
        </article>
      </main>
      <Footer />
    </>
  );
}

