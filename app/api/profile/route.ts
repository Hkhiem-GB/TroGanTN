// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import Booking from '@/models/Booking';
import Room from '@/models/Room';

// Định nghĩa kiểu dữ liệu cho Booking Populate để thay thế 'any'
interface IPopulatedRoom {
    title?: string;
    address?: string;
    themeImage?: string;
}

interface IBookingDocument {
    _id: string;
    roomId?: IPopulatedRoom;
    bookingStatus: string;
}

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

        // Khởi tạo model Room để Mongoose có thể populate
        await Room.init();

        // Tìm các lịch sử đặt phòng của user này
        const bookings = await Booking.find({ userId: user._id })
            .populate('roomId', 'title address themeImage')
            .sort({ createdAt: -1 })
            .lean();

        // Map lại dữ liệu cho Frontend dễ đọc (Đã xử lý kiểu dữ liệu an toàn)
        const rentedRooms = bookings.map((b: unknown) => {
            const booking = b as IBookingDocument;
            return {
                id: booking._id,
                title: booking.roomId?.title || 'Phòng trọ không xác định',
                address: booking.roomId?.address || 'Chưa cập nhật địa chỉ',
                image: booking.roomId?.themeImage || '/placeholder.jpg',
                status: booking.bookingStatus === 'ACTIVE' ? 'Đang thuê' : (booking.bookingStatus === 'COMPLETED' ? 'Đã trả' : 'Đã hủy'),
            };
        });

        return NextResponse.json({ success: true, data: { user, rentedRooms } });
    } catch (error) {
        console.error("Lỗi get profile:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        // FIX: Đổi từ req.json() thành request.json() khớp với tham số đầu vào
        const body = await request.json();
        const { email, action, phoneNumber, durationMonths, bankId, bankAccountNumber, bankAccountName } = body;

        if (!email) return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });

        await connectToDatabase();

        // Tìm user hiện tại trước để tính toán ngày tháng
        const user = await User.findOne({ email });
        if (!user) return NextResponse.json({ success: false, error: 'User không tồn tại' }, { status: 404 });

        // Xử lý riêng cho hành động cập nhật ngân hàng (save trực tiếp)
        if (action === 'update_bank') {
            if (!user.landlordData) {
                user.landlordData = {};
            }
            user.landlordData.bankId = bankId;
            user.landlordData.bankAccountNumber = bankAccountNumber;
            user.landlordData.bankAccountName = bankAccountName ? bankAccountName.toUpperCase() : '';

            await user.save();
            return NextResponse.json({ success: true, message: 'Cập nhật ngân hàng thành công' });
        }

        let updateData: Record<string, unknown> = {};

        if (action === 'update_phone') {
            updateData = { 'landlordData.phoneNumber': phoneNumber };
        }
        else if (action === 'upgrade_landlord') {
            const monthsToAdd = durationMonths || 1;

            const currentValidUntil = user.landlordData?.subscriptionValidUntil;
            const baseDate = (currentValidUntil && currentValidUntil > new Date())
                ? new Date(currentValidUntil)
                : new Date();

            const newValidUntil = new Date(baseDate.setMonth(baseDate.getMonth() + monthsToAdd));

            updateData = {
                role: user.role === 'ADMIN' ? 'ADMIN' : 'LANDLORD',
                'landlordData.isSubscriptionActive': true,
                'landlordData.subscriptionValidUntil': newValidUntil
            };
        }
        else if (action === 'cancel_landlord') {
            updateData = {
                role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
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