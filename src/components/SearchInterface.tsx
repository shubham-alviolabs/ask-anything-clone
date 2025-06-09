
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase.functions.invoke('search-chat', {
        body: { query: userMessage.content },
      });

      if (error) throw error;

      // Handle streaming response
      const response = await fetch(`https://kjuziamuiiypucmwvrcd.supabase.co/functions/v1/search-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Alvio Search</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">Ask me anything</h2>
            <p>I'll search the web and provide comprehensive answers with sources.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-[80%] p-4 ${
              message.type === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>
          </div>
        ))}

        {/* Streaming message */}
        {isLoading && streamingContent && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-muted">
              <div className="whitespace-pre-wrap">{streamingContent}</div>
              <div className="flex items-center mt-2">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span className="text-xs opacity-70">Generating...</span>
              </div>
            </Card>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-muted">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching the web...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="flex space-x-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
