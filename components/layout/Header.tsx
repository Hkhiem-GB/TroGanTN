"use client";

import Link from 'next/link';
import Image from 'next/image';
import {Bell, Check, LogOut, HelpCircle, User, Crown} from 'lucide-react';
import {useEffect, useRef, useState} from "react";
import {signIn, signOut, useSession} from "next-auth/react";

export default function Header() {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const { data: session, status } = useSession();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // 2. Tạo một ref để tham chiếu đến div chứa dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 3. Viết hàm xử lý click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Nếu click chuột nằm NGOÀI khu vực của dropdownRef thì đóng menu lại
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        // Lắng nghe sự kiện mousedown trên toàn document
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Dọn dẹp sự kiện khi component unmount
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight">
                    <Image
                        src="/trogantn.png"
                        alt="TroGanTN Logo"
                        width={40}
                        height={40}
                        className="rounded-full object-cover border-0"
                    />
                    TroGanTN
                </Link>

                {/* Các nút hành động */}
                <div className="flex items-center gap-4">

                    {/* Nút Thông báo (Mới) */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors tooltip"
                            title="Thông báo"
                        >
                            <Bell className="w-6 h-6" />
                            {/* Chấm đỏ báo có thông báo mới */}
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
                        </button>

                        {/* Giao diện Modal Thông báo */}
                        {isNotifOpen && (
                            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">

                                {/* Header của Modal */}
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 text-base">Thông báo</h3>
                                    <button className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors">
                                        <Check className="w-3 h-3" />
                                        Đánh dấu đã đọc
                                    </button>
                                </div>

                                {/* Body: Khu vực hiển thị danh sách thông báo */}
                                <div className="max-h-[400px] overflow-y-auto p-2">

                                    {/* Khung UI mẫu của 1 item thông báo (Chưa đọc) */}
                                    <div className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer flex gap-3 items-start relative">
                                        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                                            <Bell className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 pr-4">
                                            <div className="text-sm text-gray-900 font-medium mb-1 line-clamp-1">
                                                Chào mừng bạn đến với TroGan!
                                            </div>
                                            <div className="text-xs text-gray-500 line-clamp-2">
                                                Khu vực hiển thị nội dung chi tiết. Nơi hệ thống gửi các ưu đãi và xác nhận phòng cho bạn.
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2 font-medium">Vừa xong</div>
                                        </div>
                                        {/* Dấu chấm xanh báo tin chưa đọc */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shrink-0"></div>
                                    </div>

                                    {/* Khung UI mẫu của 1 item thông báo (Đã đọc) */}
                                    <div className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer flex gap-3 items-start opacity-75">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <Bell className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-900 font-medium mb-1 line-clamp-1">
                                                Hệ thống bảo trì lúc 00:00
                                            </div>
                                            <div className="text-xs text-gray-500 line-clamp-2">
                                                Ứng dụng sẽ bảo trì trong 1 tiếng để nâng cấp tính năng radar tìm kiếm phòng trọ.
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2">2 ngày trước</div>
                                        </div>
                                    </div>

                                </div>

                                {/* Footer của Modal */}
                                <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                                    <button className="text-sm text-gray-600 hover:text-primary font-medium transition-colors">
                                        Xem tất cả thông báo
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>

                    <button className="hidden md:block px-4 py-2 text-primary text-sm font-medium border border-primary rounded-full hover:bg-primary-light transition-colors">
                        Tải App
                    </button>
                    {/* XỬ LÝ GIAO DIỆN ĐĂNG NHẬP */}
                    {status === "loading" ? (
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    ) : session ? (
                        // KHI ĐÃ ĐĂNG NHẬP
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-50 rounded-full transition-colors border border-transparent hover:border-gray-200"
                            >
                                {/* KIỂM TRA ROLE ĐỂ THÊM VIỀN VÀNG */}
                                <div className="relative">
                                    <img
                                        src={session.user?.image || ""}
                                        alt="Avatar"
                                        className={`w-10 h-10 rounded-full object-cover transition-all ${
                                            (session.user as any)?.role === 'LANDLORD'
                                                ? 'ring-2 ring-yellow-400 p-0.5 border-none'
                                                : 'border border-gray-200'
                                        }`}
                                    />
                                    {(session.user as any)?.role === 'LANDLORD' && (
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-0.5 rounded-full border border-white">
                                            <Crown className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-bold text-gray-900 line-clamp-1">
                                        {session.user?.name}
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">

                                    {/* NÚT QUẢN LÝ PHÒNG TRỌ (Chỉ hiện cho Chủ trọ) */}
                                    {(session.user as any)?.role === 'LANDLORD' && (
                                        <>
                                            <Link
                                                href="/landlord/rooms"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-yellow-700 bg-yellow-50/50 hover:bg-yellow-100 transition-colors"
                                            >
                                                <Crown className="w-4 h-4" /> Quản lý phòng trọ
                                            </Link>
                                            <div className="h-px bg-gray-100 my-1 mx-4"></div>
                                        </>
                                    )}

                                    <Link
                                        href="/profile"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                    >
                                        <User className="w-4 h-4" /> Trang cá nhân
                                    </Link>
                                    <Link
                                        href="/support"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                    >
                                        <HelpCircle className="w-4 h-4" /> Hỗ trợ
                                    </Link>
                                    <div className="h-px bg-gray-100 my-1 mx-4"></div>
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // KHI CHƯA ĐĂNG NHẬP
                        <button
                            onClick={() => signIn('google')}
                            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover transition-colors shadow-sm"
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}