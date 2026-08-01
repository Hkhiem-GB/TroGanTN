/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MapPin, Star, Maximize, Users,
    CheckCircle2, ShieldAlert, Phone, MessageCircle, ChevronLeft, Loader2, AlertCircle
} from 'lucide-react';
import toast from "react-hot-toast";

export default function RoomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.id;

    // Giữ nguyên dùng any, đã có eslint-disable bên trên chặn lỗi vàng
    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>('');

    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await fetch(`/api/rooms/${roomId}`);
                if (!res.ok) throw new Error('Không thể lấy dữ liệu phòng');

                const json = await res.json();
                if (json.success) {
                    setRoom(json.data);
                    setActiveImage(json.data.themeImage);
                }
            } catch (error) {
                console.error("Lỗi khi tải thông tin phòng:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (roomId) {
            fetchRoomData();
        }
    }, [roomId]);

    const handleBooking = () => {
        if (!session) {
            toast.error('Vui lòng đăng nhập để đặt phòng!', { duration: 3000 });
            return;
        }
        router.push(`/booking/${room._id || roomId}`);
    };

    // HÀM MỞ CHAT THEO KIẾN TRÚC MỚI (Không dùng ChatWidget trực tiếp nữa)
    const handleOpenChat = () => {
        if (!session) {
            toast.error('Vui lòng đăng nhập để nhắn tin trao đổi!', { duration: 3000 });
            return;
        }

        if (room?.landlordId?._id) {
            window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_CHAT', {
                detail: {
                    receiverId: room.landlordId._id,
                    chatName: room.landlordId.name || 'Chủ trọ',
                    avatar: room.landlordId.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${room.landlordId.name || 'Chủ trọ'}`
                }
            }));
        } else {
            toast.error('Không tìm thấy thông tin chủ trọ!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải thông tin phòng...</p>
            </div>
        );
    }

    if (!room && !isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-20">
                <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Phòng không tồn tại</h2>
                    <p className="text-gray-500 mb-6">Có thể phòng trọ này đã bị xóa hoặc không còn tồn tại.</p>
                    <Link href="/" className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors inline-block w-full">
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    const amenities = room.amenities || ['Wifi miễn phí', 'Chỗ để xe'];
    const rules = room.rules || ['Không làm ồn sau 22h', 'Giữ gìn vệ sinh chung'];
    const landlordName = room.landlordId?.name || 'Chủ trọ';
    const landlordAvatar = room.landlordId?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${landlordName}`;
    const pricePerMonth = room.pricePerMonth || 0;
    const depositAmount = room.depositAmount || 500000;
    const allImages = [room.themeImage, ...(room.images || [])].filter(Boolean);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="container mx-auto px-4 py-6 max-w-7xl">

                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Quay lại trang chủ
                </Link>

                <div className="mb-8 space-y-4">
                    <div className="w-full bg-gray-900 rounded-3xl relative overflow-hidden shadow-sm flex items-center justify-center group">
                        <img
                            src={activeImage || room.themeImage || '/placeholder.jpg'}
                            alt={room.title}
                            className="w-full h-auto max-h-[70vh] object-contain mx-auto transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>

                        <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 rounded-full font-bold shadow-md z-10 text-sm">
                            {room.status === 'Trống' ? 'Còn trống' : room.status}
                        </div>

                        {allImages.length > 1 && (
                            <>
                                <button
                                    onClick={() => {
                                        const currentIndex = allImages.indexOf(activeImage);
                                        const prevIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
                                        setActiveImage(allImages[prevIndex]);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                                    title="Ảnh trước"
                                >
                                    ❮
                                </button>
                                <button
                                    onClick={() => {
                                        const currentIndex = allImages.indexOf(activeImage);
                                        const nextIndex = currentIndex === allImages.length - 1 ? 0 : currentIndex + 1;
                                        setActiveImage(allImages[nextIndex]);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                                    title="Ảnh tiếp theo"
                                >
                                    ❯
                                </button>
                            </>
                        )}
                    </div>

                    {allImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {allImages.map((img: string, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveImage(img)}
                                    className={`relative w-24 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                        activeImage === img ? 'border-primary scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{room.title}</h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                            <div className="flex items-center text-yellow-500 font-medium">
                                <Star className="w-5 h-5 fill-current mr-1" />
                                <span className="text-gray-900 text-base mr-1">{room.rating || '4.5'}</span>
                                ({room.reviewCount || 0} đánh giá)
                            </div>
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1 shrink-0 text-gray-400" />
                                <span className="line-clamp-1">{room.address}</span>
                            </div>
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-primary/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-primary/10">
                                <Maximize className="w-6 h-6 text-primary mb-2" />
                                <span className="text-sm text-gray-500">Diện tích</span>
                                <span className="font-bold text-gray-900">{room.area} m²</span>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-primary/10">
                                <Users className="w-6 h-6 text-primary mb-2" />
                                <span className="text-sm text-gray-500">Sức chứa</span>
                                <span className="font-bold text-gray-900">{room.capacity || 2} người</span>
                            </div>
                        </div>

                        {room.description && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">Mô tả chi tiết</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{room.description}</p>
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Tiện ích & Tiện nghi</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {amenities.map((item: string, index: number) => (
                                <div key={index} className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 shrink-0" />
                                    <span className="font-medium text-sm">{item}</span>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Nội quy trọ</h2>
                        <div className="bg-red-50/60 border border-red-100 p-5 rounded-2xl mb-8">
                            {rules.map((rule: string, index: number) => (
                                <div key={index} className="flex items-center text-gray-700 mb-2 last:mb-0">
                                    <ShieldAlert className="w-5 h-5 text-red-500 mr-2 shrink-0" />
                                    <span className="text-sm">{rule}</span>
                                </div>
                            ))}
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin Chủ trọ</h2>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 gap-4">
                            <div className="flex items-center gap-4">
                                <img src={landlordAvatar} alt="Avatar" className="w-14 h-14 rounded-full bg-white border object-cover shadow-sm" />
                                <div>
                                    <div className="font-bold text-gray-900 text-lg">{landlordName}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                                        Đối tác Chủ trọ uy tín
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none flex justify-center items-center p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-gray-700 transition-colors shadow-sm" title="Gọi điện">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleOpenChat}
                                    className="flex-1 sm:flex-none flex justify-center items-center p-3 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors shadow-sm"
                                    title="Nhắn tin trao đổi"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[350px] shrink-0">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-primary/20 sticky top-24">
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-primary">{pricePerMonth.toLocaleString('vi-VN')}đ</span>
                                <span className="text-gray-500 text-sm"> /tháng</span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600 mb-6 pb-4 border-b border-gray-100">
                                <span>Tiền cọc giữ phòng:</span>
                                <span className="font-semibold text-gray-900">{depositAmount.toLocaleString('vi-VN')}đ</span>
                            </div>

                            <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-xl mb-6 leading-relaxed border border-blue-100">
                                💡 Cọc ngay để giữ phòng. Tiền cọc sẽ được hoàn trả nếu bạn hủy trước 24h.
                            </div>

                            <button
                                onClick={handleBooking}
                                disabled={room.status !== 'Trống'}
                                className={`w-full flex items-center justify-center font-bold py-4 rounded-2xl shadow-md transition-all ${
                                    room.status === 'Trống'
                                        ? 'bg-primary text-white hover:bg-primary-hover hover:shadow-lg transform hover:-translate-y-0.5'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {room.status === 'Trống' ? 'ĐẶT PHÒNG NGAY' : 'PHÒNG ĐÃ ĐƯỢC THUÊ'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}