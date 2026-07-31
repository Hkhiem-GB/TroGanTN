"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Clock, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { notify } from '@/utils/toast';
import { Toaster } from 'react-hot-toast';

export default function BookingPage({ params }: { params: { id: string } }) {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Payment, 3: Success
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút = 900 giây

    // State quản lý form Bước 1
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [guests, setGuests] = useState(1);
    const [promo, setPromo] = useState('');

    // State quản lý dữ liệu thật từ DB
    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy thông tin phòng trọ từ API khi load trang
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

    // Xử lý đồng hồ đếm ngược ở Bước 2
    useEffect(() => {
        if (step === 2 && timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timerId);
        }
        if (timeLeft === 0 && step === 2) {
            notify.error("Mã QR đã hết hạn. Vui lòng đặt lại!");
            setStep(1); // Trở về bước 1
            setTimeLeft(15 * 60); // Reset lại thời gian
        }
    }, [step, timeLeft]);

    // Format giây thành dạng MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Xử lý chuyển sang Bước 2
    const handleNextStep = () => {
        if (!name.trim() || !phone.trim()) {
            notify.error('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');
            return;
        }
        setStep(2);
    };

    const handleSimulatePaymentSuccess = () => {
        const toastId = notify.loading('Đang xác nhận thanh toán...');
        setTimeout(() => {
            notify.success('Thanh toán thành công!', toastId);
            setStep(3);
        }, 1500);
    };

    // 1. Màn hình Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải thông tin phòng...</p>
            </div>
        );
    }

    // 2. Màn hình lỗi (Không tìm thấy phòng)
    if (!room && !isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Phòng không tồn tại</h2>
                    <p className="text-gray-500 mb-6">Có thể phòng trọ này đã bị xóa hoặc không còn trống.</p>
                    <button onClick={() => window.history.back()} className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors w-full">
                        Quay lại trang trước
                    </button>
                </div>
            </div>
        );
    }

    const depositAmount = room.deposit || 500000;

    // TẠO URL VIETQR ĐỘNG
    const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
    const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '000000000';
    const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'CHUA CAI DAT';

    // Nội dung chuyển khoản: DATCOC + Số điện thoại người đặt
    const transferContent = `DATCOC ${phone.trim()}`;
    const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID.trim()}-${BANK_ACCOUNT.trim()}-compact.png?amount=${depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME.trim())}`;


    // 3. Màn hình chính
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <Toaster position="top-center" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">

                {step !== 3 && (
                    <button onClick={() => window.history.back()} className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Quay lại
                    </button>
                )}

                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                        <div className={`h-1 w-16 md:w-32 rounded transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        {step === 1 && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin người đặt</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="VD: Nguyễn Văn A"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="09xx xxx xxx"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Số người ở dự kiến</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={guests}
                                                onChange={(e) => setGuests(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá (Nếu có)</label>
                                            <input
                                                type="text"
                                                value={promo}
                                                onChange={(e) => setPromo(e.target.value)}
                                                placeholder="Nhập mã..."
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNextStep}
                                        className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-colors mt-4 shadow-sm"
                                    >
                                        Tiếp tục thanh toán cọc
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 text-center animate-in slide-in-from-right-4 duration-300">
                                <ShieldCheck className="w-14 h-14 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán tiền cọc</h2>
                                <p className="text-gray-500 mb-6">Mở app Ngân hàng và quét mã QR bên dưới để giữ phòng</p>

                                {/* ẢNH QR ĐỘNG TỪ VIETQR */}
                                <div className="w-64 h-64 mx-auto bg-gray-50 rounded-2xl mb-6 p-2 border-2 border-primary/20 shadow-sm relative overflow-hidden flex items-center justify-center">
                                    <img
                                        src={vietQrUrl}
                                        alt="Mã QR Thanh toán"
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 text-left text-sm mb-6 space-y-3 border border-gray-100 max-w-sm mx-auto">
                                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="text-gray-500">Số tiền:</span>
                                        <span className="font-bold text-primary text-base">{depositAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-gray-500 whitespace-nowrap mr-4 mt-1">Nội dung CK:</span>
                                        <span className="font-mono font-bold text-gray-900 bg-gray-200 px-2 py-1 rounded text-right break-all">
                                            {transferContent}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-danger font-bold text-2xl mb-6">
                                    <Clock className="w-7 h-7 animate-pulse" />
                                    {formatTime(timeLeft)}
                                </div>

                                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm flex items-start text-left mb-6 border border-blue-100">
                                    <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                                    Hệ thống đang tự động kiểm tra giao dịch. Vui lòng không đóng trình duyệt. Nếu bạn đã chuyển khoản thành công, phòng sẽ được xác nhận tự động.
                                </div>

                                <button onClick={handleSimulatePaymentSuccess} className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors">
                                    [Dev Test] Bấm vào đây để giả lập thanh toán thành công
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 text-center animate-in zoom-in-95 duration-500">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-success/10 rounded-full mb-6">
                                    <CheckCircle2 className="w-12 h-12 text-success" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Đặt phòng thành công!</h2>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    Bạn đã thanh toán cọc thành công cho phòng <strong>{room.title}</strong>.
                                    Thông tin chi tiết đã được gửi vào số điện thoại <strong>{phone}</strong>. Chủ trọ sẽ sớm liên hệ để xác nhận thời gian dọn đến.
                                </p>
                                <Link href="/" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary-hover transition-colors shadow-sm">
                                    Về trang chủ
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Tóm tắt đặt phòng</h3>
                            <div className="text-sm text-gray-700 mb-2 font-medium line-clamp-3 leading-relaxed">
                                {room.title}
                            </div>
                            <div className="flex justify-between items-center text-gray-600 text-sm mt-6">
                                <span>Tiền cọc:</span>
                                <span className="font-bold text-primary text-xl">{depositAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}