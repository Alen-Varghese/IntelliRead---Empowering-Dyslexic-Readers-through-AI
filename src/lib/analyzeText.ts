import { invokeFunction } from "@/lib/api";

export interface Annotation {
  word: string;
  type: 'transposition' | 'omission' | 'substitution' | 'insertion' | 'reversal';
  suggestion: string;
  position?: number;
}

export interface AnalysisResult {
  probability: number;
  label: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Inconclusive';
  annotations: Annotation[];
  suggestions: string[];
  engine?: 'rule-based' | 'pattern-match';
  recommendationsSource?: 'gemini' | 'built-in';
  fallbackReason?: string;
  /** Words in the REFERENCE text that look wrong (see predict/index.ts). */
  referenceIssues?: ReferenceIssue[];
  /** The reference text with every suggested fix applied. */
  correctedReference?: string;
  /** True when the two texts do not look like the same passage. */
  referenceMismatch?: boolean;
  contextCheck?: 'gemini' | 'skipped' | 'failed';
  contextCheckError?: string;
}

export interface ReferenceIssue {
  reference: string;
  learner: string;
  suggestion: string;
  reason: 'not-a-word' | 'context';
  counted: boolean;
  /** Other likely corrections, best first. */
  alternatives?: string[];
  /** Position among the reference text's whitespace-separated words. */
  raw: number;
}

/** Replaces reference words by position, keeping spacing, line breaks, punctuation and capitals. */
export function applyReferenceFixes(referenceText: string, fixes: Map<number, string>): string {
  let k = -1;
  return referenceText.split(/(\s+)/).map((part) => {
    if (!part || /^\s+$/.test(part)) return part;
    k++;
    const fix = fixes.get(k);
    if (!fix) return part;
    const m = part.match(/^([^\p{L}\p{N}']*)(.*?)([^\p{L}\p{N}']*)$/u)!;
    const core = /^\p{Lu}/u.test(m[2]) ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;
    return m[1] + core + m[3];
  }).join('');
}

export async function analyzeText(text: string, userId: string = 'guest', referenceText?: string): Promise<AnalysisResult> {
  try {
    const { data, error } = await invokeFunction('predict', {
      body: { 
        user_id: userId, 
        text,
        reference_text: referenceText 
      }
    });

    if (error) {
      throw error;
    }

    return data as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}
