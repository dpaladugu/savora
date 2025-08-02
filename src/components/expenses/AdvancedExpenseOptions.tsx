
import React from 'react';
import { TagsInput } from '@/components/tags/TagsInput';
import { Label } from '@/components/ui/label';

interface AdvancedExpenseOptionsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  userId?: string;
}

export const AdvancedExpenseOptions: React.FC<AdvancedExpenseOptionsProps> = ({
  tags,
  onTagsChange,
  userId,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="tags">Tags</Label>
        <TagsInput
          value={tags}
          onChange={onTagsChange}
          placeholder="Add relevant tags..."
          userId={userId}
          className="mt-1"
        />
      </div>
    </div>
  );
};
