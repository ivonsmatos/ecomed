import { groq } from "next-sanity";
import { sanityClient } from "./client";
import type { PortableTextBlock } from "@portabletext/react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ArticleListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  coverImage?: {
    asset: { _ref: string };
    alt?: string;
  };
}

export interface ArticleFull extends ArticleListItem {
  body: PortableTextBlock[];
}

// ---------------------------------------------------------------------------
// Queries GROQ
// ---------------------------------------------------------------------------

const articleListFields = groq`
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
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

export async function getArticleBySlug(slug: string): Promise<ArticleFull | null> {
  return sanityClient.fetch(
    groq`*[_type == "article" && slug.current == $slug && published == true][0] {
      ${articleListFields},
      body
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
