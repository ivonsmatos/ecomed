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
  return sanityClient.fetch(
    groq`*[_type == "article" && published == true] | order(publishedAt desc) [0...20] {
      ${articleListFields}
    }`,
    {},
    { next: { revalidate: 3600 } }, // ISR 1 hora
  );
}

export async function getLatestArticles(limit = 3): Promise<ArticleListItem[]> {
  return sanityClient.fetch(
    groq`*[_type == "article" && published == true] | order(publishedAt desc) [0...$limit] {
      ${articleListFields}
    }`,
    { limit },
    { next: { revalidate: 3600 } },
  );
}

export async function getArticleBySlug(slug: string): Promise<ArticleFull | null> {
  return sanityClient.fetch(
    groq`*[_type == "article" && slug.current == $slug && published == true][0] {
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

export async function getArticleSlugs(): Promise<{ slug: string }[]> {
  return sanityClient.fetch(
    groq`*[_type == "article" && published == true] { "slug": slug.current }`,
    {},
    { next: { revalidate: 3600 } },
  );
}
