"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
import { useProjectCreation } from "@/hooks/use-project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const CreateProject = () => {
  const { createProject, isCreating, canCreate } = useProjectCreation();
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    
    await createProject(projectName.trim() || undefined);
    setIsOpen(false);
    setProjectName("");
  };

  return (
    <>
      <Button
        variant="default"
        onClick={() => setIsOpen(true)}
        disabled={!canCreate || isCreating}
        className="flex items-center gap-2 cursor-pointer rounded-full">
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlusIcon className="h-4 w-4" />
        )}
        {isCreating ? "Creating..." : "New Project"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Project</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-xs font-semibold text-zinc-400 mb-2 block">
                Project Name
              </label>
              <Input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-zinc-900 border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white"
                placeholder="e.g. My Awesome Design"
                autoFocus
                disabled={isCreating}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white bg-transparent"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold border-0"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
