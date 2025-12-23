# Chapter 6: Real-Time Updates

## Instant Data Synchronization

When someone creates, updates, or deletes a task or status, everyone sees it immediately!

## 🎯 What We're Building

```
User A creates a task "Fix homepage"
              ↓
     Saves to database
              ↓
    Broadcasts "task-created" event
              ↓
┌─────────────┴──────────────┐
│                             │
User B's screen         User C's screen
updates instantly!      updates instantly!
```

## 🔍 How It Works

### The Flow

```
1. User performs action (create/update/delete)
         ↓
2. API saves to database
         ↓
3. API broadcasts Pusher event
         ↓
4. All connected users receive event
         ↓
5. React Query refetches data
         ↓
6. UI updates automatically
```

### Why This Approach?

```typescript
// Option 1: Send full data in event ❌
event: "task-created"
data: { id, title, description, ... } // Can get out of sync!

// Option 2: Send notification only ✅
event: "task-created"
data: { taskId } // Then refetch from database
```

We use Option 2 because:
- ✅ Always shows latest data from database
- ✅ Simpler to implement
- ✅ No sync issues

## 📝 Step 1: Create Broadcast Helper

Add to `lib/hooks/use-realtime.ts`:

```typescript
// Helper function to broadcast events from backend
export async function broadcastTaskEvent(
  projectId: string,
  eventName: string,
  data: any
) {
  try {
    await fetch("/api/pusher/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: `project-${projectId}`,
        event: eventName,
        data,
        projectId,
      }),
    });
  } catch (error) {
    console.error("Failed to broadcast event:", error);
  }
}
```

### Understanding the Helper

**Channel Naming:**

```typescript
channel: `project-${projectId}`

// Examples:
"project-abc123"  // Events for project abc123
"project-xyz789"  // Events for project xyz789
```

**Event Names:**

```typescript
// Task events
"task-created"
"task-updated"
"task-deleted"
"task-moved"

// Status events
"status-created"
"status-updated"
"status-deleted"
```

## 📝 Step 2: Add Broadcasting to Task Hooks

Update `lib/hooks/use-tasks.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { broadcastTaskEvent } from "./use-realtime";

// Create task
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId }),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: (task) => {
      // Update local cache
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      
      // Show success message
      toast.success("Task created successfully");
      
      // Broadcast to other users ✨
      broadcastTaskEvent(projectId, "task-created", {
        taskId: task.id,
        projectId,
      });
    },
  });
}

// Update task
export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      toast.success("Task updated successfully");
      
      // Broadcast update ✨
      broadcastTaskEvent(projectId, "task-updated", {
        taskId: task.id,
        projectId,
      });
    },
  });
}

// Delete task
export function useDeleteTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Task deleted successfully");
      
      // Broadcast deletion ✨
      broadcastTaskEvent(projectId, "task-deleted", {
        taskId,
        projectId,
      });
    },
  });
}

// Move task
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, statusId }: any) => {
      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      if (!response.ok) throw new Error("Failed to move task");
      return response.json();
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Task moved");
      
      // Broadcast move ✨
      broadcastTaskEvent(projectId, "task-moved", {
        taskId: task.id,
        newStatusId: task.statusId,
        projectId,
      });
    },
  });
}
```

### Pattern to Notice

Every mutation follows the same pattern:

```typescript
onSuccess: (result) => {
  // 1. Update local cache
  queryClient.invalidateQueries(...);
  
  // 2. Show feedback
  toast.success("...");
  
  // 3. Broadcast to others ✨
  broadcastTaskEvent(projectId, "event-name", { ... });
}
```

## 📝 Step 3: Add Broadcasting to Status Hooks

Update `lib/hooks/use-statuses.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { broadcastTaskEvent } from "./use-realtime";

// Create status
export function useCreateStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId }),
      });
      if (!response.ok) throw new Error("Failed to create status");
      return response.json();
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Status created successfully");
      
      // Broadcast to other users ✨
      broadcastTaskEvent(projectId, "status-created", {
        statusId: status.id,
        projectId,
      });
    },
  });
}

// Update status
export function useUpdateStatus(statusId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/statuses/${statusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Status updated successfully");
      
      // Broadcast update ✨
      broadcastTaskEvent(projectId, "status-updated", {
        statusId: status.id,
        projectId,
      });
    },
  });
}

// Delete status
export function useDeleteStatus(statusId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/statuses/${statusId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Status deleted successfully");
      
      // Broadcast deletion ✨
      broadcastTaskEvent(projectId, "status-deleted", {
        statusId,
        projectId,
      });
    },
  });
}
```

## 📝 Step 4: Listen for Updates

Add to `lib/hooks/use-realtime.ts`:

```typescript
// Hook to listen for real-time updates
export function useRealtimeUpdates(
  projectId: string,
  onUpdate: (data: any) => void
) {
  useEffect(() => {
    if (!projectId) return;

    const projectChannelName = `project-${projectId}`;
    const channel = pusherClient.subscribe(projectChannelName);

    // Bind all event types
    channel.bind("task-created", onUpdate);
    channel.bind("task-updated", onUpdate);
    channel.bind("task-deleted", onUpdate);
    channel.bind("task-moved", onUpdate);
    channel.bind("status-created", onUpdate);
    channel.bind("status-updated", onUpdate);
    channel.bind("status-deleted", onUpdate);

    channel.bind("pusher:subscription_error", (status: any) => {
      console.error("Subscription error:", status);
      toast.error("Failed to connect to real-time updates. Please refresh.");
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(projectChannelName);
    };
  }, [projectId, onUpdate]);
}
```

### Understanding the Listener

**Single Handler:**

```typescript
const onUpdate = (data) => {
  // Handle any update type
};

// All events use the same handler
channel.bind("task-created", onUpdate);
channel.bind("task-updated", onUpdate);
// ... etc
```

We use one handler because they all do the same thing: refetch data!

## 📝 Step 5: Use in Project Board

Update `components/features/kanban/project-board.tsx`:

```typescript
"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeUpdates } from "@/lib/hooks/use-realtime";

export function ProjectBoard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  // Handle any real-time update
  const handleRealtimeUpdate = useCallback(
    (data: any) => {
      console.log("Received update:", data);
      
      // Refetch project data
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
    [queryClient, projectId]
  );

  // Listen for updates
  useRealtimeUpdates(projectId, handleRealtimeUpdate);

  return (
    <div>
      {/* Your board content */}
      {/* React Query will automatically refetch when invalidated */}
    </div>
  );
}
```

### How It Works

```
1. Someone creates a task
        ↓
2. useCreateTask broadcasts "task-created"
        ↓
3. useRealtimeUpdates receives event
        ↓
4. handleRealtimeUpdate calls invalidateQueries
        ↓
5. React Query refetches project data
        ↓
6. Component re-renders with new data
        ↓
7. User sees the new task! ✨
```

## 🎨 Visual Feedback

### Optimistic Updates (Optional)

You can make updates feel even faster:

```typescript
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // API call...
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData(["projects", projectId]);

      // Optimistically update
      queryClient.setQueryData(["projects", projectId], (old: any) => {
        return {
          ...old,
          tasks: [...old.tasks, { ...newTask, id: "temp-id" }],
        };
      });

      return { previousProject };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["projects", projectId],
        context.previousProject
      );
    },
    onSuccess: (task) => {
      // Refetch to get real data
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      broadcastTaskEvent(projectId, "task-created", { taskId: task.id });
    },
  });
}
```

**With optimistic updates:**
```
User clicks "Create" → Task appears INSTANTLY
                    → Saves in background
                    → Broadcasts to others
```

**Without optimistic updates:**
```
User clicks "Create" → Wait for server
                    → Then task appears
```

## 🧪 Testing

### Test 1: Basic Update

1. Open in two windows (different users)
2. Window 1: Create a task
3. Window 2: Task should appear automatically!

### Test 2: Multiple Actions

1. Window 1: Create task
2. Window 2: Should see it
3. Window 2: Edit the task
4. Window 1: Should see the edit
5. Window 1: Delete it
6. Window 2: Should disappear

### Test 3: Status Updates

1. Window 1: Create a new status
2. Window 2: New column should appear
3. Window 1: Delete the status
4. Window 2: Column should disappear

### Test 4: Many Users

1. Open in 3-5 windows
2. Everyone make changes
3. Everyone should see all changes

## 🐛 Common Issues

### Problem: Updates not appearing

**Check:**
```typescript
// Is the event being broadcast?
console.log("Broadcasting event:", eventName, data);

// Is the listener receiving it?
console.log("Received event:", data);

// Is invalidateQueries being called?
console.log("Invalidating queries");
```

### Problem: Duplicate updates

**Check if you're subscribing multiple times:**
```typescript
// Good ✅
useEffect(() => {
  channel.bind("task-created", handler);
  return () => {
    channel.unbind("task-created", handler); // Cleanup!
  };
}, []);

// Bad ❌
useEffect(() => {
  channel.bind("task-created", handler);
  // No cleanup - binds again on every render!
});
```

### Problem: Old data showing

**Check query keys:**
```typescript
// Make sure they match!
queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
//                                           ↑ Must match
const { data } = useQuery({ queryKey: ["projects", projectId] });
//                                      ↑ Must match
```

## ⚡ Performance Tips

### 1. Batch Invalidations

```typescript
// Instead of:
queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
queryClient.invalidateQueries({ queryKey: ["tasks"] });
queryClient.invalidateQueries({ queryKey: ["statuses"] });

// Do:
queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
// This refetches everything in one go!
```

### 2. Debounce Rapid Updates

```typescript
const debouncedInvalidate = debounce(() => {
  queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
}, 300);

useRealtimeUpdates(projectId, debouncedInvalidate);
```

### 3. Use Stale Time

```typescript
const { data } = useQuery({
  queryKey: ["projects", projectId],
  staleTime: 30000, // Consider fresh for 30 seconds
});
```

Reduces unnecessary refetches.

## 🎓 Key Concepts

1. **Broadcast after saving** to database
   - Save first, then broadcast
   - Never broadcast before saving

2. **Send minimal data** in events
   - Just IDs, not full objects
   - Refetch from database for truth

3. **Use invalidateQueries** for updates
   - React Query handles refetching
   - Automatic loading states

4. **Clean up subscriptions**
   - Always unbind in cleanup
   - Prevents memory leaks

## 🚀 Next Steps

Let's look at complete code examples!

**[Next: Chapter 7 - Code Examples →](./07-examples.md)**

