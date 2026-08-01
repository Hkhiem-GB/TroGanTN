//app/landlord/rooms/page.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Plus, Home, CheckCircle, Clock, Trash2, Edit3,
    MoreVertical, X, AlertTriangle, Upload, Check
} from 'lucide-react';
import { notify } from '@/utils/toast';
import { Toaster } from 'react-hot-toast';

interface IRoom {
    _id: string;
    title: string;
    address: string;
    pricePerMonth: number;
    depositAmount: number;
    area: number;
    capacity: number;
    status: 'Trống' | 'Đã thuê' | 'Đặt cọc';
    themeImage: string;
    images?: string[];
    description?: string;
    amenities?: string[];
    rules?: string[];
}

const STATUS_OPTIONS = [
    { id: 'Trống', label: 'Trống' },
    { id: 'Đặt cọc', label: 'Đang đặt cọc' },
    { id: 'Đã thuê', label: 'Đã cho thuê' }
];

export default function LandlordRoomsPage() {
    const { data: session } = useSession();
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

    // Form fields
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [pricePerMonth, setPricePerMonth] = useState<number>(3000000);
    const [depositAmount, setDepositAmount] = useState<number>(500000);
    const [area, setArea] = useState<number>(20);
    const [capacity, setCapacity] = useState<number>(2);
    const [status, setStatus] = useState<'Trống' | 'Đã thuê' | 'Đặt cọc'>('Trống');

    const [isOpenStatusDropdown, setIsOpenStatusDropdown] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Ảnh bìa & Thư viện ảnh chi tiết
    const [themeImage, setThemeImage] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [images, setImages] = useState<string[]>([]);

    const [description, setDescription] = useState('');
    const [amenitiesInput, setAmenitiesInput] = useState('');
    const [rulesInput, setRulesInput] = useState('');

    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsOpenStatusDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setThemeImage(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDetailImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remainingSlots = 10 - images.length;
        if (remainingSlots <= 0) {
            notify.error("Bạn chỉ được tải lên tối đa 10 ảnh chi tiết!");
            return;
        }

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        filesToProcess.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImages((prev) => [...prev, result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveDetailImage = (indexToRemove: number) => {
        setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const fetchLandlordRooms = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/landlord/rooms`);
            const data = await res.json();
            if (data.success) {
                setRooms(data.data);
            }
        } catch (error) {
            console.error("Lỗi tải danh sách phòng:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.email) {
            fetchLandlordRooms();
        }
    }, [session]);

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentRoomId(null);
        setTitle('');
        setAddress('');
        setPricePerMonth(3000000);
        setDepositAmount(500000);
        setArea(20);
        setCapacity(2);
        setStatus('Trống');
        setThemeImage('');
        setImagePreview('');
        setImages([]);
        setDescription('');
        setAmenitiesInput('');
        setRulesInput('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (room: IRoom) => {
        setIsEditing(true);
        setCurrentRoomId(room._id);
        setTitle(room.title);
        setAddress(room.address);
        setPricePerMonth(room.pricePerMonth);
        setDepositAmount(room.depositAmount);
        setArea(room.area);
        setCapacity(room.capacity);
        setStatus(room.status);
        setThemeImage(room.themeImage);
        setImagePreview(room.themeImage);
        setImages(room.images || []);
        setDescription(room.description || '');
        setAmenitiesInput(room.amenities ? room.amenities.join(', ') : '');
        setRulesInput(room.rules ? room.rules.join(', ') : '');
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const handleSaveRoom = async () => {
        if (!title.trim() || !address.trim() || !themeImage.trim() || !description.trim() || !amenitiesInput.trim() || !rulesInput.trim()) {
            notify.error("Vui lòng điền đầy đủ tất cả các thông tin bắt buộc!");
            return;
        }

        const roomData = {
            title,
            address,
            pricePerMonth,
            depositAmount,
            area,
            capacity,
            status,
            themeImage,
            images,
            description,
            amenities: amenitiesInput.split(',').map(s => s.trim()).filter(Boolean),
            rules: rulesInput.split(',').map(s => s.trim()).filter(Boolean),
            location: {
                type: 'Point',
                coordinates: [105.8342, 21.0278]
            }
        };

        const toastId = notify.loading(isEditing ? "Đang cập nhật phòng..." : "Đang tạo phòng mới...");
        try {
            const url = isEditing ? `/api/landlord/rooms?id=${currentRoomId}` : `/api/landlord/rooms`;
            const method = isEditing ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });

            const data = await res.json();
            if (data.success) {
                notify.success(isEditing ? "Cập nhật phòng thành công!" : "Thêm phòng mới thành công!", toastId);
                setIsModalOpen(false);
                fetchLandlordRooms();
            } else {
                notify.error(data.error || "Có lỗi xảy ra", toastId);
            }
        } catch (error) {
            notify.error("Lỗi kết nối mạng", toastId);
        }
    };

    const confirmDeleteRoom = async () => {
        if (!roomToDelete) return;

        const toastId = notify.loading("Đang xóa phòng...");
        try {
            const res = await fetch(`/api/landlord/rooms?id=${roomToDelete}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                notify.success("Đã xóa phòng trọ", toastId);
                setRoomToDelete(null);
                fetchLandlordRooms();
            } else {
                notify.error(data.error || "Không thể xóa phòng", toastId);
            }
        } catch (error) {
            notify.error("Lỗi kết nối mạng", toastId);
        }
    };

    const totalRooms = rooms.length;
    const emptyRooms = rooms.filter(r => r.status === 'Trống').length;
    const rentedRooms = rooms.filter(r => r.status === 'Đã thuê').length;
    const depositRooms = rooms.filter(r => r.status === 'Đặt cọc').length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Toaster position="top-center" />

            <div className="container mx-auto px-4 py-8 max-w-7xl">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Phòng trọ</h1>
                        <p className="text-gray-500 text-sm mt-1">Quản lý danh sách, trạng thái và thông tin chi tiết các phòng trọ của bạn.</p>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="px-5 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Thêm phòng mới
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Tổng số phòng</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalRooms}</h3>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Home className="w-5 h-5" /></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Phòng trống</p>
                            <h3 className="text-2xl font-bold text-green-600">{emptyRooms}</h3>
                        </div>
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5" /></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Đã cho thuê</p>
                            <h3 className="text-2xl font-bold text-gray-900">{rentedRooms}</h3>
                        </div>
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Home className="w-5 h-5" /></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Đang đặt cọc</p>
                            <h3 className="text-2xl font-bold text-yellow-600">{depositRooms}</h3>
                        </div>
                        <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <div key={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có phòng trọ nào</h3>
                        <p className="text-gray-500 text-sm mb-6">Hãy bấm nút &#34;Thêm phòng mới&#34; ở góc trên để bắt đầu đăng tin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div key={room._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between relative group hover:shadow-md transition-all">

                                {/* Bấm vào ảnh hoặc thông tin sẽ chuyển sang trang chi tiết phòng */}
                                <div className="relative h-48 bg-gray-100">
                                    <Link href={`/rooms/${room._id}`} className="block w-full h-full">
                                        <img src={room.themeImage || '/placeholder.jpg'} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </Link>

                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                            room.status === 'Trống' ? 'bg-green-500 text-white' :
                                                room.status === 'Đã thuê' ? 'bg-gray-800 text-white' : 'bg-yellow-500 text-white'
                                        }`}>
                                            {room.status}
                                        </span>
                                    </div>

                                    {/* Nút Menu 3 chấm được đặt z-index cao hơn để không bị ảnh hưởng bởi Link */}
                                    <div className="absolute top-3 right-3 z-10" ref={menuRef}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === room._id ? null : room._id)}
                                            className="p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {openMenuId === room._id && (
                                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 shadow-xl rounded-xl z-20 py-1 animate-in fade-in zoom-in-95">
                                                <button
                                                    onClick={() => handleOpenEditModal(room)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                                                >
                                                    <Edit3 className="w-4 h-4 text-blue-500" /> Chỉnh sửa
                                                </button>
                                                <button
                                                    onClick={() => { setRoomToDelete(room._id); setOpenMenuId(null); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Xóa phòng
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/rooms/${room._id}`} className="p-5 flex-1 flex flex-col justify-between block hover:bg-gray-50/50 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">{room.title}</h3>
                                        <p className="text-gray-500 text-xs mb-4 line-clamp-1 flex items-center gap-1">📍 {room.address}</p>

                                        <div className="flex justify-between items-center text-sm mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <div>
                                                <span className="text-gray-400 text-xs block">Giá thuê</span>
                                                <span className="font-bold text-primary">{room.pricePerMonth?.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 text-xs block">Tiền cọc</span>
                                                <span className="font-bold text-gray-800">{room.depositAmount?.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 text-xs block">Diện tích</span>
                                                <span className="font-bold text-gray-800">{room.area} m²</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL THÊM / SỬA PHÒNG */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8 animate-in max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Chỉnh sửa phòng trọ' : 'Thêm phòng trọ mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-5 text-sm">

                            {/* 1. UPLOAD ẢNH BÌA (THEME IMAGE) LÊN ĐẦU TIÊN CÓ PREVIEW */}
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Ảnh bìa phòng trọ (Theme Image) <span className="text-red-500">*</span></label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-full sm:w-48 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden flex items-center justify-center relative shrink-0">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2 text-gray-400">
                                                <Upload className="w-8 h-8 mx-auto mb-1 opacity-60" />
                                                <span className="text-xs">Chưa có ảnh</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThemeImageChange}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-400">Hỗ trợ tải lên file ảnh định dạng JPG, PNG hoặc WEBP.</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. UPLOAD THƯ VIỆN ẢNH CHI TIẾT (TỐI ĐA 10 ẢNH) */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block font-medium text-gray-700">Thư viện ảnh chi tiết (Tối đa 10 ảnh) <span className="text-red-500">*</span></label>
                                    <span className="text-xs text-gray-400 font-medium">{images.length}/10 ảnh</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
                                    {images.map((imgUrl, index) => (
                                        <div key={index} className="relative h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={imgUrl} alt={`Detail ${index}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDetailImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                title="Xóa ảnh"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {images.length < 10 && (
                                        <label className="h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors text-gray-400">
                                            <Plus className="w-6 h-6 mb-1" />
                                            <span className="text-[11px] font-medium">Thêm ảnh</span>
                                            <input type="file" accept="image/*" multiple onChange={handleDetailImagesChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">Chọn nhiều ảnh cùng lúc để tải lên thư viện chi tiết cho phòng trọ.</p>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Tiêu đề phòng <span className="text-red-500">*</span></label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Phòng cao cấp đầy đủ nội thất..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="VD: Số 123 Đường Cầu Giấy, Hà Nội" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Giá thuê (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="number" value={pricePerMonth} onChange={(e) => setPricePerMonth(Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Tiền cọc (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Diện tích (m²) <span className="text-red-500">*</span></label>
                                    <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Sức chứa (Số người) <span className="text-red-500">*</span></label>
                                    <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                                </div>

                                <div className="relative" ref={statusDropdownRef}>
                                    <label className="block font-medium text-gray-700 mb-1">Trạng thái phòng <span className="text-red-500">*</span></label>
                                    <div
                                        onClick={() => setIsOpenStatusDropdown(!isOpenStatusDropdown)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium flex items-center justify-between cursor-pointer hover:border-gray-400"
                                    >
                                        <span>{STATUS_OPTIONS.find(s => s.id === status)?.label || 'Chọn trạng thái'}</span>
                                        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpenStatusDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {isOpenStatusDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl z-50 py-1 animate-in">
                                            {STATUS_OPTIONS.map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => {
                                                        setStatus(opt.id as 'Trống' | 'Đã thuê' | 'Đặt cọc');
                                                        setIsOpenStatusDropdown(false);
                                                    }}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                                                        status === opt.id
                                                            ? 'bg-primary/10 text-primary font-bold'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span>{opt.label}</span>
                                                    {status === opt.id && <Check className="w-4 h-4 text-primary" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả về phòng trọ..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary"></textarea>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Tiện ích (Cách nhau bằng dấu phẩy) <span className="text-red-500">*</span></label>
                                    <input type="text" value={amenitiesInput} onChange={(e) => setAmenitiesInput(e.target.value)} placeholder="Điều hòa, Nóng lạnh, Wifi..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Nội quy (Cách nhau bằng dấu phẩy) <span className="text-red-500">*</span></label>
                                    <input type="text" value={rulesInput} onChange={(e) => setRulesInput(e.target.value)} placeholder="Không nuôi thú cưng, Giờ giấc tự do..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>
                            <button onClick={handleSaveRoom} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-sm transition-colors">Lưu phòng</button>
                        </div>

                    </div>
                </div>
            )}

            {roomToDelete && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRoomToDelete(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-in" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa phòng</h3>
                        <p className="text-gray-500 text-sm mb-6">Bạn có chắc chắn muốn xóa vĩnh viễn phòng trọ này không? Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setRoomToDelete(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>
                            <button onClick={confirmDeleteRoom} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-sm transition-colors">Xóa ngay</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}