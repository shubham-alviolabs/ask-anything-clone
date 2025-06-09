
import React from 'react';
import { Card } from '@/components/ui/card';
import { Search, TrendingUp, BookOpen, Calendar, Globe } from 'lucide-react';

const searchSuggestions = [
  { text: "What are the latest developments in AI?", icon: TrendingUp },
  { text: "Explain quantum computing", icon: BookOpen },
  { text: "Current events in technology", icon: Calendar },
  { text: "Climate change solutions", icon: Globe },
];

interface SearchWelcomeProps {
  onSuggestionClick: (suggestion: string) => void;
}

export const SearchWelcome = ({ onSuggestionClick }: SearchWelcomeProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Logo and Title */}
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <img 
              src="/lovable-uploads/59308f36-8f34-4d65-9847-07f6d15dc8eb.png" 
              alt="Alvio" 
              className="h-12 w-12 opacity-90"
            />
            <h1 className="text-5xl font-semibold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Where knowledge begins
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Ask anything and get comprehensive answers with sources, powered by advanced AI search.
          </p>
        </div>

        {/* Search Suggestions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-300">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {searchSuggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <Card 
                  key={index}
                  className="p-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group"
                  onClick={() => onSuggestionClick(suggestion.text)}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <IconComponent className="h-5 w-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    <span className="text-gray-200 group-hover:text-white transition-colors">
                      {suggestion.text}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
          <div className="text-center space-y-2">
            <Search className="h-8 w-8 text-purple-400 mx-auto" />
            <h4 className="font-medium text-gray-200">Real-time Search</h4>
            <p className="text-sm text-gray-400">Get the latest information from across the web</p>
          </div>
          <div className="text-center space-y-2">
            <BookOpen className="h-8 w-8 text-purple-400 mx-auto" />
            <h4 className="font-medium text-gray-200">Cited Sources</h4>
            <p className="text-sm text-gray-400">Every answer includes verified sources and citations</p>
          </div>
          <div className="text-center space-y-2">
            <TrendingUp className="h-8 w-8 text-purple-400 mx-auto" />
            <h4 className="font-medium text-gray-200">Follow-up Questions</h4>
            <p className="text-sm text-gray-400">Explore topics deeper with suggested questions</p>
          </div>
        </div>
      </div>
    </div>
  );
};
