/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from 'react';
import ChatWidget from './ChatWidget';
import { X, MessageCircle } from 'lucide-react';

interface ActiveChat {
    receiverId: string;
    isMinimized: boolean;
    chatName?: string;
    avatar?: string;
}

export default function GlobalChat() {
    const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    // KHÔI PHỤC CHAT TỪ LOCALSTORAGE
    useEffect(() => {
        const storedChats = localStorage.getItem('active_chats');
        if (storedChats) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setActiveChats(JSON.parse(storedChats));
            } catch (e) {
                console.error("Lỗi đọc localstorage:", e);
            }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    // LƯU LẠI VÀO LOCALSTORAGE
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('active_chats', JSON.stringify(activeChats));
        }
    }, [activeChats, isMounted]);

    // LẮNG NGHE SỰ KIỆN TỪ QUẢ CHUÔNG THÔNG BÁO
    useEffect(() => {
        const handleOpenChat = (event: Event) => {
            const customEvent = event as CustomEvent<{ receiverId: string, chatName?: string, avatar?: string }>;
            const { receiverId, chatName, avatar } = customEvent.detail;

            if (receiverId) {
                setActiveChats(prev => {
                    const existingChat = prev.find(chat => chat.receiverId === receiverId);
                    if (existingChat) {
                        return prev.map(chat =>
                            chat.receiverId === receiverId
                                ? { ...chat, isMinimized: false, chatName, avatar }
                                : chat
                        );
                    }
                    const updated = [...prev, { receiverId, isMinimized: false, chatName, avatar }];
                    return updated.slice(-3); // Tối đa 3 khung chat
                });
            }
        };

        window.addEventListener('OPEN_GLOBAL_CHAT', handleOpenChat);
        return () => window.removeEventListener('OPEN_GLOBAL_CHAT', handleOpenChat);
    }, []);

    const handleMinimize = (receiverId: string) => {
        setActiveChats(prev => prev.map(c => c.receiverId === receiverId ? { ...c, isMinimized: true } : c));
    };

    const handleClose = (receiverId: string) => {
        setActiveChats(prev => prev.filter(c => c.receiverId !== receiverId));
    };

    const handleMaximize = (receiverId: string) => {
        setActiveChats(prev => prev.map(c => c.receiverId === receiverId ? { ...c, isMinimized: false } : c));
    };

    if (!isMounted) return null;

    const minimizedChats = activeChats.filter(chat => chat.isMinimized);
    const openChats = activeChats.filter(chat => !chat.isMinimized);

    return (
        <>
            {/* VÙNG 1: BONG BÓNG CHAT - Xếp DỌC (flex-col) bên góc phải */}
            <div
                className="fixed bottom-24 right-6 flex flex-col items-end gap-3 pointer-events-none"
                style={{ zIndex: 9999 }}
            >
                {minimizedChats.map(chat => (
                    <div key={chat.receiverId} className="pointer-events-auto relative group animate-in slide-in-from-right-2">
                        <button
                            onClick={() => handleMaximize(chat.receiverId)}
                            className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform border-2 border-white overflow-hidden p-0"
                            title={`Mở tin nhắn ${chat.chatName ? 'với ' + chat.chatName : ''}`}
                        >
                            {chat.avatar ? (
                                <img src={chat.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <MessageCircle className="w-6 h-6" />
                            )}
                        </button>
                        <button
                            onClick={() => handleClose(chat.receiverId)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* VÙNG 2: KHUNG CHAT MỞ RỘNG - Xếp NGANG (flex-row) bám đáy */}
            {/* right-24 để né khoảng không gian của các bong bóng chat */}
            <div
                className="fixed bottom-0 right-24 flex items-end gap-4 pointer-events-none"
                style={{ zIndex: 9999 }}
            >
                {openChats.map(chat => (
                    <div key={chat.receiverId} className="pointer-events-auto">
                        <ChatWidget
                            receiverId={chat.receiverId}
                            chatName={chat.chatName}
                            avatar={chat.avatar}
                            onClose={() => handleClose(chat.receiverId)}
                            onMinimize={() => handleMinimize(chat.receiverId)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}