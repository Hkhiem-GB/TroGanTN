/* eslint-disable @next/next/no-img-element */
"use client";

import { X, Minus, Send, Image as ImageIcon, Smile, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { notify } from "@/utils/toast";
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';

// Định nghĩa kiểu dữ liệu cho 1 tin nhắn hiển thị UI
interface Message {
    id: string | number;
    text: string;
    sender: 'user' | 'landlord';
    time: string;
    imageUrl?: string;
}

// Định nghĩa kiểu dữ liệu thô từ Database
interface DBRawMessage {
    _id: string;
    text?: string;
    imageUrl?: string;
    senderId: string;
    createdAt: string | Date;
}

interface ChatWidgetProps {
    receiverId: string;
    onClose: () => void;
    onMinimize: () => void;
    chatName?: string;
    avatar?: string;
}

export default function ChatWidget({
                                       receiverId,
                                       onClose,
                                       onMinimize,
                                       chatName = "Tin nhắn",
                                       avatar = "https://api.dicebear.com/7.x/notionists/svg?seed=Support"
                                   }: ChatWidgetProps) {

    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadChatHistory = async () => {
            if (currentUserId && receiverId) {
                try {
                    const res = await fetch(`/api/messages?receiverId=${receiverId}`);
                    const json = await res.json();

                    if (json.success) {
                        const formattedMessages = json.data.map((msg: DBRawMessage) => ({
                            id: msg._id,
                            text: msg.text || '',
                            imageUrl: msg.imageUrl || '',
                            sender: msg.senderId === currentUserId ? 'user' : 'landlord',
                            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }));
                        setMessages(formattedMessages);
                    }
                } catch (error) {
                    console.error("Lỗi tải lịch sử chat:", error);
                }
            }
        };

        loadChatHistory();
    }, [currentUserId, receiverId]);

    useEffect(() => {
        if (!currentUserId || !receiverId) return;

        if (!pusherClient) return;

        const channel = pusherClient.subscribe(currentUserId);

        const handleNewMessage = (incomingMsg: DBRawMessage) => {
            if (incomingMsg.senderId === receiverId) {
                const formattedMsg: Message = {
                    id: incomingMsg._id,
                    text: incomingMsg.text || '',
                    imageUrl: incomingMsg.imageUrl || '',
                    sender: 'landlord',
                    time: new Date(incomingMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages((prev) => [...prev, formattedMsg]);
            }
        };

        channel.bind('new-message', handleNewMessage);

        return () => {
            channel.unbind('new-message', handleNewMessage);
        };
    }, [currentUserId, receiverId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;
        if (!currentUserId) {
            notify.error('Vui lòng đăng nhập để gửi tin nhắn!');
            return;
        }
        if (!receiverId) {
            notify.error('Không tìm thấy thông tin người nhận!');
            return;
        }

        const textToSend = messageInput.trim();
        setMessageInput('');

        const tempMsg: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: receiverId,
                    text: textToSend
                })
            });

            const data = await res.json();
            if (!data.success) {
                notify.error("Lỗi từ Server: " + data.error);
                setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id));
            }
        } catch (error) {
            notify.error("Lỗi kết nối tới máy chủ");
            setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                const newImgMsg: Message = {
                    id: Date.now().toString(),
                    text: '',
                    sender: 'user',
                    imageUrl: data.imageUrl,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, newImgMsg]);

                try {
                    const msgRes = await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            receiverId: receiverId,
                            text: '',
                            imageUrl: data.imageUrl
                        })
                    });

                    const msgData = await msgRes.json();
                    if (!msgData.success) {
                        notify.error("Lỗi lưu ảnh vào tin nhắn!");
                        setMessages(prev => prev.filter(msg => msg.id !== newImgMsg.id));
                    }
                } catch (err) {
                    notify.error("Lỗi mạng khi gửi ảnh!");
                    setMessages(prev => prev.filter(msg => msg.id !== newImgMsg.id));
                }

            } else {
                notify.error("Lỗi tải ảnh lên server!");
            }
        } catch (error) {
            notify.error("Lỗi mạng khi tải ảnh!");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className=" pointer-events-auto w-80 bg-white shadow-2xl border border-gray-200 rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
             style={{ zIndex: 9999 }}
        >
            <div className="bg-primary p-3 flex items-center justify-between text-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={avatar} alt={chatName} className="w-10 h-10 rounded-full bg-white border border-primary-light object-cover" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <div className="font-bold text-sm leading-tight line-clamp-1">{chatName}</div>
                        <div className="text-xs text-primary-light">Đang hoạt động</div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onMinimize();
                        }}
                        className="relative z-50 p-1.5 hover:bg-primary-hover rounded-full transition-colors tooltip cursor-pointer"
                        title="Thu nhỏ thành bong bóng"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="relative z-50 p-1.5 hover:bg-red-500 rounded-full transition-colors tooltip cursor-pointer"
                        title="Đóng chat"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="h-80 p-4 bg-gray-50 overflow-y-auto flex flex-col gap-4">
                <div className="text-center text-[11px] text-gray-400 mb-2">Hôm nay</div>

                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                        <Smile className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Hãy gửi lời chào đầu tiên!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.sender === 'landlord' && (
                                <img src={avatar} className="w-7 h-7 rounded-full object-cover shadow-sm shrink-0" alt="avatar" />
                            )}
                            <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-2.5 text-sm max-w-[220px] shadow-sm ${
                                    msg.sender === 'user'
                                        ? 'bg-primary text-white rounded-2xl rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-bl-none'
                                }`}>
                                    {msg.imageUrl ? (
                                        <img src={msg.imageUrl} alt="Ảnh chat" className="w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 relative z-50">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-gray-400 hover:text-primary transition-colors flex items-center justify-center relative cursor-pointer"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ImageIcon className="w-5 h-5" />}
                    </button>
                    <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className={`${messageInput.trim() ? 'text-primary cursor-pointer' : 'text-gray-400 cursor-not-allowed'} hover:text-primary-hover p-1 transition-colors`}
                    >
                        <Send className="w-5 h-5 transform translate-y-[1px] -translate-x-[5px] -rotate-12" />
                    </button>
                </div>
            </div>
        </div>
    );
}