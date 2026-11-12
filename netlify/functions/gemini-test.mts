// Netlify function: /api/gemini-test (see netlify.toml) -> same check as api/gemini-test.ts
import { GET } from "../../api/gemini-test.ts";

export default async () => GET();
