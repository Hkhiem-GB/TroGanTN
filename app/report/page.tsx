"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Send, ArrowLeft, MessageSquareWarning, User, Mail, FileText, AlignLeft, ImagePlus, X } from 'lucide-react';
import { notify } from '@/utils/toast';
import { Toaster } from 'react-hot-toast';

export default function ReportPage() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        senderName: '',
        senderEmail: '',
        subject: '',
        content: ''
    });

    // State lưu mảng hình ảnh đính kèm (dạng Base64)
    const [images, setImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tự động điền Tên và Email nếu đã đăng nhập
    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                senderName: session.user?.name || '',
                senderEmail: session.user?.email || ''
            }));
        }
    }, [session]);

    // Xử lý chọn ảnh và mã hóa sang Base64
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Giới hạn tối đa 3 ảnh đính kèm
        if (images.length + files.length > 3) {
            notify.error('Bạn chỉ được đính kèm tối đa 3 ảnh.');
            return;
        }

        Array.from(files).forEach(file => {
            // Kiểm tra dung lượng (giới hạn 3MB mỗi ảnh để tránh nặng DB)
            if (file.size > 3 * 1024 * 1024) {
                notify.error(`Ảnh ${file.name} vượt quá dung lượng 3MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImages(prev => [...prev, event.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset input để có thể chọn lại cùng 1 file nếu vừa xóa
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Xóa ảnh khỏi danh sách đính kèm
    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.senderName || !formData.senderEmail || !formData.subject || !formData.content) {
            notify.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        setIsLoading(true);
        const toastId = notify.loading("Đang gửi báo cáo...");

        try {
            const payload = { ...formData, images };

            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // Gửi kèm mảng ảnh
            });

            const data = await res.json();

            if (data.success) {
                notify.success(data.message, toastId);
                // Reset form (giữ lại Tên và Email)
                setFormData(prev => ({ ...prev, subject: '', content: '' }));
                setImages([]); // Reset danh sách ảnh
            } else {
                notify.error(data.message || 'Có lỗi xảy ra', toastId);
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng, vui lòng thử lại!', toastId);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <Toaster position="top-center" />

            <div className="container mx-auto px-4 max-w-3xl">

                <Link href="/support" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium mb-8 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <ArrowLeft className="w-4 h-4" /> Quay lại Trung tâm hỗ trợ
                </Link>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">

                    {/* Header Banner */}
                    <div className="bg-primary/5 p-8 border-b border-primary/10 text-center relative overflow-hidden">
                        <MessageSquareWarning className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Gửi báo cáo / Hỗ trợ</h1>
                        <p className="text-gray-600 text-sm max-w-lg mx-auto">
                            Mọi thắc mắc, góp ý hoặc báo cáo vi phạm sẽ được đội ngũ Quản trị viên tiếp nhận và xử lý trong thời gian sớm nhất (thường là dưới 24h).
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.senderName}
                                        onChange={e => setFormData({...formData, senderName: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium"
                                        placeholder="Nhập tên của bạn"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email liên hệ <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.senderEmail}
                                        onChange={e => setFormData({...formData, senderEmail: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium"
                                        placeholder="Địa chỉ Email"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={e => setFormData({...formData, subject: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium"
                                    placeholder="Ví dụ: Báo cáo tin đăng sai sự thật / Lỗi nâng cấp tài khoản"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nội dung chi tiết <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium min-h-[160px] resize-y"
                                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Khu vực đính kèm ảnh */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Đính kèm hình ảnh (Tối đa 3 ảnh)</label>

                            {/* Khung hiển thị ảnh đã chọn */}
                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {images.map((imgSrc, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
                                            <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                                            {/* Nút xóa ảnh */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            >
                                                <X className="w-3 h-3 font-bold" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Nút tải ảnh lên */}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={images.length >= 3}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ImagePlus className="w-5 h-5" />
                                Thêm hình ảnh đính kèm
                            </button>
                            <p className="text-xs text-gray-400 mt-2">Định dạng JPG, PNG. Tối đa 3MB/ảnh.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full md:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Gửi Báo Cáo
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}