import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Room from '@/models/Room';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// API GET: Lấy danh sách phòng của chủ trọ đang đăng nhập (hoặc tất cả nếu là ADMIN)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });
        }

        // Nếu là ADMIN thì lấy tất cả, nếu là LANDLORD thì chỉ lấy phòng do chính user đó đăng
        const filter = user.role === 'ADMIN' ? {} : { landlordId: user._id };
        const rooms = await Room.find(filter).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ success: true, data: rooms });
    } catch (error) {
        console.error("Lỗi lấy danh sách phòng của chủ trọ:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
    }
}

// API POST: Thêm phòng mới
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });
        }

        const body = await request.json();

        // Tạo phòng mới và gắn landlordId bằng _id của chủ trọ hiện tại
        const newRoom = await Room.create({
            ...body,
            landlordId: user._id
        });

        return NextResponse.json({ success: true, data: newRoom }, { status: 201 });
    } catch (error: any) {
        console.error("Lỗi chi tiết khi tạo phòng:", error);
        return NextResponse.json({ success: false, error: error.message || 'Không thể tạo phòng trọ' }, { status: 500 });
    }
}

// API PATCH: Cập nhật phòng
export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Thiếu ID phòng' }, { status: 400 });

        const body = await request.json();
        await connectToDatabase();

        const updatedRoom = await Room.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
        if (!updatedRoom) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy phòng để cập nhật' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedRoom });
    } catch (error) {
        console.error("Lỗi cập nhật phòng:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
    }
}

// API DELETE: Xóa phòng
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Thiếu ID phòng' }, { status: 400 });

        await connectToDatabase();
        const deletedRoom = await Room.findByIdAndDelete(id);
        if (!deletedRoom) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy phòng để xóa' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Đã xóa phòng thành công' });
    } catch (error) {
        console.error("Lỗi xóa phòng:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
    }
}