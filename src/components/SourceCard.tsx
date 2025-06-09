
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink, Globe } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface SourceCardProps {
  source: {
    title: string;
    url: string;
    content: string;
    engine?: string;
    favicon?: string;
  };
  index: number;
}

export const SourceCard = ({ source, index }: SourceCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(source.url);
  const domain = new URL(source.url).hostname;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card className="p-3 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <span className="text-sm font-medium text-purple-200">{index}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {faviconUrl && !imageError ? (
                  <img 
                    src={faviconUrl} 
                    alt="" 
                    className="w-4 h-4"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Globe className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs text-gray-400 truncate">{domain}</span>
              </div>
              <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-2">
                {source.title}
              </h4>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-gray-900/95 border-white/20 backdrop-blur-xl">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {faviconUrl && !imageError ? (
              <img 
                src={faviconUrl} 
                alt="" 
                className="w-5 h-5"
                onError={() => setImageError(true)}
              />
            ) : (
              <Globe className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h4 className="font-medium text-white text-sm">{source.title}</h4>
              <p className="text-xs text-gray-400">{domain}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {source.content.slice(0, 200)}...
          </p>
          <a 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Visit source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
