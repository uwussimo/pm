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
import { useInviteUser } from "@/lib/hooks/use-projects";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  projectId,
}: InviteUserDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const inviteUser = useInviteUser(projectId);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate(
      { email: inviteEmail },
      {
        onSuccess: () => {
          onOpenChange(false);
          setInviteEmail("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite a user to collaborate on this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={inviteUser.isPending}
          >
            {inviteUser.isPending ? "Inviting..." : "Invite User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

