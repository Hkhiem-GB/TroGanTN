"use client";

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, HelpCircle, User, Crown, ShieldAlert, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import NotificationBell from './NotificationBell'; // <-- Component chuông chúng ta vừa tạo

export default function Header() {
    const { data: session, status } = useSession();

    // Header giờ chỉ còn quản lý mỗi User Menu
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userRole = (session?.user as { role?: string })?.role;
    const isAdmin = userRole === 'ADMIN';
    const isLandlord = userRole === 'LANDLORD';
    const hasPrivilege = isAdmin || isLandlord;

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight">
                    <Image src="/trogantn.png" alt="TroGanTN Logo" width={40} height={40} className="rounded-full object-cover border-0" />
                    TroGanTN
                </Link>

                <div className="flex items-center gap-4">

                    {/* Component Chuông thông báo siêu gọn gàng */}
                    <NotificationBell />

                    <button className="hidden md:block px-4 py-2 text-primary text-sm font-medium border border-primary rounded-full hover:bg-primary-light transition-colors">
                        Tải App
                    </button>

                    {status === "loading" ? (
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    ) : session ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-50 rounded-full transition-colors border border-transparent hover:border-gray-200"
                            >
                                <div className="relative">
                                    <img
                                        src={session.user?.image || ""}
                                        alt="Avatar"
                                        className={`w-10 h-10 rounded-full object-cover transition-all ${
                                            isAdmin ? 'ring-2 ring-red-500 p-0.5 border-none' : isLandlord ? 'ring-2 ring-yellow-400 p-0.5 border-none' : 'border border-gray-200'
                                        }`}
                                    />
                                    {isAdmin ? (
                                        <div className="absolute -bottom-1 -right-1 bg-red-500 p-0.5 rounded-full border border-white"><ShieldAlert className="w-2.5 h-2.5 text-white" /></div>
                                    ) : isLandlord && (
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-0.5 rounded-full border border-white"><Crown className="w-2.5 h-2.5 text-white" /></div>
                                    )}
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-bold text-gray-900 line-clamp-1">{session.user?.name}</div>
                                </div>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {isAdmin && (
                                        <>
                                            <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-700 bg-red-50/50 hover:bg-red-100 transition-colors">
                                                <ShieldAlert className="w-4 h-4" /> Bảng điều khiển Admin
                                            </Link>
                                            <div className="h-px bg-gray-100 my-1 mx-4"></div>
                                        </>
                                    )}
                                    {hasPrivilege && (
                                        <>
                                            <Link href="/landlord/rooms" onClick={() => setIsUserMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isAdmin ? 'text-red-700 bg-red-50/50 hover:bg-red-100' : 'text-yellow-700 bg-yellow-50/50 hover:bg-yellow-100'}`}>
                                                {isAdmin ? <ShieldAlert className="w-4 h-4" /> : <Crown className="w-4 h-4" />} Quản lý phòng trọ
                                            </Link>
                                            <div className="h-px bg-gray-100 my-1 mx-4"></div>
                                        </>
                                    )}
                                    <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                        <User className="w-4 h-4" /> Trang cá nhân
                                    </Link>
                                    <Link href="/support" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                        <HelpCircle className="w-4 h-4" /> Hỗ trợ
                                    </Link>
                                    <Link href="/report" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors">
                                        <Flag className="w-4 h-4" /> Báo cáo
                                    </Link>
                                    <div className="h-px bg-gray-100 my-1 mx-4"></div>
                                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                        <LogOut className="w-4 h-4" /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => signIn('google')} className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover transition-colors shadow-sm">
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}