// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import Booking from '@/models/Booking';
import Room from '@/models/Room';

// Lấy thông tin User và Lịch sử thuê trọ
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });

        await connectToDatabase();

        // Tìm user trong Database
        const user = await User.findOne({ email }).lean();
        if (!user) return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });

        // Khởi tạo model Room để Mongoose có thể populate (đề phòng lỗi schema chưa load)
        await Room.init();

        // Tìm các lịch sử đặt phòng của user này
        const bookings = await Booking.find({ userId: user._id })
            .populate('roomId', 'title address themeImage')
            .sort({ createdAt: -1 })
            .lean();

        // Map lại dữ liệu cho Frontend dễ đọc
        const rentedRooms = bookings.map((b: any) => ({
            id: b._id,
            title: b.roomId?.title || 'Phòng trọ không xác định',
            address: b.roomId?.address || 'Chưa cập nhật địa chỉ',
            image: b.roomId?.themeImage || '/placeholder.jpg',
            status: b.bookingStatus === 'ACTIVE' ? 'Đang thuê' : (b.bookingStatus === 'COMPLETED' ? 'Đã trả' : 'Đã hủy'),
        }));

        return NextResponse.json({ success: true, data: { user, rentedRooms } });
    } catch (error) {
        console.error("Lỗi get profile:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { email, phoneNumber, action, durationMonths } = body; // Thêm durationMonths

        if (!email) return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });

        await connectToDatabase();

        // Tìm user hiện tại trước để tính toán ngày tháng
        const user = await User.findOne({ email });
        if (!user) return NextResponse.json({ success: false, error: 'User không tồn tại' }, { status: 404 });

        let updateData: any = {};

        if (action === 'update_phone') {
            updateData = { 'landlordData.phoneNumber': phoneNumber };
        }
        else if (action === 'upgrade_landlord') {
            const monthsToAdd = durationMonths || 1; // Mặc định là 1 tháng nếu không có

            // Kiểm tra xem gói cũ còn hạn không. Nếu còn thì cộng dồn, nếu hết thì tính từ hôm nay
            const currentValidUntil = user.landlordData?.subscriptionValidUntil;
            const baseDate = (currentValidUntil && currentValidUntil > new Date())
                ? new Date(currentValidUntil)
                : new Date();

            const newValidUntil = new Date(baseDate.setMonth(baseDate.getMonth() + monthsToAdd));

            updateData = {
                role: 'LANDLORD',
                'landlordData.isSubscriptionActive': true,
                'landlordData.subscriptionValidUntil': newValidUntil
            };
        }
        else if (action === 'cancel_landlord') {
            updateData = {
                role: 'USER',
                'landlordData.isSubscriptionActive': false,
                'landlordData.subscriptionValidUntil': null
            };
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: updateData },
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error("Lỗi update profile:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
    }
}