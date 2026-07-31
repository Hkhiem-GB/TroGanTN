import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Room from '@/models/Room'; // Đảm bảo đường dẫn này đúng với project của bạn

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');

        if (!latParam || !lngParam) {
            return NextResponse.json({ success: false, error: 'Thiếu thông tin tọa độ' }, { status: 400 });
        }

        const lat = parseFloat(latParam);
        const lng = parseFloat(lngParam);

        await connectToDatabase();

        // Đảm bảo model Room đã được load
        await Room.init();

        // Sử dụng Aggregation với $geoNear để tính khoảng cách
        const rooms = await Room.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        // LƯU Ý QUAN TRỌNG: MongoDB luôn nhận mảng [Kinh độ (lng), Vĩ độ (lat)]
                        coordinates: [lng, lat]
                    },
                    distanceField: 'calculatedDistance', // Tên trường chứa kết quả khoảng cách
                    maxDistance: 2000, // Quét trong bán kính 2000 mét = 2km
                    spherical: true,
                    query: { status: 'AVAILABLE' } // Chỉ hiển thị những phòng đang còn trống
                }
            },
            {
                $limit: 15 // Tối đa 15 phòng để tránh nặng UI
            }
        ]);

        // Map lại dữ liệu khớp với giao diện của thẻ FloatingRadar
        const formattedRooms = rooms.map(room => ({
            ...room,
            // Đổi từ mét sang km và làm tròn 1 chữ số thập phân (VD: 1.2)
            distance: (room.calculatedDistance / 1000).toFixed(1)
        }));

        return NextResponse.json({ success: true, data: formattedRooms });

    } catch (error) {
        console.error('Lỗi API Radar:', error);
        return NextResponse.json({ success: false, error: 'Lỗi server khi xử lý radar' }, { status: 500 });
    }
}