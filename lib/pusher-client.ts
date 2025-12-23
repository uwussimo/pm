import PusherClient from "pusher-js";

// Singleton instance
let pusherInstance: PusherClient | null = null;

export function getPusherClient() {
  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.error(
        "❌ Pusher not configured! Missing environment variables:",
        { key: key ? "✅" : "❌", cluster: cluster ? "✅" : "❌" }
      );
      return null;
    }

    pusherInstance = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {},
      },
    });
  }

  return pusherInstance;
}
