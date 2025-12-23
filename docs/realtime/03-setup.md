# Chapter 3: Setup Guide

## Setting Up Real-Time Features from Scratch

This guide will walk you through setting up Pusher and real-time features step by step.

## ✅ Prerequisites

Before starting, make sure you have:

- ✅ Node.js installed (v18 or higher)
- ✅ A Pusher account (free tier is fine)
- ✅ Basic knowledge of React and Next.js

## 📝 Step 1: Create a Pusher Account

### 1.1 Sign Up

1. Go to [pusher.com](https://pusher.com)
2. Click "Sign Up" (free plan available)
3. Create your account

### 1.2 Create a Channels App

1. After logging in, click "Channels" → "Create app"
2. Fill in the details:
   ```
   Name: PM App (or any name you like)
   Cluster: Choose closest to you (e.g., ap1 for Asia)
   Frontend: React
   Backend: Node.js
   ```
3. Click "Create app"

### 1.3 Get Your Credentials

You'll see a screen with your credentials:

```
app_id = "2094474"
key = "643d852146c41a634e4e"
secret = "d0b5b1ad6ce67b546ec0"
cluster = "ap1"
```

**⚠️ Important:** Keep your secret safe! Never put it in frontend code.

## 🔧 Step 2: Install Dependencies

Open your terminal and install the required packages:

```bash
# Install Pusher libraries
npm install pusher pusher-js

# Install Framer Motion (for smooth cursor animations)
npm install framer-motion
```

**What each package does:**

- `pusher` → Server-side library (backend)
- `pusher-js` → Client-side library (frontend/browser)
- `framer-motion` → Smooth animations for cursors

## 🔐 Step 3: Add Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Public variables (can be used in browser)
NEXT_PUBLIC_PUSHER_KEY=643d852146c41a634e4e
NEXT_PUBLIC_PUSHER_CLUSTER=ap1

# Private variables (server-only)
PUSHER_APP_ID=2094474
PUSHER_SECRET=d0b5b1ad6ce67b546ec0
```

**Replace these with your own credentials from Step 1.3!**

### Understanding Public vs Private:

```
NEXT_PUBLIC_* → Can be used in browser ✅
               → Anyone can see it ✅
               → Used for: Connecting to Pusher

Others        → Server-only ⚠️
              → Never sent to browser ✅
              → Used for: Broadcasting events, auth
```

## 📄 Step 4: Enable Client Events in Pusher

**This is CRITICAL for cursor sharing to work!**

1. Go to your Pusher dashboard
2. Select your app
3. Click "App Settings"
4. Scroll to "Enable client events"
5. **Turn it ON** ✅
6. Click "Save"

```
Enable client events: [✓] ON
```

**Why?** Client events allow browsers to send events directly to other browsers without going through your server. Perfect for cursor positions!

## 🔌 Step 5: Create Pusher Client

Create `lib/pusher-client.ts`:

```typescript
import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
    auth: {
      headers: {
        "Content-Type": "application/json",
      },
    },
  }
);

// Optional: Add logging for debugging
pusherClient.connection.bind("state_change", (states) => {
  console.log(`Pusher: ${states.previous} → ${states.current}`);
});

pusherClient.connection.bind("connected", () => {
  console.log("✅ Pusher connected!");
});

pusherClient.connection.bind("error", (err: any) => {
  console.error("❌ Pusher error:", err);
});
```

**Breakdown:**

- `NEXT_PUBLIC_PUSHER_KEY` → Your public key (safe in browser)
- `cluster` → Geographic region (e.g., "ap1" for Asia)
- `authEndpoint` → Where to verify users for presence channels
- Logging → Helps debug connection issues

## 🖥️ Step 6: Create Pusher Server

Create `lib/pusher-server.ts`:

```typescript
import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true, // Use secure connection
});
```

**Breakdown:**

- `appId` → Your Pusher app ID
- `secret` → Private key (server-only!)
- `useTLS: true` → Uses HTTPS (more secure)

## 🔐 Step 7: Create Auth Endpoint

Create `app/api/pusher/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Pusher info from request
    const { socket_id, channel_name } = await request.json();

    // Extract project ID from channel name
    // Example: "presence-project-abc123" → "abc123"
    const projectId = channel_name.split("-")[2];

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { users: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isUserInProject = project.users.some(
      (user) => user.id === session.userId
    );

    if (!isUserInProject) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user info to send to other clients
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Authorize the user
    const authResponse = pusherServer.authorizeChannel(
      socket_id,
      channel_name,
      {
        user_id: user.id,
        user_info: {
          id: user.id,
          name: user.name || user.email.split("@")[0],
          email: user.email,
        },
      }
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**What this does:**

1. ✅ Checks if user is logged in
2. ✅ Checks if user can access the project
3. ✅ Gets user's name and info
4. ✅ Returns authorization token to Pusher
5. ❌ Rejects if anything fails

## 📢 Step 8: Create Trigger Endpoint

Create `app/api/pusher/trigger/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channel, event, data, projectId } = await request.json();

    // Optional: Verify user has access to the project
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          users: {
            some: {
              id: session.userId,
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Broadcast the event
    await pusherServer.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**What this does:**

1. ✅ Verifies user is logged in
2. ✅ Optionally checks project access
3. ✅ Broadcasts event through Pusher
4. ✅ Returns success/error

## ✅ Step 9: Test Your Setup

### 9.1 Check Environment Variables

```bash
# In your terminal:
npm run dev

# You should see:
# ✅ Server running on http://localhost:3000
# ✅ No errors about missing env variables
```

### 9.2 Check Pusher Connection

Open your browser console (F12) and look for:

```
Pusher: disconnected → connecting
Pusher: connecting → connected
✅ Pusher connected!
```

If you see this, you're good! 🎉

### 9.3 Check Pusher Dashboard

1. Go to Pusher dashboard
2. Click your app
3. Click "Debug Console"
4. Open your app in browser
5. You should see connection events in the console

## 🐛 Troubleshooting

### Problem: "Pusher is not defined"

**Solution:** Check if you installed `pusher-js`:

```bash
npm install pusher-js
```

### Problem: "Invalid credentials"

**Solution:** Double-check your `.env.local` file:

- Are the values correct?
- Did you restart your dev server after changing `.env.local`?
- Are you using `NEXT_PUBLIC_` prefix for public variables?

### Problem: "Unauthorized" error

**Solution:** Check your auth endpoint:

- Is the user logged in?
- Does the user have access to the project?
- Check browser console for detailed errors

### Problem: Cursors not showing

**Solution:**

1. Go to Pusher dashboard
2. Check "App Settings"
3. Make sure "Enable client events" is ON ✅
4. Save and try again

## 🎉 Success!

If everything is working, you should:

- ✅ See Pusher connection logs in console
- ✅ See no errors in terminal or browser
- ✅ Be ready to add real-time features!

## 🚀 Next Steps

Now that everything is set up, let's implement the presence system!

**[Next: Chapter 4 - Presence System →](./04-presence.md)**
