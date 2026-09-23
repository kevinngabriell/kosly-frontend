import type { JsonLdProps } from "./JsonLd.types";

/** Renders schema.org structured data for search engines. Never visible in the UI. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so translated strings can never close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
