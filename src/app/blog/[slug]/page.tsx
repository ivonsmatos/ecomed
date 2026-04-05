import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FaqAccordion } from "@/components/blog/FaqAccordion";
import Link from "next/link";
import type { Metadata } from "next";
import { PortableText } from "@portabletext/react";
import { getArticleBySlug } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { User, Calendar } from "lucide-react";
import { ArticleReadTracker } from "@/components/blog/ArticleReadTracker";

// O Header usa auth() que lê cookies — a página deve ser dinâmica (on-demand).
// Os dados do Sanity ainda são cacheados 1h pelo next.revalidate no fetch.
export const dynamic = "force-dynamic";

interface Params { params: Promise<{ slug: string }> }

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

// Componente de prose customizado para renderizar o corpo de artigo com o estilo ActaHub
const portableComponents = {
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-2xl font-bold text-eco-teal-dark mt-10 mb-4 leading-snug">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl font-bold text-eco-teal-dark mt-8 mb-3 leading-snug">{children}</h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-lg font-semibold text-eco-teal-dark mt-6 mb-2">{children}</h4>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-gray-800 leading-relaxed mb-5 text-[1.0625rem]">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-green-500 pl-5 py-1 my-6 bg-eco-teal/10 text-gray-700 italic rounded-r">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-outside pl-6 mb-5 space-y-2 text-gray-800">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-outside pl-6 mb-5 space-y-2 text-gray-800">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed text-[1.0625rem]">{children}</li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed text-[1.0625rem]">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="bg-gray-100 text-eco-teal-dark px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
    link: ({ value, children }: { value?: { href?: string }; children?: React.ReactNode }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-eco-teal-dark underline underline-offset-2 hover:text-eco-teal-dark"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: { asset: { _ref: string }; alt?: string; caption?: string } }) => {
      const imageUrl = urlFor(value).width(800).url();
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={value.alt ?? ""} className="w-full rounded-xl" />
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
  },
};

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const coverUrl = article.coverImage
    ? urlFor(article.coverImage).width(900).height(500).url()
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

  const dateFormatted = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <Header />

      {/* Rastreador de leitura — credita +2 EcoCoins após 2min + scroll 90% */}
      <ArticleReadTracker articleSlug={slug} />

      <main className="bg-white min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-10">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-500 mb-6 flex items-center gap-1 flex-wrap">
            <Link href="/" className="hover:text-eco-teal-dark">Início</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-eco-teal-dark">Blog</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium line-clamp-1">{article.title}</span>
          </nav>

          {/* Título */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-eco-teal-dark leading-tight mb-5">
            {article.title}
          </h1>

          {/* Autor + Data */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 flex-wrap">
            {article.author && (
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                {article.author}
              </span>
            )}
            {dateFormatted && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {dateFormatted}
              </span>
            )}
            {article.category && (
              <span className="ml-auto bg-eco-teal/10 text-eco-teal-dark text-xs font-semibold px-2.5 py-1 rounded-full">
                {article.category.title}
              </span>
            )}
          </div>

          {/* Resumo IA */}
          {article.aiSummary && (
            <div className="border-l-4 border-green-500 bg-eco-teal/10 rounded-r-lg px-5 py-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900">📌 Resumo IA: </span>
                {article.aiSummary}
              </p>
            </div>
          )}

          {/* Tags / Entidades */}
          {article.entities && article.entities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-7">
              {article.entities.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-600 border border-gray-300 rounded-full px-3 py-1 bg-white hover:border-eco-green hover:text-eco-teal-dark transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Imagem de capa */}
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={article.coverImage?.alt ?? article.title}
              className="w-full rounded-xl mb-10 object-cover max-h-120"
            />
          )}

          {/* Corpo do artigo */}
          <article>
            <PortableText value={article.body} components={portableComponents} />
          </article>

          {/* FAQ Accordion */}
          {article.faqs && article.faqs.length > 0 && (
            <FaqAccordion faqs={article.faqs} />
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

