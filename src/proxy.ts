import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // opengraph-image is excluded so og:image URLs like /id/opengraph-image are served directly instead of
  // being redirected to the un-prefixed default-locale path (an extra hop for social crawlers).
  matcher: ["/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)"],
};
