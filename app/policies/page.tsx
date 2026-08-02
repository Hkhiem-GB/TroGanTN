import { ShieldCheck, Scale, AlertOctagon } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Chính sách & Điều khoản nền tảng',
};

export default function PoliciesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">

                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Chính Sách & Điều Khoản</h1>
                    <p className="text-gray-500 text-lg">Cập nhật lần cuối: Tháng 8/2026</p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Phần 1: Khách hàng */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">1. Chính sách bảo vệ Khách hàng (Người thuê)</h2>
                        </div>

                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p><b>1.1. Chính sách Hủy & Hoàn cọc:</b> Khách hàng được hoàn lại 100% tiền đặt cọc trong các trường hợp sau:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Hủy đặt phòng trong vòng <b>24 giờ</b> kể từ thời điểm chuyển khoản thành công.</li>
                                <li>Đến xem phòng thực tế nhưng phát hiện phòng không đúng với hình ảnh, mô tả, hoặc giá cả trên hệ thống.</li>
                            </ul>

                            <p className="mt-6"><b>1.2. Mất tiền cọc:</b> Khách hàng sẽ không được hoàn cọc nếu tự ý hủy phòng sau 24 giờ mà không có lý do chính đáng, hoặc không đến nhận phòng theo lịch đã hẹn với Chủ trọ.</p>

                            <p className="mt-6"><b>1.3. Quy trình khiếu nại (Chống lừa đảo):</b> Nếu Chủ trọ từ chối hoàn cọc sai quy định, khách hàng vui lòng sử dụng tính năng <b>"Báo cáo"</b> trên hệ thống. Khách hàng cần cung cấp: Biên lai chuyển khoản và Lịch sử nhắn tin trên hệ thống. Ban quản trị sẽ can thiệp xử lý trong vòng 48 giờ.</p>
                        </div>
                    </div>

                    {/* Phần 2: Chủ trọ */}
                    <div className="p-8 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                <Scale className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">2. Chính sách dành cho Chủ trọ</h2>
                        </div>

                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p><b>2.1. Quyền lợi:</b> Chủ trọ có toàn quyền giữ lại tiền đặt cọc nếu Khách hàng vi phạm chính sách hủy phòng nhằm bù đắp chi phí cơ hội. Hệ thống cam kết bảo vệ Chủ trọ khỏi các đánh giá ác ý, bôi nhọ sai sự thật.</p>

                            <p className="mt-6"><b>2.2. Trách nhiệm trung thực:</b> Mọi hình ảnh, giá thuê, tiền cọc và chi phí phát sinh (điện, nước, dịch vụ) phải được niêm yết chính xác 100%. Chủ trọ có nghĩa vụ hoàn cọc cho khách theo đúng quy định tại Mục 1.1.</p>

                            <p className="mt-6"><b>2.3. Chế tài xử lý vi phạm:</b></p>
                            <ul className="list-disc list-inside space-y-2 ml-4 text-red-600/90 font-medium">
                                <li>Nếu phát hiện hành vi cố tình đăng tin giả mạo hoặc chiếm đoạt tiền cọc của sinh viên, Chủ trọ sẽ bị cảnh cáo và tài khoản sẽ bị tạm khóa. Nếu vi phạm nhiều lần sẽ bị <b>Khóa vĩnh viễn</b>.</li>
                                <li>Mọi gói dịch vụ đã mua sẽ bị đóng băng và không được hoàn trả.</li>
                                <li>Hệ thống sẽ cung cấp toàn bộ dữ liệu (IP, Lịch sử chat, SĐT) cho Cơ quan chức năng nếu có yêu cầu điều tra.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Phần 3: Miễn trừ trách nhiệm */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                <AlertOctagon className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">3. Miễn trừ trách nhiệm</h2>
                        </div>

                        <div className="space-y-4 text-gray-600 leading-relaxed bg-orange-50/50 p-6 rounded-2xl border border-orange-100 text-sm">
                            <p>Hệ thống hoạt động với tư cách là nền tảng công nghệ kết nối nhu cầu thuê và cho thuê. <b>Mọi giao dịch tài chính (bao gồm tiền cọc, tiền thuê nhà) là giao dịch dân sự trực tiếp giữa Khách hàng và Chủ trọ.</b></p>
                            <p>Nền tảng <b>không giữ tiền cọc</b> và <b>không chịu trách nhiệm bồi thường tài chính</b> cho bất kỳ thất thoát nào phát sinh từ các bên tham gia.</p>
                            <p>Tuy nhiên, chúng tôi cam kết liên tục nâng cấp hệ thống kỹ thuật, áp dụng nghiêm ngặt các biện pháp định danh và trừng phạt vi phạm để duy trì một môi trường thuê trọ minh bạch, sạch sẽ và an toàn nhất.</p>
                        </div>
                    </div>

                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-primary font-bold hover:underline">
                        ← Quay lại trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}