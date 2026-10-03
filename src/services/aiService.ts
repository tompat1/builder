/**
 * AI Service Integration Stub
 * Supports natural language building modification and automated module placement.
 */

export interface AIPlacementSuggestion {
  moduleId: string;
  category: 'doors' | 'windows' | 'loft';
  wallPosition: 'front' | 'back' | 'left' | 'right';
  coordinates: { x: number; y: number; z: number };
  rationale: string;
}

export async function requestAIConfiguration(prompt: string): Promise<AIPlacementSuggestion[]> {
  // Stub for LLM agent integration (e.g., Gemini 2.5 Flash / Claude)
  console.log(`[AI Architect] Analyzing configuration prompt: "${prompt}"`);
  return [
    {
      moduleId: 'FLENINGE',
      category: 'doors',
      wallPosition: 'front',
      coordinates: { x: 1.2, y: 0, z: 0 },
      rationale: 'Placed on front wall for optimal natural daylight alignment.'
    }
  ];
}
