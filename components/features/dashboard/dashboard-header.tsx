"use client";

import { LogOut, Settings, ZapIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar, getUserDisplayName } from "@/components/ui/user-avatar";
import { useAuth } from "@/lib/hooks/use-auth";

interface DashboardHeaderProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    githubUrl?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { signOut, isSigningOut } = useAuth();
  const displayName = getUserDisplayName(user);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#1D1D1F] dark:bg-white p-2">
              <ZapIcon className="h-5 w-5 text-white dark:text-[#1D1D1F]" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                PM
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-3">
                <UserAvatar user={user} size="sm" className="h-7 w-7" />
                <span className="hidden sm:inline-block text-sm font-medium">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut()}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
