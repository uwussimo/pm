"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { broadcastTaskEvent } from "@/lib/hooks/use-realtime";

interface Status {
  id: string;
  name: string;
  color: string;
  unicode: string;
  position: number;
}

export function useCreateStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      color,
      unicode,
      position,
    }: {
      name: string;
      color: string;
      unicode: string;
      position: number;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, unicode, position }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create status");
      return data.status as Status;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Status created successfully");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "status-created", { statusId: data.id });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateStatus(statusId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      color,
      unicode,
      position,
    }: {
      name?: string;
      color?: string;
      unicode?: string;
      position?: number;
    }) => {
      const res = await fetch(`/api/statuses/${statusId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, unicode, position }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      return data.status as Status;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Status updated successfully");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "status-updated", { statusId });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteStatus(statusId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/statuses/${statusId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Status deleted successfully");
      // Broadcast to other users
      broadcastTaskEvent(projectId, "status-deleted", { statusId });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
