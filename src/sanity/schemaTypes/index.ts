import { type SchemaTypeDefinition } from "sanity";
import { articleType } from "./article";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [articleType],
};
