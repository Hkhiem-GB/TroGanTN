// src/app/page.tsx
import HeroBanner from '@/components/home/HeroBanner';
import RoomCard from '@/components/common/RoomCard';

// Hàm gọi API lấy dữ liệu (Chạy trên Server)
async function getRooms() {
    try {
        // Lưu ý: Đổi URL này theo domain thực tế khi deploy (VD: https://trogan.vn/api/rooms)
        const res = await fetch('http://localhost:3000/api/rooms', {
            cache: 'no-store' // Không cache để luôn lấy data mới nhất khi phòng bị đặt
        });

        if (!res.ok) throw new Error('Failed to fetch data');

        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function Home() {
    // Lấy dữ liệu thật từ Database
    const rooms = await getRooms();

    return (
        <>
            <HeroBanner />

            <div className="container mx-auto px-4 py-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        🔥 Phòng trọ nổi bật
                    </h2>
                    <button className="text-primary font-medium hover:underline">
                        Xem tất cả
                    </button>
                </div>

                {/* Kiểm tra nếu DB trống thì hiển thị thông báo, nếu có thì render Card */}
                {rooms.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-2xl">
                        Hiện tại chưa có phòng trọ nào trên hệ thống.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {rooms.map((room: any) => (
                            <RoomCard key={room._id} room={room} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}