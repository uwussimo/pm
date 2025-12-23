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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserAvatar, getUserDisplayName } from "@/components/ui/user-avatar";
import { useProject, useInviteUser } from "@/lib/hooks/use-projects";
import { useRemoveUserFromProject } from "@/lib/hooks/use-profile";
import { useAuth } from "@/lib/hooks/use-auth";
import { Users, UserPlus, Loader2, Crown, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ManageUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function ManageUsersDialog({
  open,
  onOpenChange,
  projectId,
}: ManageUsersDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: project, isLoading } = useProject(projectId);
  const { user: currentUser } = useAuth();
  const inviteUser = useInviteUser(projectId);
  const removeUser = useRemoveUserFromProject(projectId);

  const isOwner = project?.ownerId === currentUser?.userId;

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate(
      { email: inviteEmail },
      {
        onSuccess: () => {
          setInviteEmail("");
        },
      }
    );
  };

  const handleRemoveUser = (userId: string) => {
    removeUser.mutate({ userId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[21px] font-semibold tracking-tight">
            Manage Users
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            Invite team members to collaborate on this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Form */}
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[15px]">
                Invite by email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={inviteUser.isPending}
                  className="gap-2"
                >
                  {inviteUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Invite
                </Button>
              </div>
            </div>
          </form>

          <Separator />

          {/* Current Members */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[15px] font-medium">
              <Users className="h-4 w-4" />
              <span>
                Team members{" "}
                {project?.users.length ? `(${project.users.length})` : ""}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : project?.users && project.users.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {project.users.map((user) => {
                  const isProjectOwner = user.id === project.ownerId;
                  const displayName = getUserDisplayName(user);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-background"
                    >
                      <UserAvatar user={user} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-medium text-[#1D1D1F] dark:text-white truncate">
                            {displayName}
                          </p>
                          {isProjectOwner && (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-[12px] bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F]"
                            >
                              <Crown className="h-3 w-3" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-[13px] text-[#86868B] truncate">
                          {user.email}
                        </p>
                      </div>
                      {isOwner && !isProjectOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={removeUser.isPending}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[15px] text-[#86868B]">
                No team members yet
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
