import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  // "id" (the primary market and primary buyer's language) serves at "/" with no
  // prefix; "en" is the secondary toggle language and lives under "/en".
  localePrefix: "as-needed",
});
