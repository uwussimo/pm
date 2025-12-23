"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PresenceMember } from "@/lib/hooks/use-realtime";

interface PresenceAvatarsProps {
  members: PresenceMember[];
}

// Generate consistent color for user
function getUserColor(userId: string): string {
  const colors = [
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#F59E0B", // amber
    "#10B981", // emerald
    "#6366F1", // indigo
    "#14B8A6", // teal
    "#F97316", // orange
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function PresenceAvatars({ members }: PresenceAvatarsProps) {
  if (members.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <span className="text-[13px] text-muted-foreground mr-2">Viewing:</span>
        <div className="flex -space-x-2">
          {members.map((member) => {
            const initials = member.info.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const color = getUserColor(member.id);

            return (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-muted">
                    <AvatarFallback
                      className="text-[11px] font-semibold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[13px]">{member.info.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {member.info.email}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {members.length > 3 && (
          <span className="text-[13px] text-muted-foreground ml-2">
            +{members.length - 3} more
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
