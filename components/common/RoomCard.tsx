import Image from 'next/image';
import { Star, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

// Định nghĩa kiểu dữ liệu tạm thời (Mock data)
interface RoomProps {
    _id: string;
    title: string;
    themeImage: string;
    rating: number;
    reviewCount: number;
    address: string;
    capacity: number;
    status: 'AVAILABLE' | 'BOOKED';
    price: number;
}

export default function RoomCard({ room }: { room: RoomProps }) {
    return (
        <Link href={`/room/${room._id}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
            {/* Khung ảnh Thumbnail 16:9 */}
            <div className="relative aspect-video bg-gray-200 overflow-hidden">
                {/* Sử dụng next/image thật với thuộc tính fill */}
                <Image
                    src={room.themeImage || '/placeholder.jpg'} // Fallback nếu không có ảnh
                    alt={room.title}
                    fill // Lấp đầy thẻ div cha (aspect-video)
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Tag trạng thái */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${room.status === 'AVAILABLE' ? 'bg-primary' : 'bg-red-500'}`}>
                    {room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đặt'}
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
                    <span className="font-medium text-gray-900">{room.rating}</span>
                    <span>({room.reviewCount} đánh giá)</span>
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

                {/* Giá tiền */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-primary font-bold text-xl">
                        {room.price.toLocaleString('vi-VN')}đ <span className="text-sm text-gray-500 font-normal">/tháng</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}