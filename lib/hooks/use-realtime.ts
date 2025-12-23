"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { Channel, PresenceChannel } from "pusher-js";

export interface PresenceMember {
  id: string;
  info: {
    email: string;
    name: string;
    githubUrl?: string | null;
  };
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  timestamp: number;
}

export function usePresence(projectId: string | null, currentUserId: string) {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [channel, setChannel] = useState<PresenceChannel | null>(null);

  useEffect(() => {
    if (!projectId) {
      console.warn("🔴 No projectId for presence");
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      console.warn("🔴 Pusher client not initialized");
      return;
    }

    console.log(
      "🟢 Subscribing to presence channel:",
      `presence-project-${projectId}`
    );

    const presenceChannel = pusher.subscribe(
      `presence-project-${projectId}`
    ) as PresenceChannel;

    // Handle initial members list
    presenceChannel.bind("pusher:subscription_succeeded", () => {
      console.log("✅ Presence subscription succeeded");
      const allMembers: PresenceMember[] = [];
      presenceChannel.members.each((member: any) => {
        console.log("👤 Member in channel:", member);
        if (member.id !== currentUserId) {
          allMembers.push({
            id: member.id,
            info: member.info,
          });
        }
      });
      console.log("👥 Total members (excluding self):", allMembers.length);
      setMembers(allMembers);
    });

    // Handle subscription errors
    presenceChannel.bind("pusher:subscription_error", (error: any) => {
      console.error("❌ Presence subscription error:", error);
    });

    // Handle new member joining
    presenceChannel.bind("pusher:member_added", (member: any) => {
      if (member.id !== currentUserId) {
        setMembers((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === member.id)) return prev;
          return [
            ...prev,
            {
              id: member.id,
              info: member.info,
            },
          ];
        });
      }
    });

    // Handle member leaving
    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
      setChannel(null);
    };
  }, [projectId, currentUserId]);

  return { members, channel };
}

export function useCursors(
  channel: PresenceChannel | null,
  currentUserId: string
) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(
    new Map()
  );

  useEffect(() => {
    if (!channel) {
      console.warn("🔴 No channel available for cursors");
      return;
    }

    console.log("🟢 Setting up cursor listeners on channel:", channel.name);

    // Listen for cursor updates from other users
    const handleCursorUpdate = (data: CursorPosition) => {
      console.log("📍 Cursor update received:", data);
      if (data.userId !== currentUserId) {
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data);
          console.log("🖱️ Active cursors:", next.size);
          return next;
        });

        // Remove stale cursors after 3 seconds of inactivity (Figma-style)
        setTimeout(() => {
          setCursors((prev) => {
            const next = new Map(prev);
            const cursor = next.get(data.userId);
            if (cursor && cursor.timestamp === data.timestamp) {
              next.delete(data.userId);
              console.log("🗑️ Removed stale cursor for:", data.userId);
            }
            return next;
          });
        }, 3000);
      }
    };

    channel.bind("client-cursor-move", handleCursorUpdate);

    return () => {
      channel.unbind("client-cursor-move", handleCursorUpdate);
    };
  }, [channel, currentUserId]);

  const broadcastCursor = useCallback(
    (x: number, y: number, userName: string) => {
      if (!channel) {
        console.warn("🔴 Cannot broadcast cursor: no channel");
        return;
      }

      const data = {
        userId: currentUserId,
        userName,
        x,
        y,
        timestamp: Date.now(),
      };

      console.log("📤 Broadcasting cursor:", data, "on channel:", channel.name);
      
      try {
        const result = channel.trigger("client-cursor-move", data);
        if (!result) {
          console.error("❌ Trigger returned false - Client Events might not be enabled or channel not ready");
        } else {
          console.log("✅ Cursor broadcast successful");
        }
      } catch (error) {
        console.error("❌ Failed to broadcast cursor:", error);
        console.error("Channel state:", {
          subscribed: channel.subscribed,
          name: channel.name,
        });
      }
    },
    [channel, currentUserId]
  );

  return { cursors, broadcastCursor };
}

export function useRealtimeUpdates(
  projectId: string | null,
  onTaskUpdate: (data: any) => void
) {
  useEffect(() => {
    if (!projectId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`project-${projectId}`);

    // Listen for task events
    channel.bind("task-created", onTaskUpdate);
    channel.bind("task-updated", onTaskUpdate);
    channel.bind("task-deleted", onTaskUpdate);
    channel.bind("task-moved", onTaskUpdate);

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [projectId, onTaskUpdate]);
}

// Helper to trigger task events from the client
export async function broadcastTaskEvent(
  projectId: string,
  event: string,
  data: any
) {
  try {
    await fetch("/api/pusher/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: `project-${projectId}`,
        event,
        data,
      }),
    });
  } catch (error) {
    console.error("Failed to broadcast task event:", error);
  }
}
