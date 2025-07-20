import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Search, 
  Filter,
  X,
  Hash,
  Palette,
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { TagService } from "@/services/TagService";
import { useAuth } from "@/services/auth-service";

interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const iconOptions = [
  { value: "Tag", label: "Tag", icon: <Tag size={16} /> },
  { value: "Hash", label: "Hash", icon: <Hash size={16} /> },
  { value: "Palette", label: "Palette", icon: <Palette size={16} /> },
  { value: "BookOpen", label: "BookOpen", icon: <BookOpen size={16} /> },
  { value: "Target", label: "Target", icon: <Target size={16} /> },
  { value: "Calendar", label: "Calendar", icon: <Calendar size={16} /> },
  { value: "TrendingUp", label: "TrendingUp", icon: <TrendingUp size={16} /> },
  { value: "BarChart3", label: "BarChart3", icon: <BarChart3 size={16} /> },
  { value: "PieChart", label: "PieChart", icon: <PieChart size={16} /> },
  { value: "Activity", label: "Activity", icon: <Activity size={16} /> },
];

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const auth = useAuth();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const loadedTags = await TagService.getAllTags();
      setTags(loadedTags);
    } catch (error: any) {
      toast.error(`Failed to load tags: ${error.message}`);
    }
  };

  const handleCreate = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }

    try {
      const newTag = await TagService.createTag({ name, description, color, icon });
      setTags([...tags, newTag]);
      setOpen(false);
      clearForm();
      toast.success("Tag created successfully!");
    } catch (error: any) {
      toast.error(`Failed to create tag: ${error.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }

    if (!editTag) {
      toast.error("No tag selected for update");
      return;
    }

    try {
      const updatedTag = await TagService.updateTag(editTag.id, { name, description, color, icon });
      setTags(tags.map(tag => tag.id === editTag.id ? updatedTag : tag));
      setOpen(false);
      clearForm();
      setEditTag(null);
      toast.success("Tag updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update tag: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await TagService.deleteTag(id);
      setTags(tags.filter(tag => tag.id !== id));
      toast.success("Tag deleted successfully!");
    } catch (error: any) {
      toast.error(`Failed to delete tag: ${error.message}`);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditTag(tag);
    setName(tag.name);
    setDescription(tag.description || "");
    setColor(tag.color || "");
    setIcon(tag.icon || "");
    setOpen(true);
  };

  const clearForm = () => {
    setName("");
    setDescription("");
    setColor("");
    setIcon("");
  };

  const filteredTags = tags.filter(tag => {
    const searchTerm = search.toLowerCase();
    const nameMatch = tag.name.toLowerCase().includes(searchTerm);
    const descriptionMatch = tag.description?.toLowerCase().includes(searchTerm);

    if (filter === "name" && !nameMatch) return false;
    if (filter === "description" && !descriptionMatch) return false;

    return nameMatch || descriptionMatch;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Tag Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTags.map((tag) => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{tag.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{tag.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge style={{ backgroundColor: tag.color, color: 'white' }}>{tag.color}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {iconOptions.find(option => option.value === tag.icon)?.icon || <div className="text-sm text-gray-500 dark:text-gray-400">No Icon</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>
                  <Input
                    type="color"
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="icon" className="text-right">
                    Icon
                  </Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => { setOpen(false); clearForm(); setEditTag(null); }}>
                  Cancel
                </Button>
                <Button type="submit" onClick={editTag ? handleUpdate : handleCreate}>
                  {editTag ? "Update Tag" : "Create Tag"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
