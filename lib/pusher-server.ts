import Pusher from "pusher";

// Singleton instance
let pusherInstance: Pusher | null = null;

export function getPusherServer() {
  if (!pusherInstance) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!appId || !key || !secret || !cluster) {
      console.error("Pusher environment variables not configured");
      // Return a mock instance for development without Pusher
      return {
        trigger: async () => ({}),
        authorizeChannel: () => ({}),
      } as unknown as Pusher;
    }

    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return pusherInstance;
}
