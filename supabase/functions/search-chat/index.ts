
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
    
    return data.results?.slice(0, 10) || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function generateRelatedQuestions(query: string, content: string): Promise<string[]> {
  try {
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
        messages: [
          {
            role: 'system',
            content: 'Generate 4 related follow-up questions based on the user\'s original query and the content provided. Return only the questions, one per line, without numbering or bullet points.'
          },
          {
            role: 'user',
            content: `Original query: ${query}\n\nContent: ${content.slice(0, 1000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const questions = data.choices?.[0]?.message?.content?.trim()
      .split('\n')
      .filter((q: string) => q.trim())
      .slice(0, 4) || [];
    
    return questions;
  } catch (error) {
    console.error('Error generating related questions:', error);
    return [];
  }
}

async function generateStreamingResponse(query: string, searchResults: SearchResult[]): Promise<ReadableStream> {
  const context = searchResults.map((result, index) => 
    `[${index + 1}] ${result.title}\n${result.content}\nURL: ${result.url}`
  ).join('\n\n');

  const prompt = `You are Alvio Search, an AI search assistant that provides comprehensive, accurate answers with proper citations.

CRITICAL INSTRUCTIONS:
- Provide a detailed, well-structured answer using the search results
- Use numbered citations [1], [2], etc. throughout your response to reference sources
- Structure your answer with clear sections and headings when appropriate
- Be comprehensive but concise
- Maintain a professional, helpful tone
- Focus on accuracy and cite specific sources for claims

Search Results:
${context}

User Question: ${query}

Provide a comprehensive answer with proper citations:`;

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
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) return;

      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Generate related questions after the main response is complete
            try {
              const relatedQuestions = await generateRelatedQuestions(query, fullContent);
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                type: 'related_questions', 
                questions: relatedQuestions 
              })}\n\n`));
            } catch (e) {
              console.error('Error generating related questions:', e);
            }
            
            controller.close();
            return;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                    type: 'content', 
                    content 
                  })}\n\n`));
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

    // Send sources first
    const sourcesResponse = new Response(JSON.stringify({ 
      type: 'sources', 
      sources: searchResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // Then start streaming response
    const stream = await generateStreamingResponse(query, searchResults);

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
