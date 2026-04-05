import { defineType, defineField } from "sanity";

export const articleType = defineType({
  name: "article",
  title: "Artigo",
  type: "document",

  // ── Abas do Sanity Studio ──────────────────────────────────────────────────
  groups: [
    { name: "content", title: "Conteúdo", default: true },
    { name: "seo", title: "SEO" },
    { name: "geo", title: "GEO / IA" },
  ],

  fields: [
    // ── Conteúdo ────────────────────────────────────────────────────────────
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().min(5).max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "reference",
      group: "content",
      to: [{ type: "category" }],
      description: "Categoria principal do artigo (define cor e ícone na interface).",
    }),
    defineField({
      name: "publishedAt",
      title: "Data de Publicação",
      type: "datetime",
      group: "content",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "excerpt",
      title: "Resumo (Excerpt)",
      type: "text",
      rows: 3,
      group: "content",
      description: "Breve resumo do artigo exibido em listagens e cards.",
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "coverImage",
      title: "Imagem Principal",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Texto Alternativo (Alt)",
          description: "Importante para acessibilidade e SEO.",
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Corpo do Artigo",
      type: "array",
      group: "content",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", type: "string", title: "Texto alternativo" }),
            defineField({ name: "caption", type: "string", title: "Legenda" }),
          ],
        },
      ],
    }),
    defineField({
      name: "published",
      title: "Publicado",
      type: "boolean",
      group: "content",
      initialValue: false,
    }),

    // ── SEO ─────────────────────────────────────────────────────────────────
    defineField({
      name: "seoTitle",
      title: "Título SEO",
      type: "string",
      group: "seo",
      description: "Título otimizado para mecanismos de busca (50-60 caracteres).",
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      group: "seo",
      description: "Descrição para resultados de busca (120-150 caracteres).",
      validation: (Rule) => Rule.max(160),
    }),

    // ── GEO / IA ─────────────────────────────────────────────────────────────
    defineField({
      name: "aiSummary",
      title: "Resumo para IA (AI Summary)",
      type: "text",
      rows: 4,
      group: "geo",
      description: "Resumo semântico de até 500 caracteres, otimizado para respostas de IAs generativas.",
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "entities",
      title: "Entidades Relacionadas",
      type: "array",
      group: "geo",
      of: [{ type: "string" }],
      description: "Tags de entidades do mundo real (ex: 'ANVISA', 'CONAMA', 'Lei 12.305').",
      options: { layout: "tags" },
    }),
    defineField({
      name: "faqs",
      title: "Perguntas Frequentes (FAQ)",
      type: "array",
      group: "geo",
      description: "Pares de pergunta/resposta para FAQPage JSON-LD e respostas de IAs.",
      of: [
        {
          type: "object",
          name: "faq",
          title: "FAQ",
          fields: [
            defineField({
              name: "question",
              title: "Pergunta",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Resposta",
              type: "text",
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: "question" } },
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: "title",
      subtitle: "category.title",
      media: "coverImage",
    },
  },
  orderings: [
    {
      title: "Data (mais recente)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
