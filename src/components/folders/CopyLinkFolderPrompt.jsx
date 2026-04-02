import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import supabaseClient from '@/lib/supabaseClient';
import { findOrCreateFolderByName, assignPackageToFolder } from '@/lib/folderAssignment';

/**
 * After copying a share link: optional assign to folder + persist "don't show again".
 */
export default function CopyLinkFolderPrompt({
  open,
  onOpenChange,
  packageId,
  userId,
  onAssigned,
}) {
  const [name, setName] = useState('');
  const [dontShow, setDontShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const persistDontShow = async () => {
    if (dontShow && userId) {
      try {
        await supabaseClient.entities.User.update(userId, { hide_copy_link_folder_prompt: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async () => {
    if (!packageId || !userId) {
      setName('');
      setDontShow(false);
      onOpenChange(false);
      return;
    }
    setBusy(true);
    try {
      await persistDontShow();
      const trimmed = name.trim();
      if (trimmed) {
        const folder = await findOrCreateFolderByName(trimmed, userId);
        await assignPackageToFolder(packageId, folder.id, userId);
        onAssigned?.(folder);
      }
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
    setName('');
    setDontShow(false);
    onOpenChange(false);
  };

  const handleSkip = async () => {
    setBusy(true);
    try {
      await persistDontShow();
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
    setName('');
    setDontShow(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Link copied!</DialogTitle>
          <DialogDescription>
            Want to connect this package to a client or project? Type their name below.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="e.g. Sarah M."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          autoFocus
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dont-show-folder-prompt"
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(Boolean(v))}
          />
          <Label htmlFor="dont-show-folder-prompt" className="text-sm font-normal cursor-pointer">
            Don&apos;t show this again
          </Label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleSkip} disabled={busy}>
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="bg-[#ff0044] hover:bg-[#cc0033]"
          >
            {name.trim() ? 'Connect' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
