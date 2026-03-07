import PusherServer from "pusher";
import PusherClient from "pusher-js";

export function getPusherServer(): PusherServer | null {
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.NEXT_PUBLIC_PUSHER_KEY ||
    !process.env.PUSHER_SECRET
  ) {
    return null;
  }

  return new PusherServer({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
    useTLS: true,
  });
}

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) return null;

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
    });
  }

  return pusherClientInstance;
}
