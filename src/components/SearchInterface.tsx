
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const SearchInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Handle streaming response directly
      const response = await fetch(`https://kjuziamuiiypucmwvrcd.supabase.co/functions/v1/search-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdXppYW11aWl5cHVjbXd2cmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMzMTEsImV4cCI6MjA2Mjg5OTMxMX0.wPjjGF0-dwzZUUa7boyzMZClFGw2fJ0Xw75YcSjJTZk`,
        },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setStreamingContent(assistantContent);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add final assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      
    } catch (error) {
      console.error('Search error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while searching. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/59308f36-8f34-4d65-9847-07f6d15dc8eb.png" 
              alt="Alvio" 
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Alvio Search
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="max-w-4xl w-full text-center space-y-8">
            <div className="space-y-4">
              <img 
                src="/lovable-uploads/59308f36-8f34-4d65-9847-07f6d15dc8eb.png" 
                alt="Alvio" 
                className="h-16 w-16 mx-auto opacity-80"
              />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Ask me anything
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                I'll search the web and provide comprehensive answers with sources, powered by advanced AI.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What would you like to know?"
                  className="w-full h-14 pl-6 pr-14 text-lg bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !query.trim()}
                  size="icon"
                  className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="w-full max-w-4xl flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <Card className={`max-w-[80%] p-6 backdrop-blur-xl border-white/20 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white' 
                      : 'bg-white/10 text-gray-100'
                  } rounded-2xl`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    <div className="text-xs opacity-60 mt-3">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </Card>
                </div>
              ))}

              {/* Streaming message */}
              {isLoading && streamingContent && (
                <div className="flex justify-start">
                  <Card className="max-w-[80%] p-6 bg-white/10 backdrop-blur-xl border-white/20 text-gray-100 rounded-2xl">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{streamingContent}</div>
                    <div className="flex items-center mt-3">
                      <Loader2 className="h-3 w-3 animate-spin mr-2 text-purple-400" />
                      <span className="text-xs opacity-60">Generating response...</span>
                    </div>
                  </Card>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <Card className="max-w-[80%] p-6 bg-white/10 backdrop-blur-xl border-white/20 text-gray-100 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                      <span className="text-sm">Searching the web...</span>
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Input at Bottom */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a follow-up question..."
                  className="w-full h-12 pl-6 pr-14 bg-white/10 border-white/20 backdrop-blur-xl rounded-xl text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !query.trim()}
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
