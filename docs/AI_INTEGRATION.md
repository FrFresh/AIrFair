# AI Integration Guide

Connecting PE data to AI/LLM for hyper-specific content generation.

## Overview

The AI integration system takes Player Exclusive (PE) data and combines it with user's creative lens to generate context-specific content. Instead of generic prompts, users get responses deeply rooted in sneaker culture, athlete history, and specific PE details.

## Architecture

### 1. PE Context Hook (`usePEContext`)

Builds rich context from PE data:

```tsx
import { usePEContext } from '../hooks/usePEContext';

const peContext = usePEContext(silhouette);
// Returns: shoe, athlete, year, description, fullContext string
```

### 2. AI Prompt Builder (`buildAIPrompt`)

Combines user creative lens with PE context:

```tsx
import { buildAIPrompt } from '../hooks/usePEContext';

const prompt = buildAIPrompt(peContext, userLens);
// Returns: Formatted prompt ready for LLM
```

### 3. AIContentGenerator Component

React component that provides UI for:
- Displaying PE context
- Input for creative lens
- Example prompts
- Generated content display

## Usage Example

```tsx
import AIContentGenerator from './components/AIContentGenerator';

// In your component
<AIContentGenerator
  silhouette={currentSilhouette}
  onGenerate={(content) => console.log(content)}
/>
```

## Creative Lens Examples

Users can choose from pre-built creative lenses:

### Design
"Design a locker room mural based on this PE"

### Story
"Write a short story capturing a defining moment for this athlete wearing these shoes"

### Marketing
"Create a social media campaign concept celebrating this PE"

### Culture
"Explain how this PE influenced basketball culture and sneaker collecting"

### Details
"Describe the design details and what makes this PE unique"

## Integration with LLM

### Current Implementation
- Mock/simulated AI generation for demo
- Placeholder responses based on PE context

### Production Integration

Replace the mock with your LLM API:

```tsx
const handleGenerate = async () => {
  const prompt = buildAIPrompt(peContext, userLens);
  
  // Call your LLM API (OpenAI, Claude, etc.)
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  
  const content = await response.json();
  setGeneratedContent(content);
};
```

## PE Data Structure

The AI system uses:

```typescript
{
  shoe: string,           // "Air Jordan 12"
  athlete: string,        // "Ray Allen"
  peName: string,         // "Sugar Ray PE"
  year: number,           // 2008
  description: string,    // Full context
  story: string,          // Summary
  reference: string,      // Source URL
  fullContext: string     // Combined for LLM
}
```

## Example Output

**Input:**
- PE: Air Jordan 12 - Ray Allen (2008)
- Lens: "Design a locker room mural"

**Output:**
"[AI generates a mural concept specifically referencing Ray Allen's shooting precision, the AJ12's Japanese Rising Sun inspiration, the 2008 championship context, and the Boston Celtics color scheme - all woven together into a cohesive design brief]"

## Builder Fellow Application Flow

1. User selects "Marquette Golden Eagles PE" (or any PE)
2. App loads PE context from data
3. User enters creative lens: "design a locker room mural"
4. System builds prompt combining:
   - PE description and history
   - Athlete's legacy and college
   - User's creative request
5. LLM generates hyper-specific content
6. User gets personalized, context-rich output

## Benefits

- **Hyper-specific**: Content tied to exact PE, athlete, year
- **Contextual**: Uses sneaker history, athlete career, design details
- **Personalized**: Combines PE data with user's vision
- **Authentic**: Grounded in real sneaker culture

## Future Enhancements

- Real-time streaming responses
- Save generated content to collection
- Share AI-generated stories
- Generate multiple variations
- Export content in different formats



