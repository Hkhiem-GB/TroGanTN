// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import HeroBanner from '@/components/home/HeroBanner';
import RoomCard, { RoomProps } from '@/components/common/RoomCard';
import { Sparkles, Flame, ChevronDown } from 'lucide-react';

interface RawRoom {
    _id?: string;
    title?: string;
    themeImage?: string;
    pricePerMonth?: number;
    depositAmount?: number;
    capacity?: number;
    area?: number;
    address?: string;
    rating?: number;
    reviewCount?: number;
    status?: 'Trống' | 'Đã thuê' | 'Đặt cọc';
    [key: string]: unknown;
}

export default function Home() {
    const [rooms, setRooms] = useState<RoomProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);

    useEffect(() => {
        async function fetchRooms() {
            try {
                const res = await fetch('/api/rooms', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch data');
                const json = await res.json();

                const rawData: RawRoom[] = json.data || [];

                // Map dữ liệu thô sang RoomProps chuẩn xác, sạch bóng 'any'
                const formattedRooms: RoomProps[] = rawData.map((item) => ({
                    ...(item as RoomProps),
                    _id: item._id ? String(item._id) : '',
                    title: item.title || 'Phòng trọ chưa có tiêu đề',
                    themeImage: item.themeImage || '/placeholder.jpg',
                    pricePerMonth: item.pricePerMonth || 0,
                    depositAmount: item.depositAmount || 0,
                    capacity: item.capacity || 1,
                    area: item.area || 0,
                    address: item.address || 'Đang cập nhật',
                    rating: item.rating ?? 0,
                    reviewCount: item.reviewCount ?? 0,
                    status: item.status || 'Trống',
                }));

                setRooms(formattedRooms);
            } catch (error) {
                console.error(error);
                setRooms([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRooms();
    }, []);

    const featuredRooms = rooms.slice(0, 4);
    const newestRooms = rooms.slice(4);
    const displayedNewestRooms = newestRooms.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 20);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <HeroBanner />

            <div className="container mx-auto px-4 py-12 space-y-16">

                {/* 1. PHÒNG TRỌ NỔI BẬT */}
                {featuredRooms.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                                <h2 className="text-2xl font-bold text-gray-900">Phòng trọ nổi bật</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {featuredRooms.map((room) => (
                                <RoomCard key={room._id} room={room} />
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. PHÒNG TRỌ MỚI ĐĂNG & XEM THÊM */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary fill-primary/20" />
                            <h2 className="text-2xl font-bold text-gray-900">Phòng trọ mới đăng</h2>
                        </div>
                        <span className="text-sm font-medium text-gray-500">
                            Hiển thị {Math.min(visibleCount, newestRooms.length)} / {newestRooms.length} phòng
                        </span>
                    </div>

                    {rooms.length === 0 ? (
                        <div className="text-center text-gray-500 py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            Hiện tại chưa có phòng trọ nào trên hệ thống.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {displayedNewestRooms.map((room) => (
                                    <RoomCard key={room._id} room={room} />
                                ))}
                            </div>

                            {/* Nút Xem thêm 20 phòng */}
                            {visibleCount < newestRooms.length && (
                                <div className="mt-12 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm inline-flex items-center gap-2 group"
                                    >
                                        <span>Xem thêm 20 phòng khác</span>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

            </div>
        </div>
    );
}