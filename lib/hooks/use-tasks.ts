"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { broadcastTaskEvent } from "@/lib/hooks/use-realtime";

interface User {
  id: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  user: User;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  statusId: string;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  imageUrl: string | null;
  assignee: User | null;
  status: {
    id: string;
    name: string;
    color: string;
    unicode: string;
  };
  comments: Comment[];
  _count: {
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: ["tasks", taskId],
    queryFn: async () => {
      if (!taskId) throw new Error("Task ID is required");
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      const data = await res.json();
      return data.task as Task;
    },
    enabled: !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      title: string;
      description?: string;
      statusId: string;
      assigneeId?: string;
      startDate?: string;
      dueDate?: string;
      imageUrl?: string;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");
      return data.task as Task;
    },
    onMutate: async (newTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });
      const previousProject = queryClient.getQueryData(["projects", projectId]);

      queryClient.setQueryData(["projects", projectId], (old: any) => {
        if (!old) return old;
        const tempTask = {
          id: `temp-${Date.now()}`,
          ...newTask,
          assignee: newTask.assigneeId
            ? old.users.find((u: User) => u.id === newTask.assigneeId)
            : null,
          status: old.statuses.find((s: any) => s.id === newTask.statusId),
          _count: { comments: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...old,
          tasks: [...(old.tasks || []), tempTask],
          _count: {
            ...old._count,
            tasks: (old._count?.tasks || 0) + 1,
          },
        };
      });

      return { previousProject };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["projects", projectId],
          context.previousProject
        );
      }
      toast.error("Failed to create task");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Task created successfully");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "task-created", { taskId: data.id });
    },
  });
}

export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      title?: string;
      description?: string;
      statusId?: string;
      assigneeId?: string;
      startDate?: string;
      dueDate?: string;
      imageUrl?: string;
    }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");
      return data.task as Task;
    },
    onMutate: async (updatedTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });
      await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

      const previousProject = queryClient.getQueryData(["projects", projectId]);
      const previousTask = queryClient.getQueryData(["tasks", taskId]);

      // Update project tasks
      queryClient.setQueryData(["projects", projectId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: (old.tasks || []).map((task: Task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updatedTask,
                  assignee: updatedTask.assigneeId
                    ? old.users.find(
                        (u: User) => u.id === updatedTask.assigneeId
                      )
                    : updatedTask.assigneeId === ""
                    ? null
                    : task.assignee,
                  status: updatedTask.statusId
                    ? old.statuses.find(
                        (s: any) => s.id === updatedTask.statusId
                      ) || task.status
                    : task.status,
                }
              : task
          ),
        };
      });

      // Update individual task
      queryClient.setQueryData(["tasks", taskId], (old: any) => {
        if (!old) return old;
        return { ...old, ...updatedTask };
      });

      return { previousProject, previousTask };
    },
    onError: (err, updatedTask, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["projects", projectId],
          context.previousProject
        );
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["tasks", taskId], context.previousTask);
      }
      toast.error("Failed to update task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      toast.success("Task updated successfully");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "task-updated", { taskId });
    },
  });
}

export function useDeleteTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });
      const previousProject = queryClient.getQueryData(["projects", projectId]);

      queryClient.setQueryData(["projects", projectId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: (old.tasks || []).filter((task: Task) => task.id !== taskId),
          _count: {
            ...old._count,
            tasks: Math.max((old._count?.tasks || 0) - 1, 0),
          },
        };
      });

      return { previousProject };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["projects", projectId],
          context.previousProject
        );
      }
      toast.error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Task deleted successfully");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "task-deleted", { taskId });
    },
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      statusId,
    }: {
      taskId: string;
      statusId: string;
    }) => {
      console.log("🚀 Mutation triggered - PATCH /api/tasks/" + taskId, {
        statusId,
      });
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      const data = await res.json();
      console.log("📥 Response:", res.ok ? "Success" : "Error", data);
      if (!res.ok) throw new Error(data.error || "Failed to move task");
      return data.task as Task;
    },
    onMutate: async ({ taskId, statusId }) => {
      console.log("⚡ onMutate - Optimistic update", { taskId, statusId });
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });
      await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(["projects", projectId]);
      const previousTask = queryClient.getQueryData(["tasks", taskId]);

      // Optimistically update the project tasks
      queryClient.setQueryData(["projects", projectId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: (old.tasks || []).map((task: Task) =>
            task.id === taskId
              ? {
                  ...task,
                  statusId,
                  status:
                    old.statuses.find((s: any) => s.id === statusId) ||
                    task.status,
                }
              : task
          ),
        };
      });

      // Optimistically update individual task if it's cached
      queryClient.setQueryData(["tasks", taskId], (old: any) => {
        if (!old) return old;
        return { ...old, statusId };
      });

      console.log("✅ Optimistic update complete");
      return { previousProject, previousTask };
    },
    onError: (err, { taskId }, context) => {
      console.error("❌ onError - Rolling back", err);
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["projects", projectId],
          context.previousProject
        );
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["tasks", taskId], context.previousTask);
      }
      toast.error("Failed to move task");
    },
    onSuccess: (data) => {
      console.log("✨ onSuccess - Task moved successfully");
      toast.success("Task moved");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "task-moved", { taskId: data.id });
    },
    onSettled: () => {
      console.log("🔄 onSettled - Invalidating queries");
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}
