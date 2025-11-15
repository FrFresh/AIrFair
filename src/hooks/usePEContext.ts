import { useMemo } from 'react';
import { Silhouette } from '../data/silhouettes';

/**
 * Builds rich context for AI prompts based on PE data
 */
export function usePEContext(silhouette: Silhouette | null) {
  const context = useMemo(() => {
    if (!silhouette) return null;

    return {
      // Core PE information
      shoe: silhouette.title,
      athlete: silhouette.pe.athlete,
      peName: silhouette.pe.peName,
      year: silhouette.pe.year,
      
      // Rich context for AI
      description: silhouette.description || silhouette.pe.summary,
      story: silhouette.pe.summary,
      reference: silhouette.reference,
      
      // Styling context
      colorScheme: silhouette.pedestalColor,
      
      // Combined context string for LLM
      fullContext: `
PE Shoe: ${silhouette.title}
Athlete: ${silhouette.pe.athlete}
PE Name: ${silhouette.pe.peName}
Year: ${silhouette.pe.year}
Description: ${silhouette.description || silhouette.pe.summary}
Story: ${silhouette.pe.summary}
Reference: ${silhouette.reference || 'N/A'}
      `.trim(),
    };
  }, [silhouette]);

  return context;
}

/**
 * Builds an AI prompt by combining user creative lens with PE context
 */
export function buildAIPrompt(
  peContext: ReturnType<typeof usePEContext>,
  userLens: string
): string {
  if (!peContext) {
    return userLens;
  }

  return `You are a creative AI assistant specializing in sneaker culture and athlete storytelling.

**Player Exclusive Context:**
${peContext.fullContext}

**User's Creative Request:**
${userLens}

Based on the PE's history, athlete's legacy, and specific details, generate a hyper-specific response that authentically weaves together the sneaker's story with the user's creative vision.`;
}

/**
 * Example prompts that demonstrate different creative lenses
 */
export const creativeLensExamples = {
  design: "Design a locker room mural based on this PE",
  story: "Write a short story capturing a defining moment for this athlete wearing these shoes",
  marketing: "Create a social media campaign concept celebrating this PE",
  culture: "Explain how this PE influenced basketball culture and sneaker collecting",
  details: "Describe the design details and what makes this PE unique",
};



