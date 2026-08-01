"use client";

import {useState, useEffect, useRef} from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { User, History, Crown, Phone, ShieldCheck, Check, ArrowLeft, Lock, AlertTriangle, CalendarDays, ShieldAlert } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Link from "next/link";
import { notify } from '@/utils/toast';

const PRICING_PLANS = [
    { id: '1m', months: 1, price: 99000, label: '1 tháng', popular: false },
    { id: '3m', months: 3, price: 269000, label: '3 tháng', popular: false },
    { id: '6m', months: 6, price: 569000, label: '6 tháng', popular: true },
    { id: '12m', months: 12, price: 1699000, label: '1 năm', popular: false },
    { id: '60m', months: 60, price: 5869000, label: '5 năm', popular: false },
];

const BANKS_LIST = [
    { id: 'MB', name: 'MB Bank (Quân Đội)' },
    { id: 'VCB', name: 'Vietcombank (TMCP Ngoại Thương)' },
    { id: 'TCB', name: 'Techcombank (Kỹ Thương)' },
    { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
    { id: 'CTG', name: 'VietinBank (Công Thương)' },
    { id: 'BIDV', name: 'BIDV (Đầu tư và Phát triển)' },
    { id: 'ACB', name: 'ACB (Á Châu)' },
    { id: 'TPB', name: 'TPBank (Tiên Phong)' },
    { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
    { id: 'HDB', name: 'HDBank (Phát triển TP.HCM)' },
    { id: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)' },
    { id: 'MSB', name: 'MSB (Hàng Hải)' },
    { id: 'OCB', name: 'OCB (Phương Đông)' },
    { id: 'VIB', name: 'VIB (Quốc Tế)' },
    { id: 'LPB', name: 'LienVietPostBank (Lộc Phát)' },
    { id: 'Agribank', name: 'Agribank (Nông nghiệp và Phát triển Nông thôn)' }
];

export default function ProfilePage() {
    // ==========================================
    // 1. HOOKS & STATES (Khởi tạo dữ liệu)
    // ==========================================
    const { data: session, status, update } = useSession();
    const [activeTab, setActiveTab] = useState('info');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userData, setUserData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rentedRooms, setRentedRooms] = useState<any[]>([]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [confirmAge, setConfirmAge] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(PRICING_PLANS[2]);

    const [bankId, setBankId] = useState('MB'); // Mặc định là MB Bank
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [isOpenBankDropdown, setIsOpenBankDropdown] = useState(false);

    const bankDropdownRef = useRef<HTMLDivElement>(null);

    // ==========================================
    // 2. BIẾN PHÂN QUYỀN (Derived States)
    // ==========================================
    const isAdmin = userData?.role === 'ADMIN';
    const isSubscriptionActive = userData?.landlordData?.isSubscriptionActive === true;
    const isLandlord = userData?.role === 'LANDLORD' || isSubscriptionActive;

    // ==========================================
    // 3. EFFECTS (Gọi API khi tải trang)
    // ==========================================
    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.email) {
            fetch(`/api/profile?email=${session.user.email}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        setUserData(json.data.user);
                        setPhoneNumber(json.data.user.landlordData?.phoneNumber || '');

                        // FIX: Lấy dữ liệu ngân hàng phải nằm gọn bên trong khối .then() này
                        setBankId(json.data.user.landlordData?.bankId || 'MB');
                        setBankAccountNumber(json.data.user.landlordData?.bankAccountNumber || '');
                        setBankAccountName(json.data.user.landlordData?.bankAccountName || '');

                        setRentedRooms(json.data.rentedRooms);
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                });
        } else {
            setTimeout(() => {
                setIsLoading(false);
            }, 0);
        }
        const handleClickOutside = (event: MouseEvent) => {
            if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
                setIsOpenBankDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [session, status]);

    // ==========================================
    // 4. HÀM TIỆN ÍCH (Helpers)
    // ==========================================
    // Kiểm tra chuẩn 10 số
    const isValidPhoneNumber = (phone: string) => {
        const phoneRegex = /^0[0-9]{9}$/;
        return phoneRegex.test(phone);
    };

    // ==========================================
    // 5. HÀM XỬ LÝ SỰ KIỆN (Event Handlers)
    // ==========================================

    // --- Nhóm xử lý cập nhật thông tin ---
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const onlyNums = value.replace(/[^0-9]/g, '');
        if (onlyNums.length <= 10) {
            setPhoneNumber(onlyNums);
        }
    };

    const handleUpdatePhone = async () => {
        if (!phoneNumber) return notify.error('Vui lòng nhập số điện thoại');

        if (!isValidPhoneNumber(phoneNumber)) {
            return notify.error('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số bắt đầu bằng số 0.');
        }

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

    // --- Nhóm xử lý Nâng cấp/Hủy gói Chủ trọ ---
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
                await update({ role: isAdmin ? 'ADMIN' : 'LANDLORD' });
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
                await update({ role: isAdmin ? 'ADMIN' : 'USER' });
                notify.success('Đã hủy gói Đối tác Chủ trọ thành công!', toastId);
                setShowCancelModal(false);
                setActiveTab('info');
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    // --- Xử lý cập nhật ngân hàng ---
    const handleUpdateBank = async () => {
        if (!bankAccountNumber || !bankAccountName) {
            return notify.error('Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản');
        }

        const toastId = notify.loading('Đang cập nhật ngân hàng...');
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: session?.user?.email,
                    bankId,
                    bankAccountNumber,
                    bankAccountName,
                    action: 'update_bank'
                })
            });
            const data = await res.json();

            if (data.success) {
                notify.success('Cấu hình ngân hàng nhận cọc thành công!', toastId);
            } else {
                notify.error('Có lỗi xảy ra!', toastId);
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    // ==========================================
    // 6. BIẾN TÍNH TOÁN HIỂN THỊ (Render Variables)
    // ==========================================

    // --- Tính toán thời gian gói ---
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
    const canCancel = diffHours >= 72 || isAdmin;

    // --- Thông tin ngân hàng & QR ---
    const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
    const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '000000000';
    const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'CHUA CAI DAT';

    const transferContent = `UPGRADE ${session?.user?.email?.split('@')[0].toUpperCase()} ${selectedPlan.months}M`;
    const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID.trim()}-${BANK_ACCOUNT.trim()}-compact.png?amount=${selectedPlan.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME.trim())}`;

    // ==========================================
    // 7. HIỂN THỊ GIAO DIỆN (Render)
    // ==========================================
    if (isLoading || status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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

                            {(!isLandlord || isAdmin) && (
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
                                {isSubscriptionActive ? 'Quản lý Gói Chủ trọ' : 'Đăng ký Chủ trọ'}
                            </button>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">

                        {activeTab === 'info' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-xl font-bold mb-6">Thông tin cá nhân</h2>

                                {/* BỐ CỤC 2 CỘT CÂN ĐỐI, TẬN DỤNG HẾT KHÔNG GIAN */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                                    {/* CỘT TRÁI (5 phần): THÔNG TIN CƠ BẢN */}
                                    <div className="lg:col-span-5 space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <img
                                                    src={session.user?.image || ""}
                                                    alt="Avatar"
                                                    className={`w-20 h-20 rounded-full object-cover shadow-sm ${
                                                        isAdmin
                                                            ? 'ring-4 ring-red-500 p-1'
                                                            : isLandlord
                                                                ? 'ring-4 ring-yellow-400 p-1'
                                                                : ''
                                                    }`}
                                                />
                                                {isAdmin ? (
                                                    <div className="absolute -bottom-2 -right-2 bg-red-500 p-1.5 rounded-full border-2 border-white shadow-sm" title="Quản trị viên">
                                                        <ShieldAlert className="w-4 h-4 text-white" />
                                                    </div>
                                                ) : isLandlord && (
                                                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1.5 rounded-full border-2 border-white shadow-sm" title="Tài khoản Chủ trọ">
                                                        <Crown className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{session.user?.name}</h3>
                                                <div className="flex gap-2 mt-1.5">
                                                    {isAdmin ? (
                                                        <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-md text-xs font-bold border border-red-100">ADMIN</span>
                                                    ) : isLandlord ? (
                                                        <span className="text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-md text-xs font-bold border border-yellow-100">CHỦ TRỌ</span>
                                                    ) : (
                                                        <span className="text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-bold">THÀNH VIÊN</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input type="email" disabled value={session.user?.email || ""} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-medium text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Phone className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        value={phoneNumber}
                                                        onChange={handlePhoneChange}
                                                        placeholder="Nhập số điện thoại (10 số)..."
                                                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all font-medium text-sm ${
                                                            phoneNumber.length > 0 && phoneNumber.length < 10
                                                                ? 'border-red-300 focus:ring-red-500'
                                                                : 'border-gray-300 focus:ring-primary'
                                                        }`}
                                                    />
                                                </div>

                                                {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                                                    <p className="mt-1.5 text-xs text-red-500 font-medium">
                                                        * Số điện thoại phải bao gồm đúng 10 chữ số.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button onClick={handleUpdatePhone} className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm text-sm">
                                            Lưu số điện thoại
                                        </button>
                                    </div>

                                    {/* CỘT PHẢI (7 phần): CẤU HÌNH NGÂN HÀNG (Dành cho Chủ trọ/Admin) */}
                                    {(isLandlord || isAdmin) && (
                                        <div className="lg:col-span-7 bg-gray-50/60 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 mb-1">Cấu hình Ngân hàng nhận Tiền Cọc</h3>
                                                <p className="text-xs text-gray-500 mb-6">Thông tin này dùng để tạo mã QR tự động giúp người thuê chuyển khoản cọc trực tiếp cho bạn.</p>

                                                <div className="space-y-4">
                                                    <div className="relative" ref={bankDropdownRef}>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>

                                                        <div
                                                            onClick={() => setIsOpenBankDropdown(!isOpenBankDropdown)}
                                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-sm flex items-center justify-between cursor-pointer hover:border-gray-400"
                                                        >
                                                            <span>{BANKS_LIST.find(b => b.id === bankId)?.name || 'Chọn ngân hàng'}</span>
                                                            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpenBankDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>

                                                        {/* Menu danh sách xổ xuống (Có thanh cuộn mượt mà khi dài) */}
                                                        {isOpenBankDropdown && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl z-50 max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                                                {BANKS_LIST.map((bank) => (
                                                                    <div
                                                                        key={bank.id}
                                                                        onClick={() => {
                                                                            setBankId(bank.id);
                                                                            setIsOpenBankDropdown(false);
                                                                        }}
                                                                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                                                                            bankId === bank.id
                                                                                ? 'bg-primary/10 text-primary font-bold'
                                                                                : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <span>{bank.name}</span>
                                                                        {bankId === bank.id && (
                                                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                                                            <input
                                                                type="text"
                                                                value={bankAccountNumber}
                                                                onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                                                placeholder="VD: 0987654321"
                                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
                                                            <input
                                                                type="text"
                                                                value={bankAccountName}
                                                                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                                                                placeholder="VD: NGUYEN VAN A"
                                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-medium uppercase text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-gray-200/60 flex justify-end">
                                                <button
                                                    onClick={handleUpdateBank}
                                                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm"
                                                >
                                                    Lưu thông tin ngân hàng
                                                </button>
                                            </div>
                                        </div>
                                    )}

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
                                {!isSubscriptionActive ? (
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
                                                    className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors inline-flex items-center gap-2"
                                                >
                                                    Hủy đăng ký Chủ trọ
                                                    {isAdmin && <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded-full border border-red-200 font-bold">Admin Privileged</span>}
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
                    <div className="bg-white rounded-3xl w-full max-w-3xl p-8 md:p-10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                        <div className="text-center mb-8">
                            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-3" />
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">Quét mã để thanh toán</h3>
                            <p className="text-gray-500 text-base">Mở app Ngân hàng và quét mã dưới đây để kích hoạt gói {selectedPlan.label}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            {/* CỘT TRÁI: QR CODE */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-64 h-64 bg-gray-50 rounded-2xl p-2 border-2 border-primary/20 shadow-sm relative overflow-hidden mb-3">
                                    <img
                                        src={vietQrUrl}
                                        alt="Mã QR Thanh toán"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-xs text-gray-400 font-medium">Hỗ trợ quét mọi ứng dụng ngân hàng</span>
                            </div>

                            {/* CỘT PHẢI: THÔNG TIN VÀ NÚT BẤM */}
                            <div className="flex flex-col justify-center space-y-6">
                                <div className="bg-gray-50 rounded-xl p-5 text-left text-sm space-y-4 border border-gray-100">
                                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                        <span className="text-gray-500 font-medium text-base">Số tiền:</span>
                                        <span className="font-bold text-primary text-xl">{selectedPlan.price.toLocaleString('vi-VN')}đ</span>
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                        <span className="text-gray-500 font-medium text-base">Nội dung chuyển khoản:</span>
                                        <div className="font-mono font-bold text-gray-900 bg-gray-200 px-3 py-2.5 rounded-lg text-center break-all text-base shadow-inner border border-gray-300">
                                            {transferContent}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={handlePaymentSuccess} className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-sm text-base">
                                        Đã thanh toán (Dev Test)
                                    </button>
                                    <button onClick={() => setShowQR(false)} className="w-full py-3.5 text-gray-600 font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors text-base">
                                        Hủy giao dịch
                                    </button>
                                </div>
                            </div>
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