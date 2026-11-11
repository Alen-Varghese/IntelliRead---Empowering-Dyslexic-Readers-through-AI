// Vercel function: POST /api/ocr-extract -> Gemini vision OCR.
// If Gemini is not configured or fails, the browser falls back to Tesseract.js (src/components/ImageUpload.tsx).
import handler from "./_lib/ocr-extract/index.js";

export async function POST(req: Request) {
  const res = await handler(req);
  if (res.status !== 200) return res;
  const data = await res.json();
  return Response.json({ ...data, engine: "gemini" });
}
export const OPTIONS = (req: Request) => handler(req);
