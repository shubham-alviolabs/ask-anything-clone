
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  size?: 'default' | 'large';
}

export const SearchInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading, 
  placeholder = "Ask anything...",
  size = 'default'
}: SearchInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const inputHeight = size === 'large' ? 'h-16' : 'h-12';
  const inputPadding = size === 'large' ? 'pl-6 pr-16' : 'pl-4 pr-12';
  const buttonSize = size === 'large' ? 'h-12 w-12' : 'h-8 w-8';
  const buttonPosition = size === 'large' ? 'right-2 top-2' : 'right-2 top-2';

  return (
    <div className="relative w-full">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={`${inputHeight} ${inputPadding} text-base bg-white/10 border-white/20 backdrop-blur-xl rounded-xl text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 resize-none`}
        disabled={isLoading}
      />
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !value.trim()}
        size="icon"
        className={`absolute ${buttonPosition} ${buttonSize} rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 disabled:opacity-50`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
