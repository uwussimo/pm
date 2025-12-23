"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

export function DebugPanel({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState({
    pusherConnected: false,
    channelSubscribed: false,
    channelName: "",
    memberCount: 0,
    cursorEventsSent: 0,
    cursorEventsReceived: 0,
  });

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      console.error("❌ Pusher not initialized");
      return;
    }

    // Check connection
    const checkConnection = () => {
      setStatus((prev) => ({
        ...prev,
        pusherConnected: pusher.connection.state === "connected",
      }));
    };

    pusher.connection.bind("state_change", checkConnection);
    checkConnection();

    // Check channel subscription
    const channelName = `presence-project-${projectId}`;
    const channel = pusher.channel(channelName);

    if (channel) {
      setStatus((prev) => ({
        ...prev,
        channelSubscribed: channel.subscribed,
        channelName,
      }));

      // Listen for cursor events
      channel.bind("client-cursor-move", (data: any) => {
        console.log("📍 Cursor event received in debug panel:", data);
        setStatus((prev) => ({
          ...prev,
          cursorEventsReceived: prev.cursorEventsReceived + 1,
        }));
      });

      // Track member count
      if ((channel as any).members) {
        const members = (channel as any).members;
        setStatus((prev) => ({
          ...prev,
          memberCount: members.count,
        }));
      }
    }

    return () => {
      pusher.connection.unbind("state_change", checkConnection);
      if (channel) {
        channel.unbind("client-cursor-move");
      }
    };
  }, [projectId]);

  return (
    <div className="fixed bottom-4 right-4 bg-black/95 text-white p-4 rounded-lg text-xs font-mono z-[10000] max-w-md shadow-2xl border border-white/10">
      <div className="font-bold mb-3 text-sm">🔍 Real-time Debug Panel</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span>Pusher:</span>
          <span
            className={
              status.pusherConnected ? "text-green-400" : "text-red-400"
            }
          >
            {status.pusherConnected ? "✅ Connected" : "❌ Disconnected"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Channel:</span>
          <span
            className={
              status.channelSubscribed ? "text-green-400" : "text-red-400"
            }
          >
            {status.channelSubscribed ? "✅ Subscribed" : "❌ Not subscribed"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Members:</span>
          <span className="text-blue-400">{status.memberCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Cursor Events Sent:</span>
          <span className="text-yellow-400">{status.cursorEventsSent}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Cursor Events Received:</span>
          <span className="text-green-400">{status.cursorEventsReceived}</span>
        </div>
        <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/10">
          Channel: {status.channelName || "N/A"}
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-yellow-400 mb-1">💡 Troubleshooting:</div>
          <div className="text-[10px] text-gray-300 space-y-0.5">
            <div>• Move mouse to trigger cursor events</div>
            <div>• Open in 2 windows (different users)</div>
            <div>• Check console for errors (F12)</div>
          </div>
        </div>
        <button
          onClick={() =>
            window.open(
              "https://dashboard.pusher.com/apps/2094474/debug_console",
              "_blank"
            )
          }
          className="w-full mt-2 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white text-[11px] transition-colors"
        >
          Open Pusher Debug Console →
        </button>
      </div>
    </div>
  );
}
