"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    githubUrl?: string | null;
  };
  className?: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({
  user,
  className,
  showName = false,
  size = "md",
}: UserAvatarProps) {
  // Extract GitHub username from URL
  const getGithubUsername = (url: string | null) => {
    if (!url) return null;
    try {
      const match = url.match(/github\.com\/([^\/]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const githubUsername = getGithubUsername(user.githubUrl || null);
  const githubAvatarUrl = githubUsername
    ? `https://github.com/${githubUsername}.png`
    : null;

  // Display name: prioritize user.name, fallback to email username
  const displayName = user.name || user.email.split("@")[0];

  // Get initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  if (showName) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={cn(sizeClasses[size], className)}>
          {githubAvatarUrl && (
            <AvatarImage src={githubAvatarUrl} alt={displayName} />
          )}
          <AvatarFallback className="bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate">{displayName}</span>
      </div>
    );
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {githubAvatarUrl && (
        <AvatarImage src={githubAvatarUrl} alt={displayName} />
      )}
      <AvatarFallback className="bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-medium">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}

export function getUserDisplayName(user: {
  name?: string | null;
  email: string;
}) {
  return user.name || user.email.split("@")[0];
}
