import React, { useState, useEffect, useMemo } from 'react';
import { Folder, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import supabaseClient from '@/lib/supabaseClient';
import { assignPackageToFolder, findOrCreateFolderByName } from '@/lib/folderAssignment';
import { toast } from '@/components/ui/use-toast';

/**
 * Compact folder assign control: shows current folder and dropdown to pick / create / clear.
 */
export default function AssignFolderMenu({
  packageId,
  userId,
  initialFolderId,
  onFolderChange,
  variant = 'outline',
  className = '',
}) {
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentFolderId(initialFolderId || null);
  }, [initialFolderId]);

  const loadFolders = async () => {
    if (!userId) return;
    try {
      const list = await supabaseClient.entities.Folder.filter({ created_by: userId }, '-updated_date');
      setFolders(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFolders();
  }, [userId]);

  const currentName = useMemo(() => {
    if (!currentFolderId) return null;
    const f = folders.find((x) => x.id === currentFolderId);
    return f?.name || '…';
  }, [currentFolderId, folders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, search]);

  const handleAssign = async (folderId) => {
    if (!packageId || !userId) return;
    setLoading(true);
    try {
      const { folder, previousFolder } = await assignPackageToFolder(packageId, folderId, userId);
      setCurrentFolderId(folderId || null);
      if (folderId && folder && previousFolder && previousFolder.id !== folder.id) {
        toast({
          title: `Moved from "${previousFolder.name}" to "${folder.name}"`,
        });
      } else if (folderId && folder && !previousFolder) {
        toast({ title: `Connected to "${folder.name}"` });
      } else if (!folderId && previousFolder) {
        toast({ title: `Removed from "${previousFolder.name}"` });
      }
      onFolderChange?.(folderId || null, folder);
      await loadFolders();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not update folder', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleCreateAndAssign = async () => {
    const name = search.trim();
    if (!name || !packageId || !userId) return;
    setLoading(true);
    try {
      const folder = await findOrCreateFolderByName(name, userId);
      const { previousFolder } = await assignPackageToFolder(packageId, folder.id, userId);
      setCurrentFolderId(folder.id);
      setSearch('');
      if (previousFolder) {
        toast({ title: `Moved from "${previousFolder.name}" to "${folder.name}"` });
      } else {
        toast({ title: `Connected to "${folder.name}"` });
      }
      onFolderChange?.(folder.id, folder);
      await loadFolders();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not create folder', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && loadFolders()}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          disabled={loading || !packageId}
          className={`rounded-full border-2 text-sm font-medium gap-1 max-w-[240px] ${className}`}
        >
          <Folder className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Folder: {currentName || 'None'}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <div className="p-2 border-b">
          <Input
            placeholder="Search or type new folder name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateAndAssign();
              }
            }}
            className="h-9"
          />
        </div>
        <DropdownMenuLabel className="text-xs text-gray-500">Your folders</DropdownMenuLabel>
        <ScrollArea className="h-48">
          {filtered.map((f) => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => handleAssign(f.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {currentFolderId === f.id && <Check className="w-4 h-4 text-[#ff0044]" />}
              <span className={currentFolderId === f.id ? 'font-medium' : ''}>{f.name}</span>
            </DropdownMenuItem>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-sm text-gray-500 text-center">No matches</div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        {search.trim() && (
          <DropdownMenuItem onClick={handleCreateAndAssign} className="text-[#ff0044] font-medium cursor-pointer">
            Create “{search.trim()}” and assign
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => handleAssign(null)}
          className="cursor-pointer text-gray-600"
        >
          Remove from folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
