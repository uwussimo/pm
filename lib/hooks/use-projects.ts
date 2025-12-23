"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string | null;
  githubUrl?: string | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
  unicode: string;
  position: number;
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
  _count: {
    comments: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  users: User[];
  statuses: Status[];
  tasks: Task[];
  _count: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  users: User[];
  _count: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      return data.projects as ProjectListItem[];
    },
  });
}

export function useProject(
  projectId: string | undefined,
  options?: Partial<UseQueryOptions<Project>>
) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      return data.project as Project;
    },
    enabled: !!projectId,
    ...options,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");
      return data.project as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      router.push(`/projects/${project.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project");
      return data.project as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Project updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard");
      toast.success("Project deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useInviteUser(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite user");
      return data.project as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("User invited successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
