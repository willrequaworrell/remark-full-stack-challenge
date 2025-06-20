
import { tool } from 'ai';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

interface ConsolidatedMetadata {
  trackId: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export const consolidateMetadata = tool({
  description: 'Extract and consolidate BPM and key information from GetSongBPM and web search data',
  parameters: z.object({
    trackData: z.object({
      id: z.string(),
      title: z.string(),
      artist: z.string(),
      getsongbmpData: z.any().optional(),
      webData: z
        .union([
          z.object({ results: z.array(z.object({ snippet: z.string(), link: z.string() })) }),
          z.object({ error: z.string(), suggestion: z.string() })
        ])
        .optional()
    })
  }),
  execute: async ({ trackData }, options) => {
    const { id, title, artist, getsongbmpData, webData } = trackData;
    console.log(options)
    // Build system prompt for metadata extraction
    const systemPrompt = `
You are a music metadata expert. Extract only valid JSON—absolutely no markdown fences (e.g., \`\`\`, “json”), no surrounding text.  
Output must match this JSON schema exactly:
{
  "bpm": number|null,
  "key": string|null,
  "confidence": "high"|"medium"|"low",
  "reasoning": string
}
Do not include any commentary or formatting.  
`;

    // Build user prompt including available data
    let userPrompt = `Track: "${title}" by ${artist}\n`;
    if (getsongbmpData) {
      userPrompt += `API Data: ${JSON.stringify(getsongbmpData)}\n`;
    }
    if (webData && 'results' in webData) {
      userPrompt += `Web Search Snippets:\n${webData.results.map(r => `- ${r.snippet}`).join('\n')}\n`;
    } else if (webData && 'error' in webData) {
      userPrompt += `Web search error: ${webData.error}. Suggestion: ${webData.suggestion}\n`;
    } else {
      userPrompt += `No web data available.\n`;
    }

    try {
      // Invoke AI model to parse and unify metadata
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1
      });
      
      const parsed: Omit<ConsolidatedMetadata, 'trackId' | 'title' | 'artist'> = JSON.parse(text);
      return {
        trackId: id,
        title,
        artist,
        bpm: parsed.bpm ?? null,
        key: parsed.key ?? null,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning
      };
    } catch (err) {
      // Fallback on parsing failure
      console.log(err)
      return {
        trackId: id,
        title,
        artist,
        bpm: null,
        key: null,
        confidence: 'low',
        reasoning: 'Parsing failed or no valid data available'
      };
    }
  }
});
