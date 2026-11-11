// Local replacement for Supabase Edge Functions + Lovable AI gateway.
// Runs the original functions from supabase/functions on your own PC with Node.
// AI: Google Gemini API (OpenAI-compatible endpoint) if GEMINI_API_KEY is set in .env.local
// OCR fallback: Tesseract.js (offline, no key needed).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Minimal .env loader (no extra dependency). Earlier files win.
for (const f of [".env.local", ".env"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.API_PORT || 8787);
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Supabase functions are written for Deno; make Deno.env work in Node.
(globalThis as any).Deno = { env: { get: (k: string) => (k === "LOVABLE_API_KEY" ? GEMINI_KEY || undefined : process.env[k]) } };

const srcDir = path.join(root, "supabase", "functions");
const genDir = path.join(root, "server", ".gen");
fs.mkdirSync(genDir, { recursive: true });

function convert(code: string): string {
  return code
    .split("\n")
    .filter((l) => !/^import .*https:\/\/deno\.land/.test(l))
    .join("\n")
    .replace(/^serve\(/m, "export default (")
    .replaceAll("https://ai.gateway.lovable.dev/v1/chat/completions", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")
    .replaceAll("'google/gemini-2.5-flash'", JSON.stringify(GEMINI_MODEL));
}

type Handler = (req: Request) => Promise<Response>;
const handlers: Record<string, Handler> = {};

async function loadFunctions() {
  for (const name of fs.readdirSync(srcDir)) {
    const dir = path.join(srcDir, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const outDir = path.join(genDir, name);
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      fs.writeFileSync(path.join(outDir, f), convert(fs.readFileSync(path.join(dir, f), "utf8")));
    }
    const mod = await import(pathToFileURL(path.join(outDir, "index.ts")).href);
    handlers[name] = mod.default;
    console.log(`  loaded function: ${name}`);
  }
}

async function tesseractOcr(image: string): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const base64 = image.replace(/^data:[^;]+;base64,/, "");
  const { data } = await worker.recognize(Buffer.from(base64, "base64"));
  await worker.terminate();
  return data.text;
}

async function testGemini(): Promise<any> {
  if (!GEMINI_KEY) return { ok: false, message: "No key found. Add GEMINI_API_KEY to .env.local and restart the launcher." };
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: GEMINI_MODEL, messages: [{ role: "user", content: "Reply with the single word OK." }] }),
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, status: r.status, message: googleError(text) };
    const reply = JSON.parse(text).choices?.[0]?.message?.content ?? "";
    return { ok: true, status: r.status, message: "Gemini answered: " + String(reply).trim().slice(0, 100) };
  } catch (e: any) {
    return { ok: false, message: "Could not reach Google: " + (e?.message || String(e)) };
  }
}

function googleError(text: string): string {
  try {
    const j = JSON.parse(text);
    const e = Array.isArray(j) ? j[0]?.error : j.error;
    if (e?.message) return (e.status ? e.status + ": " : "") + e.message;
  } catch (_) { /* not JSON */ }
  return text.slice(0, 300);
}

const GEMINI_TEST_PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test Gemini</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}button{font-size:16px;padding:10px 18px;cursor:pointer}pre{background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap}.ok{color:#15803d}.bad{color:#b91c1c}</style></head>
<body><h2>Test Gemini key</h2><p>Sends one short request to Google and shows the exact result.</p>
<button id="b">Test Gemini</button><div id="out" style="margin-top:20px"></div>
<script>
document.getElementById('b').onclick = async function () {
  var out = document.getElementById('out');
  out.textContent = 'Testing...';
  try {
    var r = await fetch('/api/gemini-test');
    var d = await r.json();
    out.innerHTML = d.ok
      ? '<p class="ok"><b>Works.</b></p><pre></pre>'
      : '<p class="bad"><b>Failed' + (d.status ? ' (HTTP ' + d.status + ')' : '') + '.</b></p><pre></pre>';
    out.querySelector('pre').textContent = d.message;
  } catch (e) {
    out.innerHTML = '<p class="bad"><b>Could not reach the IntelliRead server.</b></p>';
  }
};
</script></body></html>`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const server = http.createServer(async (req, res) => {
  const name = (req.url || "").replace(/^\/api\//, "").split("?")[0];
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  if (req.url === "/gemini-test") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(GEMINI_TEST_PAGE); }
  if (req.url === "/api/gemini-test") { res.writeHead(200, { ...cors, "Content-Type": "application/json" }); return res.end(JSON.stringify(await testGemini())); }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = Buffer.concat(chunks).toString() || "{}";
  try {
    if (name === "ocr-extract" && !GEMINI_KEY) {
      const { image } = JSON.parse(body);
      const text = await tesseractOcr(image);
      res.writeHead(200, { ...cors, "Content-Type": "application/json" });
      return res.end(JSON.stringify({ text, engine: "tesseract" }));
    }
    const h = handlers[name];
    if (!h) { res.writeHead(404, cors); return res.end(JSON.stringify({ error: `Unknown function ${name}` })); }
    let r = await h(new Request(`http://localhost/${name}`, { method: "POST", body, headers: { "content-type": "application/json" } }));
    let out = await r.text();
    if (name === "ocr-extract" && r.status !== 200) {
      console.warn("Gemini OCR failed, falling back to Tesseract:", out);
      const { image } = JSON.parse(body);
      out = JSON.stringify({ text: await tesseractOcr(image), engine: "tesseract" });
      r = new Response(out, { status: 200 });
    }
    if (name === "ocr-extract" && r.status === 200 && !out.includes('"engine"')) {
      out = JSON.stringify({ ...JSON.parse(out), engine: "gemini" });
    }
    res.writeHead(r.status, { ...cors, "Content-Type": "application/json" });
    res.end(out);
  } catch (e: any) {
    console.error(e);
    res.writeHead(500, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e?.message || String(e) }));
  }
});

await loadFunctions();
server.listen(PORT, () => {
  console.log(`IntelliRead API running at http://localhost:${PORT}`);
  console.log(GEMINI_KEY ? `  AI: Google Gemini (${GEMINI_MODEL})` : "  AI: off (no GEMINI_API_KEY) - using rule-based analysis + Tesseract OCR");
});
