// Netlify function: /api/evaluation (see netlify.toml) -> same handler as the Vercel function in api/evaluation.ts
import { POST, OPTIONS } from "../../api/evaluation.ts";

export default async (req: Request) => (req.method === "OPTIONS" ? OPTIONS(req) : POST(req));
