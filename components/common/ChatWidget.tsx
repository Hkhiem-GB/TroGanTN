"use client";

import { X, Minus, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { useState } from 'react';

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    landlordName: string;
    avatar: string;
}

export default function ChatWidget({ isOpen, onClose, landlordName, avatar }: ChatWidgetProps) {
    const [message, setMessage] = useState('');

    // Trạng thái quản lý việc thu nhỏ thành bong bóng chat
    const [isMinimized, setIsMinimized] = useState(true);

    // Giả lập có 1 tin nhắn chưa đọc khi thu nhỏ
    const unreadCount = 1;

    // Nếu widget không được mở, không render gì cả
    if (!isOpen) return null;

    // Giao diện khi bị THU NHỎ (Bong bóng chat)
    if (isMinimized) {
        return (
            <div className="fixed bottom-40 right-6 z-50 flex flex-col gap-4 animate-in zoom-in duration-200">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="relative w-14 h-14 rounded-full shadow-xl hover:scale-105 transition-transform p-0 overflow-hidden border-2 border-white cursor-pointer"
                    title={`Mở chat với ${landlordName}`}
                >
                    {/* Avatar chủ trọ */}
                    <img src={avatar} alt={landlordName} className="w-full h-full object-cover" />

                    {/* Badge thông báo số lượng tin nhắn chưa đọc (Màu đỏ) */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount}
            </span>
                    )}
                </button>
            </div>
        );
    }

    // Giao diện khi MỞ RỘNG (Khung chat bình thường)
    return (
        <div className="fixed bottom-0 right-6 md:bottom-24 w-80 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">

            {/* Chat Header */}
            <div className="bg-primary p-3 flex items-center justify-between text-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={avatar} alt={landlordName} className="w-10 h-10 rounded-full bg-white border border-primary-light object-cover" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <div className="font-bold text-sm leading-tight">{landlordName}</div>
                        <div className="text-xs text-primary-light">Đang hoạt động</div>
                    </div>
                </div>

                {/* Nhóm nút hành động: Thu nhỏ & Đóng */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 hover:bg-primary-hover rounded-full transition-colors tooltip"
                        title="Thu nhỏ"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-primary-hover rounded-full transition-colors tooltip"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className="h-72 p-4 bg-gray-50 overflow-y-auto flex flex-col gap-3">
                <div className="text-center text-[11px] text-gray-400 mb-2">Hôm nay 10:24 AM</div>

                {/* Tin nhắn từ chủ trọ */}
                <div className="flex items-end gap-2">
                    <img src={avatar} className="w-7 h-7 rounded-full object-cover shadow-sm" alt="avatar" />
                    <div className="bg-white border border-gray-100 p-2.5 rounded-2xl rounded-bl-none text-sm text-gray-700 max-w-[75%] shadow-sm">
                        Chào bạn, bạn đang tìm trọ ở khu vực Gia Sàng à? Mình có thể giúp gì cho bạn không?
                    </div>
                </div>

                {/* Khoảng trống để tin nhắn của User hiển thị sau này */}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
                    <button className="text-gray-400 hover:text-primary transition-colors">
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && message.trim() !== '') {
                                // Xử lý gửi tin nhắn ở đây
                                setMessage('');
                            }
                        }}
                    />
                    <button className="text-gray-400 hover:text-primary transition-colors">
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        className={`${message.trim() ? 'text-primary' : 'text-gray-400'} hover:text-primary-hover p-1 transition-colors`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </div>
    );
}