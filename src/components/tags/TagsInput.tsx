
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/db';

export interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  userId?: string;
  className?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  value = [],
  onChange,
  placeholder = "Add tags...",
  userId,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        // For now, we'll use a simple approach with existing expense and income data
        const expenses = await db.expenses.toArray();
        const incomes = await db.incomes.toArray();
        
        const allTags = new Set<string>();
        
        // Extract tags from expenses
        expenses.forEach(expense => {
          if (expense.tags && Array.isArray(expense.tags)) {
            expense.tags.forEach(tag => allTags.add(tag));
          }
        });

        setSuggestions(Array.from(allTags).slice(0, 10));
      } catch (error) {
        console.error('Error loading tag suggestions:', error);
        setSuggestions([]);
      }
    };

    if (userId) {
      loadSuggestions();
    }
  }, [userId]);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => handleRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddTag(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {suggestions.length > 0 && inputValue && (
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs text-muted-foreground mr-2">Suggestions:</span>
          {suggestions
            .filter(suggestion => 
              suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
              !value.includes(suggestion)
            )
            .slice(0, 5)
            .map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleAddTag(suggestion)}
              >
                {suggestion}
              </Badge>
            ))
          }
        </div>
      )}
    </div>
  );
};
