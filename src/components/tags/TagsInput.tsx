import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X as XIcon } from 'lucide-react';
import { db } from '@/db'; // Dexie instance
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from "@/hooks/use-toast"; // For auto-add notification

interface TagsInputProps {
  tags: string[]; // Current tags for the item being edited (e.g., an expense)
  onTagsChange: (tags: string[]) => void; // Callback to update parent's state
  placeholder?: string;
  className?: string;
  userId?: string; // For user-specific tags
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  className = "",
  userId, // Removed default_user fallback
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { toast } = useToast();

  // Step 1: Fetch tags from the new db.tags table
  const allMasterTags = useLiveQuery(async () => {
    if (!userId) return []; // Don't query if no user is provided
    const userTags = await db.tags.where({ user_id: userId }).sortBy('name');
    return userTags.map(tagRecord => tagRecord.name);
  }, [userId], []); // Re-run if userId changes

  useEffect(() => {
    if (inputValue.trim() === '') {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      return;
    }

    if (allMasterTags && allMasterTags.length > 0) {
      const currentInputLower = inputValue.toLowerCase();
      const suggestions = allMasterTags
        .filter(tagName =>
            tagName.toLowerCase().includes(currentInputLower) &&
            !tags.includes(tagName) // Don't suggest tags already added to the current item
        )
        .slice(0, 5); // Limit suggestions

      setFilteredSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setActiveIndex(-1);
    } else {
      // No master tags, or none match
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allMasterTags, tags]);

  const handleAddTag = async (tagToAdd: string) => {
    const newTagNameRaw = tagToAdd.trim();
    if (!newTagNameRaw) return;

    const newTagName = newTagNameRaw.toLowerCase(); // Normalize for storage and comparison

    // Add to the parent component's list of tags for the current item
    if (!tags.includes(newTagName) && !tags.includes(newTagNameRaw) /* check both just in case */) {
        // Prefer adding the normalized (lowercase) version to the item, or keep original casing?
        // For consistency with master list, let's use normalized. Parent can decide display casing.
        onTagsChange([...tags, newTagName]);
    }

    setInputValue('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    setActiveIndex(-1);

    // Step 2: Check if this tag exists in db.tags and add it if not. Only if userId is available.
    if (userId && allMasterTags && !allMasterTags.map(t=>t.toLowerCase()).includes(newTagName)) {
      try {
        const newTagRecord = {
          id: self.crypto.randomUUID(),
          user_id: userId,
          name: newTagName, // Store normalized name
          // color: '#cccccc',
          created_at: new Date(),
          updated_at: new Date(),
        };
        await db.tags.add(newTagRecord);
        toast({
          title: "New Tag Created",
          description: `Tag "${newTagName}" has been added to your master list.`,
          duration: 2000,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'ConstraintError') {
            console.warn(`Tag "${newTagName}" already exists in master list.`);
        } else {
            console.error("Failed to add new tag to master list:", error);
            toast({
                title: "Error Creating Tag",
                description: "Could not save the new tag to your master list.",
                variant: "destructive",
                duration: 2000,
            });
        }
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        handleAddTag(filteredSuggestions[activeIndex]);
      } else if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (event.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
      setShowSuggestions(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  const handleInputFocus = () => {
    if (inputValue.trim() !== '' && allMasterTags && filteredSuggestions.length > 0) {
        setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
        setShowSuggestions(false);
        setActiveIndex(-1);
    }, 150); // Delay to allow click on suggestion
  };

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-sm py-1 px-2 capitalize">
            {tag} {/* Display tag (could be original casing if onTagsChange sends that) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
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
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="flex-grow h-8 px-1 py-0 border-none shadow-none focus-visible:ring-0 bg-transparent"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="tags-suggestions-list"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          id="tags-suggestions-list"
          role="listbox"
          className="absolute z-10 w-full mt-1 top-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-3 py-2 cursor-pointer hover:bg-muted text-popover-foreground capitalize ${
                index === activeIndex ? 'bg-muted font-semibold' : ''
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
