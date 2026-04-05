import { type SchemaTypeDefinition } from "sanity";
import { articleType } from "./article";
import { categoryType } from "./category";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [categoryType, articleType],
};
