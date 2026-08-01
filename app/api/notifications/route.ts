import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email }).lean();
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Lấy 20 thông báo mới nhất + POPULATE (Lôi Tên và Avatar người gửi)
        const notificationsRaw = await Notification.find({ userId: user._id })
            .populate('senderId', 'name avatar') // Join với bảng User để lấy name và avatar
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        type RawNotification = Record<string, unknown> & {
            senderId?: {
                _id: { toString: () => string }; // Khai báo an toàn cho Mongoose ObjectId
                name: string;
                avatar: string;
            } | null;
        };

        // Xử lý lại Data để biến `senderId` thành `sender` cho khớp 100% với Frontend
        const notifications = notificationsRaw.map((notif: RawNotification) => ({
            ...notif,
            // Nếu có senderId (nghĩa là có người gửi), thì gói nó vào object `sender`
            sender: notif.senderId ? {
                _id: notif.senderId._id.toString(),
                name: notif.senderId.name,
                avatar: notif.senderId.avatar
            } : null,
            senderId: undefined // Dọn dẹp trường cũ cho gọn dữ liệu
        }));

        const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });

        return NextResponse.json({ success: true, data: notifications, unreadCount });
    } catch (error) {
        console.error("GET Notifications Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email }).lean();

        // FIX BUG: Phải kiểm tra user tồn tại trước khi lấy user._id
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Đánh dấu TẤT CẢ đã đọc
        await Notification.updateMany(
            { userId: user._id, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
        console.error("PATCH Notifications Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // BẢO MẬT: Tìm user để xác thực quyền sở hữu thông báo
        const user = await User.findOne({ email: session.user.email }).lean();
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const { ids } = await req.json();

        // Xóa các thông báo và đảm bảo thông báo đó phải thuộc về user này
        if (Array.isArray(ids) && ids.length > 0) {
            await Notification.deleteMany({
                _id: { $in: ids },
                userId: user._id // Khóa an toàn
            });
        }

        return NextResponse.json({ success: true, message: 'Đã xóa thông báo.' });
    } catch (error) {
        console.error("DELETE Notifications Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}