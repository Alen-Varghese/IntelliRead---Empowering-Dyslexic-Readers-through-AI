import { invokeFunction } from "@/lib/api";

export interface Annotation {
  word: string;
  type: 'transposition' | 'omission' | 'substitution';
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
