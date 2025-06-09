
import React, { useState, useRef, useEffect } from 'react';
import { SearchWelcome } from '@/components/SearchWelcome';
import { SearchInput } from '@/components/SearchInput';
import { SearchResponse } from '@/components/SearchResponse';
import { RelatedQuestions } from '@/components/RelatedQuestions';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
}

interface SearchSession {
  id: string;
  query: string;
  response: string;
  sources: SearchResult[];
  relatedQuestions: string[];
  timestamp: Date;
}

export const SearchInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [currentSources, setCurrentSources] = useState<SearchResult[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentRelatedQuestions, setCurrentRelatedQuestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentResponse]);

  const trackUsage = async (action: string, metadata?: any) => {
    if (!user) return;
    
    try {
      await supabase.from('usage_analytics').insert({
        user_id: user.id,
        action,
        metadata,
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setIsStreaming(true);
    setCurrentResponse('');
    setCurrentSources([]);
    setCurrentRelatedQuestions([]);
    setQuery('');

    await trackUsage('search_started', { query: searchQuery });

    try {
      const response = await fetch('https://kjuziamuiiypucmwvrcd.supabase.co/functions/v1/search-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdXppYW11aWl5cHVjbXd2cmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMzMTEsImV4cCI6MjA2Mjg5OTMxMX0.wPjjGF0-dwzZUUa7boyzMZClFGw2fJ0Xw75YcSjJTZk`,
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle initial sources response
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.type === 'sources' && data.sources) {
          setCurrentSources(data.sources);
        }
        setIsSearching(false);
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content' && data.content) {
                accumulatedResponse += data.content;
                setCurrentResponse(accumulatedResponse);
              } else if (data.type === 'sources' && data.sources) {
                setCurrentSources(data.sources);
              } else if (data.type === 'related_questions' && data.questions) {
                setCurrentRelatedQuestions(data.questions);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Create session after streaming is complete
      const newSession: SearchSession = {
        id: crypto.randomUUID(),
        query: searchQuery,
        response: accumulatedResponse,
        sources: currentSources,
        relatedQuestions: currentRelatedQuestions,
        timestamp: new Date(),
      };

      setSessions(prev => [...prev, newSession]);
      setCurrentResponse('');
      
      await trackUsage('search_completed', { 
        query: searchQuery,
        response_length: accumulatedResponse.length,
        sources_count: currentSources.length
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
      
      await trackUsage('search_error', { 
        query: searchQuery,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSearching(false);
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    performSearch(suggestion);
  };

  const handleRelatedQuestionClick = (question: string) => {
    performSearch(question);
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied",
      description: "Response copied to clipboard",
    });
  };

  const handleShareResponse = (response: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Alvio Search Result',
        text: response,
      });
    } else {
      handleCopyResponse(response);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {sessions.length === 0 && !isSearching && !currentResponse ? (
        // Welcome Screen
        <div className="flex-1 flex flex-col">
          <SearchWelcome onSuggestionClick={handleSuggestionClick} />
          
          {/* Fixed Search Input */}
          <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto">
              <SearchInput
                value={query}
                onChange={setQuery}
                onSubmit={() => performSearch(query)}
                isLoading={isSearching}
                placeholder="Ask anything..."
                size="large"
              />
            </div>
          </div>
        </div>
      ) : (
        // Search Results View
        <div className="flex-1 flex flex-col">
          {/* Header with Logo and Search */}
          <div className="p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/59308f36-8f34-4d65-9847-07f6d15dc8eb.png" 
                  alt="Alvio" 
                  className="h-6 w-6"
                />
                <span className="text-lg font-semibold text-white">Alvio</span>
              </div>
              <div className="flex-1">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  onSubmit={() => performSearch(query)}
                  isLoading={isSearching}
                  placeholder="Ask a follow-up question..."
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Previous Sessions */}
              {sessions.map((session) => (
                <div key={session.id} className="space-y-6">
                  {/* User Query */}
                  <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <p className="text-white font-medium">{session.query}</p>
                  </Card>

                  {/* Response */}
                  <SearchResponse
                    content={session.response}
                    sources={session.sources}
                    isStreaming={false}
                    onCopy={() => handleCopyResponse(session.response)}
                    onShare={() => handleShareResponse(session.response)}
                  />

                  {/* Related Questions */}
                  {session.relatedQuestions.length > 0 && (
                    <RelatedQuestions
                      questions={session.relatedQuestions}
                      onQuestionClick={handleRelatedQuestionClick}
                    />
                  )}
                </div>
              ))}

              {/* Current Search */}
              {(isSearching || currentResponse) && (
                <div className="space-y-6">
                  {/* Current Query */}
                  <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <p className="text-white font-medium">{query || sessions[sessions.length - 1]?.query}</p>
                  </Card>

                  {/* Streaming Response */}
                  <SearchResponse
                    content={currentResponse}
                    sources={currentSources}
                    isStreaming={isStreaming}
                    onCopy={() => handleCopyResponse(currentResponse)}
                    onShare={() => handleShareResponse(currentResponse)}
                  />

                  {/* Current Related Questions */}
                  {currentRelatedQuestions.length > 0 && (
                    <RelatedQuestions
                      questions={currentRelatedQuestions}
                      onQuestionClick={handleRelatedQuestionClick}
                    />
                  )}
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
