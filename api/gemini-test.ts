// Vercel function: GET /api/gemini-test -> checks that GEMINI_API_KEY and GEMINI_MODEL work.
export async function GET() {
  const key = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  if (!key) return Response.json({ ok: false, model, message: "No key found. Add GEMINI_API_KEY in Vercel > Project > Settings > Environment Variables, then redeploy." });
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with the single word OK." }] }),
    });
    const text = await r.text();
    if (!r.ok) return Response.json({ ok: false, model, message: `HTTP ${r.status}: ${text.slice(0, 300)}` });
    return Response.json({ ok: true, model, message: "Gemini answered." });
  } catch (e) {
    return Response.json({ ok: false, model, message: String(e) });
  }
}
