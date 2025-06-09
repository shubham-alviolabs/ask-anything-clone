
import React from 'react';
import { Card } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

interface RelatedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export const RelatedQuestions = ({ questions, onQuestionClick }: RelatedQuestionsProps) => {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <HelpCircle className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-white">Related Questions</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {questions.map((question, index) => (
          <Card 
            key={index}
            className="p-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group"
            onClick={() => onQuestionClick(question)}
          >
            <p className="text-gray-200 group-hover:text-white transition-colors text-sm">
              {question}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
