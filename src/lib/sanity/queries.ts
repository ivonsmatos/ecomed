import { groq } from "next-sanity";
import { sanityClient } from "./client";
import type { PortableTextBlock } from "@portabletext/react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface Category {
  _id: string;
  title: string;
  slug: string;
}

export interface ArticleListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  aiSummary?: string;
  category?: Category;
  publishedAt?: string;
  coverImage?: {
    asset: { _ref: string };
    alt?: string;
  };
}

export interface ArticleFull extends ArticleListItem {
  author?: string;
  body: PortableTextBlock[];
  // SEO
  seoTitle?: string;
  metaDescription?: string;
  // GEO / IA
  aiSummary?: string;
  entities?: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

// ---------------------------------------------------------------------------
// Queries GROQ
// ---------------------------------------------------------------------------

const articleListFields = groq`
  _id,
  title,
  "slug": slug.current,
  excerpt,
  aiSummary,
  "category": category->{ _id, title, "slug": slug.current },
  publishedAt,
  coverImage { asset, alt }
`;

export async function getArticles(): Promise<ArticleListItem[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    groq`*[_type == "article" && defined(publishedAt)] | order(publishedAt desc) [0...20] {
      ${articleListFields}
    }`,
    {},
    { next: { revalidate: 60 } }, // 1 minuto
  );
}

export async function getArticlesPaginated(
  page: number,
  perPage: number,
): Promise<ArticleListItem[]> {
  if (!sanityClient) return [];
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return sanityClient.fetch(
    groq`*[_type == "article" && defined(publishedAt)] | order(publishedAt desc) [$start...$end] {
      ${articleListFields}
    }`,
    { start, end },
    { next: { revalidate: 60 } },
  );
}

export async function getArticleCount(): Promise<number> {
  if (!sanityClient) return 0;
  return sanityClient.fetch(
    groq`count(*[_type == "article" && defined(publishedAt)])`,
    {},
    { next: { revalidate: 60 } },
  );
}

export async function getLatestArticles(limit = 3): Promise<ArticleListItem[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    groq`*[_type == "article" && defined(publishedAt)] | order(publishedAt desc) [0...$limit] {
      ${articleListFields}
    }`,
    { limit },
    { next: { revalidate: 60 } }, // 1 minuto
  );
}

export async function getArticleBySlug(slug: string): Promise<ArticleFull | null> {
  if (!sanityClient) return null;
  return sanityClient.fetch(
    groq`*[_type == "article" && defined(publishedAt) && slug.current == $slug][0] {
      ${articleListFields},
      author,
      body,
      seoTitle,
      metaDescription,
      aiSummary,
      entities,
      faqs[] { question, answer }
    }`,
    { slug },
    { next: { revalidate: 3600 } },
  );
}

// Tipo mínimo para navegação prev/next
export interface ArticleNav {
  _id: string;
  title: string;
  slug: string;
  coverImage?: { asset: { _ref: string }; alt?: string };
}

/** 3 posts relacionados — mesma categoria primeiro, fallback para recentes */
export async function getRelatedArticles(
  slug: string,
  categoryId: string | undefined,
): Promise<ArticleListItem[]> {
  if (!sanityClient) return [];

  // Tenta mesma categoria
  if (categoryId) {
    const related = await sanityClient.fetch<ArticleListItem[]>(
      groq`*[_type == "article" && defined(publishedAt) && slug.current != $slug && category._ref == $categoryId]
        | order(publishedAt desc) [0...3] { ${articleListFields} }`,
      { slug, categoryId },
      { next: { revalidate: 3600 } },
    );
    if (related.length >= 3) return related;
  }

  // Fallback: recentes excluindo o atual
  return sanityClient.fetch<ArticleListItem[]>(
    groq`*[_type == "article" && defined(publishedAt) && slug.current != $slug]
      | order(publishedAt desc) [0...3] { ${articleListFields} }`,
    { slug },
    { next: { revalidate: 3600 } },
  );
}

/** Post anterior (mais antigo) e próximo (mais recente) em relação ao publishedAt */
export async function getPrevNextArticles(
  publishedAt: string,
  slug: string,
): Promise<{ prev: ArticleNav | null; next: ArticleNav | null }> {
  if (!sanityClient) return { prev: null, next: null };

  const navFields = groq`_id, title, "slug": slug.current, coverImage { asset, alt }`;

  const [prevArr, nextArr] = await Promise.all([
    sanityClient.fetch<ArticleNav[]>(
      groq`*[_type == "article" && defined(publishedAt) && publishedAt < $publishedAt && slug.current != $slug]
        | order(publishedAt desc) [0...1] { ${navFields} }`,
      { publishedAt, slug },
      { next: { revalidate: 3600 } },
    ),
    sanityClient.fetch<ArticleNav[]>(
      groq`*[_type == "article" && defined(publishedAt) && publishedAt > $publishedAt && slug.current != $slug]
        | order(publishedAt asc) [0...1] { ${navFields} }`,
      { publishedAt, slug },
      { next: { revalidate: 3600 } },
    ),
  ]);

  return { prev: prevArr[0] ?? null, next: nextArr[0] ?? null };
}

export async function getArticleSlugs(): Promise<{ slug: string }[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    groq`*[_type == "article" && defined(publishedAt)] { "slug": slug.current }`,
    {},
    { next: { revalidate: 3600 } },
  );
}
