"use client";

import { useState } from 'react';
import { MapPin, X, Crosshair, Home, AlertCircle, MapPinOff } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function FloatingRadar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const handleStartScan = () => {
        setIsOpen(true);
        setIsScanning(true);
        setResults(null);
        setLocationError(null);

        // Kiểm tra xem trình duyệt có hỗ trợ định vị không
        if (!navigator.geolocation) {
            setLocationError("Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị GPS.");
            setIsScanning(false);
            return;
        }

        // Bắt đầu xin quyền và lấy vị trí
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // GỌI API THỰC TẾ: Truyền tọa độ lên server để tìm phòng quanh bán kính 2km
                    const res = await fetch(`/api/rooms/radar?lat=${latitude}&lng=${longitude}`);

                    if (!res.ok) throw new Error("Lỗi khi tìm kiếm");

                    const json = await res.json();

                    if (json.success) {
                        setResults(json.data); // Dữ liệu trả về từ DB
                    } else {
                        setResults([]);
                    }
                } catch (error) {
                    console.error("Lỗi quét radar:", error);
                    toast.error("Có lỗi xảy ra khi quét trọ quanh đây.");
                    setResults([]);
                } finally {
                    setIsScanning(false);
                }
            },
            (error) => {
                // Xử lý khi người dùng TỪ CHỐI cấp quyền hoặc lỗi GPS
                setIsScanning(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError("Bạn đã từ chối cấp quyền vị trí. Vui lòng vào Cài đặt trình duyệt để cho phép truy cập vị trí và thử lại.");
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationError("Không thể xác định được vị trí của bạn lúc này. Vui lòng bật GPS và thử lại.");
                } else if (error.code === error.TIMEOUT) {
                    setLocationError("Quá thời gian kết nối GPS. Vui lòng thử lại.");
                } else {
                    setLocationError("Đã xảy ra lỗi không xác định khi lấy vị trí.");
                }
            },
            {
                enableHighAccuracy: true, // Ưu tiên độ chính xác cao (GPS thật)
                timeout: 10000, // Hết hạn sau 10s nếu không lấy được
                maximumAge: 0 // Không dùng bộ nhớ cache vị trí cũ
            }
        );
    };

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            setIsScanning(false);
            setResults(null);
            setLocationError(null);
        }, 300);
    };

    return (
        <>
            {/* Nút Floating thu gọn ở góc phải dưới */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={handleStartScan}
                    title="Tìm trọ quanh đây"
                    className="group flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(0,168,107,0.4)] hover:bg-primary-hover transition-all transform hover:-translate-y-1 hover:scale-105"
                >
                    <Crosshair className="w-6 h-6 group-hover:animate-spin-slow" />
                </button>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">

                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Radar quét bán kính 2km
                            </h3>
                            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* TRẠNG THÁI 1: ĐANG QUÉT & XIN QUYỀN */}
                            {isScanning ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                                        <div className="absolute inset-4 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                        <div className="relative bg-primary text-white p-4 rounded-full shadow-lg">
                                            <Crosshair className="w-10 h-10" />
                                        </div>
                                    </div>
                                    <p className="text-gray-600 font-medium animate-pulse text-center">
                                        Đang định vị vị trí của bạn...<br/>
                                        <span className="text-sm font-normal text-gray-400">(Vui lòng bấm &#34;Cho phép&#34; nếu trình duyệt hỏi)</span>
                                    </p>
                                </div>

                                // TRẠNG THÁI 2: LỖI QUYỀN VỊ TRÍ
                            ) : locationError ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-red-50 text-danger rounded-full flex items-center justify-center mb-4">
                                        <MapPinOff className="w-10 h-10" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2">Không thể quét Radar</h4>
                                    <p className="text-gray-500 text-sm mb-6 px-4">{locationError}</p>
                                    <button onClick={handleStartScan} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                                        Thử quét lại
                                    </button>
                                </div>

                                // TRẠNG THÁI 3: HIỂN THỊ KẾT QUẢ
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="text-center mb-6">
                                        <div className="inline-block bg-primary-light text-primary px-4 py-1 rounded-full text-sm font-semibold mb-2">
                                            Tìm thấy {results?.length || 0} phòng trọ quanh đây
                                        </div>
                                    </div>

                                    {results?.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            Không có phòng trọ nào đang trống trong bán kính 2km quanh bạn.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {results?.map((room) => (
                                                <Link href={`/app/rooms/${room._id}`} onClick={handleClose} key={room._id} className="block bg-gray-50 border border-gray-100 p-4 rounded-2xl hover:border-primary/50 hover:bg-primary-light/20 transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2 pr-4 group-hover:text-primary transition-colors">{room.title}</h4>
                                                        <span className="shrink-0 bg-white border border-gray-200 text-xs px-2 py-1 rounded-lg font-medium text-gray-600 flex items-center gap-1">
                                                            {/* Giả sử Backend trả về thuộc tính distance tính bằng km */}
                                                            {room.distance ? `${room.distance} km` : 'Gần đây'}
                                                        </span>
                                                    </div>
                                                    <div className="text-primary font-bold mb-2">
                                                        {room.price?.toLocaleString('vi-VN')}đ <span className="text-xs text-gray-500 font-normal">/tháng</span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Home className="w-3 h-3 mr-1 shrink-0" />
                                                        <span className="line-clamp-1">{room.address}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}