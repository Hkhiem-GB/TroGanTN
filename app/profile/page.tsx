// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { User, History, Crown, Phone, ShieldCheck, Check, ArrowLeft, Lock, AlertTriangle, CalendarDays } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Link from "next/link";
import { notify } from '@/utils/toast'; // IMPORT FILE THÔNG BÁO VỪA TẠO

const PRICING_PLANS = [
    { id: '1m', months: 1, price: 99000, label: '1 tháng', popular: false },
    { id: '3m', months: 3, price: 269000, label: '3 tháng', popular: false },
    { id: '6m', months: 6, price: 569000, label: '6 tháng', popular: true },
    { id: '12m', months: 12, price: 1699000, label: '1 năm', popular: false },
    { id: '60m', months: 60, price: 5869000, label: '5 năm', popular: false },
];

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const [activeTab, setActiveTab] = useState('info');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userData, setUserData] = useState<any>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rentedRooms, setRentedRooms] = useState<any[]>([]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const isLandlord = userData?.role === 'LANDLORD';

    const [showModal, setShowModal] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [confirmAge, setConfirmAge] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(PRICING_PLANS[2]);

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.email) {
            fetch(`/api/profile?email=${session.user.email}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        setUserData(json.data.user);
                        setPhoneNumber(json.data.user.landlordData?.phoneNumber || '');
                        setRentedRooms(json.data.rentedRooms);
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                });
        } else {
            // Dùng setTimeout để hoãn lệnh cập nhật UI lại 1 nhịp, tránh lỗi của ESLint
            setTimeout(() => {
                setIsLoading(false);
            }, 0);
        }
    }, [session, status]);

    // AUTO-POLLING KHI ĐANG MỞ MÃ QR
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // BẮT BUỘC: Lưu email vào biến cục bộ để TypeScript nhớ (Type Narrowing)
        const userEmail = session?.user?.email;

        if (showQR && userEmail) {
            interval = setInterval(async () => {
                try {
                    // Truyền biến userEmail vào đây, thay vì gọi lại session.user.email
                    const res = await fetch(`/api/profile?email=${userEmail}`);
                    const json = await res.json();

                    if (json.success) {
                        const checkUser = json.data.user;

                        if (checkUser.role === 'LANDLORD' && !isLandlord) {
                            clearInterval(interval);

                            setUserData(checkUser);
                            await update({ role: 'LANDLORD' });

                            notify.success('Nhận tiền thành công! Gói cước đã được kích hoạt.');
                            setShowQR(false);
                            setActiveTab('info');
                        }
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra thanh toán", error);
                }
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showQR, session, isLandlord, update]);

    const handleUpdatePhone = async () => {
        if (!phoneNumber) return notify.error('Vui lòng nhập số điện thoại');

        const toastId = notify.loading('Đang cập nhật...');
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, phoneNumber, action: 'update_phone' })
            });
            const data = await res.json();

            if (data.success) {
                notify.success('Cập nhật số điện thoại thành công!', toastId);
            } else {
                notify.error('Có lỗi xảy ra!', toastId);
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    const handleOpenQR = () => {
        if (!agreePolicy || !confirmAge) {
            notify.error('Vui lòng xác nhận đủ các điều khoản!');
            return;
        }
        setShowModal(false);
        setShowQR(true);
    };

    const handlePaymentSuccess = async () => {
        const toastId = notify.loading('Đang xác nhận thanh toán...');
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, action: 'upgrade_landlord', durationMonths: selectedPlan.months })
            });
            const data = await res.json();

            if (data.success) {
                setUserData(data.data);
                await update({ role: 'LANDLORD' });
                notify.success(`Chúc mừng! Bạn đã đăng ký gói ${selectedPlan.label} thành công.`, toastId);
                setShowQR(false);
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    const handleCancelSubscription = async () => {
        const toastId = notify.loading('Đang xử lý hủy gói...');
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, action: 'cancel_landlord' })
            });
            const data = await res.json();

            if (data.success) {
                setUserData(data.data);
                await update({ role: 'USER' });
                notify.success('Đã hủy gói Đối tác Chủ trọ thành công!', toastId);
                setShowCancelModal(false);
                setActiveTab('info');
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    const validUntilDate = userData?.landlordData?.subscriptionValidUntil
        ? new Date(userData.landlordData.subscriptionValidUntil)
        : new Date();

    const registerDate = new Date(validUntilDate);
    if (userData?.landlordData?.subscriptionValidUntil) {
        registerDate.setMonth(registerDate.getMonth() - 1);
    }

    const now = new Date();
    const diffHours = (now.getTime() - registerDate.getTime()) / (1000 * 60 * 60);
    const remainingHours = Math.max(0, Math.ceil(72 - diffHours));

    // TODO: DEV TEST - Đang để true để test hủy bất cứ lúc nào. Khi build thật, đổi lại thành (diffHours >= 72)
    const canCancel = true;

    const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
    const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '000000000';
    const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'CHUA CAI DAT';

    const transferContent = `UPGRADE ${session?.user?.email?.split('@')[0].toUpperCase()} ${selectedPlan.months}M`;
    const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID.trim()}-${BANK_ACCOUNT.trim()}-compact.png?amount=${selectedPlan.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME.trim())}`;

    if (isLoading || status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Tắt Toaster cũ, bọc Toaster mới với cấu hình mặc định (có thể đặt ở file layout.tsx sau này) */}
            <Toaster position="top-center" />

            <div className="flex items-center gap-2 mb-8">
                <Link
                    href="/"
                    className="p-2 -ml-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Quay lại trang chủ"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
            </div>

            {!session ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa đăng nhập</h2>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Vui lòng đăng nhập để xem thông tin chi tiết và quản lý tài khoản của bạn trên TroGan.</p>
                    <button
                        onClick={() => signIn('google')}
                        className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        Đăng nhập bằng Google
                    </button>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-8">
                    {/* SIDEBAR */}
                    <div className="w-full md:w-64 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1 sticky top-20">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <User className="w-5 h-5" /> Thông tin cá nhân
                            </button>

                            {!isLandlord && (
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <History className="w-5 h-5" /> Trọ đã/đang thuê
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('upgrade')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'upgrade' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Crown className="w-5 h-5" />
                                {isLandlord ? 'Quản lý Gói Chủ trọ' : 'Đăng ký Chủ trọ'}
                            </button>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">

                        {activeTab === 'info' && (
                            <div className="max-w-xl animate-in fade-in duration-300">
                                <h2 className="text-xl font-bold mb-6">Thông tin cá nhân</h2>
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative">
                                        <img src={session.user?.image || ""} alt="Avatar" className={`w-24 h-24 rounded-full object-cover shadow-sm ${isLandlord ? 'ring-4 ring-yellow-400 p-1' : ''}`} />
                                        {isLandlord && (<div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1.5 rounded-full border-2 border-white shadow-sm"><Crown className="w-4 h-4 text-white" /></div>)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{session.user?.name}</h3>
                                        <p className="text-sm font-medium mt-1">
                                            {isLandlord ? (<span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">Đối tác Chủ trọ</span>) : (<span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-md">Thành viên tiêu chuẩn</span>)}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" disabled value={session.user?.email || ""} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
                                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Nhập số điện thoại của bạn..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium" />
                                        </div>
                                    </div>
                                    <button onClick={handleUpdatePhone} className="mt-4 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">Lưu thay đổi</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && !isLandlord && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-xl font-bold mb-6">Trọ đã và đang thuê</h2>
                                {rentedRooms.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">Bạn chưa có lịch sử đặt phòng nào.</div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {rentedRooms.map((room) => (
                                            <div key={room.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-2xl hover:shadow-md transition-all bg-white group cursor-pointer">
                                                <div className="relative w-full sm:w-48 h-32 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                                    <Image src={room.image} alt={room.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                                </div>
                                                <div className="flex flex-col justify-center flex-1">
                                                    <div className={`w-fit px-3 py-1 mb-2 rounded-full text-xs font-semibold ${room.status === 'Đang thuê' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{room.status}</div>
                                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{room.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5 line-clamp-2"><span className="shrink-0">📍</span> {room.address}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'upgrade' && (
                            <div className="animate-in fade-in duration-300">
                                {!isLandlord ? (
                                    <div className="text-center md:text-left">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
                                            <Crown className="w-8 h-8 text-yellow-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trở thành Đối tác Chủ trọ</h2>
                                        <p className="text-gray-600 mb-8 leading-relaxed max-w-2xl">
                                            Đăng bài không giới hạn, tiếp cận hàng ngàn người thuê mỗi ngày và quản lý phòng trọ chuyên nghiệp ngay trên hệ thống của TroGan.
                                        </p>

                                        <h3 className="font-bold text-gray-900 mb-4">Chọn gói duy trì máy chủ:</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                                            {PRICING_PLANS.map((plan) => (
                                                <button
                                                    key={plan.id}
                                                    onClick={() => setSelectedPlan(plan)}
                                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                                                        selectedPlan.id === plan.id
                                                            ? 'border-primary bg-primary/5 shadow-md'
                                                            : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {plan.popular && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                                            PHỔ BIẾN
                                                        </div>
                                                    )}
                                                    <div className={`font-bold text-lg mb-1 ${selectedPlan.id === plan.id ? 'text-primary' : 'text-gray-900'}`}>
                                                        {plan.label}
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-600">
                                                        {(plan.price / 1000).toLocaleString('vi-VN')}K
                                                    </div>

                                                    <div className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        selectedPlan.id === plan.id ? 'border-primary bg-primary' : 'border-gray-300'
                                                    }`}>
                                                        {selectedPlan.id === plan.id && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 space-y-4 max-w-2xl">
                                            <div className="flex items-center gap-3 text-gray-700"><Check className="w-5 h-5 text-green-500 shrink-0" /><span>Đăng tải và quản lý phòng trọ không giới hạn.</span></div>
                                            <div className="flex items-center gap-3 text-gray-700"><Check className="w-5 h-5 text-green-500 shrink-0" /><span>Hiển thị ưu tiên trên bản đồ Radar 2km.</span></div>
                                            <div className="flex items-center gap-3 text-gray-700"><Check className="w-5 h-5 text-green-500 shrink-0" /><span>Hỗ trợ huy hiệu &#34;Chủ trọ uy tín&#34; (viền vàng).</span></div>
                                        </div>

                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="px-8 py-4 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors w-full sm:w-auto shadow-sm flex flex-col sm:flex-row items-center justify-center gap-2"
                                        >
                                            <span>Thanh toán gói {selectedPlan.label}</span>
                                            <span className="hidden sm:inline-block">•</span>
                                            <span>{selectedPlan.price.toLocaleString('vi-VN')}đ</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-w-2xl">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Crown className="w-7 h-7 text-yellow-500" />
                                            Quản lý Gói Đối tác
                                        </h2>

                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 mb-8 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">ĐANG HOẠT ĐỘNG</div>

                                            <h3 className="font-bold text-gray-900 text-lg mb-4">Gói Chủ Trọ</h3>

                                            <div className="space-y-4">
                                                <div className="flex items-center text-gray-700">
                                                    <CalendarDays className="w-5 h-5 mr-3 text-yellow-600" />
                                                    <span className="w-32">Ngày đăng ký:</span>
                                                    <span className="font-semibold text-gray-900">{registerDate.toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="flex items-center text-gray-700">
                                                    <CalendarDays className="w-5 h-5 mr-3 text-yellow-600" />
                                                    <span className="w-32">Ngày hết hạn:</span>
                                                    <span className="font-semibold text-primary">{validUntilDate.toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            <h3 className="font-bold text-gray-900 mb-2">Hủy gói đăng ký</h3>
                                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                                Nếu hủy đăng ký, toàn bộ phòng trọ của bạn sẽ bị ẩn khỏi hệ thống và mất biểu tượng Chủ trọ.
                                                Bạn chỉ có thể hủy sau <strong className="text-gray-700">72 giờ</strong> kể từ thời điểm đăng ký.
                                            </p>

                                            {canCancel ? (
                                                <button
                                                    onClick={() => setShowCancelModal(true)}
                                                    className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors"
                                                >
                                                    Hủy đăng ký Chủ trọ
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 inline-flex">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Bạn có thể hủy sau {remainingHours} giờ nữa
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN ĐĂNG KÝ */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                     onClick={(e) => {
                         if (e.target === e.currentTarget) setShowModal(false);
                     }}
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Xác nhận đăng ký</h3>

                        <div className="space-y-4 mb-8">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={agreePolicy} onChange={(e) => setAgreePolicy(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Tôi đã đọc và đồng ý với các Chính sách dành cho Chủ trọ của nền tảng.</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={confirmAge} onChange={(e) => setConfirmAge(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Tôi xác nhận mình trên 18 tuổi và chịu trách nhiệm pháp lý cho các tin đăng.</span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>

                            {/* NÚT XÁC NHẬN ĐÃ ĐƯỢC CẬP NHẬT LOGIC MÀU SẮC & TRẠNG THÁI */}
                            <button
                                onClick={handleOpenQR}
                                disabled={!agreePolicy || !confirmAge}
                                className={`flex-1 py-3 font-medium rounded-xl transition-all ${
                                    agreePolicy && confirmAge
                                        ? 'text-white bg-primary hover:bg-primary-hover shadow-sm'
                                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                                }`}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MÃ QR THANH TOÁN */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                     onClick={(e) => {
                         if (e.target === e.currentTarget) setShowQR(false);
                     }}
                >
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
                        <ShieldCheck className="w-14 h-14 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Quét mã để thanh toán</h3>
                        <p className="text-sm text-gray-500 mb-6">Mở app Ngân hàng và quét mã dưới đây để kích hoạt gói {selectedPlan.label}</p>

                        <div className="w-56 h-56 mx-auto bg-gray-50 rounded-2xl mb-6 p-2 border-2 border-gray-100 shadow-sm relative overflow-hidden">
                            <img
                                src={vietQrUrl}
                                alt="Mã QR Thanh toán"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 text-left text-sm mb-6 space-y-3 border border-gray-100">
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Số tiền:</span>
                                <span className="font-bold text-primary text-base">{selectedPlan.price.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-gray-500 whitespace-nowrap mr-4 mt-1">Nội dung CK:</span>
                                <span className="font-mono font-bold text-gray-900 bg-gray-200 px-2 py-1 rounded text-right break-all">
                                    {transferContent}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-center text-sm font-medium text-primary animate-pulse bg-primary/10 py-3 rounded-xl">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                                Hệ thống đang chờ nhận tiền tự động...
                            </div>
                            <button onClick={() => setShowQR(false)} className="w-full py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                Hủy giao dịch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN HỦY GÓI */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                     onClick={(e) => {
                         if (e.target === e.currentTarget) setShowCancelModal(false);
                     }}
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn chắc chắn muốn hủy?</h3>
                        <p className="text-gray-500 text-sm mb-8 px-4 leading-relaxed">
                            Sau khi hủy, tất cả tin đăng phòng trọ của bạn sẽ tạm thời bị ẩn khỏi nền tảng và không thể khôi phục lại thời hạn của gói hiện tại.
                        </p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Đóng</button>
                            <button onClick={handleCancelSubscription} className="flex-1 py-3 text-white font-medium bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-sm">Đồng ý Hủy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}