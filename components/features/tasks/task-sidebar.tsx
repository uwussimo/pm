"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  MessageSquare,
  Trash2,
  User,
  Clock,
  Image as ImageIcon,
  Edit2,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTask } from "@/lib/hooks/use-tasks";
import { useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { useCreateComment } from "@/lib/hooks/use-comments";
import { useModal } from "@/lib/hooks/use-modal";

interface TaskSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  projectId: string;
  projectUsers: { id: string; email: string }[];
  statuses: { id: string; name: string; color: string; unicode: string }[];
}

export function TaskSidebar({
  open,
  onOpenChange,
  taskId,
  projectId,
  projectUsers,
  statuses,
}: TaskSidebarProps) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask(taskId || "", projectId);
  const deleteTask = useDeleteTask(taskId || "", projectId);
  const createComment = useCreateComment(taskId || "", projectId);
  const modal = useModal();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Sync form with task data when task loads
  if (task && task.title !== title) {
    setTitle(task.title);
    setDescription(task.description || "");
    setSelectedStatusId(task.statusId);
    setAssigneeId(task.assigneeId || "");
    setStartDate(task.startDate ? task.startDate.split("T")[0] : "");
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
  }

  const handleDelete = () => {
    modal.confirm({
      title: "Delete Task",
      description:
        "Are you sure you want to delete this task? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        await new Promise((resolve, reject) => {
          deleteTask.mutate(undefined, {
            onSuccess: () => {
              onOpenChange(false);
              resolve(undefined);
            },
            onError: reject,
          });
        });
      },
    });
  };

  const handleAddComment = () => {
    if (!commentContent.trim()) return;
    createComment.mutate(
      { content: commentContent },
      {
        onSuccess: () => {
          setCommentContent("");
        },
      }
    );
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 h-full">
        <SheetTitle className="sr-only">
          {task?.title || "Task Details"}
        </SheetTitle>
        {isLoading || !task ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading task details...
            </p>
          </div>
        ) : (
          <>
            {/* Header with inline editing */}
            <div className="px-6 pt-6 pb-5 border-b">
              <div className="flex items-start justify-between gap-3 mb-5">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (title !== task.title && title.trim()) {
                      updateTask.mutate({ title });
                    } else if (!title.trim()) {
                      setTitle(task.title);
                    }
                  }}
                  className="text-xl font-bold border-0 px-0 h-auto py-1 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted/50 rounded px-2 -ml-2"
                  placeholder="Task title"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleteTask.isPending}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {/* Inline editable details */}
              <div className="space-y-2.5">
                {/* Status */}
                <div className="flex items-center gap-3 group">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.status.color }}
                    />
                    Status
                  </div>
                  <Select
                    value={selectedStatusId}
                    onValueChange={(value) => {
                      setSelectedStatusId(value);
                      updateTask.mutate({ statusId: value });
                    }}
                  >
                    <SelectTrigger className="h-8 w-auto border-0 px-2 hover:bg-muted focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.unicode} {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-3 group">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                    <User className="h-3.5 w-3.5" />
                    Assignee
                  </div>
                  <Select
                    value={assigneeId || "unassigned"}
                    onValueChange={(value) => {
                      const newValue = value === "unassigned" ? "" : value;
                      setAssigneeId(newValue);
                      updateTask.mutate({ assigneeId: newValue });
                    }}
                  >
                    <SelectTrigger className="h-8 w-auto border-0 px-2 hover:bg-muted focus:ring-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {projectUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email.split("@")[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="flex items-center gap-3 group">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    Start
                  </div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      updateTask.mutate({
                        startDate: e.target.value || undefined,
                      });
                    }}
                    className="h-8 w-auto border-0 px-2 hover:bg-muted focus-visible:ring-0 text-sm"
                  />
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-3 group">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-24 shrink-0">
                    <Calendar className="h-3.5 w-3.5" />
                    Due
                  </div>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      updateTask.mutate({
                        dueDate: e.target.value || undefined,
                      });
                    }}
                    className={cn(
                      "h-8 w-auto border-0 px-2 hover:bg-muted focus-visible:ring-0 text-sm",
                      task.dueDate &&
                        (() => {
                          try {
                            const dateStr = task.dueDate.split("T")[0];
                            return new Date(dateStr + "T00:00:00") < new Date();
                          } catch {
                            return false;
                          }
                        })() &&
                        "text-destructive font-medium"
                    )}
                  />
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-6 pb-20">
                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Description</Label>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      Markdown supported
                    </div>
                  </div>
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as any)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="write" className="gap-2 text-sm">
                        <Edit2 className="h-3.5 w-3.5" />
                        Write
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-2 text-sm">
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="write" className="mt-3">
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => {
                          if (description !== task.description) {
                            updateTask.mutate({ description });
                          }
                        }}
                        placeholder="Add a detailed description...&#10;&#10;Supports **bold**, *italic*, [links](url), and more!"
                        rows={10}
                        className="font-mono text-sm resize-none"
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="mt-3">
                      <div className="border rounded-lg p-4 min-h-[240px] bg-muted/30 prose prose-sm dark:prose-invert max-w-none">
                        {description ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {description}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <Eye className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">Nothing to preview</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Image Display */}
                {task.imageUrl && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Attached Image
                    </Label>
                    <div className="border rounded-lg overflow-hidden bg-muted/20">
                      <img
                        src={task.imageUrl}
                        alt="Task attachment"
                        className="w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<div class="p-4 text-sm text-muted-foreground">Image failed to load</div>';
                        }}
                      />
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* Activity & Comments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Activity
                      <Badge variant="secondary" className="text-xs">
                        {task.comments.length + 2}
                      </Badge>
                    </Label>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3 relative">
                    {/* Timeline line */}
                    <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />

                    {/* Task Created */}
                    <div className="relative flex gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 shrink-0 relative z-10">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-muted-foreground">
                          Task created •{" "}
                          <span className="text-foreground font-medium">
                            {format(
                              new Date(task.createdAt),
                              "MMM d 'at' h:mm a"
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Comments */}
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="relative flex gap-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 relative z-10">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {comment.user.email.split("@")[0]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(comment.createdAt),
                                  "MMM d 'at' h:mm a"
                                )}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Last Updated */}
                    {task.updatedAt !== task.createdAt && (
                      <div className="relative flex gap-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 relative z-10">
                          <Edit2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm text-muted-foreground">
                            Task updated •{" "}
                            <span className="text-foreground font-medium">
                              {format(
                                new Date(task.updatedAt),
                                "MMM d 'at' h:mm a"
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Empty State (no comments) */}
                    {task.comments.length === 0 &&
                      task.updatedAt === task.createdAt && (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <p className="text-sm">No activity yet</p>
                        </div>
                      )}
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm">Add a comment</Label>
                    <Textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Share your thoughts, ask questions, or provide updates..."
                      rows={3}
                      className="resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          if (commentContent.trim()) {
                            handleAddComment();
                          }
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Press{" "}
                        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                          ⌘
                        </kbd>{" "}
                        +{" "}
                        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                          Enter
                        </kbd>{" "}
                        to submit
                      </span>
                      <Button
                        onClick={handleAddComment}
                        disabled={
                          !commentContent.trim() || createComment.isPending
                        }
                        size="sm"
                        className="gap-2"
                      >
                        {createComment.isPending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Posting
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
