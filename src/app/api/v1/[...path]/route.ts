import { handleMockRequest } from "@/lib/mock/api";

/**
 * DEV-ONLY mock of the Kosly API. Answers every /api/v1/* call from an in-memory database, but only when
 * KOSLY_MOCK_API=true. In any other environment it is a plain 404 so it can never shadow the real backend.
 * Real endpoint contracts live in kosly-api-requirements.md.
 */

// Session cookies and mutable state: never cache.
export const dynamic = "force-dynamic";

async function handle(req: Request, ctx: RouteContext<"/api/v1/[...path]">): Promise<Response> {
  if (process.env.KOSLY_MOCK_API !== "true") {
    return Response.json({ error: { code: "not_found", message: "not_found" } }, { status: 404 });
  }
  const { path } = await ctx.params;
  return handleMockRequest(req, path);
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
