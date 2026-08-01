"use client";

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, MessageSquare, ArrowRight, ShieldCheck, Search } from 'lucide-react';

const FAQS = [
    {
        id: 1,
        question: 'TroGanTN hoạt động như thế nào?',
        answer: 'TroGanTN là nền tảng kết nối trực tiếp giữa người có phòng cho thuê và người đi thuê. Người dùng có thể tìm kiếm phòng trọ quanh khu vực, xem trên bản đồ Radar và liên hệ trực tiếp với Chủ trọ mà không qua trung gian.'
    },
    {
        id: 2,
        question: 'Làm sao để liên lạc với Chủ trọ?',
        answer: 'Khi bạn bấm vào chi tiết một phòng trọ, sẽ có thông tin Số điện thoại và nút "Liên hệ Chủ trọ". Bạn có thể gọi điện trực tiếp hoặc nhắn tin (tùy thuộc vào thông tin Chủ trọ cung cấp).'
    },
    {
        id: 3,
        question: 'Thanh toán gói Đối tác Chủ trọ như thế nào?',
        answer: 'Chủ trọ có thể nâng cấp gói dịch vụ ngay trong mục "Quản lý tài khoản". Hệ thống hỗ trợ thanh toán bằng mã QR tự động 24/7 (hỗ trợ mọi ngân hàng và ví điện tử). Sau khi chuyển khoản thành công, tài khoản sẽ được nâng cấp ngay lập tức.'
    },
    {
        id: 4,
        question: 'Tôi có phải trả phí khi tìm trọ không?',
        answer: 'Không! Nền tảng hoàn toàn miễn phí 100% đối với người đi tìm trọ (Sinh viên, người đi làm). Chỉ những Chủ trọ muốn đăng nhiều bài và sử dụng các tính năng quản lý cao cấp mới cần đăng ký gói dịch vụ.'
    },
    {
        id: 5,
        question: 'Làm sao để báo cáo phòng trọ lừa đảo?',
        answer: 'Nếu bạn phát hiện thông tin phòng trọ sai sự thật hoặc có dấu hiệu lừa đảo, vui lòng bấm vào nút "Báo cáo" ngay tại tin đăng đó, hoặc sử dụng tính năng "Gửi báo cáo cho Admin" ở phía dưới trang này.'
    }
];

export default function SupportPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [search, setSearch] = useState('');

    const filteredFaqs = FAQS.filter(faq =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary rounded-full mb-6">
                        <HelpCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trung tâm hỗ trợ <span className="text-primary">TroGanTN</span></h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Khám phá các hướng dẫn, câu hỏi thường gặp và tìm hiểu cách hệ thống hoạt động để có trải nghiệm tìm trọ tốt nhất.
                    </p>
                </div>

                {/* Search Box */}
                <div className="relative max-w-xl mx-auto mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-700 bg-white"
                    />
                </div>

                {/* FAQ Accordion */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Câu hỏi thường gặp
                    </h2>

                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Không tìm thấy câu hỏi nào phù hợp.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredFaqs.map((faq, index) => (
                                <div key={faq.id} className={`border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200 ${openIndex === index ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white hover:bg-gray-50'}`}>
                                    <button
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-gray-900"
                                    >
                                        <span>{faq.question}</span>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 shrink-0 ${openIndex === index ? 'rotate-180 text-primary' : ''}`} />
                                    </button>
                                    <div className={`px-6 overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="text-gray-600 text-sm leading-relaxed border-t border-gray-200/50 pt-4">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Điều hướng sang trang Báo cáo */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-100 shadow-sm">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Vẫn chưa giải quyết được vấn đề?</h3>
                        <p className="text-gray-600 text-sm">Hãy gửi báo cáo chi tiết cho Admin, chúng tôi sẽ hỗ trợ bạn sớm nhất có thể.</p>
                    </div>
                    <Link
                        href="/report"
                        className="w-full md:w-auto px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm inline-flex items-center justify-center gap-2 shrink-0"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Gửi Báo Cáo
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

            </div>
        </div>
    );
}