"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateStatus } from "@/lib/hooks/use-statuses";
import { useProject } from "@/lib/hooks/use-projects";
import { cn } from "@/lib/utils";
import { Smile } from "lucide-react";

interface CreateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const PRESET_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

const COMMON_EMOJIS = [
  "📋",
  "✅",
  "🚀",
  "⏳",
  "🔄",
  "💡",
  "🎯",
  "🔥",
  "⚡",
  "🏁",
  "📝",
  "🎨",
  "🔧",
  "🐛",
  "✨",
  "💬",
  "📦",
  "🎉",
  "⚠️",
  "🔍",
  "📊",
  "🎭",
  "🌟",
  "💻",
];

export function CreateStatusDialog({
  open,
  onOpenChange,
  projectId,
}: CreateStatusDialogProps) {
  const { data: project } = useProject(projectId);
  const createStatus = useCreateStatus(projectId);

  const [statusName, setStatusName] = useState("");
  const [statusColor, setStatusColor] = useState("#3b82f6");
  const [statusUnicode, setStatusUnicode] = useState("📋");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusName.trim()) return;

    createStatus.mutate(
      {
        name: statusName.trim(),
        color: statusColor,
        unicode: statusUnicode,
        position: project?.statuses.length || 0,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setStatusName("");
          setStatusColor("#3b82f6");
          setStatusUnicode("📋");
          setCustomColor("#3b82f6");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Status</DialogTitle>
          <DialogDescription>
            Add a new status column to your board
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateStatus} className="space-y-4">
          <div className="flex items-center gap-3">
            <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 text-2xl"
                >
                  {statusUnicode}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {COMMON_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-lg"
                      onClick={() => {
                        setStatusUnicode(emoji);
                        setEmojiPopoverOpen(false);
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Input
              placeholder="Status name"
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Color</p>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setStatusColor(color.value)}
                  className={cn(
                    "h-9 w-9 rounded-full border-2",
                    statusColor === color.value
                      ? "border-primary"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}

              <label
                className={cn(
                  "h-9 w-9 rounded-full border-2 cursor-pointer relative overflow-hidden flex items-center justify-center",
                  !PRESET_COLORS.some((c) => c.value === statusColor)
                    ? "border-primary"
                    : "border-transparent"
                )}
                title="Custom color"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-purple-500 to-blue-500" />
                <Smile className="h-4 w-4 relative z-10 text-white drop-shadow" />
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setStatusColor(e.target.value);
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createStatus.isPending || !statusName.trim()}
          >
            {createStatus.isPending ? "Creating..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
