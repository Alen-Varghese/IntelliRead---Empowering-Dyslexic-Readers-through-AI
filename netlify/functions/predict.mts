// Netlify function: /api/predict (see netlify.toml) -> same handler as the Vercel function in api/predict.ts
import { POST, OPTIONS } from "../../api/predict.ts";

export default async (req: Request) => (req.method === "OPTIONS" ? OPTIONS(req) : POST(req));
