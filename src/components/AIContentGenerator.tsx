import { useState } from 'react';
import { usePEContext, buildAIPrompt, creativeLensExamples } from '../hooks/usePEContext';
import { Silhouette } from '../data/silhouettes';

interface AIContentGeneratorProps {
  silhouette: Silhouette | null;
  onGenerate?: (content: string) => void;
}

/**
 * AI Content Generator Component
 * Connects PE data to LLM for hyper-specific content generation
 */
export default function AIContentGenerator({ silhouette, onGenerate }: AIContentGeneratorProps) {
  const peContext = usePEContext(silhouette);
  const [userLens, setUserLens] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!silhouette || !peContext) {
    return (
      <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>
        Select a PE to generate AI content
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!userLens.trim()) return;

    setIsGenerating(true);

    // Build the full prompt with PE context
    const prompt = buildAIPrompt(peContext, userLens);

    // Simulate AI generation (replace with actual LLM API call)
    setTimeout(() => {
      const mockContent = `Based on the ${peContext.shoe} ${peContext.peName} from ${peContext.year}:

${peContext.fullContext}

Your request: "${userLens}"

[AI-generated hyper-specific content would appear here, tailored to this exact PE and user's creative vision]`;

      setGeneratedContent(mockContent);
      setIsGenerating(false);
      onGenerate?.(mockContent);
    }, 1500);
  };

  return (
    <div className="ai-generator" style={{
      padding: '2rem',
      background: 'rgba(18, 18, 18, 0.95)',
      borderRadius: '12px',
      border: '1px solid #2a2a2a',
      maxWidth: '600px',
      margin: '2rem auto',
    }}>
      <h3 style={{ color: '#d61f29', marginBottom: '1rem' }}>
        AI Content Generator — {peContext.peName}
      </h3>

      {/* PE Context Display */}
      <div style={{
        padding: '1rem',
        background: 'rgba(214, 31, 41, 0.1)',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        lineHeight: 1.6,
      }}>
        <strong>PE Context:</strong>
        <div style={{ marginTop: '0.5rem', color: '#aaa' }}>
          {peContext.shoe} • {peContext.athlete} • {peContext.year}
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          {peContext.description}
        </div>
      </div>

      {/* Creative Lens Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          Your Creative Lens
        </label>
        <textarea
          value={userLens}
          onChange={(e) => setUserLens(e.target.value)}
          placeholder="e.g., Design a locker room mural based on this PE..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            resize: 'vertical',
          }}
        />
        
        {/* Example Lenses */}
        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(creativeLensExamples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setUserLens(example)}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'rgba(214, 31, 41, 0.2)',
                border: '1px solid #d61f29',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(214, 31, 41, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(214, 31, 41, 0.2)';
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !userLens.trim()}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: isGenerating ? '#666' : '#d61f29',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: 600,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate AI Content'}
      </button>

      {/* Generated Content */}
      {generatedContent && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}>
          {generatedContent}
        </div>
      )}
    </div>
  );
}

