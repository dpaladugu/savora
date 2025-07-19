
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Tag as TagIcon, Edit2, Trash2, Palette, AlertTriangle as AlertTriangleIcon, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db, DexieTagRecord } from "@/db";
import { TagService } from '@/services/TagService'; // Import the new service
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label'; // Import Label
import { useAuth } from '@/contexts/auth-context';

type TagFormData = Partial<Omit<DexieTagRecord, 'created_at' | 'updated_at' | 'name'>> & {
  name: string; // Name is always required for form, even if initially empty
};

export function TagManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<DexieTagRecord | null>(null);
  const [tagToDelete, setTagToDelete] = useState<DexieTagRecord | null>(null);
  const [deleteUsageCount, setDeleteUsageCount] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const tags = useLiveQuery(
    () => {
      if (!user?.uid) return [];
      return TagService.getTags(user.uid);
    },
    [user?.uid],
    []
  );

  const handleAddNew = () => {
    setEditingTag(null);
    setShowForm(true);
  };

  const handleEdit = (tag: DexieTagRecord) => {
    setEditingTag(tag);
    setShowForm(true);
  };

  const openDeleteConfirm = async (tag: DexieTagRecord) => {
    setTagToDelete(tag);
    try {
      const usageCount = await TagService.getTagUsageCount(tag.name);
      setDeleteUsageCount(usageCount);
    } catch (e) {
      console.error("Failed to get tag usage count", e);
      setDeleteUsageCount(null);
    }
  };

  const handleDeleteExecute = async () => {
    if (!tagToDelete || !tagToDelete.id) return;
    try {
      await TagService.deleteTag(tagToDelete.id);
      // Note: Orphaned tag strings in expenses might remain. A more robust solution
      // would be a batch update on the expenses table, which could be a new service method.
      toast({ title: "Success", description: `Tag "${tagToDelete.name}" deleted.` });
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not delete tag.", variant: "destructive" });
    } finally {
      setTagToDelete(null);
      setDeleteUsageCount(null);
    }
  };

  if (tags === undefined) {
     return (
        <div className="flex justify-center items-center h-64 p-4">
            <Loader2 aria-hidden="true" className="w-12 h-12 text-muted-foreground animate-spin" />
            <p className="ml-4 text-lg text-muted-foreground">Loading tags...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Tags</h1>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle aria-hidden="true" className="w-5 h-5 mr-2" />
          Add New Tag
        </Button>
      </div>

      {showForm && (
        <AddEditTagForm
          initialData={editingTag}
          onClose={() => { setShowForm(false); setEditingTag(null); }}
          userId={user?.uid || ''}
        />
      )}

      {tags && tags.length === 0 && !showForm ? (
        <Card className="border-dashed mt-6">
          <CardContent className="p-6 text-center">
            <TagIcon aria-hidden="true" className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tags Created Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create tags to categorize your expenses and other items.
            </p>
            <Button onClick={handleAddNew}>
              <PlusCircle aria-hidden="true" className="w-4 h-4 mr-2" /> Create First Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map(tag => (
            <Card key={tag.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-4 flex-grow flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {tag.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} aria-label={`Color ${tag.color}`}></div>}
                    <span className="font-medium text-foreground capitalize">{tag.name}</span> {/* Capitalize for display */}
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tag)} className="h-8 w-8" aria-label={`Edit tag ${tag.name}`}>
                        <Edit2 aria-hidden="true" className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(tag)} className="h-8 w-8 hover:text-destructive" aria-label={`Delete tag ${tag.name}`}>
                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tagToDelete && (
        <AlertDialog open={!!tagToDelete} onOpenChange={() => { setTagToDelete(null); setDeleteUsageCount(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent className="flex items-center">
                <AlertTriangleIcon aria-hidden="true" className="w-5 h-5 mr-2 text-destructive"/>Are you sure?
              </AlertDialogTitleComponent>
              <AlertDialogDescription>
                This will permanently delete the tag: "<strong>{tagToDelete.name}</strong>".
                {deleteUsageCount === null && <span className="block mt-2">Checking usage... <Loader2 className="inline w-3 h-3 animate-spin ml-1" /></span>}
                {deleteUsageCount !== null && deleteUsageCount > 0 &&
                  <span className="block mt-2 font-semibold text-destructive">This tag is currently used by {deleteUsageCount} expense(s). Deleting it will remove it from these items.</span>
                }
                 {deleteUsageCount !== null && deleteUsageCount === 0 &&
                  <span className="block mt-2">This tag is not currently used in any expenses.</span>
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExecute} className="bg-destructive hover:bg-destructive/90">Delete Tag</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

interface AddEditTagFormProps {
  initialData?: DexieTagRecord | null;
  onClose: () => void;
  userId: string;
}

function AddEditTagForm({ initialData, onClose, userId }: AddEditTagFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TagFormData>(() => {
    const defaults: TagFormData = { name: '', color: '#cccccc' };
    return initialData ? { ...initialData, name: initialData.name } : defaults;
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TagFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Set initial form data based on initialData or defaults, including user_id
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name,
        color: initialData.color || '#cccccc',
      });
    } else {
      setFormData({ name: '', color: '#cccccc' });
    }
    setFormErrors({});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof TagFormData]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TagFormData, string>> = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Tag Name is required.";
    } else if (formData.name.includes(',')) {
      newErrors.name = "Tag Name cannot contain commas.";
    }
    // Basic hex color validation (optional)
    if (formData.color && !/^#([0-9A-Fa-f]{3}){1,2}$/.test(formData.color)) {
        newErrors.color = "Invalid hex color format (e.g., #RRGGBB or #RGB).";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        toast({ title: "Validation Error", description: "Please correct the errors.", variant: "destructive", duration: 2000 });
        return;
    }
    setIsSaving(true);

    if (!validateForm()) {
        toast({ title: "Validation Error", description: "Please correct the errors.", variant: "destructive", duration: 2000 });
        return;
    }

    setIsSaving(true);

    const normalizedName = formData.name!.trim().toLowerCase();

    const recordData: Omit<DexieTagRecord, 'id' | 'created_at' | 'updated_at'> = {
      name: normalizedName,
      color: formData.color || undefined,
      user_id: userId,
    };

    try {
      if (formData.id) { // Editing existing tag
        if (initialData && normalizedName !== initialData.name.toLowerCase()) {
            const conflictingTag = await TagService.getTagByName(normalizedName, userId);
            if (conflictingTag && conflictingTag.id !== formData.id) {
                 toast({ title: "Duplicate Tag", description: `Tag "${formData.name!.trim()}" already exists.`, variant: "destructive" });
                 setIsSaving(false); return;
            }
        }
        await TagService.updateTag(formData.id, recordData);
        toast({ title: "Success", description: "Tag updated." });
      } else { // Adding new tag
        const existingTag = await TagService.getTagByName(normalizedName, userId);
        if (existingTag) {
            toast({ title: "Duplicate Tag", description: `Tag "${formData.name!.trim()}" already exists.`, variant: "destructive" });
            setIsSaving(false); return;
        }
        await TagService.addTag(recordData as Omit<DexieTagRecord, 'id'>);
        toast({ title: "Success", description: "Tag added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save tag:", error);
      toast({ title: "Database Error", description: (error as Error).message || `Could not save tag.`, variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const FieldError: React.FC<{ field: keyof TagFormData }> = ({ field }) =>
    formErrors[field] ? <p id={`${field}-error-tag`} className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/> {formErrors[field]}</p> : null;


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="add-tag-description">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Create New'} Tag</DialogTitle>
          <DialogDescription id="add-tag-description">
            {formData.id ? 'Update the details of your tag.' : 'Create a new tag to categorize your items.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Name *</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required
                   className={formErrors.name ? 'border-red-500' : ''}
                   aria-required="true"
                   aria-invalid={!!formErrors.name}
                   aria-describedby={formErrors.name ? "name-error-tag" : undefined}
            />
            <FieldError field="name"/>
          </div>
          <div>
            <Label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Color</Label>
            <div className="flex items-center gap-2">
                <Input id="color" name="color" type="color" value={formData.color || '#cccccc'} onChange={handleChange} className="w-16 h-10 p-1 rounded-md border" aria-label="Tag color picker"/>
                <Input value={formData.color || '#cccccc'} onChange={handleChange} name="color" placeholder="#RRGGBB"
                       className={`flex-grow ${formErrors.color ? 'border-red-500' : ''}`}
                       aria-invalid={!!formErrors.color}
                       aria-describedby={formErrors.color ? "color-error-tag" : undefined}
                />
            </div>
            <FieldError field="color"/>
          </div>
          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Tag' : 'Create Tag')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
