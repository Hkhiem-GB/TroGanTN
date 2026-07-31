// src/app/api/rooms/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Room from '@/models/Room';

// API GET: Lấy danh sách phòng trọ
export async function GET(request: Request) {
    try {
        await connectToDatabase();

        // Lấy url để hỗ trợ query param (ví dụ: ?limit=10)
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Lấy danh sách phòng mới nhất, giới hạn số lượng
        const rooms = await Room.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('landlordId', 'name avatar') // mở dòng này khi có data User
            .lean(); // .lean() giúp convert Document Mongoose thành plain object cho Next.js

        return NextResponse.json({ success: true, data: rooms });
    } catch (error) {
        console.error("Lỗi lấy danh sách phòng:", error);
        return NextResponse.json({ success: false, error: 'Lỗi Server' }, { status: 500 });
    }
}

// API POST: Tạo phòng trọ mới (Dùng để bơm data thật vào DB)
export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const newRoom = await Room.create(body);

        return NextResponse.json({ success: true, data: newRoom }, { status: 201 });
    } catch (error) {
        console.error("Lỗi tạo phòng:", error);
        return NextResponse.json({ success: false, error: 'Không thể tạo phòng trọ' }, { status: 500 });
    }
}