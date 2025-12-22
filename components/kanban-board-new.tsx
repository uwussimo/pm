"use client";

import React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  User,
  Calendar,
  MessageSquare,
  UserPlus,
  CalendarPlus,
  GripVertical,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUpdateTask, useCreateTask } from "@/lib/hooks/use-tasks";
import { useDeleteStatus, useUpdateStatus } from "@/lib/hooks/use-statuses";
import { useModal } from "@/lib/hooks/use-modal";

interface Task {
  id: string;
  title: string;
  description: string | null;
  statusId: string;
  assignee: { id: string; email: string } | null;
  dueDate: string | null;
  _count: { comments: number };
}

interface Column {
  id: string;
  name: string;
  unicode: string;
  color: string;
  tasks: Task[];
}

interface User {
  id: string;
  email: string;
}

interface KanbanBoardProps {
  columns: Column[];
  projectUsers: User[];
  projectId: string;
  onTaskMove: (taskId: string, newStatusId: string) => void;
  onTaskClick: (taskId: string) => void;
}

function TaskCard({
  task,
  onClick,
  projectUsers,
  projectId,
}: {
  task: Task;
  onClick: () => void;
  projectUsers: User[];
  projectId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const updateTask = useUpdateTask(task.id, projectId);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = React.useState(false);
  const [dueDatePopoverOpen, setDueDatePopoverOpen] = React.useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const handleAssigneeChange = (userId: string) => {
    updateTask.mutate(
      { assigneeId: userId === "unassigned" ? "" : userId },
      {
        onSuccess: () => setAssigneePopoverOpen(false),
      }
    );
  };

  const handleDueDateChange = (date: string) => {
    updateTask.mutate(
      { dueDate: date },
      {
        onSuccess: () => setDueDatePopoverOpen(false),
      }
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("touch-none mb-2", isDragging && "opacity-50")}
    >
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-200 bg-card border border-border/60 hover:border-border overflow-hidden py-2"
        onClick={(e) => {
          // Only trigger if not clicking on specific interactive elements
          const target = e.target as HTMLElement;
          // Don't trigger if clicking on buttons, inputs, or popover content
          if (
            !target.closest("button") &&
            !target.closest("input") &&
            !target.closest('[role="dialog"]') &&
            !target.closest("[data-radix-popper-content-wrapper]")
          ) {
            onClick();
          }
        }}
      >
        {/* Card Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h4 className="font-medium text-[13px] leading-snug text-foreground line-clamp-3 pr-1">
            {task.title}
          </h4>

          {/* Description Preview */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description.replace(/[#*_`\[\]]/g, "").slice(0, 100)}
            </p>
          )}

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {/* Due Date Badge with Quick Edit */}
            <Popover
              open={dueDatePopoverOpen}
              onOpenChange={setDueDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors",
                    task.dueDate
                      ? isOverdue
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-muted/50 text-muted-foreground/50 hover:bg-muted"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Calendar className="h-3 w-3" />
                  <span>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Due date"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-3"
                align="start"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="space-y-2">
                  <p className="text-xs font-medium">Due date</p>
                  <Input
                    type="date"
                    defaultValue={
                      task.dueDate
                        ? new Date(task.dueDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="h-8 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {task.dueDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDueDateChange("");
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Assignee Badge with Quick Edit */}
            <Popover
              open={assigneePopoverOpen}
              onOpenChange={setAssigneePopoverOpen}
            >
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors",
                    task.assignee
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-muted/50 text-muted-foreground/50 hover:bg-muted"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  title={task.assignee?.email}
                >
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[80px]">
                    {task.assignee
                      ? task.assignee.email.split("@")[0]
                      : "Assign"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[200px] p-2"
                align="start"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  <p className="text-xs font-medium px-2 py-1">Assign to</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-xs font-normal"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssigneeChange("unassigned");
                    }}
                  >
                    <User className="h-3 w-3 mr-2" />
                    Unassigned
                  </Button>
                  {projectUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start h-8 text-xs font-normal",
                        task.assignee?.id === user.id && "bg-accent"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssigneeChange(user.id);
                      }}
                    >
                      <User className="h-3 w-3 mr-2" />
                      {user.email.split("@")[0]}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Comments Badge */}
            {task._count.comments > 0 && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{task._count.comments}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function KanbanColumn({
  column,
  onTaskClick,
  projectUsers,
  projectId,
  onDelete,
}: {
  column: Column;
  onTaskClick: (taskId: string) => void;
  projectUsers: User[];
  projectId: string;
  onDelete: () => void;
}) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  const createTask = useCreateTask(projectId);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const modal = useModal();

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      setIsAdding(false);
      setNewTaskTitle("");
      return;
    }

    createTask.mutate(
      {
        title: newTaskTitle.trim(),
        statusId: column.id,
      },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setIsAdding(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewTaskTitle("");
  };

  const handleDelete = () => {
    modal.confirm({
      title: "Delete Status?",
      description: `Are you sure you want to delete "${column.name}"? All tasks in this status will be deleted.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: onDelete,
    });
  };

  const columnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={columnStyle}
      className={cn(
        "flex-shrink-0 w-[280px] flex flex-col min-h-screen",
        isDragging && "opacity-50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-2 px-2 py-2 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <span className="text-lg flex-shrink-0">{column.unicode}</span>
          <h3 className="font-semibold text-sm text-foreground truncate">
            {column.name}
          </h3>
          <span className="px-1.5 py-0.5 rounded text-xs font-medium text-muted-foreground flex-shrink-0">
            {column.tasks.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks Container */}
      <div
        ref={setDroppableRef}
        style={{
          backgroundColor: isOver ? `${column.color}15` : `${column.color}08`,
        }}
        className={cn(
          "flex-1 overflow-y-auto px-2 py-1 rounded-lg transition-all duration-200 min-h-[100px]",
          isOver && "ring-2 ring-primary/20"
        )}
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              projectUsers={projectUsers}
              projectId={projectId}
            />
          ))}
        </SortableContext>

        {/* Inline Add Task */}
        {isAdding ? (
          <div className="mt-2 space-y-2">
            <Input
              ref={inputRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTask();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              onBlur={handleCancel}
              placeholder="Enter task title..."
              className="h-9 text-sm"
              disabled={createTask.isPending}
            />
            <p className="text-xs text-muted-foreground px-1">
              Press Enter to add • Esc to cancel
            </p>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 mt-2 justify-start text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  columns: initialColumns,
  projectUsers,
  projectId,
  onTaskMove,
  onTaskClick,
}: KanbanBoardProps) {
  const [columns, setColumns] = React.useState(initialColumns);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeType, setActiveType] = React.useState<"task" | "column" | null>(
    null
  );
  const [originalColumnId, setOriginalColumnId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTask = (id: string) => {
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === id);
      if (task) return { task, columnId: column.id };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;

    // Check if we're dragging a column
    if (id.startsWith("column-")) {
      setActiveType("column");
      setActiveId(id.replace("column-", ""));
    } else {
      // Dragging a task
      setActiveType("task");
      setActiveId(id);
      // Store the original column ID before any state changes
      const taskData = findTask(id);
      if (taskData) {
        setOriginalColumnId(taskData.columnId);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Handle column reordering
    if (activeType === "column") {
      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId.startsWith("column-") && overId.startsWith("column-")) {
        const activeColumnId = activeId.replace("column-", "");
        const overColumnId = overId.replace("column-", "");

        if (activeColumnId === overColumnId) return;

        setColumns((cols) => {
          const oldIndex = cols.findIndex((c) => c.id === activeColumnId);
          const newIndex = cols.findIndex((c) => c.id === overColumnId);
          return arrayMove(cols, oldIndex, newIndex);
        });
      }
      return;
    }

    // Handle task dragging
    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're over a column
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      // Dragging over a column directly
      const activeData = findTask(activeId);
      if (!activeData) return;
      if (activeData.columnId === overId) return;

      setColumns((cols) => {
        const newColumns = [...cols];
        const activeColumnIndex = newColumns.findIndex(
          (c) => c.id === activeData.columnId
        );
        const overColumnIndex = newColumns.findIndex((c) => c.id === overId);

        const activeColumn = { ...newColumns[activeColumnIndex] };
        const overColumn = { ...newColumns[overColumnIndex] };

        activeColumn.tasks = activeColumn.tasks.filter(
          (t) => t.id !== activeId
        );

        const task = findTask(activeId)?.task;
        if (task) {
          const updatedTask = { ...task, statusId: overId };
          overColumn.tasks = [...overColumn.tasks, updatedTask];
        }

        newColumns[activeColumnIndex] = activeColumn;
        newColumns[overColumnIndex] = overColumn;

        return newColumns;
      });
      return;
    }

    // Check if we're over another task
    const activeData = findTask(activeId);
    const overData = findTask(overId);

    if (!activeData || !overData) return;
    if (activeData.columnId === overData.columnId) return;

    setColumns((cols) => {
      const newColumns = [...cols];
      const activeColumnIndex = newColumns.findIndex(
        (c) => c.id === activeData.columnId
      );
      const overColumnIndex = newColumns.findIndex(
        (c) => c.id === overData.columnId
      );

      const activeColumn = { ...newColumns[activeColumnIndex] };
      const overColumn = { ...newColumns[overColumnIndex] };

      activeColumn.tasks = activeColumn.tasks.filter((t) => t.id !== activeId);

      const task = findTask(activeId)?.task;
      if (task) {
        const updatedTask = { ...task, statusId: overData.columnId };
        const overTaskIndex = overColumn.tasks.findIndex(
          (t) => t.id === overId
        );
        overColumn.tasks = [
          ...overColumn.tasks.slice(0, overTaskIndex),
          updatedTask,
          ...overColumn.tasks.slice(overTaskIndex),
        ];
      }

      newColumns[activeColumnIndex] = activeColumn;
      newColumns[overColumnIndex] = overColumn;

      return newColumns;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    // Reset active state
    setActiveId(null);
    setActiveType(null);

    if (!over) {
      setOriginalColumnId(null);
      return;
    }

    // Handle column reordering
    if (activeId.startsWith("column-") && overId.startsWith("column-")) {
      const activeColumnId = activeId.replace("column-", "");
      const overColumnId = overId.replace("column-", "");

      if (activeColumnId !== overColumnId) {
        // Update column positions in the database
        const newColumnOrder = columns.map((col) => col.id);
        updateColumnPositions(newColumnOrder);
      }
      return;
    }

    // Handle task movement
    if (!originalColumnId) {
      setOriginalColumnId(null);
      return;
    }

    // Determine the target column
    let targetColumnId: string | null = null;

    // Check if dropped directly on a column
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      targetColumnId = overId;
    } else {
      // Dropped on a task, find which column it belongs to
      const overData = findTask(overId);
      if (overData) {
        targetColumnId = overData.columnId;
      }
    }

    // If we found a target column and it's different from the original, update the database
    if (targetColumnId && targetColumnId !== originalColumnId) {
      console.log(
        `📤 Calling onTaskMove: ${activeId} from ${originalColumnId} to ${targetColumnId}`
      );
      onTaskMove(activeId, targetColumnId);
    }

    // Reset original column tracking
    setOriginalColumnId(null);
  };

  const updateColumnPositions = async (columnIds: string[]) => {
    // Update each column's position in parallel
    const updates = columnIds.map((columnId, index) =>
      fetch(`/api/statuses/${columnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: index }),
      })
    );

    try {
      await Promise.all(updates);
      // Invalidate queries to refetch with new order
      window.location.reload(); // Temporary solution to ensure order persists
    } catch (error) {
      console.error("Failed to update column positions:", error);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    try {
      const res = await fetch(`/api/statuses/${statusId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete status");
      // Refresh to update the UI
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete status:", error);
    }
  };

  const activeTask =
    activeId && activeType === "task" ? findTask(activeId)?.task : null;
  const activeColumn =
    activeId && activeType === "column"
      ? columns.find((c) => c.id === activeId)
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={columns.map((c) => `column-${c.id}`)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-4 overflow-x-auto">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onTaskClick={onTaskClick}
              projectUsers={projectUsers}
              projectId={projectId}
              onDelete={() => handleDeleteStatus(column.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask ? (
          <Card className="w-[280px] cursor-grabbing rotate-2 shadow-2xl border-2 border-primary/30 bg-card p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-[13px] leading-snug text-foreground line-clamp-2">
                {activeTask.title}
              </h4>
              {(activeTask.assignee ||
                activeTask.dueDate ||
                activeTask._count.comments > 0) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeTask.dueDate && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-muted">
                      <Calendar className="h-3 w-3" />
                    </div>
                  )}
                  {activeTask._count.comments > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-muted">
                      <MessageSquare className="h-3 w-3" />
                      <span>{activeTask._count.comments}</span>
                    </div>
                  )}
                  {activeTask.assignee && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-muted">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ) : null}
        {activeColumn && (
          <div className="w-[280px] opacity-90 cursor-grabbing rotate-2">
            <div className="bg-muted/50 rounded-lg p-3 border-2 border-primary">
              <div className="flex items-center gap-2">
                <span className="text-lg">{activeColumn.unicode}</span>
                <h3 className="font-semibold text-sm">{activeColumn.name}</h3>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-background/50">
                  {activeColumn.tasks.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
