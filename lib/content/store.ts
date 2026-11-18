import raw from "@/content/content.json";
import { contentSchema, type Content } from "./schema";

/**
 * The site's content, from content/content.json. It is validated when the
 * site is built, so a mistake in the file fails the build instead of
 * publishing a broken page.
 */
const content: Content = contentSchema.parse(raw);

export function getContent(): Content {
  return content;
}
