"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/lib/hooks/use-tasks";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  statusId: string | null;
  statuses: { id: string; name: string; color: string; unicode: string }[];
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  statusId,
  statuses,
}: TaskDialogProps) {
  const createTask = useCreateTask(projectId);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
    }
  }, [open]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statusId) return;

    createTask.mutate(
      {
        title: title.trim(),
        statusId: statusId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTitle("");
        },
      }
    );
  };

  const statusName =
    statuses.find((s) => s.id === statusId)?.name || "this column";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            What do you want to do? You can add more details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="title"
              placeholder={`e.g. "Fix login bug" or "Design homepage"`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-base h-11"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && title.trim()) {
                  e.preventDefault();
                  handleSaveTask(e as any);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Will be added to <span className="font-medium">{statusName}</span>
              . Press Enter to create.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!title.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createTask.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
