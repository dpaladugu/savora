import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Tag as TagIcon, Edit2, Trash2, Palette, AlertTriangleIcon, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db, DexieTagRecord } from "@/db"; // Using DexieTagRecord from db.ts
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
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

// Form Data Type for Tag
type TagFormData = Partial<Omit<DexieTagRecord, 'created_at' | 'updated_at'>> & {
  // name is required for saving
};

export function TagManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<DexieTagRecord | null>(null);
  const [tagToDelete, setTagToDelete] = useState<DexieTagRecord | null>(null);
  // const [searchTerm, setSearchTerm] = useState(""); // For future search/filter
  const { toast } = useToast();

  // Fetch tags live from Dexie, ordered by name
  const tags = useLiveQuery(
    () => db.tags.orderBy('name').toArray(),
    [], // dependencies
    []  // initial value
  );

  const handleAddNew = () => {
    setEditingTag(null);
    setShowForm(true);
  };

  const handleEdit = (tag: DexieTagRecord) => {
    setEditingTag(tag);
    setShowForm(true);
  };

  const openDeleteConfirm = (tag: DexieTagRecord) => {
    setTagToDelete(tag);
  };

  const handleDeleteExecute = async () => {
    if (!tagToDelete || !tagToDelete.id) return;
    try {
      // TODO: Check if tag is in use by expenses before deleting, or handle orphaned tags.
      // For now, direct delete.
      await db.tags.delete(tagToDelete.id);
      toast({ title: "Success", description: `Tag "${tagToDelete.name}" deleted.` });
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({ title: "Error", description: "Could not delete tag.", variant: "destructive" });
    } finally {
      setTagToDelete(null);
    }
  };

  if (tags === undefined) {
     return (
        <div className="flex justify-center items-center h-64 p-4">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
            <p className="ml-4 text-lg text-muted-foreground">Loading tags...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Tags</h1>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Tag
        </Button>
      </div>

      {/* Form will be rendered here when showForm is true */}
      {showForm && (
        <AddEditTagForm
          initialData={editingTag}
          onClose={() => { setShowForm(false); setEditingTag(null); }}
        />
      )}

      {tags.length === 0 && !showForm ? (
        <Card className="border-dashed mt-6">
          <CardContent className="p-6 text-center">
            <TagIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tags Created Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create tags to categorize your expenses and other items.
            </p>
            <Button onClick={handleAddNew}>
              <PlusCircle className="w-4 h-4 mr-2" /> Create First Tag
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
                    <span className="font-medium text-foreground">{tag.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tag)} className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(tag)} className="h-8 w-8 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {tagToDelete && (
        <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent className="flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2 text-destructive"/>Are you sure?</AlertDialogTitleComponent>
              <AlertDialogDescription>
                This will permanently delete the tag: "{tagToDelete.name}".
                This might affect existing items using this tag.
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


// --- AddEditTagForm Sub-Component (Placeholder for now, will be implemented in next step) ---
interface AddEditTagFormProps {
  initialData?: DexieTagRecord | null;
  onClose: () => void;
}

function AddEditTagForm({ initialData, onClose }: AddEditTagFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TagFormData>(() => {
    const defaults: TagFormData = { name: '', color: '#cccccc', user_id: 'default_user' };
    return initialData ? { ...initialData } : defaults;
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const defaults: TagFormData = { name: '', color: '#cccccc', user_id: 'default_user' };
    if (initialData) {
      setFormData({ ...initialData, id: initialData.id });
    } else {
      setFormData(defaults);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formData.name?.trim()) {
      toast({ title: "Validation Error", description: "Tag Name is required.", variant: "destructive" });
      setIsSaving(false); return;
    }

    const recordData: Omit<DexieTagRecord, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name!.trim(),
      color: formData.color || undefined,
      user_id: formData.user_id || 'default_user',
    };

    try {
      if (formData.id) { // Update
        await db.tags.update(formData.id, { ...recordData, name: recordData.name.toLowerCase(), updated_at: new Date() }); // Ensure name is stored consistently
        toast({ title: "Success", description: "Tag updated." });
      } else { // Add
        // Check for uniqueness (name per user_id) before adding
        const existingTag = await db.tags.where({user_id: recordData.user_id, name: recordData.name.toLowerCase()}).first();
        if (existingTag) {
            toast({ title: "Duplicate Tag", description: `Tag "${recordData.name}" already exists.`, variant: "warning" });
            setIsSaving(false);
            return;
        }
        const newId = self.crypto.randomUUID();
        await db.tags.add({ ...recordData, name: recordData.name.toLowerCase(), id: newId, created_at: new Date(), updated_at: new Date() });
        toast({ title: "Success", description: "Tag added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save tag:", error);
      toast({ title: "Database Error", description: `Could not save tag. ${error instanceof Error ? error.message : ''}`, variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Create New'} Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Name *</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required
                   className={formErrors.name ? 'border-red-500' : ''}/>
            {formErrors.name && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon className="w-3 h-3 mr-1"/>{formErrors.name}</p>}
          </div>
          <div>
            <Label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Color (Optional)</Label>
            <div className="flex items-center gap-2">
                <Input id="color" name="color" type="color" value={formData.color || '#cccccc'} onChange={handleChange} className="w-16 h-10 p-1 rounded-md border" />
                <Input value={formData.color || '#cccccc'} onChange={handleChange} name="color" placeholder="#RRGGBB" className="flex-grow"/>
            </div>
            {formErrors.color && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon className="w-3 h-3 mr-1"/>{formErrors.color}</p>}
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
