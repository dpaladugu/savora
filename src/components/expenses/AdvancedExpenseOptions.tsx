import React from 'react';
import { TagsInput } from '@/components/tags/TagsInput';
import { Label } from '@/components/ui/label';

interface AdvancedExpenseOptionsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  userId?: string; // Add userId prop
}

export const AdvancedExpenseOptions: React.FC<AdvancedExpenseOptionsProps> = ({
  tags,
  onTagsChange,
  userId, // Destructure userId
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="tags">Tags</Label>
        <TagsInput
          tags={tags}
          onTagsChange={onTagsChange}
          placeholder="Add relevant tags..."
          userId={userId} // Pass userId to TagsInput
          className="mt-1"
        />
      </div>
    </div>
  );
};
