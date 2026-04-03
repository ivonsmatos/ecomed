import { defineType, defineField } from "sanity";

export const articleType = defineType({
  name: "article",
  title: "Artigo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (Rule) => Rule.required().min(5).max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "text",
      rows: 3,
      description: "Aparece na listagem do blog e nas meta tags.",
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "string",
      options: {
        list: [
          { title: "Descarte", value: "descarte" },
          { title: "Legislação", value: "legislacao" },
          { title: "Saúde Ambiental", value: "saude-ambiental" },
          { title: "Dicas", value: "dicas" },
          { title: "EcoMed", value: "ecomed" },
        ],
      },
    }),
    defineField({
      name: "coverImage",
      title: "Imagem de capa",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Texto alternativo",
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Conteúdo",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", type: "string", title: "Texto alternativo" }),
            defineField({
              name: "caption",
              type: "string",
              title: "Legenda",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
    }),
    defineField({
      name: "published",
      title: "Publicado",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
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
