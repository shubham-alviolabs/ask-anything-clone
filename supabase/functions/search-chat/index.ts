
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const SEARXNG_URL = 'https://searx.alviolabs.com';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
}

async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json&engines=google,bing,duckduckgo`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    return data.results?.slice(0, 8) || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function generateResponse(query: string, searchResults: SearchResult[]): Promise<ReadableStream> {
  const context = searchResults.map((result, index) => 
    `[${index + 1}] ${result.title}\n${result.content}\nURL: ${result.url}`
  ).join('\n\n');

  const prompt = `You are Alvio Search, an AI search assistant that provides comprehensive answers with proper citations, similar to Perplexity AI.

IMPORTANT FORMATTING INSTRUCTIONS:
- Provide a well-structured, comprehensive answer
- Use numbered citations [1], [2], etc. to reference sources throughout your response
- Include a "Sources" section at the end with clickable links
- Be informative but concise
- Use clear headings and bullet points when appropriate
- Maintain a professional, helpful tone

Search Results:
${context}

User Question: ${query}

Provide a comprehensive answer with proper citations and a sources section at the end.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://alvio.app',
      'X-Title': 'Alvio Search',
    },
    body: JSON.stringify({
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.close();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing search query:', query);

    // Search the web
    const searchResults = await searchWeb(query);
    console.log(`Found ${searchResults.length} search results`);

    // Generate streaming response
    const stream = await generateResponse(query, searchResults);

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in search-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
