# Chapter 2: Architecture

## How Everything Fits Together

Let's understand how all the pieces of our real-time system work together!

## 🏗️ The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Presence    │  │    Cursor    │  │   Updates    │      │
│  │   Avatars    │  │   Tracking   │  │  Listener    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                  ┌────────▼────────┐                        │
│                  │ pusherClient.js │                        │
│                  └────────┬────────┘                        │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │    PUSHER     │  (Cloud Service)
                    │   WebSocket   │
                    └───────┬───────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           │          BACKEND                 │
│                  ┌────────▼────────┐                        │
│                  │ pusherServer.js │                        │
│                  └────────┬────────┘                        │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐       │
│  │     Auth     │  │   Trigger   │  │  Database   │       │
│  │   Endpoint   │  │   Events    │  │   (Prisma)  │       │
│  └──────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

Here's where all the real-time code lives:

```
project-root/
├── lib/
│   ├── pusher-client.ts          # Client-side Pusher setup
│   ├── pusher-server.ts          # Server-side Pusher setup
│   └── hooks/
│       ├── use-realtime.ts       # Real-time React hooks
│       ├── use-tasks.ts          # Task CRUD + broadcasts
│       └── use-statuses.ts       # Status CRUD + broadcasts
├── app/
│   └── api/
│       └── pusher/
│           ├── auth/route.ts     # Authenticate users for presence
│           └── trigger/route.ts  # Trigger events from server
└── components/
    └── features/
        ├── collaboration/
        │   ├── cursor.tsx        # Individual cursor component
        │   └── presence-avatars.tsx  # Who's viewing display
        └── kanban/
            └── project-board.tsx # Main board with real-time
```

## 🔧 Core Components

### 1. **Pusher Client** (`lib/pusher-client.ts`)

**Purpose:** Connects the browser to Pusher's WebSocket servers.

```typescript
// This runs in the user's browser
import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY,
  {
    cluster: "ap1",
    authEndpoint: "/api/pusher/auth", // Where to authenticate
  }
);
```

**What it does:**

- 🔌 Opens WebSocket connection to Pusher
- 👂 Listens for events from channels
- 📤 Sends client events (like cursor movements)

---

### 2. **Pusher Server** (`lib/pusher-server.ts`)

**Purpose:** Allows our backend to send events through Pusher.

```typescript
// This runs on our server
import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "ap1",
});
```

**What it does:**

- 📢 Broadcasts events to all connected users
- ✅ Authenticates presence channel connections
- 🔐 Securely verifies users

---

### 3. **Real-Time Hooks** (`lib/hooks/use-realtime.ts`)

**Purpose:** React hooks that make real-time features easy to use.

```typescript
// Three main hooks:

1. usePresence()     // Who's viewing the project
2. useCursors()      // Track everyone's mouse
3. useRealtimeUpdates()  // Listen for data changes
```

---

### 4. **Auth Endpoint** (`app/api/pusher/auth/route.ts`)

**Purpose:** Verifies users can join presence channels.

```typescript
// Security check before allowing user to join

1. Is the user logged in? ✅
2. Does the user have access to this project? ✅
3. Get user's name and avatar ✅
4. Return authorization token ✅
```

---

### 5. **Trigger Endpoint** (`app/api/pusher/trigger/route.ts`)

**Purpose:** Allows server to broadcast events.

```typescript
// When data changes:

1. Save to database ✅
2. Call this endpoint to broadcast event ✅
3. All users receive the update ✅
```

## 🔄 Data Flow Examples

### Example 1: User Joins a Project

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: User opens project page                         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 2: usePresence() hook activates                    │
│ → Subscribes to "presence-project-abc123"               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 3: Pusher asks for authorization                   │
│ → Sends request to /api/pusher/auth                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 4: Server checks permissions                       │
│ → Is user logged in? ✅                                 │
│ → Is user in this project? ✅                           │
│ → Returns auth token + user info                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 5: User joins presence channel                     │
│ → Other users see "Sarah joined" event                  │
│ → Sarah's avatar appears for everyone                   │
└─────────────────────────────────────────────────────────┘
```

### Example 2: Creating a Task

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: User A clicks "Create Task"                     │
│ → Fills in task details                                 │
│ → Clicks "Save"                                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 2: Frontend calls useCreateTask()                  │
│ → POST /api/tasks { title: "Fix bug", ... }            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 3: Backend saves task to database                  │
│ → Task created with ID: task-789                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 4: Backend broadcasts event                        │
│ → pusherServer.trigger(                                 │
│     "project-abc123",                                    │
│     "task-created",                                      │
│     { taskId: "task-789" }                              │
│   )                                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 5: All users receive event                         │
│ → useRealtimeUpdates() catches "task-created"           │
│ → Triggers queryClient.invalidateQueries()              │
│ → React Query fetches latest data                       │
│ → UI updates with new task                              │
└─────────────────────────────────────────────────────────┘
```

### Example 3: Moving the Mouse (Cursor Sharing)

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: User A moves their mouse                        │
│ → onMouseMove event fires                               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 2: broadcastCursor() throttled to ~60fps          │
│ → Prevents sending too many events                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 3: Send cursor position to Pusher                  │
│ → channel.trigger("client-cursor-move", {               │
│     userId: "user-123",                                  │
│     userName: "Sarah",                                   │
│     x: 450,                                              │
│     y: 320                                               │
│   })                                                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ STEP 4: Pusher broadcasts to other users               │
│ → User B receives event                                 │
│ → useCursors() hook updates cursor state                │
│ → Cursor component moves to (450, 320)                  │
│ → Animation makes it smooth                             │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security Layers

### 1. **Environment Variables**

```env
# Public (can be in browser)
NEXT_PUBLIC_PUSHER_KEY=abc123

# Secret (server only)
PUSHER_SECRET=xyz789
```

### 2. **Authentication Endpoint**

```typescript
// Checks before allowing user to join presence channel:
✅ Valid session
✅ User is part of the project
✅ User exists in database
```

### 3. **Channel Authorization**

```typescript
// Presence channels require authentication
"presence-project-abc"  → Requires auth ✅
"project-abc"           → Public to project members ✅
```

## 🎯 Channel Naming Convention

```typescript
// Presence channels (who's online)
`presence-project-${projectId}`;
Example: "presence-project-abc123" // Project channels (data updates)
`project-${projectId}`;
Example: "project-abc123";
```

## 📊 Event Types

### Server Events (Backend → Frontend)

```typescript
"task-created"; // New task added
"task-updated"; // Task modified
"task-deleted"; // Task removed
"task-moved"; // Task moved to different status
"status-created"; // New status column added
"status-updated"; // Status modified
"status-deleted"; // Status removed
```

### Client Events (Frontend → Frontend)

```typescript
"client-cursor-move"; // User moved their mouse
```

**Note:** Client events start with `client-` and go directly between users without hitting our server!

## 🎓 Key Takeaways

1. **Pusher Client** = Browser talks to Pusher
2. **Pusher Server** = Our backend talks to Pusher
3. **Presence Channels** = Track who's online
4. **Regular Channels** = Send data updates
5. **Client Events** = Fast user-to-user communication (cursors)
6. **Server Events** = Reliable data synchronization (tasks)

## 🚀 Next Steps

Ready to learn how to set everything up?

**[Next: Chapter 3 - Setup Guide →](./03-setup.md)**
