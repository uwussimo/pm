"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Share2, Search, Plus, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "@/components/features/kanban/kanban-board-new";
import { getUserDisplayName } from "@/components/ui/user-avatar";
import { useProject } from "@/lib/hooks/use-projects";
import { useMoveTask } from "@/lib/hooks/use-tasks";
import { useModal } from "@/lib/hooks/use-modal";

interface ProjectBoardProps {
  projectId: string;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);
  const moveTask = useMoveTask(projectId);
  const modal = useModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterDueDate, setFilterDueDate] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const columns = project.statuses.map((status) => ({
    id: status.id,
    name: status.name,
    unicode: status.unicode,
    color: status.color,
    tasks: project.tasks
      .filter((task) => task.statusId === status.id)
      .filter((task) => {
        // Search filter
        if (
          searchQuery &&
          !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) &&
          !task.assignee?.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return false;
        }

        // Assignee filter
        if (filterAssignee !== "all") {
          if (filterAssignee === "unassigned" && task.assignee) return false;
          if (
            filterAssignee !== "unassigned" &&
            task.assigneeId !== filterAssignee
          )
            return false;
        }

        // Due date filter
        if (filterDueDate !== "all") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = task.dueDate
            ? (() => {
                try {
                  const dateStr = task.dueDate.split("T")[0];
                  return new Date(dateStr + "T00:00:00");
                } catch {
                  return null;
                }
              })()
            : null;

          if (filterDueDate === "no-date" && dueDate) return false;
          if (filterDueDate === "overdue" && (!dueDate || dueDate >= today))
            return false;
          if (filterDueDate === "today") {
            if (!dueDate) return false;
            const dueDateOnly = new Date(dueDate);
            dueDateOnly.setHours(0, 0, 0, 0);
            if (dueDateOnly.getTime() !== today.getTime()) return false;
          }
          if (filterDueDate === "week") {
            if (!dueDate) return false;
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            if (dueDate < today || dueDate > weekFromNow) return false;
          }
        }

        return true;
      }),
  }));

  const handleTaskMove = (taskId: string, newStatusId: string) => {
    console.log("🔄 Moving task:", taskId, "to status:", newStatusId);
    // Update task status with optimistic UI
    moveTask.mutate({ taskId, statusId: newStatusId });
  };

  const handleTaskClick = (taskId: string) => {
    modal.openTaskView({
      projectId,
      taskId,
      projectUsers: project.users,
      statuses: project.statuses.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        unicode: s.unicode,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  {project.name}
                  <Badge variant="outline" className="text-xs font-normal">
                    {project.tasks.length}{" "}
                    {project.tasks.length === 1 ? "task" : "tasks"}
                  </Badge>
                </h1>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => modal.openShareProject({ projectId })}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => modal.openCreateStatus({ projectId })}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Status</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search tasks by title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Assignee Filter */}
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="All members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {project.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Due Date Filter */}
            <Select value={filterDueDate} onValueChange={setFilterDueDate}>
              <SelectTrigger className="w-[145px] h-9 text-sm">
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="no-date">No due date</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="today">Due today</SelectItem>
                <SelectItem value="week">Due this week</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {(searchQuery ||
              filterAssignee !== "all" ||
              filterDueDate !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterAssignee("all");
                  setFilterDueDate("all");
                }}
                className="h-9 gap-2"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(filterAssignee !== "all" ||
            filterDueDate !== "all" ||
            searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">
                Filters:
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  Search: "
                  {searchQuery.length > 20
                    ? searchQuery.slice(0, 20) + "..."
                    : searchQuery}
                  "
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {filterAssignee !== "all" && (
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  {filterAssignee === "unassigned"
                    ? "Unassigned"
                    : getUserDisplayName(
                        project.users.find((u) => u.id === filterAssignee) || {
                          id: "",
                          email: "",
                        }
                      )}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => setFilterAssignee("all")}
                  />
                </Badge>
              )}
              {filterDueDate !== "all" && (
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  {filterDueDate === "no-date"
                    ? "No due date"
                    : filterDueDate === "overdue"
                    ? "Overdue"
                    : filterDueDate === "today"
                    ? "Due today"
                    : "Due this week"}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => setFilterDueDate("all")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-muted/10">
            <div className="rounded-full bg-primary/10 p-6 mb-6">
              <Settings className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Set up your workflow</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">
              Create status columns like "To Do", "In Progress", and "Done" to
              organize and track your tasks effectively.
            </p>
            <Button
              onClick={() => modal.openCreateStatus({ projectId })}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Status
            </Button>
          </div>
        ) : (
          <KanbanBoard
            columns={columns}
            projectUsers={project.users}
            projectId={projectId}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
          />
        )}
      </main>
    </div>
  );
}
