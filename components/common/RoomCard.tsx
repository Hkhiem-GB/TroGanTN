import Image from 'next/image';
import { Star, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

// Định nghĩa kiểu dữ liệu
export interface RoomProps {
    _id: string;
    landlordId?: string;
    title: string;
    themeImage: string;
    galleryImages?: string[];
    images?: string[];

    pricePerMonth: number;
    depositAmount: number;
    capacity: number;
    area: number;

    address: string;
    location?: {
        type: 'Point';
        coordinates: number[]; // [Kinh độ, Vĩ độ]
    };

    amenities?: string[];
    rules?: string[];

    rating: number;
    reviewCount: number;
    status: 'Trống' | 'Đã thuê' | 'Đặt cọc'; // Khớp chuẩn enum Backend

    createdAt?: string;
    updatedAt?: string;
}

export default function RoomCard({ room }: { room: RoomProps }) {
    // Hàm phụ trợ chọn màu sắc nhãn trạng thái phòng
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Trống':
                return { text: 'Còn trống', className: 'bg-green-500 text-white' };
            case 'Đặt cọc':
                return { text: 'Đang đặt cọc', className: 'bg-yellow-500 text-white' };
            case 'Đã thuê':
                return { text: 'Đã cho thuê', className: 'bg-gray-800 text-white' };
            default:
                return { text: status, className: 'bg-gray-500 text-white' };
        }
    };

    const badge = getStatusBadge(room.status);

    return (
        <Link href={`/rooms/${room._id}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
            {/* Khung ảnh Thumbnail 16:9 */}
            <div className="relative aspect-video bg-gray-200 overflow-hidden">
                <Image
                    src={room.themeImage || '/placeholder.jpg'}
                    alt={room.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Tag trạng thái động theo Backend */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${badge.className}`}>
                    {badge.text}
                </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                    {room.title}
                </h3>

                {/* Đánh giá */}
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-gray-900">{room.rating || 0}</span>
                    <span>({room.reviewCount || 0} đánh giá)</span>
                </div>

                {/* Địa chỉ & Số người */}
                <div className="flex flex-col gap-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{room.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>Tối đa {room.capacity} người</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-primary font-bold text-xl">
                        {(room.pricePerMonth || 0).toLocaleString('vi-VN')}đ <span className="text-sm text-gray-500 font-normal">/tháng</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}