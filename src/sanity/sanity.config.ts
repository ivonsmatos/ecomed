import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "ecomed-studio",
  title: "EcoMed CMS",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Conteúdo")
          .items([
            S.listItem()
              .title("Artigos")
              .child(S.documentTypeList("article").title("Artigos")),
          ]),
    }),
  ],
  schema,
});
