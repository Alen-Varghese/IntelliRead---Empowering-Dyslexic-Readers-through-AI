import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LABELS = ['Normal', 'Mild', 'Moderate', 'Severe', 'Inconclusive'];

type Item = { orig: string; norm: string };
type Annotation = { word: string; type: string; suggestion: string };

// ---------- Scoring: rule-based, deterministic ----------

// Lowercase and strip punctuation at the edges of a word, so "dog." matches "dog".
function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
}

function toItems(text: string): Item[] {
  return text.trim().split(/\s+/).filter(Boolean)
    .map((orig) => ({ orig, norm: normalizeWord(orig) }))
    .filter((x) => x.norm.length > 0);
}

const REVERSALS = new Set(['bd', 'db', 'pq', 'qp', 'mw', 'wm']);

// Describes how one typed word differs from the expected word.
function classifyError(expected: string, typed: string): string {
  if (typed.length === expected.length) {
    const diffs: number[] = [];
    for (let i = 0; i < expected.length; i++) if (expected[i] !== typed[i]) diffs.push(i);
    if (diffs.length === 2 && diffs[1] === diffs[0] + 1 &&
        expected[diffs[0]] === typed[diffs[1]] && expected[diffs[1]] === typed[diffs[0]]) return 'transposition';
    if (diffs.length === 1 && REVERSALS.has(expected[diffs[0]] + typed[diffs[0]])) return 'reversal';
    return 'substitution';
  }
  if (typed.length === expected.length - 1) return 'omission';
  if (typed.length === expected.length + 1) return 'insertion';
  return 'substitution';
}

// Lines up typed words with reference words in order (longest common subsequence),
// so one missing or extra word does not shift every word after it.
function alignWords(ref: Item[], typed: Item[]): Array<{ expected?: Item; typed?: Item }> {
  const n = ref.length, m = typed.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = ref[i].norm === typed[j].norm ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const matches: Array<[number, number]> = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (ref[i].norm === typed[j].norm) { matches.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const out: Array<{ expected?: Item; typed?: Item }> = [];
  let ri = 0, ti = 0;
  for (const [mi, mj] of [...matches, [n, m] as [number, number]]) {
    const refGap = ref.slice(ri, mi), typGap = typed.slice(ti, mj);
    const k = Math.min(refGap.length, typGap.length);
    for (let x = 0; x < k; x++) out.push({ expected: refGap[x], typed: typGap[x] });
    for (let x = k; x < refGap.length; x++) out.push({ expected: refGap[x] });
    for (let x = k; x < typGap.length; x++) out.push({ typed: typGap[x] });
    ri = mi + 1; ti = mj + 1;
  }
  return out;
}

function scoreAgainstReference(referenceText: string, typedText: string) {
  const ref = toItems(referenceText);
  const typed = toItems(typedText);
  const annotations: Annotation[] = [];
  for (const pair of alignWords(ref, typed)) {
    if (pair.expected && pair.typed) {
      annotations.push({ word: pair.typed.orig, type: classifyError(pair.expected.norm, pair.typed.norm), suggestion: pair.expected.orig });
    } else if (pair.expected) {
      annotations.push({ word: '(missing)', type: 'omission', suggestion: pair.expected.orig });
    } else if (pair.typed) {
      annotations.push({ word: pair.typed.orig, type: 'insertion', suggestion: '(extra word)' });
    }
  }
  return { annotations, totalWords: ref.length };
}

// Used only when no reference text is given: checks a fixed list of common misspellings.
function scorePatternOnly(text: string) {
  const patterns = [
    { pattern: /\b(teh|hte)\b/gi, word: 'the', type: 'transposition' },
    { pattern: /\b(qick|quik)\b/gi, word: 'quick', type: 'transposition' },
    { pattern: /\b(borwn|bworn)\b/gi, word: 'brown', type: 'transposition' },
    { pattern: /\b(poeple|peopl)\b/gi, word: 'people', type: 'omission' },
    { pattern: /\b(thier|thir)\b/gi, word: 'their', type: 'substitution' },
    { pattern: /\b(migt|mihgt)\b/gi, word: 'might', type: 'transposition' },
  ];
  const annotations: Annotation[] = [];
  for (const p of patterns) {
    for (const match of text.match(p.pattern) || []) {
      annotations.push({ word: match, type: p.type, suggestion: p.word });
    }
  }
  return { annotations, totalWords: text.trim().split(/\s+/).filter(Boolean).length };
}

// Uncalibrated formula: error rate x 2.5, capped at 95%. Thresholds are not validated.
function toLabel(probability: number): string {
  if (probability < 0.3) return 'Normal';
  if (probability < 0.45) return 'Inconclusive';
  if (probability < 0.6) return 'Mild';
  if (probability < 0.75) return 'Moderate';
  return 'Severe';
}

// ---------- Recommendations: fixed text, or Gemini wording ----------

function staticSuggestions(label: string, annotations: Annotation[]): string[] {
  if (label === 'Normal') return ['Continue with regular reading practice', 'Explore diverse reading materials'];
  const s = [
    'Enable OpenDyslexic font for better readability',
    'Increase line spacing to 1.8 or higher',
    'Use text-to-speech for audio support',
  ];
  if (annotations.some((a) => a.type === 'transposition')) s.push('Practice letter sequence recognition exercises');
  if (annotations.some((a) => a.type === 'omission')) s.push('Use visual tracking guides while reading');
  if (annotations.some((a) => a.type === 'substitution')) s.push('Work with a reading specialist on phonics');
  if (label === 'Moderate' || label === 'Severe') s.push('Consider professional assessment for personalized support');
  return s;
}

function errorMessage(text: string): string {
  try {
    const j = JSON.parse(text);
    const e = Array.isArray(j) ? j[0]?.error : j.error;
    if (e?.message) return (e.status ? e.status + ': ' : '') + e.message;
  } catch (_) { /* not JSON */ }
  return text.slice(0, 300);
}

// Sends only the label and the error list (not the texts) and asks for wording.
// Retries briefly on busy/rate-limit errors.
async function geminiRecommendations(label: string, probability: number, annotations: Annotation[]): Promise<{ suggestions: string[] } | { error: string }> {
  const errorList = annotations.slice(0, 10)
    .map((a) => `"${a.word}" (expected "${a.suggestion}", ${a.type})`).join('; ') || 'none';
  const body = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You write practical reading-support recommendations for a dyslexia SCREENING tool. It is not a diagnosis. The label and score were already computed by a rule-based system: do not change, question or re-score them. Reply only with JSON in the form {"suggestions": ["...", "..."]} containing 3 to 5 short, plain-language suggestions that match the error types listed.',
      },
      {
        role: 'user',
        content: `Screening label: ${label}. Score: ${Math.round(probability * 100)}%. Errors found: ${errorList}.`,
      },
    ],
  });
  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(20000),
      });
      if (r.ok) {
        const data = await r.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        const list = Array.isArray(parsed.suggestions)
          ? parsed.suggestions.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0).slice(0, 5)
          : [];
        if (list.length > 0) return { suggestions: list };
        return { error: 'unexpected reply format' };
      }
      lastError = `HTTP ${r.status} (${errorMessage(await r.text())})`;
      if (r.status !== 429 && r.status !== 503) break;
    } catch (e) {
      lastError = 'could not reach Gemini: ' + (e instanceof Error ? e.message : String(e));
    }
    if (attempt < 3) await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
  return { error: lastError };
}

// ---------- HTTP handler ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, text, reference_text } = await req.json();
    console.log('Received prediction request:', { user_id, textLength: text?.length, hasReference: !!reference_text });

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid input. User text must be at least 10 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usedReference = !!(reference_text && typeof reference_text === 'string' && reference_text.trim().length > 0);
    const scored = usedReference
      ? scoreAgainstReference(reference_text, text)
      : scorePatternOnly(text);

    const { annotations, totalWords } = scored;
    const errorRate = totalWords > 0 ? annotations.length / totalWords : 0;
    let probability = Math.min(0.95, errorRate * 2.5);
    if (totalWords < 10) probability = Math.max(0.4, probability * 0.7); // short texts: lower confidence
    const label = toLabel(probability);

    let suggestions = staticSuggestions(label, annotations);
    let recommendationsSource = 'built-in';
    let fallbackReason = '';

    if (usedReference && LOVABLE_API_KEY) {
      const g = await geminiRecommendations(label, probability, annotations);
      if ('suggestions' in g) {
        suggestions = g.suggestions;
        recommendationsSource = 'gemini';
      } else {
        fallbackReason = g.error;
        console.error('Gemini recommendations failed:', g.error);
      }
    }

    const result = {
      probability,
      label,
      annotations: annotations.slice(0, 20),
      suggestions,
      engine: usedReference ? 'rule-based' : 'pattern-match',
      recommendationsSource,
      ...(fallbackReason ? { fallbackReason } : {}),
    };

    console.log('Prediction result:', { label, probability, annotationCount: annotations.length, recommendationsSource });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in predict function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
