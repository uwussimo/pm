"use client";

import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Users,
  CheckSquare,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjects, useDeleteProject } from "@/lib/hooks/use-projects";
import { useModal } from "@/lib/hooks/use-modal";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: any;
  onClick: () => void;
  modal: any;
}

function ProjectCard({ project, onClick, modal }: ProjectCardProps) {
  const deleteProject = useDeleteProject(project.id);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    modal.confirm({
      title: "Delete Project?",
      description: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        await deleteProject.mutateAsync();
      },
    });
  };

  const handleManageUsers = (e: React.MouseEvent) => {
    e.stopPropagation();
    modal.openManageUsers({ projectId: project.id });
  };

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-sm transition-all duration-200 border bg-background"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-[17px] font-semibold tracking-tight line-clamp-1 text-[#1D1D1F] dark:text-white mb-1">
              {project.name}
            </CardTitle>
            {project.description && (
              <CardDescription className="text-[15px] line-clamp-2 text-[#86868B]">
                {project.description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={handleManageUsers}
              >
                <Users className="h-4 w-4" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Edit className="h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-6 text-[15px] text-[#86868B]">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span>{project._count.tasks}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{project.users.length}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Clock className="h-4 w-4" />
            <span className="text-[13px]">
              {formatDistanceToNow(new Date(project.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsList() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const modal = useModal();

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
            Projects
          </h2>
          <p className="text-[15px] text-[#86868B] mt-1">
            Manage your projects and tasks
          </p>
        </div>
        <Button onClick={() => modal.openCreateProject({})}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-[#1D1D1F] dark:bg-white p-6 mb-6">
              <FolderOpen className="h-12 w-12 text-white dark:text-[#1D1D1F]" />
            </div>
            <h3 className="text-[21px] font-semibold mb-2 text-[#1D1D1F] dark:text-white">
              No projects yet
            </h3>
            <p className="text-[15px] text-[#86868B] mb-8 text-center max-w-sm">
              Get started by creating your first project. Organize your tasks,
              collaborate with your team, and track progress.
            </p>
            <Button
              onClick={() => modal.openCreateProject({})}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/projects/${project.id}`)}
              modal={modal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
