// Vercel function: POST /api/predict -> supabase/functions/predict (generated into _lib)
import handler from "./_lib/predict/index.js";

export const POST = (req: Request) => handler(req);
export const OPTIONS = (req: Request) => handler(req);
