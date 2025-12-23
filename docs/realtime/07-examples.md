# Chapter 7: Code Examples

## Complete Implementation Examples

This chapter provides complete, copy-paste-ready code examples for implementing real-time features.

## 📝 Example 1: Complete Project Board with Real-Time

This is a full implementation of a project board with all real-time features.

```typescript
// components/features/kanban/project-board.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/features/kanban/kanban-board";
import { useProject } from "@/lib/hooks/use-projects";
import { useMoveTask } from "@/lib/hooks/use-tasks";
import { useModal } from "@/lib/hooks/use-modal";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  usePresence,
  useCursors,
  useRealtimeUpdates,
} from "@/lib/hooks/use-realtime";
import { PresenceAvatars } from "@/components/features/collaboration/presence-avatars";
import { Cursor } from "@/components/features/collaboration/cursor";
import { AnimatePresence } from "framer-motion";
import { getUserColor } from "@/lib/utils";

interface ProjectBoardProps {
  projectId: string;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modal = useModal();
  const { user } = useAuth();

  // Fetch project data
  const { data: project, isLoading } = useProject(projectId);
  const moveTask = useMoveTask(projectId);

  // Real-time collaboration
  const currentUserId = user?.id || "";
  const { members, channel } = usePresence(projectId, currentUserId);
  const { cursors, broadcastCursor } = useCursors(channel, currentUserId);

  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // Handle real-time updates from other users
  const handleRealtimeUpdate = useCallback(
    (data: any) => {
      console.log("Received real-time update:", data);
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
    [queryClient, projectId]
  );

  useRealtimeUpdates(projectId, handleRealtimeUpdate);

  // Broadcast cursor position
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!user || !channel) return;

      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      throttleRef.current = setTimeout(() => {
        const userName = user.name || user.email.split("@")[0];
        broadcastCursor(e.clientX, e.clientY, userName);
      }, 16); // ~60fps
    },
    [user, channel, broadcastCursor]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [handleMouseMove]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleTaskClick = (taskId: string) => {
    modal.openTaskView({
      projectId,
      taskId,
      projectUsers: project.users,
      statuses: project.statuses,
    });
  };

  const handleTaskMove = async (taskId: string, newStatusId: string) => {
    await moveTask.mutateAsync({ taskId, statusId: newStatusId });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-8 w-px bg-border" />
              <h1 className="text-lg font-bold">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Show who's viewing */}
              <PresenceAvatars members={members} />
              <Button
                onClick={() => modal.openCreateStatus({ projectId })}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Status
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <KanbanBoard
          project={project}
          onTaskClick={handleTaskClick}
          onTaskMove={handleTaskMove}
        />
      </main>

      {/* Render all cursors */}
      <AnimatePresence>
        {Array.from(cursors.values()).map((cursor) => (
          <Cursor
            key={cursor.userId}
            x={cursor.x}
            y={cursor.y}
            userName={cursor.userName}
            color={getUserColor(cursor.userId)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

## 📝 Example 2: Simple Chat with Real-Time

A simple chat component showing real-time messages:

```typescript
// components/features/chat/project-chat.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export function ProjectChat({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Listen for new messages
  useEffect(() => {
    if (!projectId) return;

    const channel = pusherClient.subscribe(`project-${projectId}`);

    channel.bind("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`project-${projectId}`);
    };
  }, [projectId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name || user.email.split("@")[0],
      content: newMessage,
      timestamp: Date.now(),
    };

    // Send to server
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        content: newMessage,
      }),
    });

    // Broadcast via Pusher
    await fetch("/api/pusher/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: `project-${projectId}`,
        event: "new-message",
        data: message,
        projectId,
      }),
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.userId === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                msg.userId === user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="text-xs font-medium mb-1">{msg.userName}</div>
              <div className="text-sm">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
```

---

## 📝 Example 3: Real-Time Notifications

Show toast notifications when things happen:

```typescript
// components/features/notifications/realtime-notifications.tsx
"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";

export function RealtimeNotifications({ projectId }: { projectId: string }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId || !user) return;

    const channel = pusherClient.subscribe(`project-${projectId}`);

    // Task created
    channel.bind("task-created", (data: any) => {
      if (data.createdBy !== user.id) {
        toast.success("New task created", {
          description: data.taskTitle,
        });
      }
    });

    // Task assigned to you
    channel.bind("task-assigned", (data: any) => {
      if (data.assigneeId === user.id) {
        toast.info("Task assigned to you", {
          description: data.taskTitle,
        });
      }
    });

    // Task completed
    channel.bind("task-completed", (data: any) => {
      toast.success("Task completed!", {
        description: data.taskTitle,
      });
    });

    // User joined
    channel.bind("user-joined", (data: any) => {
      if (data.userId !== user.id) {
        toast(`${data.userName} joined the project`);
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, user]);

  return null; // This component doesn't render anything
}

// Usage in your app:
// <RealtimeNotifications projectId={projectId} />
```

---

## 📝 Example 4: Typing Indicator

Show when someone is typing:

```typescript
// components/features/collaboration/typing-indicator.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Channel } from "pusher-js";

interface TypingUser {
  userId: string;
  userName: string;
  lastTyped: number;
}

export function useTypingIndicator(
  channel: Channel | null,
  currentUserId: string
) {
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(
    new Map()
  );
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const broadcastTyping = useCallback(
    (userName: string) => {
      if (channel && currentUserId) {
        channel.trigger("client-typing", {
          userId: currentUserId,
          userName,
        });
      }
    },
    [channel, currentUserId]
  );

  useEffect(() => {
    if (channel) {
      channel.bind(
        "client-typing",
        (data: { userId: string; userName: string }) => {
          if (data.userId === currentUserId) return;

          setTypingUsers((prev) => {
            const newUsers = new Map(prev);
            newUsers.set(data.userId, {
              ...data,
              lastTyped: Date.now(),
            });
            return newUsers;
          });

          // Clear existing timeout
          if (timeoutRefs.current.has(data.userId)) {
            clearTimeout(timeoutRefs.current.get(data.userId)!);
          }

          // Remove after 2 seconds of no typing
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => {
              const newUsers = new Map(prev);
              newUsers.delete(data.userId);
              return newUsers;
            });
            timeoutRefs.current.delete(data.userId);
          }, 2000);

          timeoutRefs.current.set(data.userId, timeout);
        }
      );

      return () => {
        channel.unbind("client-typing");
        timeoutRefs.current.forEach(clearTimeout);
        timeoutRefs.current.clear();
      };
    }
  }, [channel, currentUserId]);

  return { typingUsers, broadcastTyping };
}

// Usage:
export function ChatWithTyping({ projectId, channel }: any) {
  const { user } = useAuth();
  const { typingUsers, broadcastTyping } = useTypingIndicator(
    channel,
    user?.id || ""
  );
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing
    broadcastTyping(user?.name || "Unknown");

    // Stop broadcasting after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      // User stopped typing
    }, 1000);
  };

  return (
    <div>
      <Input onChange={handleInputChange} />

      {/* Show who's typing */}
      {typingUsers.size > 0 && (
        <div className="text-sm text-muted-foreground mt-2">
          {Array.from(typingUsers.values())
            .map((u) => u.userName)
            .join(", ")}{" "}
          {typingUsers.size === 1 ? "is" : "are"} typing...
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Example 5: Real-Time User Status

Show if users are online/offline:

```typescript
// components/features/collaboration/user-status.tsx
"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Badge } from "@/components/ui/badge";

interface UserStatusProps {
  projectId: string;
  userId: string;
  userName: string;
}

export function UserStatus({ projectId, userId, userName }: UserStatusProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const channel = pusherClient.subscribe(`presence-project-${projectId}`);

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      // Check if user is in the members list
      const isMember = members.get(userId);
      setIsOnline(!!isMember);
    });

    channel.bind("pusher:member_added", (member: any) => {
      if (member.id === userId) {
        setIsOnline(true);
      }
    });

    channel.bind("pusher:member_removed", (member: any) => {
      if (member.id === userId) {
        setIsOnline(false);
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`presence-project-${projectId}`);
    };
  }, [projectId, userId]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <span className="text-sm">{userName}</span>
      {isOnline && (
        <Badge variant="secondary" className="text-xs">
          Online
        </Badge>
      )}
    </div>
  );
}
```

---

## 📝 Example 6: Custom Hook for Any Real-Time Feature

Reusable hook for any real-time subscription:

```typescript
// lib/hooks/use-realtime-subscription.ts
"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";

interface UseRealtimeSubscriptionOptions {
  channelName: string;
  events: {
    [eventName: string]: (data: any) => void;
  };
  enabled?: boolean;
}

export function useRealtimeSubscription({
  channelName,
  events,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    if (!enabled || !channelName) return;

    const channel = pusherClient.subscribe(channelName);

    // Bind all events
    Object.entries(events).forEach(([eventName, handler]) => {
      channel.bind(eventName, handler);
    });

    return () => {
      // Unbind all events
      Object.keys(events).forEach((eventName) => {
        channel.unbind(eventName);
      });
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName, enabled, events]);
}

// Usage:
export function MyComponent({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  useRealtimeSubscription({
    channelName: `project-${projectId}`,
    events: {
      "task-created": (data) => {
        console.log("Task created:", data);
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      "task-updated": (data) => {
        console.log("Task updated:", data);
        queryClient.invalidateQueries({ queryKey: ["tasks", data.taskId] });
      },
      "user-joined": (data) => {
        toast.success(`${data.userName} joined!`);
      },
    },
    enabled: !!projectId,
  });

  return <div>...</div>;
}
```

---

## 🎓 Key Patterns

### 1. Always Clean Up

```typescript
useEffect(() => {
  // Subscribe
  const channel = pusherClient.subscribe("...");
  channel.bind("event", handler);

  // Always return cleanup
  return () => {
    channel.unbind_all();
    pusherClient.unsubscribe("...");
  };
}, []);
```

### 2. Throttle Frequent Events

```typescript
const throttleRef = useRef<NodeJS.Timeout | null>(null);

const handleFrequentEvent = (data) => {
  if (throttleRef.current) clearTimeout(throttleRef.current);

  throttleRef.current = setTimeout(() => {
    // Handle event
  }, 100);
};
```

### 3. Filter Out Own Events

```typescript
channel.bind("event", (data) => {
  if (data.userId === currentUserId) return; // Don't process own events
  // Handle event
});
```

### 4. Use Callbacks for Handlers

```typescript
const handleUpdate = useCallback(
  (data) => {
    // Your logic
  },
  [dependencies]
);

useEffect(() => {
  channel.bind("event", handleUpdate);
  return () => channel.unbind("event", handleUpdate);
}, [handleUpdate]);
```

---

**Next:** Learn how to troubleshoot common issues!

**[Next: Chapter 8 - Troubleshooting →](./08-troubleshooting.md)**
