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

// Refined color palette
function getUserColor(userId: string): string {
  const colors = [
    "#0EA5E9", // sky blue
    "#8B5CF6", // violet
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

  const displayMembers = members.slice(0, 4);
  const remainingCount = members.length - 4;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center -space-x-1.5">
          {displayMembers.map((member) => {
            const initials = member.info.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const color = getUserColor(member.id);

            return (
              <Tooltip key={member.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="relative group">
                    <Avatar className="h-7 w-7 border-2 border-background transition-all duration-200 hover:scale-110 hover:z-10 cursor-pointer shadow-sm">
                      <AvatarFallback
                        className="text-[10px] font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Clean active indicator */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="text-left">
                      <p className="text-[12px] font-medium leading-none">
                        {member.info.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Viewing now
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {remainingCount > 0 && (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground border-2 border-background shadow-sm">
            +{remainingCount}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
