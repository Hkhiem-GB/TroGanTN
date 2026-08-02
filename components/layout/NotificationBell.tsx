/* eslint-disable @next/next/no-img-element */
"use client";

import { Bell, Check, Trash2, X, AlertTriangle, Square, CheckSquare } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { notify } from '@/utils/toast';
import { pusherClient } from "@/lib/pusher";

// 1. CẬP NHẬT INTERFACE: Thêm loại thông báo và thông tin người gửi
interface NotificationItem {
    _id: string;
    title: string;
    content: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    type?: 'MESSAGE' | 'SYSTEM' | string; // Phân biệt loại thông báo
    sender?: {                          // Thông tin người gửi (Lấy từ Database)
        _id: string;
        name: string;
        avatar: string;
    };
}

export default function NotificationBell() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (!showDeleteConfirm) setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDeleteConfirm]);

    const fetchNotifications = async () => {
        if (!session?.user) return;
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Lỗi lấy thông báo:", error);
        }
    };

    useEffect(() => {
        const currentUserId = session?.user?.id;
        if (!currentUserId) return;

        // Bỏ qua cảnh báo set state trong effect của ESLint
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();

        if (!pusherClient) return;

        const channel = pusherClient.subscribe(currentUserId);

        channel.bind('new-notification', (newNotif: NotificationItem) => {
            // KIỂM TRA: Nếu là tin nhắn, check xem khung chat có đang được mở không?
            if (newNotif.type === 'MESSAGE' && newNotif.sender) {
                try {
                    const storedChats = localStorage.getItem('active_chats');
                    if (storedChats) {
                        const activeChats = JSON.parse(storedChats);
                        // FIX LỖI "any": Định nghĩa rõ ràng kiểu dữ liệu cho biến chat thay vì dùng any
                        const isChatOpenAndActive = activeChats.some(
                            (chat: { receiverId: string; isMinimized: boolean }) => chat.receiverId === newNotif.sender?._id && !chat.isMinimized
                        );
                        if (isChatOpenAndActive) return;
                    }
                } catch (e) {
                    console.error("Lỗi đọc trạng thái chat", e);
                }
            }

            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Hiện toast xịn hơn nếu là tin nhắn
            if (newNotif.type === 'MESSAGE') {
                notify.success(`💬 ${newNotif.sender?.name || 'Ai đó'} vừa nhắn tin cho bạn!`);
            } else {
                notify.success(`🔔 ${newNotif.title}`);
            }
        });

        return () => {
            channel.unbind('new-notification');
        };
    }, [session]);

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            const res = await fetch('/api/notifications', { method: 'PATCH' });
            if ((await res.json()).success) {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error("Lỗi cập nhật thông báo:", error);
        }
    };

    const handleNotificationClick = (notif: NotificationItem) => {
        if (isSelectionMode) {
            setSelectedIds(prev =>
                prev.includes(notif._id) ? prev.filter(id => id !== notif._id) : [...prev, notif._id]
            );
            return;
        }

        if (!notif.isRead) {
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // 2. MỞ KHUNG CHAT NẾU LÀ TIN NHẮN
        if (notif.type === 'MESSAGE' && notif.sender) {
            window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_CHAT', {
                detail: {
                    receiverId: notif.sender._id,
                    chatName: notif.sender.name,
                    avatar: notif.sender.avatar
                }
            }));
            setIsNotifOpen(false);
            return;
        }

        // Nếu là thông báo hệ thống thì mở Modal bình thường
        setSelectedNotif(notif);
    };

    const confirmDeleteNotifications = async () => {
        if (selectedIds.length === 0) return;
        const toastId = notify.loading("Đang xóa...");
        try {
            const res = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            if ((await res.json()).success) {
                notify.success(`Đã xóa ${selectedIds.length} thông báo`, toastId);
                setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
                setSelectedIds([]);
                setIsSelectionMode(false);
                setShowDeleteConfirm(false);
                fetchNotifications();
            } else {
                notify.error("Lỗi xóa thông báo", toastId);
            }
        } catch (error) {
            notify.error("Lỗi kết nối", toastId);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
        if (seconds < 60) return "Vừa xong";
        if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
        return `${Math.floor(seconds / 86400)} ngày trước`;
    };

    if (!session) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors tooltip"
                title="Thông báo"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>

            {isNotifOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-40 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-base">Thông báo</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
                                className={`p-1.5 rounded-lg transition-colors ${isSelectionMode ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {!isSelectionMode && unreadCount > 0 && (
                                <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors">
                                    <Check className="w-3 h-3" /> Đã đọc
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Bạn chưa có thông báo nào.</div>
                        ) : (
                            notifications.map((notif) => {
                                const isSelected = selectedIds.includes(notif._id);
                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-3 rounded-xl transition-all cursor-pointer flex gap-3 items-start relative mb-1 
                                            ${isSelectionMode ? 'hover:bg-gray-100' : 'hover:bg-gray-50'} 
                                            ${notif.isRead && !isSelectionMode ? 'opacity-75' : ''}
                                            ${isSelected ? 'bg-red-50/50 border border-red-100' : 'border border-transparent'}
                                        `}
                                    >
                                        {/* 3. ĐỔI GIAO DIỆN HIỂN THỊ AVATAR NẾU LÀ TIN NHẮN */}
                                        {isSelectionMode ? (
                                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                                {isSelected ? <CheckSquare className="w-6 h-6 text-red-500" /> : <Square className="w-6 h-6 text-gray-300" />}
                                            </div>
                                        ) : notif.type === 'MESSAGE' && notif.sender ? (
                                            <div className="relative w-10 h-10 shrink-0">
                                                <img src={notif.sender.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                {!notif.isRead && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                            </div>
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-gray-100' : 'bg-primary/10'}`}>
                                                <Bell className={`w-5 h-5 ${notif.isRead ? 'text-gray-500' : 'text-primary'}`} />
                                            </div>
                                        )}

                                        <div className="flex-1 pr-4">
                                            <div className={`text-sm mb-1 line-clamp-1 ${notif.isRead ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                                                {notif.type === 'MESSAGE' ? notif.sender?.name : notif.title}
                                            </div>
                                            <div className={`text-xs line-clamp-2 leading-relaxed ${notif.type === 'MESSAGE' ? (notif.isRead ? 'text-gray-500' : 'text-gray-800 font-medium') : 'text-gray-500'}`}>
                                                {notif.content}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2 font-medium">{formatTimeAgo(notif.createdAt)}</div>
                                        </div>

                                        {!notif.isRead && !isSelectionMode && notif.type !== 'MESSAGE' && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shrink-0"></div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                        {isSelectionMode ? (
                            <div className="flex items-center justify-between gap-2 px-2">
                                <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                    Hủy
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={selectedIds.length === 0}
                                    className="text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.length})
                                </button>
                            </div>
                        ) : (
                            <button className="text-sm text-gray-600 hover:text-primary font-medium transition-colors">
                                Xem tất cả thông báo
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN XÓA THÔNG BÁO */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 text-center" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                        <p className="text-gray-500 text-sm mb-6">Bạn có chắc chắn muốn xóa vĩnh viễn <b>{selectedIds.length}</b> thông báo này không? Hành động này không thể hoàn tác.</p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                Hủy bỏ
                            </button>
                            <button onClick={confirmDeleteNotifications} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-sm transition-colors">
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT ĐỌC TIN */}
            {selectedNotif && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-default" onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setSelectedNotif(null); }}>
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bell className="w-6 h-6 text-primary" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedNotif.title}</h3>
                                <div className="text-xs text-gray-500 mt-1 font-medium">{formatTimeAgo(selectedNotif.createdAt)}</div>
                            </div>
                        </div>
                        <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[40vh] overflow-y-auto">{selectedNotif.content}</div>
                        <button onClick={() => setSelectedNotif(null)} className={`w-full ${selectedNotif.link ? 'mt-3' : 'mt-6'} py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors`}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}