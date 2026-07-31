"use client";

import {
    MapPin, Star, Maximize, Users,
    CheckCircle2, ShieldAlert, Phone, MessageCircle, ChevronLeft, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ChatWidget from "@/components/common/ChatWidget";
import { useState, useEffect } from "react";

export default function RoomDetailsPage({ params }: { params: { id: string } }) {
    const [isChatOpen, setIsChatOpen] = useState(false);

    // States quản lý dữ liệu thật
    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { data: session } = useSession();
    const router = useRouter();

    // Fetch dữ liệu phòng từ Database
    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await fetch(`/api/rooms/${params.id}`);
                if (!res.ok) throw new Error('Không thể lấy dữ liệu phòng');

                const json = await res.json();
                if (json.success) {
                    setRoom(json.data);
                }
            } catch (error) {
                console.error("Lỗi khi tải thông tin phòng:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchRoomData();
        }
    }, [params.id]);

    // Xử lý nút Đặt phòng (Kiểm tra đăng nhập)
    const handleBooking = () => {
        if (!session) {
            toast.error('Vui lòng đăng nhập để đặt phòng!', { duration: 3000 });
            // Nếu muốn tự động gọi popup đăng nhập Google, bạn có thể import signIn từ next-auth/react và gọi signIn('google') ở đây
            return;
        }
        // Đã đăng nhập -> Chuyển sang trang đặt phòng
        router.push(`/booking/${room._id || params.id}`);
    };

    // 1. Màn hình Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải thông tin phòng...</p>
            </div>
        );
    }

    // 2. Màn hình lỗi (Không tìm thấy phòng)
    if (!room && !isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-20">
                <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Phòng không tồn tại</h2>
                    <p className="text-gray-500 mb-6">Có thể phòng trọ này đã bị xóa hoặc không còn trống.</p>
                    <Link href="/" className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors inline-block w-full">
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    // Gán dữ liệu mặc định an toàn để tránh lỗi render nếu dữ liệu DB bị khuyết
    const amenities = room.amenities || ['Wifi miễn phí', 'Chỗ để xe'];
    const rules = room.rules || ['Không làm ồn sau 22h', 'Giữ gìn vệ sinh chung'];
    const landlordName = room.landlordId?.name || 'Chủ trọ';
    const landlordAvatar = room.landlordId?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${landlordName}`;
    const depositAmount = room.deposit || 500000;

    // 3. Giao diện chính thức
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="container mx-auto px-4 py-6">

                {/* Nút quay lại */}
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Quay lại trang chủ
                </Link>

                {/* Khung ảnh Gallery (Thay màu nền bằng ảnh đại diện của phòng nếu có) */}
                <div
                    className="w-full h-[40vh] md:h-[60vh] bg-gray-300 rounded-3xl mb-8 relative overflow-hidden flex items-center justify-center"
                    style={{
                        backgroundImage: `url(${room.themeImage || '/placeholder.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Lớp phủ tối nhẹ để làm nổi bật badge */}
                    <div className="absolute inset-0 bg-black/10"></div>

                    <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 rounded-full font-medium shadow-sm z-10">
                        {room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã thuê'}
                    </div>
                </div>

                {/* Layout 2 cột */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* CỘT TRÁI: THÔNG TIN CHI TIẾT (70%) */}
                    <div className="flex-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                        {/* Tiêu đề & Đánh giá */}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{room.title}</h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                            <div className="flex items-center text-warning font-medium">
                                <Star className="w-5 h-5 fill-current mr-1" />
                                <span className="text-gray-900 text-base mr-1">{room.rating || '4.5'}</span>
                                ({room.reviewCount || 0} đánh giá)
                            </div>
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1 shrink-0" />
                                <span className="line-clamp-1">{room.address}</span>
                            </div>
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Thông số cơ bản */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-primary-light/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                <Maximize className="w-6 h-6 text-primary mb-2" />
                                <span className="text-sm text-gray-500">Diện tích</span>
                                <span className="font-semibold text-gray-900">{room.area} m²</span>
                            </div>
                            <div className="bg-primary-light/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                <Users className="w-6 h-6 text-primary mb-2" />
                                <span className="text-sm text-gray-500">Sức chứa</span>
                                <span className="font-semibold text-gray-900">{room.capacity || 2} người</span>
                            </div>
                        </div>

                        {/* Tiện ích */}
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Tiện ích & Tiện nghi</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {amenities.map((item: string, index: number) => (
                                <div key={index} className="flex items-center text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-success mr-2 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>

                        {/* Nội quy */}
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Nội quy trọ</h2>
                        <div className="bg-red-50 p-5 rounded-2xl mb-8">
                            {rules.map((rule: string, index: number) => (
                                <div key={index} className="flex items-center text-gray-700 mb-2 last:mb-0">
                                    <ShieldAlert className="w-5 h-5 text-danger mr-2 shrink-0" />
                                    {rule}
                                </div>
                            ))}
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Thông tin chủ trọ */}
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
                                <button className="flex-1 sm:flex-none flex justify-center items-center p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-gray-700 transition-colors tooltip" title="Gọi điện">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className="flex-1 sm:flex-none flex justify-center items-center p-3 bg-primary-light text-primary rounded-full hover:bg-primary hover:text-white transition-colors tooltip"
                                    title="Nhắn tin trao đổi"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: BOX ĐẶT PHÒNG (30% - Sticky) */}
                    <div className="lg:w-[350px] shrink-0">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-primary/20 sticky top-24">
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-primary">{room.price.toLocaleString('vi-VN')}đ</span>
                                <span className="text-gray-500 text-sm"> /tháng</span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600 mb-6 pb-4 border-b border-gray-100">
                                <span>Tiền cọc giữ phòng:</span>
                                <span className="font-semibold text-gray-900">{depositAmount.toLocaleString('vi-VN')}đ</span>
                            </div>

                            <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-xl mb-6 leading-relaxed">
                                💡 Cọc ngay để giữ phòng. Tiền cọc sẽ được hoàn trả nếu bạn hủy trước 24h.
                            </div>

                            <button
                                onClick={handleBooking}
                                disabled={room.status !== 'AVAILABLE'}
                                className={`w-full flex items-center justify-center font-bold py-4 rounded-2xl shadow-md transition-all ${
                                    room.status === 'AVAILABLE'
                                        ? 'bg-primary text-white hover:bg-primary-hover hover:shadow-lg transform hover:-translate-y-0.5'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {room.status === 'AVAILABLE' ? 'ĐẶT PHÒNG NGAY' : 'PHÒNG ĐÃ ĐƯỢC THUÊ'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <ChatWidget
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                landlordName={landlordName}
                avatar={landlordAvatar}
            />
        </div>
    );
}