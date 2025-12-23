# Chapter 4: Presence System

## See Who's Viewing the Project

The presence system shows who else is currently viewing the same project as you - just like seeing who's online in a Google Doc!

## 🎯 What We're Building

```
┌──────────────────────────────────────────────────┐
│ Project: Website Redesign                        │
│                                                   │
│ Viewing: 👤 Sarah  👤 Mike  👤 +2               │
│         └─────────────┬────────────┘             │
│               Presence Avatars                    │
└──────────────────────────────────────────────────┘
```

## 🔍 How Presence Works

### The Flow

```
User opens project
       ↓
Subscribes to "presence-project-abc"
       ↓
Pusher asks: "Who are you?"
       ↓
Our auth endpoint verifies user
       ↓
User joins presence channel
       ↓
"member_added" event fires
       ↓
Other users see the new member
```

## 📝 Step 1: Create the Presence Hook

Open or create `lib/hooks/use-realtime.ts`:

```typescript
import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Channel, Members } from "pusher-js";
import { toast } from "sonner";

// Type for a member (user) in the presence channel
export interface PresenceMember {
  userId: string;
  info: {
    id: string;
    name: string;
    email: string;
  };
}

// Hook to track who's viewing the project
export function usePresence(projectId: string, currentUserId: string) {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    // Don't subscribe if we don't have required info
    if (!projectId || !currentUserId) {
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
      setMembers([]);
      return;
    }

    // Subscribe to presence channel
    const presenceChannelName = `presence-project-${projectId}`;
    const newChannel = pusherClient.subscribe(presenceChannelName);
    setChannel(newChannel);

    // When subscription succeeds, get list of who's already here
    newChannel.bind("pusher:subscription_succeeded", (members: Members) => {
      const initialMembers: PresenceMember[] = [];
      members.each((member: any) => {
        // Don't include yourself in the list
        if (member.id !== currentUserId) {
          initialMembers.push({ userId: member.id, info: member.info });
        }
      });
      setMembers(initialMembers);
    });

    // When someone new joins
    newChannel.bind("pusher:member_added", (member: any) => {
      if (member.id !== currentUserId) {
        setMembers((prev) => [
          ...prev,
          { userId: member.id, info: member.info },
        ]);
      }
    });

    // When someone leaves
    newChannel.bind("pusher:member_removed", (member: any) => {
      setMembers((prev) => prev.filter((m) => m.userId !== member.id));
    });

    // Handle errors
    newChannel.bind("pusher:subscription_error", (status: any) => {
      console.error("Presence subscription error:", status);
      toast.error("Failed to connect to presence. Please refresh.");
    });

    // Cleanup when component unmounts or project changes
    return () => {
      newChannel.unsubscribe();
      setChannel(null);
      setMembers([]);
    };
  }, [projectId, currentUserId]);

  return { members, channel };
}
```

### Understanding the Code

**Presence Channel Events:**

```typescript
"pusher:subscription_succeeded";
// → Fired when you successfully join
// → Gives you list of who's already there

"pusher:member_added";
// → Fired when someone new joins
// → Gives you their info

"pusher:member_removed";
// → Fired when someone leaves
// → Gives you their user ID

"pusher:subscription_error";
// → Fired if something goes wrong
// → Show error message to user
```

**Why exclude currentUserId?**

```typescript
if (member.id !== currentUserId) {
  // Don't show your own avatar
}
```

You don't need to see your own presence - you know you're there!

## 📝 Step 2: Create the Presence Avatars Component

Create `components/features/collaboration/presence-avatars.tsx`:

```typescript
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PresenceMember } from "@/lib/hooks/use-realtime";
import { getUserColor } from "@/lib/utils";

interface PresenceAvatarsProps {
  members: PresenceMember[];
}

export function PresenceAvatars({ members }: PresenceAvatarsProps) {
  // Only show first 4 members
  const displayedMembers = members.slice(0, 4);
  const remainingCount = members.length - 4;

  // Don't render anything if no one else is viewing
  if (members.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-muted-foreground">Viewing:</span>
        <div className="flex -space-x-1.5">
          {/* Show first 4 members */}
          {displayedMembers.map((member) => (
            <Tooltip key={member.userId}>
              <TooltipTrigger asChild>
                <div
                  className="relative h-7 w-7 rounded-full border-2 border-background transition-all duration-200 hover:scale-110"
                  style={{ borderColor: getUserColor(member.userId) }}
                >
                  <Avatar className="h-full w-full">
                    <AvatarFallback
                      className="text-[11px] font-medium text-white"
                      style={{
                        backgroundColor: getUserColor(member.userId),
                      }}
                    >
                      {member.info.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Active indicator dot */}
                  <span
                    className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background"
                    style={{ backgroundColor: getUserColor(member.userId) }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[13px] font-medium">
                {member.info.name} (Viewing now)
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Show "+X" if more than 4 members */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground transition-all duration-200 hover:scale-110">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[13px] font-medium">
                {members
                  .slice(4)
                  .map((m) => m.info.name)
                  .join(", ")}{" "}
                (and {remainingCount} more)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
```

### Understanding the Component

**Avatar Display Logic:**

```typescript
// Show at most 4 avatars
const displayedMembers = members.slice(0, 4);

// If 5 or more members, show "+X"
const remainingCount = members.length - 4;
```

**Visual Example:**

```
2 members:  👤 👤
3 members:  👤 👤 👤
4 members:  👤 👤 👤 👤
5 members:  👤 👤 👤 👤 +1
10 members: 👤 👤 👤 👤 +6
```

**Color System:**

```typescript
getUserColor(member.userId);
// → Each user gets a unique color based on their ID
// → Same user always gets the same color
// → Makes it easy to identify who is who
```

## 📝 Step 3: Use It in Your Project Board

Update `components/features/kanban/project-board.tsx`:

```typescript
"use client";

import { usePresence } from "@/lib/hooks/use-realtime";
import { PresenceAvatars } from "@/components/features/collaboration/presence-avatars";
import { useAuth } from "@/lib/hooks/use-auth";

export function ProjectBoard({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  // Get list of members viewing this project
  const { members } = usePresence(projectId, currentUserId);

  return (
    <div>
      {/* Header with presence avatars */}
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1>Project Board</h1>

          {/* Show who's viewing */}
          <PresenceAvatars members={members} />
        </div>
      </header>

      {/* Rest of your board */}
      {/* ... */}
    </div>
  );
}
```

## 🎨 Styling Tips

### Overlapping Avatars

```css
.flex -space-x-1.5;
```

This creates the overlapping effect:

```
Normal spacing:  👤  👤  👤
With -space-x-1.5:  👤👤👤
```

### Hover Effect

```typescript
className = "transition-all duration-200 hover:scale-110";
```

When you hover over an avatar, it grows slightly. Subtle but nice!

### Active Indicator

```typescript
<span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background" />
```

Creates a small dot at bottom-right of avatar showing they're active.

## 🧪 Testing

### Test 1: Open in Multiple Windows

1. Open your app in two browser windows
2. Sign in as different users
3. Both open the same project
4. You should see each other's avatars!

### Test 2: Leave and Join

1. Close one window
2. Avatar should disappear from the other window
3. Reopen the window
4. Avatar should reappear

### Test 3: Check Auth

1. Try opening a project you don't have access to
2. You should NOT see presence (or get an error)
3. This confirms auth is working

## 🐛 Common Issues

### Problem: Avatars not showing

**Check:**

```typescript
// Is currentUserId set?
console.log("Current user:", currentUserId);

// Are members being received?
console.log("Members:", members);

// Is the channel subscribed?
console.log("Channel state:", channel?.subscribed);
```

### Problem: Seeing your own avatar

**Check:**

```typescript
// Make sure you're filtering yourself out
if (member.id !== currentUserId) {
  // Only add if it's not you
}
```

### Problem: "Unauthorized" in console

**Check:**

1. Auth endpoint (`/api/pusher/auth`) working?
2. User logged in?
3. User has access to the project?

## 🎓 Key Concepts

1. **Presence Channels** start with `presence-`

   ```typescript
   `presence-project-${projectId}`;
   ```

2. **Pusher handles the logic** of tracking who's online

   - You just subscribe/unsubscribe
   - Pusher tells you who joins/leaves

3. **Always verify auth** before allowing access

   - Check user is logged in
   - Check user can access the project

4. **Cleanup is important**
   ```typescript
   return () => {
     channel.unsubscribe(); // Always cleanup!
   };
   ```

## 🚀 Next Steps

Now that you can see who's viewing, let's add live cursors!

**[Next: Chapter 5 - Live Cursors →](./05-cursors.md)**
