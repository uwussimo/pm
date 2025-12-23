# Real-time Collaboration Setup Guide

This project now supports real-time collaboration features including:

- **Live presence** - See who's viewing the project
- **Real-time cursors** - See other users' cursor positions
- **Instant updates** - All task changes sync immediately across all viewers

## Setup Instructions

### 1. Create a Pusher Account

1. Go to [https://pusher.com/](https://pusher.com/) and sign up for a free account
2. Create a new app in the Pusher dashboard
3. Choose the closest region to your users
4. Enable "Client Events" in your app settings (required for cursor sharing)

### 2. Get Your Credentials

From your Pusher dashboard, get the following credentials:

- **app_id**
- **key**
- **secret**
- **cluster** (e.g., "us2", "eu", "ap1")

### 3. Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster_here
PUSHER_APP_ID=your_app_id_here
PUSHER_SECRET=your_pusher_secret_here
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these variables.

### 4. Restart Your Development Server

```bash
npm run dev
```

## Features

### Presence System

When multiple users view the same project, they'll see avatars of other viewers in the header.

### Real-time Cursors

As users move their mouse on the kanban board, other viewers will see their cursor position with their name.

### Instant Task Updates

When any user:

- Creates a task
- Updates a task
- Moves a task between columns
- Deletes a task

All other viewers will see the change instantly without refreshing.

## Optional: Running Without Pusher

If you don't configure Pusher credentials, the app will run normally but without real-time features. The collaboration features will gracefully degrade.

## Architecture

### Components Created

1. **`lib/pusher-server.ts`** - Server-side Pusher singleton
2. **`lib/pusher-client.ts`** - Client-side Pusher singleton
3. **`lib/hooks/use-realtime.ts`** - React hooks for presence, cursors, and real-time updates
4. **`app/api/pusher/auth/route.ts`** - Authenticates users for presence channels
5. **`app/api/pusher/trigger/route.ts`** - Triggers events from server to all clients
6. **`components/features/collaboration/cursor.tsx`** - Cursor component with animations
7. **`components/features/collaboration/presence-avatars.tsx`** - Shows active users

### How It Works

1. **Presence Channels**: Each project has a presence channel (`presence-project-{id}`)

   - Users subscribe when viewing a project
   - Server authenticates with user info
   - Everyone sees who else is viewing

2. **Client Events**: Cursor positions are shared via client-to-client events

   - Throttled to 50ms for performance
   - Automatically removed after 5s of inactivity

3. **Server Events**: Task updates are broadcast via server
   - Server validates user permissions
   - Events trigger React Query invalidation
   - All clients refetch and update UI

## Performance Considerations

- Cursor updates are throttled to 50ms
- Stale cursors are removed after 5 seconds
- Presence data is cached client-side
- React Query handles efficient refetching

## Security

- All Pusher channels require authentication
- Server validates project access before authorizing
- User info (email, name) is included in presence data
- Secrets are never exposed to the browser

## Troubleshooting

### Real-time features not working?

1. Check that all Pusher env variables are set correctly
2. Verify "Client Events" is enabled in Pusher dashboard
3. Check browser console for connection errors
4. Ensure your Pusher app is in the same cluster as configured

### Cursors not showing?

- Client Events must be enabled in Pusher settings
- Check that users are in the same presence channel

### Updates not syncing?

- Check Network tab for failed API calls to `/api/pusher/trigger`
- Verify user has access to the project

## Cost Considerations

**Pusher Free Tier includes:**

- 200k messages/day
- 100 max connections
- Unlimited channels

For a small team, the free tier is more than enough. Cursor updates and presence don't count toward message limits (they're client events).

## Future Enhancements

- Task locking when someone is editing
- Live typing indicators in comments
- Audio/video chat integration
- Collaborative text editing in descriptions
- Activity feed of recent changes
