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
