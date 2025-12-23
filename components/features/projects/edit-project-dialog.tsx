"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateProject } from "@/lib/hooks/use-projects";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialName: string;
  initialDescription?: string | null;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  projectId,
  initialName,
  initialDescription,
}: EditProjectDialogProps) {
  const updateProject = useUpdateProject(projectId);

  const [projectName, setProjectName] = useState(initialName);
  const [projectDescription, setProjectDescription] = useState(
    initialDescription || ""
  );

  // Update local state when props change
  useEffect(() => {
    setProjectName(initialName);
    setProjectDescription(initialDescription || "");
  }, [initialName, initialDescription, open]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProject.mutate(
      {
        name: projectName,
        description: projectDescription,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[21px] font-semibold tracking-tight">
            Edit Project
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            Update your project name and description
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[15px]">
              Project Name
            </Label>
            <Input
              id="name"
              placeholder="My Awesome Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[15px]">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="What is this project about?"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={updateProject.isPending}
          >
            {updateProject.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

