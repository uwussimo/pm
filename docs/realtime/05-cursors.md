# Chapter 5: Live Cursors

## Figma-Style Cursor Sharing

See where other users are moving their mouse in real-time - just like in Figma or Google Slides!

## 🎯 What We're Building

```
┌──────────────────────────────────────────────┐
│                                               │
│    Your screen                                │
│                                               │
│         🖱️ Sarah                             │
│          (Another user's cursor)              │
│                                               │
│                        🖱️ Mike               │
│                         (Another cursor)      │
│                                               │
└──────────────────────────────────────────────┘
```

## 🔍 How It Works

### The Flow

```
User A moves mouse
       ↓
JavaScript captures position (x, y)
       ↓
Throttle to ~60fps (smooth but not overwhelming)
       ↓
Send via Pusher client event
       ↓
Pusher broadcasts to other users
       ↓
User B receives position
       ↓
Animated cursor appears on User B's screen
```

### Why Client Events?

```typescript
// Regular event (through server):
Browser A → Server → Pusher → Browser B
Slower, but reliable ✅

// Client event (direct):
Browser A → Pusher → Browser B
Faster, perfect for cursors! ⚡
```

## 📝 Step 1: Create the Cursor Hook

Add to `lib/hooks/use-realtime.ts`:

```typescript
import { useCallback, useRef } from "react";
import { Channel } from "pusher-js";

export interface CursorState {
  userId: string;
  userName: string;
  x: number;
  y: number;
  lastUpdate: number;
}

export function useCursors(channel: Channel | null, currentUserId: string) {
  const [cursors, setCursors] = useState<Map<string, CursorState>>(new Map());
  const cursorTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Function to send your cursor position to others
  const broadcastCursor = useCallback(
    (x: number, y: number, userName: string) => {
      if (channel && currentUserId) {
        try {
          // Send client event (starts with "client-")
          channel.trigger("client-cursor-move", {
            userId: currentUserId,
            userName,
            x,
            y,
          });
        } catch (error) {
          console.error("Failed to broadcast cursor:", error);
        }
      }
    },
    [channel, currentUserId]
  );

  useEffect(() => {
    if (channel) {
      // Listen for cursor movements from other users
      channel.bind(
        "client-cursor-move",
        (data: { userId: string; userName: string; x: number; y: number }) => {
          // Don't show your own cursor
          if (data.userId === currentUserId) return;

          // Update cursor position
          setCursors((prev) => {
            const newCursors = new Map(prev);
            newCursors.set(data.userId, { ...data, lastUpdate: Date.now() });
            return newCursors;
          });

          // Clear existing timeout for this user
          if (cursorTimeoutRefs.current.has(data.userId)) {
            clearTimeout(cursorTimeoutRefs.current.get(data.userId)!);
          }

          // Remove cursor after 3 seconds of inactivity
          const timeout = setTimeout(() => {
            setCursors((prev) => {
              const newCursors = new Map(prev);
              newCursors.delete(data.userId);
              return newCursors;
            });
            cursorTimeoutRefs.current.delete(data.userId);
          }, 3000);

          cursorTimeoutRefs.current.set(data.userId, timeout);
        }
      );

      return () => {
        channel.unbind("client-cursor-move");
        // Clear all timeouts
        cursorTimeoutRefs.current.forEach(clearTimeout);
        cursorTimeoutRefs.current.clear();
      };
    }
  }, [channel, currentUserId]);

  return { cursors, broadcastCursor };
}
```

### Understanding the Code

**Client Event Name:**

```typescript
"client-cursor-move";
//  ↑
// Must start with "client-" for client events!
```

**Throttling (we'll add this in the component):**

```typescript
// Without throttling:
Mouse moves → 1000 events per second! 😱

// With throttling (60fps):
Mouse moves → 60 events per second ✅
```

**Auto-hide Inactive Cursors:**

```typescript
setTimeout(() => {
  // Remove cursor after 3 seconds
}, 3000);
```

If someone stops moving their mouse, their cursor disappears after 3 seconds.

## 📝 Step 2: Create the Cursor Component

Create `components/features/collaboration/cursor.tsx`:

```typescript
"use client";

import { motion } from "framer-motion";

interface CursorProps {
  x: number;
  y: number;
  userName: string;
  color: string;
}

export function Cursor({ x, y, userName, color }: CursorProps) {
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        x,
        y,
        opacity: 1,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
        mass: 0.5,
      }}
      style={{ willChange: "transform" }}
    >
      {/* Cursor SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M12.9999 1.00001L1.00001 12.9999L8.00001 15.9999L10.0001 22.9999L22.0001 11.0001L12.9999 1.00001Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-0.5 rounded-full text-white text-[11px] font-medium whitespace-nowrap drop-shadow-md"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </motion.div>
  );
}
```

### Understanding the Component

**Framer Motion Animation:**

```typescript
animate={{ x, y, opacity: 1, scale: 1 }}
transition={{ type: "spring", ... }}
```

This creates smooth, spring-like cursor movement (feels natural!).

**Z-Index:**

```typescript
className = "z-[9999]";
```

Ensures cursors appear above everything else.

**Pointer Events:**

```typescript
className = "pointer-events-none";
```

Cursors don't block clicks - they're just visual.

**Custom Cursor SVG:**

The cursor looks like this:

```
    ▲
   ◄►
  ▼
```

Professional mouse cursor shape with a white border.

## 📝 Step 3: Use It in Your Project Board

Update `components/features/kanban/project-board.tsx`:

```typescript
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePresence, useCursors } from "@/lib/hooks/use-realtime";
import { Cursor } from "@/components/features/collaboration/cursor";
import { AnimatePresence } from "framer-motion";
import { getUserColor } from "@/lib/utils";

export function ProjectBoard({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  // Get presence channel
  const { members, channel } = usePresence(projectId, currentUserId);

  // Get cursor system
  const { cursors, broadcastCursor } = useCursors(channel, currentUserId);

  // Throttle ref for cursor updates
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!user || !channel) return;

      // Clear previous throttle
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      // Throttle to ~60fps
      throttleRef.current = setTimeout(() => {
        const userName = user.name || user.email.split("@")[0];
        broadcastCursor(e.clientX, e.clientY, userName);
      }, 16); // ~60fps (1000ms / 60 = 16.67ms)
    },
    [user, channel, broadcastCursor]
  );

  // Attach mouse listener
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [handleMouseMove]);

  return (
    <div>
      {/* Your board content */}
      {/* ... */}

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

### Understanding the Integration

**Throttling:**

```typescript
setTimeout(() => {
  broadcastCursor(e.clientX, e.clientY, userName);
}, 16); // 16ms = ~60fps
```

Limits cursor updates to 60 per second. Smooth but not overwhelming!

**AnimatePresence:**

```typescript
<AnimatePresence>
  {cursors.map((cursor) => (
    <Cursor ... />
  ))}
</AnimatePresence>
```

Handles smooth entrance/exit animations when cursors appear/disappear.

**Color System:**

```typescript
getUserColor(cursor.userId);
```

Each user gets a consistent color. Same person = same color every time.

## 🎨 Visual Design

### Cursor Positioning

```typescript
// Absolute positioning from top-left
className="fixed left-0 top-0"

// Then move to cursor position
animate={{ x, y }}
```

### Label Placement

```typescript
// Position label below and right of cursor
className = "absolute top-5 left-2";
```

```
    🖱️
      [Sarah]
```

### Color Consistency

```typescript
// Cursor color matches user's presence avatar
fill = { color }; // Cursor fill
backgroundColor = { color }; // Label background
```

## 🧪 Testing

### Test 1: Two Windows

1. Open app in two windows (different users)
2. Both open the same project
3. Move mouse in window 1
4. Should see cursor appear in window 2!

### Test 2: Smooth Movement

1. Move your mouse slowly
2. Other window should show smooth, spring-like movement
3. No jitter or lag

### Test 3: Auto-Hide

1. Move your mouse
2. Stop moving for 3 seconds
3. Your cursor should disappear from other windows

### Test 4: Multiple Cursors

1. Open in 3+ windows (different users)
2. Everyone move their mouse
3. Should see multiple cursors with different colors

## 🐛 Common Issues

### Problem: Cursors not appearing

**Check console for:**

```
Error: Client events are disabled
```

**Solution:** Enable client events in Pusher dashboard!

1. Go to Pusher dashboard
2. App Settings
3. Enable client events ✅

### Problem: Choppy/laggy cursors

**Check throttle value:**

```typescript
setTimeout(..., 16);  // 60fps = good ✅
setTimeout(..., 100); // 10fps = choppy ❌
setTimeout(..., 5);   // 200fps = too fast ❌
```

### Problem: Seeing your own cursor

**Check filter:**

```typescript
if (data.userId === currentUserId) return;
// Make sure this is working!
```

### Problem: Cursors stay forever

**Check timeout:**

```typescript
setTimeout(() => {
  // Remove cursor
}, 3000); // Should be working
```

## ⚡ Performance Tips

### 1. Throttle Wisely

```typescript
// Good for cursors
16ms  = ~60fps  ✅ Smooth and efficient

// Too fast (wastes bandwidth)
5ms   = ~200fps ❌

// Too slow (looks choppy)
100ms = ~10fps  ❌
```

### 2. Use willChange

```typescript
style={{ willChange: "transform" }}
```

Tells browser to optimize for smooth transforms.

### 3. Pointer Events None

```typescript
className = "pointer-events-none";
```

Cursors don't interfere with clicks.

### 4. Clean Up Timeouts

```typescript
return () => {
  cursorTimeoutRefs.current.forEach(clearTimeout);
};
```

Prevents memory leaks!

## 🎓 Key Concepts

1. **Client Events** enable fast user-to-user communication

   - Must start with `client-`
   - Must enable in Pusher dashboard
   - Don't go through your server

2. **Throttling** prevents too many events

   - 60fps is the sweet spot
   - Balance smoothness vs. bandwidth

3. **Auto-hide** removes inactive cursors

   - After 3 seconds of no movement
   - Keeps the UI clean

4. **Spring animations** make it feel natural
   - Framer Motion handles this
   - Smooth acceleration/deceleration

## 🚀 Next Steps

Now let's handle real-time data updates!

**[Next: Chapter 6 - Real-Time Updates →](./06-updates.md)**
