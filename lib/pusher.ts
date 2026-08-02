import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

const pusherAppId = process.env.PUSHER_APP_ID;
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
const pusherSecret = process.env.PUSHER_SECRET;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

const isPusherConfigured = Boolean(pusherAppId && pusherKey && pusherSecret && pusherCluster);

// Dùng cho Backend (API Routes) để "bắn" thông báo
export const pusherServer = isPusherConfigured
    ? new PusherServer({
        appId: pusherAppId!,
        key: pusherKey!,
        secret: pusherSecret!,
        cluster: pusherCluster!,
        useTLS: true,
    })
    : null;

PusherClient.logToConsole = true;

// Dùng cho Frontend (Components) để "nghe" thông báo
export const pusherClient = pusherKey && pusherCluster
    ? new PusherClient(pusherKey, {
        cluster: pusherCluster,
    })
    : null;