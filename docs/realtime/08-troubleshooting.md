# Chapter 8: Troubleshooting

## Common Issues and Solutions

This chapter covers common problems you might encounter and how to fix them.

## 🔍 Debugging Checklist

Before diving into specific issues, check these first:

```bash
# 1. Check environment variables
cat .env.local | grep PUSHER

# 2. Check Pusher connection
# Open browser console, you should see:
# ✅ Pusher connected!

# 3. Check Pusher dashboard
# Go to: dashboard.pusher.com
# Click: Debug Console
# Should show connection events

# 4. Check network tab
# Open DevTools → Network → WS (WebSocket)
# Should see active WebSocket connection
```

---

## 🐛 Connection Issues

### Problem: "Pusher is not defined"

**Error:**
```
ReferenceError: Pusher is not defined
```

**Solution:**
```bash
# Install Pusher client
npm install pusher-js

# Restart dev server
npm run dev
```

---

### Problem: "WebSocket connection failed"

**Symptoms:**
- Console shows: `Pusher: connecting → unavailable`
- Real-time features don't work

**Solutions:**

#### 1. Check Environment Variables

```env
# .env.local must have:
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap1  # or your cluster

# Restart server after changing!
```

#### 2. Check Firewall/Network

```bash
# Test Pusher directly
curl https://ws-ap1.pusher.com

# If this fails, firewall might be blocking WebSockets
```

#### 3. Check Browser Console

```javascript
// Look for detailed error
pusherClient.connection.bind("error", (err) => {
  console.error("Connection error:", err);
});
```

---

### Problem: "401 Unauthorized" on Presence Channels

**Error:**
```
Pusher: Received error on presence-project-abc: 401
```

**Solutions:**

#### 1. Check Auth Endpoint

```typescript
// lib/pusher-client.ts
export const pusherClient = new PusherClient(key, {
  authEndpoint: "/api/pusher/auth", // ✅ Correct path?
});
```

#### 2. Check User Session

```typescript
// app/api/pusher/auth/route.ts
const session = await getSession();
console.log("Session:", session); // Is user logged in?
```

#### 3. Check Project Access

```typescript
// Does user have access to this project?
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    users: { some: { id: session.userId } },
  },
});

console.log("Project access:", !!project);
```

---

## 🖱️ Cursor Issues

### Problem: Cursors Not Showing

**Checklist:**

#### 1. Enable Client Events in Pusher

**THIS IS THE #1 CAUSE!**

```
1. Go to dashboard.pusher.com
2. Select your app
3. Click "App Settings"
4. Find "Enable client events"
5. Turn it ON ✅
6. Click "Save"
7. Restart your app
```

#### 2. Check Event Name

```typescript
// Must start with "client-"
channel.trigger("client-cursor-move", { ... }); // ✅ Correct
channel.trigger("cursor-move", { ... });        // ❌ Wrong!
```

#### 3. Check Channel Type

```typescript
// Cursors work on presence channels
const channel = pusherClient.subscribe("presence-project-abc"); // ✅

// Not on private channels
const channel = pusherClient.subscribe("private-project-abc"); // ❌
```

#### 4. Check Filter

```typescript
// Don't show own cursor
if (data.userId === currentUserId) return; // ✅

// If this is missing, you might only see your own!
```

---

### Problem: Choppy/Laggy Cursors

**Solution: Adjust Throttle**

```typescript
// Too slow (choppy)
setTimeout(() => {
  broadcastCursor(x, y, name);
}, 100); // 10fps ❌

// Too fast (wastes bandwidth)
setTimeout(() => {
  broadcastCursor(x, y, name);
}, 5); // 200fps ❌

// Just right
setTimeout(() => {
  broadcastCursor(x, y, name);
}, 16); // 60fps ✅
```

---

### Problem: Cursors Never Disappear

**Solution: Check Timeout**

```typescript
// Set timeout to remove inactive cursors
const timeout = setTimeout(() => {
  setCursors(prev => {
    const newCursors = new Map(prev);
    newCursors.delete(userId);
    return newCursors;
  });
}, 3000); // 3 seconds

// IMPORTANT: Clear on cleanup!
return () => {
  clearTimeout(timeout);
};
```

---

## 👥 Presence Issues

### Problem: Not Seeing Other Users

**Solutions:**

#### 1. Check Channel Name

```typescript
// Must start with "presence-"
const channel = pusherClient.subscribe("presence-project-abc"); // ✅
const channel = pusherClient.subscribe("project-abc");          // ❌
```

#### 2. Check User Filter

```typescript
// Don't include yourself
members.each((member) => {
  if (member.id !== currentUserId) { // ✅ Important!
    addMember(member);
  }
});
```

#### 3. Check Authorization

```typescript
// app/api/pusher/auth/route.ts

// Return user info in auth response
const authResponse = pusherServer.authorizeChannel(
  socket_id,
  channel_name,
  {
    user_id: user.id,        // ✅ Required
    user_info: {             // ✅ Required
      id: user.id,
      name: user.name,
      email: user.email,
    },
  }
);
```

---

### Problem: Presence Count Wrong

**Solution: Check Event Handlers**

```typescript
// Count includes you!
const totalUsers = members.length + 1; // ✅

// Or track separately
const [allMembers, setAllMembers] = useState([]);

channel.bind("pusher:subscription_succeeded", (members) => {
  // Include yourself in initial list
  setAllMembers([currentUser, ...getMembersArray(members)]);
});
```

---

## 🔄 Update Issues

### Problem: Updates Not Appearing

**Solutions:**

#### 1. Check Event Broadcasting

```typescript
// Are events being sent?
await pusherServer.trigger(
  `project-${projectId}`,  // ✅ Correct channel
  "task-created",          // ✅ Correct event
  { taskId: task.id }      // ✅ Has data
);

// Add logging
console.log("Broadcasting:", channel, event, data);
```

#### 2. Check Event Listening

```typescript
// Are you listening to the right events?
channel.bind("task-created", handler);  // ✅ Match exactly
channel.bind("taskCreated", handler);   // ❌ Wrong name!
```

#### 3. Check Query Invalidation

```typescript
// After receiving event, invalidate queries
const handleUpdate = useCallback((data) => {
  queryClient.invalidateQueries({ 
    queryKey: ["projects", projectId] // ✅ Correct key
  });
}, [projectId]);

// Make sure key matches your query!
const { data } = useQuery({ 
  queryKey: ["projects", projectId] // ✅ Must match above
});
```

---

### Problem: Duplicate Updates

**Solution: Check Cleanup**

```typescript
// Good ✅
useEffect(() => {
  channel.bind("task-created", handler);
  
  return () => {
    channel.unbind("task-created", handler); // Cleanup!
  };
}, [handler]);

// Bad ❌
useEffect(() => {
  channel.bind("task-created", handler);
  // No cleanup = binds multiple times!
}, [handler]);
```

---

### Problem: Old Data After Update

**Solution: Check Stale Time**

```typescript
// If stale time is too high, might not refetch
const { data } = useQuery({
  queryKey: ["projects", projectId],
  staleTime: 0, // Always refetch ✅
  // staleTime: Infinity, // Never refetch ❌
});
```

---

## ⚡ Performance Issues

### Problem: Too Many Events

**Solution: Debounce Updates**

```typescript
import { debounce } from "lodash";

const debouncedUpdate = useCallback(
  debounce((data) => {
    queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
  }, 300),
  [projectId]
);

channel.bind("task-updated", debouncedUpdate);
```

---

### Problem: Memory Leaks

**Solution: Always Clean Up**

```typescript
useEffect(() => {
  // Subscribe
  const channel = pusherClient.subscribe(`project-${projectId}`);
  
  // Bind events
  channel.bind("task-created", handler);
  
  // ✅ ALWAYS clean up!
  return () => {
    channel.unbind_all();
    pusherClient.unsubscribe(`project-${projectId}`);
  };
}, [projectId]);
```

---

### Problem: High Bandwidth Usage

**Solutions:**

#### 1. Throttle Cursor Updates

```typescript
// Send less frequently
setTimeout(() => broadcastCursor(x, y), 50); // 20fps instead of 60fps
```

#### 2. Send Only IDs, Not Full Objects

```typescript
// Good ✅
broadcastTaskEvent(projectId, "task-created", { 
  taskId: task.id 
});

// Bad ❌
broadcastTaskEvent(projectId, "task-created", { 
  ...task, // Don't send full task!
  ...assignee,
  ...status,
  // etc...
});
```

#### 3. Use One Channel Per Project

```typescript
// Good ✅
const channel = pusherClient.subscribe(`project-${projectId}`);

// Bad ❌
const taskChannel = pusherClient.subscribe(`tasks-${projectId}`);
const statusChannel = pusherClient.subscribe(`statuses-${projectId}`);
// Multiple channels = more overhead!
```

---

## 🔐 Security Issues

### Problem: Unauthorized Access

**Solution: Verify in Auth Endpoint**

```typescript
// app/api/pusher/auth/route.ts

// 1. Check user is logged in
const session = await getSession();
if (!session?.userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// 2. Check user has access to project
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    users: { some: { id: session.userId } },
  },
});

if (!project) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// 3. Only then authorize
return NextResponse.json(authResponse);
```

---

### Problem: Secret Key Exposed

**Check:**

```bash
# Secret should NEVER be in frontend code!
grep -r "PUSHER_SECRET" app/   # Should find nothing ❌
grep -r "PUSHER_SECRET" lib/   # Should find nothing ❌

# Secret should ONLY be in:
# - .env.local (server)
# - lib/pusher-server.ts (server)
# - app/api/ (server)
```

**If exposed:**
1. Regenerate secret in Pusher dashboard
2. Update `.env.local`
3. Deploy with new secret

---

## 🧪 Testing Issues

### Problem: Can't Test Locally with Multiple Users

**Solution: Use Multiple Browsers**

```bash
# Test with:
- Chrome (normal)
- Chrome (incognito)
- Firefox
- Safari

# Each can log in as a different user!
```

---

### Problem: Tests Failing in CI

**Solution: Mock Pusher**

```typescript
// tests/mocks/pusher.ts
export const mockPusherClient = {
  subscribe: jest.fn(() => ({
    bind: jest.fn(),
    unbind: jest.fn(),
    trigger: jest.fn(),
  })),
  unsubscribe: jest.fn(),
};

// In test
jest.mock("@/lib/pusher-client", () => ({
  pusherClient: mockPusherClient,
}));
```

---

## 📊 Debugging Tools

### Browser Console Commands

```javascript
// Check Pusher state
window.pusherClient.connection.state;
// Should be: "connected"

// List subscribed channels
window.pusherClient.allChannels();

// Get channel details
const channel = window.pusherClient.channel("presence-project-abc");
channel.subscribed; // Should be true

// List members (presence channels)
channel.members.count;
channel.members.each((member) => console.log(member));
```

### Pusher Debug Console

```
1. Go to: dashboard.pusher.com
2. Select your app
3. Click: "Debug Console"
4. Filter by channel or event
5. See all events in real-time
```

### Network Tab

```
1. Open DevTools
2. Network tab
3. Filter: WS (WebSocket)
4. Look for: ws-[cluster].pusher.com
5. Click to see all messages
```

---

## 🆘 Still Need Help?

### Check Official Resources

- Pusher Docs: https://pusher.com/docs
- Pusher Support: support@pusher.com
- React Query Docs: https://tanstack.com/query

### Enable Verbose Logging

```typescript
// lib/pusher-client.ts
Pusher.logToConsole = true; // Enable detailed logs

export const pusherClient = new PusherClient(key, {
  // ... your config
});
```

### Create Minimal Reproduction

If nothing works, create a minimal example:

```typescript
// minimal-test.tsx
"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";

export function MinimalTest() {
  useEffect(() => {
    const channel = pusherClient.subscribe("test-channel");
    
    channel.bind("test-event", (data) => {
      console.log("Received:", data);
    });

    // Trigger from Pusher Debug Console
    // Event: test-event
    // Data: { "message": "hello" }
    
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("test-channel");
    };
  }, []);

  return <div>Check console for messages</div>;
}
```

---

## ✅ Quick Reference

### Checklist Before Asking for Help

- [ ] Environment variables set correctly
- [ ] Dev server restarted after env changes
- [ ] Pusher connection shows "connected"
- [ ] Client events enabled (for cursors)
- [ ] Auth endpoint returns 200
- [ ] Events appearing in Pusher Debug Console
- [ ] Query keys match between invalidate and useQuery
- [ ] Cleanup functions present in useEffect
- [ ] No errors in browser console
- [ ] No errors in server console

---

**Congratulations!** 🎉 You now have comprehensive real-time collaboration documentation! Keep this guide handy for reference.

**[← Back to Documentation Index](./README.md)**

