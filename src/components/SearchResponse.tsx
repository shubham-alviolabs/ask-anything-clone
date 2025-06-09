
import React from 'react';
import { Card } from '@/components/ui/card';
import { SourceCard } from '@/components/SourceCard';
import { Copy, Share, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
}

interface SearchResponseProps {
  content: string;
  sources: SearchResult[];
  isStreaming: boolean;
  onCopy?: () => void;
  onShare?: () => void;
}

const formatResponseContent = (content: string) => {
  // Convert markdown-style formatting to HTML
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-white">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="text-xl font-semibold mt-6 mb-3 text-white">$1</h2>')
    .replace(/# (.*?)\n/g, '<h1 class="text-2xl font-bold mt-6 mb-4 text-white">$1</h1>')
    .replace(/\[(\d+)\]/g, '<sup class="text-purple-300 font-medium text-xs bg-purple-500/20 px-1.5 py-0.5 rounded-md ml-1">$1</sup>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br/>');

  // Wrap in paragraphs if not already wrapped
  if (!formatted.includes('<p>') && !formatted.includes('<h')) {
    formatted = `<p class="mb-4">${formatted}</p>`;
  }

  return formatted;
};

export const SearchResponse = ({ 
  content, 
  sources, 
  isStreaming, 
  onCopy, 
  onShare 
}: SearchResponseProps) => {
  return (
    <div className="space-y-6">
      {/* Main Response */}
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Answer</h3>
            <div className="flex items-center space-x-2">
              {onCopy && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onCopy}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
              {onShare && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onShare}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Share className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div 
              className="text-gray-100 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatResponseContent(content) }}
            />
            {isStreaming && (
              <div className="flex items-center mt-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-purple-400" />
                <span className="text-sm text-gray-400">Generating response...</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source, index) => (
              <a 
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <SourceCard source={source} index={index + 1} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
