import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X as XIcon } from 'lucide-react';

interface TagsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  // TODO: Add props for suggestions, tag creation/editing if needed later
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  className = "",
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    } else if (event.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full"
              onClick={() => removeTag(tag)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-grow h-8 px-1 border-none shadow-none focus-visible:ring-0"
        />
      </div>
      {/* TODO: Implement auto-suggest dropdown here if needed */}
    </div>
  );
};

// Basic usage example (can be removed or moved to a storybook/docs)
// const Example = () => {
//   const [currentTags, setCurrentTags] = useState<string[]>(["travel", "food"]);
//   return (
//     <div>
//       <p>Current tags: {currentTags.join(', ')}</p>
//       <TagsInput
//         tags={currentTags}
//         onTagsChange={setCurrentTags}
//         placeholder="Add new tags"
//       />
//     </div>
//   );
// };
