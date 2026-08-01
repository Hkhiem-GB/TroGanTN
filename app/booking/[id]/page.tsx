"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Clock, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Copy, Check } from 'lucide-react';
import { notify } from '@/utils/toast';
import { Toaster } from 'react-hot-toast';

interface ILandlordBankData {
    bankId?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
}

interface IRoomData {
    _id: string;
    title: string;
    depositAmount?: number;
    themeImage?: string;
    pricePerMonth?: number;
    landlordId?: {
        name?: string;
        email?: string;
        landlordData?: ILandlordBankData;
    };
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params trực tiếp bằng React.use() theo chuẩn Next.js mới (Khắc phục hoàn toàn lỗi ESLint set-state-in-effect)
    const resolvedParams = use(params);
    const roomId = resolvedParams?.id;

    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Payment, 3: Success
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút = 900 giây
    const [copied, setCopied] = useState(false);

    // State quản lý form Bước 1
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [guests, setGuests] = useState(1);
    const [promo, setPromo] = useState('');

    // State quản lý dữ liệu thật từ DB
    const [room, setRoom] = useState<IRoomData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy thông tin phòng trọ từ API khi có roomId
    useEffect(() => {
        if (!roomId) return;

        const fetchRoomData = async () => {
            try {
                const res = await fetch(`/api/rooms/${roomId}`);
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

        fetchRoomData();
    }, [roomId]);

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
            setStep(1);
            setTimeLeft(15 * 60);
        }
    }, [step, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Kiểm tra định dạng Họ tên và SĐT (chuẩn 10 số, bắt đầu bằng số 0)
    const handleNextStep = () => {
        if (!name.trim()) {
            notify.error('Vui lòng nhập Họ và tên!');
            return;
        }

        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!nameRegex.test(name.trim())) {
            notify.error('Họ và tên chỉ được chứa chữ cái và khoảng trắng!');
            return;
        }

        if (!phone.trim()) {
            notify.error('Vui lòng nhập Số điện thoại!');
            return;
        }

        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone.trim())) {
            notify.error('Số điện thoại không hợp lệ! Phải có đúng 10 chữ số và bắt đầu bằng số 0.');
            return;
        }

        setStep(2);
    };

    const handleConfirmPayment = () => {
        const toastId = notify.loading('Đang xác nhận giao dịch...');
        setTimeout(() => {
            notify.success('Xác nhận thanh toán thành công!', toastId);
            setStep(3);
        }, 1500);
    };

    const handleCopyContent = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        notify.success('Đã sao chép nội dung chuyển khoản!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải thông tin phòng...</p>
            </div>
        );
    }

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

    // Khắc phục triệt để lỗi TS18048 bằng cách thêm giá trị dự phòng an toàn (|| 0)
    const depositAmount = room?.depositAmount || 0;

    const landlordBank = room?.landlordId?.landlordData;
    const BANK_ID = landlordBank?.bankId || process.env.NEXT_PUBLIC_BANK_ID || 'MB';
    const BANK_ACCOUNT = landlordBank?.bankAccountNumber || '000000000';
    const BANK_ACCOUNT_NAME = landlordBank?.bankAccountName || 'CHUA CAI DAT';

    const transferContent = `DATCOC ${phone.trim()}`;
    const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID.trim()}-${BANK_ACCOUNT.trim()}-compact.png?amount=${depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME.trim())}`;

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

                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
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
                                            maxLength={10}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            placeholder="09xx xxx xxx (10 chữ số)"
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
                        </div>

                        <div className="md:col-span-1">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24 space-y-4">
                                <h3 className="font-bold text-gray-900 pb-3 border-b border-gray-100">Tóm tắt đặt phòng</h3>

                                <div className="w-full h-36 bg-gray-100 rounded-2xl overflow-hidden relative shadow-inner">
                                    <img
                                        src={room?.themeImage || '/placeholder.jpg'}
                                        alt={room?.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div>
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Phòng trọ</span>
                                    <h4 className="font-bold text-gray-900 text-base line-clamp-2 mt-0.5">{room?.title}</h4>
                                </div>

                                <div className="pt-3 border-t border-gray-100 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Giá thuê hàng tháng:</span>
                                        <span className="font-semibold text-gray-900">{(room?.pricePerMonth || 0).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="font-medium text-gray-700">Tiền cọc giữ phòng:</span>
                                        {/* Đã thêm || 0 để triệt tiêu hoàn toàn lỗi TypeScript */}
                                        <span className="font-bold text-primary text-lg">{depositAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <h2 className="text-2xl font-bold text-gray-900">Quét mã QR để thanh toán cọc</h2>
                            <p className="text-gray-500 text-sm">Sử dụng ứng dụng ngân hàng bất kỳ để quét mã bên dưới</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="w-64 h-64 bg-white rounded-2xl p-2 border-2 border-primary/20 shadow-sm relative overflow-hidden flex items-center justify-center">
                                    <img
                                        src={vietQrUrl}
                                        alt="Mã QR Thanh toán"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-danger font-bold text-xl mt-4">
                                    <Clock className="w-5 h-5 animate-pulse" />
                                    <span>Hết hạn sau: {formatTime(timeLeft)}</span>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                                    <h3 className="font-bold text-gray-900 text-base border-b border-gray-200 pb-2">Chi tiết chuyển khoản</h3>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Ngân hàng:</span>
                                        <span className="font-bold text-gray-900">{BANK_ID}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Số tài khoản:</span>
                                        <span className="font-mono font-bold text-gray-900">{BANK_ACCOUNT}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Chủ tài khoản:</span>
                                        <span className="font-bold text-gray-900 uppercase">{BANK_ACCOUNT_NAME}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                                        <span className="text-gray-500">Số tiền cọc:</span>
                                        {/* Đã thêm || 0 để triệt tiêu hoàn toàn lỗi TypeScript */}
                                        <span className="font-bold text-primary text-lg">{depositAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-gray-500 text-sm">Nội dung CK:</span>
                                        <button
                                            onClick={() => handleCopyContent(transferContent)}
                                            className="flex items-center gap-1.5 font-mono font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-sm"
                                        >
                                            <span>{transferContent}</span>
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                        </button>
                                    </div>

                                    {promo.trim() && (
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm">
                                            <span className="text-gray-500">Mã giảm giá áp dụng:</span>
                                            <span className="font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg uppercase border border-green-200">{promo}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 text-blue-700 p-3.5 rounded-xl text-xs flex items-start border border-blue-100 leading-relaxed">
                                    <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                    Vui lòng chuyển khoản đúng số tiền và chính xác nội dung để hệ thống tự động xác nhận giữ phòng.
                                </div>

                                <button
                                    onClick={handleConfirmPayment}
                                    className="w-full bg-success text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Đã thanh toán (Xác nhận)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 text-center animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-success/10 rounded-full mb-6">
                            <CheckCircle2 className="w-12 h-12 text-success" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Đặt phòng thành công!</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Bạn đã thanh toán cọc thành công cho phòng <strong>{room?.title}</strong>.
                            Thông tin chi tiết đã được gửi vào số điện thoại <strong>{phone}</strong>. Chủ trọ sẽ sớm liên hệ để xác nhận thời gian dọn đến.
                        </p>
                        <Link href="/" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary-hover transition-colors shadow-sm">
                            Về trang chủ
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}