// Vercel function: POST /api/evaluation -> supabase/functions/evaluation (generated into _lib)
import handler from "./_lib/evaluation/index.js";

export const POST = (req: Request) => handler(req);
export const OPTIONS = (req: Request) => handler(req);
