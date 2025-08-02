import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search } from "lucide-react";
import { TagService } from "@/services/TagService";
import { useToast } from "@/hooks/use-toast";

export function TagManager() {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const tagList = await TagService.getTags();
      setTags(tagList);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await TagService.searchTags();
      setTags(results);
    } catch (error) {
      console.error('Failed to search tags:', error);
      toast({
        title: "Error",
        description: "Failed to search tags",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p>Loading tags...</p>;
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    setIsLoading(true);
    try {
      await TagService.addTag();
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
      setNewTag('');
      loadTags();
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async () => {
    setIsLoading(true);
    try {
      await TagService.deleteTag();
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
      loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Add a new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button onClick={handleAddTag} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="mr-2 h-4 w-4" />
            Search Tags
          </Button>
        </div>

        <div className="grid gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center justify-between">
              {tag}
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDeleteTag}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Badge>
          ))}
          {tags.length === 0 && <p>No tags found.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
