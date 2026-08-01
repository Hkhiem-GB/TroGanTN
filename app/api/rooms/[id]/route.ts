// src/app/api/rooms/[id]/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Room from '@/models/Room';
import User from '@/models/User'; // Import model User để TypeScript hiểu lệnh populate

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// API GET: Lấy chi tiết một phòng trọ dựa vào ID
export async function GET(request: Request, context: RouteContext) {
    try {
        await connectToDatabase();

        // Đảm bảo model User đã được đăng ký để populate hoạt động chính xác
        User.init();

        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Thiếu ID phòng trọ' }, { status: 400 });
        }

        // Tìm phòng theo ID và populate thêm thông tin landlordId (bao gồm cả landlordData chứa ngân hàng)
        const room = await Room.findById(id)
            .populate('landlordId', 'name email avatar landlordData')
            .lean();

        if (!room) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy phòng trọ' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: room });
    } catch (error) {
        console.error("Lỗi lấy chi tiết phòng:", error);
        return NextResponse.json({ success: false, error: 'Lỗi Server' }, { status: 500 });
    }
}