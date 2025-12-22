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

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50 hover:border-border overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
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

        {project.description && (
          <CardDescription className="text-sm line-clamp-2 mt-3 ml-14">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="rounded-md bg-muted p-1.5">
                <CheckSquare className="h-4 w-4" />
              </div>
              <span className="font-medium">{project._count.tasks}</span>
              <span className="text-xs">tasks</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="rounded-md bg-muted p-1.5">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">{project.users.length}</span>
              <span className="text-xs">members</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Updated{" "}
            {formatDistanceToNow(new Date(project.updatedAt), {
              addSuffix: true,
            })}
          </span>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
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
            <div className="rounded-full bg-primary/10 p-6 mb-6">
              <FolderOpen className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
