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
    title: `${article.seoTitle ?? article.title} | EcoMed`,
    description: article.metaDescription ?? article.excerpt ?? undefined,
    alternates: { canonical: `https://ecomed.eco.br/blog/${slug}` },
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription ?? article.excerpt ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    image: coverUrl ?? "https://ecomed.eco.br/icons/icon-512.png",
    author: article.author
      ? { "@type": "Person", name: article.author }
      : { "@type": "Organization", name: "EcoMed", url: "https://ecomed.eco.br" },
    publisher: {
      "@type": "Organization",
      name: "EcoMed",
      logo: { "@type": "ImageObject", url: "https://ecomed.eco.br/icons/icon-512.png" },
    },
    mainEntityOfPage: `https://ecomed.eco.br/blog/${slug}`,
    keywords: article.entities?.join(", "),
  };

  const faqSchema = article.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://ecomed.eco.br" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://ecomed.eco.br/blog" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://ecomed.eco.br/blog/${slug}` },
    ],
  };

  const CATEGORY_LABEL: Record<string, string> = {
    descarte: "Descarte",
    legislacao: "Legislação",
    "saude-ambiental": "Saúde Ambiental",
    dicas: "Dicas",
    ecomed: "EcoMed",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
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
              {article.category.title}
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

