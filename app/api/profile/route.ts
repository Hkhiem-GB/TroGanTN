// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import Booking from '@/models/Booking';
import Room from '@/models/Room';

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

export async function GET(request: Request) {
    try {
        // 1. BẢO MẬT: Kiểm tra đăng nhập
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        // 2. BẢO MẬT: Chỉ cho phép tự xem profile của mình, trừ khi là Admin
        const userRole = (session.user as { role?: string })?.role;
        if (session.user.email !== email && userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền truy cập' }, { status: 403 });
        }

        if (!email) return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });

        await connectToDatabase();

        const user = await User.findOne({ email }).lean();
        if (!user) return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });

        await Room.init();

        const bookings = await Booking.find({ userId: user._id })
            .populate('roomId', 'title address themeImage')
            .sort({ createdAt: -1 })
            .lean();

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
        // 1. BẢO MẬT: Kiểm tra đăng nhập
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, action, phoneNumber, durationMonths, bankId, bankAccountNumber, bankAccountName } = body;

        // 2. BẢO MẬT: Chỉ cho sửa tài khoản của chính mình (trừ Admin)
        const userRole = (session.user as { role?: string })?.role;
        if (session.user.email !== email && userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền thao tác' }, { status: 403 });
        }

        // 3. BẢO MẬT NGHIÊM NGẶT: Chặn User tự gửi request nâng cấp gói
        if ((action === 'upgrade_landlord' || action === 'cancel_landlord') && userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Chỉ Admin mới có quyền thao tác thủ công gói Chủ trọ' }, { status: 403 });
        }

        if (!email) return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });

        await connectToDatabase();

        const user = await User.findOne({ email });
        if (!user) return NextResponse.json({ success: false, error: 'User không tồn tại' }, { status: 404 });

        if (action === 'update_bank') {
            if (!user.landlordData) user.landlordData = {};
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