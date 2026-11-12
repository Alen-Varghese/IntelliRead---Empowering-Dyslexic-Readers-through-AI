// Netlify function: /api/ocr-extract (see netlify.toml) -> same handler as the Vercel function in api/ocr-extract.ts
import { POST, OPTIONS } from "../../api/ocr-extract.ts";

export default async (req: Request) => (req.method === "OPTIONS" ? OPTIONS(req) : POST(req));
