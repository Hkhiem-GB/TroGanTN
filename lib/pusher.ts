import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Dùng cho Backend (API Routes) để "bắn" thông báo
export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true
});

PusherClient.logToConsole = true;

// Dùng cho Frontend (Components) để "nghe" thông báo
export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    }
);