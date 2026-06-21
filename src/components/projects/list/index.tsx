/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useProjectCreation } from "@/hooks/use-project";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/redux/store";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ProjectsList = () => {
  const { projects, createProject, deleteProject, renameProject, isCreating, canCreate } = useProjectCreation();
  const user = useAppSelector((state) => state.profile);

  // Create Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Delete Modal States
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename Modal States
  const [projectToRename, setProjectToRename] = useState<any>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <p className="text-lg">Please sign in to view your projects.</p>
      </div>
    );
  }

  const handleDeleteClick = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    if (deleteProject) {
      await deleteProject(projectToDelete._id);
    }
    setIsDeleting(false);
    setIsDeleteOpen(false);
    setProjectToDelete(null);
  };

  const handleRenameClick = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToRename(project);
    setRenameValue(project.name);
    setIsRenameOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!projectToRename || !renameValue.trim()) return;
    if (renameProject) {
      await renameProject(projectToRename._id, renameValue);
    }
    setIsRenameOpen(false);
    setProjectToRename(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    await createProject(newProjectName.trim() || undefined);
    setIsCreateOpen(false);
    setNewProjectName("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Your Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your design projects and continue where you left off.
          </p>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer border border-white/5"
            title="Create Project"
          >
            <Plus className="w-8 h-8 text-muted-foreground" />
          </button>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Click the plus button to create your first project
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project._id}
              href={`/dashboard/${user?.name}/canvas?project=${project._id}`}
              className="group cursor-pointer relative">
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted relative">
                  {project.thumbnail ? (
                    <Image
                      src={project.thumbnail}
                      alt={project.name}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Hover Edit and Delete Action Buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleRenameClick(project, e)}
                      className="p-1.5 rounded-md bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                      title="Rename Project"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(project, e)}
                      className="p-1.5 rounded-md bg-zinc-950/80 hover:bg-red-950/80 border border-white/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(project.lastModified), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── RENAME DIALOG MODAL ── */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-semibold text-zinc-400 mb-2 block">
              Project Name
            </label>
            <Input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white"
              placeholder="e.g. My New Project Name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsRenameOpen(false)}
              className="rounded-xl border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={!renameValue.trim()}
              className="rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold border-0"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE DIALOG MODAL ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-sm">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Project</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-xs font-semibold text-zinc-400 mb-2 block">
                Project Name
              </label>
              <Input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
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
                onClick={() => setIsCreateOpen(false)}
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

      {/* ── DELETE CONFIRMATION ALERT-DIALOG ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-500">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed mt-2">
              Are you sure you want to delete <span className="text-white font-semibold">&quot;{projectToDelete?.name}&quot;</span>? This action cannot be undone and will permanently remove all sketch data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white bg-transparent"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-500 text-white border-0"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
