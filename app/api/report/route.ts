// app/api/report/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Report from '@/models/Report';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        // Lấy dữ liệu từ Form gửi lên
        const { senderName, senderEmail, subject, content, images } = await req.json();

        if (!senderName || !senderEmail || !subject || !content) {
            return NextResponse.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' }, { status: 400 });
        }

        // Kiểm tra xem người dùng có đang đăng nhập không để lưu userId
        const session = await getServerSession(authOptions);
        let userId = null;

        if (session?.user?.email) {
            const dbUser = await User.findOne({ email: session.user.email }).lean();
            if (dbUser) {
                userId = dbUser._id;
            }
        }

        // Lưu vào Database
        const newReport = await Report.create({
            senderName,
            senderEmail,
            subject,
            content,
            images: images || [],
            userId
        });

        return NextResponse.json({
            success: true,
            message: 'Đã gửi yêu cầu hỗ trợ thành công. Chúng tôi sẽ phản hồi sớm nhất!'
        });

    } catch (error) {
        console.error("SUPPORT POST ERROR:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if ((session?.user as { role?: string })?.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        await connectToDatabase();
        // Lấy danh sách báo cáo, sắp xếp mới nhất lên đầu
        const reports = await Report.find().sort({ createdAt: -1 }).lean();

        return NextResponse.json({ success: true, data: reports });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if ((session?.user as { role?: string })?.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        await connectToDatabase();
        const body = await req.json();
        const { reportId, action, replyContent } = body;

        // 1. Hành động: Đánh dấu đã đọc
        if (action === 'mark_read') {
            await Report.findByIdAndUpdate(reportId, { isRead: true });
            return NextResponse.json({ success: true });
        }

        // 2. Hành động: Gửi phản hồi (Tự động bắn thông báo về cho User)
        if (action === 'reply') {
            if (!reportId || !replyContent) {
                return NextResponse.json({ success: false, message: 'Vui lòng nhập nội dung phản hồi.' }, { status: 400 });
            }

            const report = await Report.findById(reportId);
            if (!report) {
                return NextResponse.json({ success: false, message: 'Không tìm thấy báo cáo.' }, { status: 404 });
            }

            // Tìm userId của người gửi (nếu báo cáo chưa có userId thì tìm theo Email)
            let targetUserId = report.userId;
            if (!targetUserId) {
                const targetUser = await User.findOne({ email: report.senderEmail }).lean();
                if (targetUser) targetUserId = targetUser._id;
            }

            // Tạo thông báo mới cho người dùng
            if (targetUserId) {
                await Notification.create({
                    userId: targetUserId,
                    title: `Phản hồi từ Ban quản trị: ${report.subject}`,
                    content: replyContent,
                    type: 'SYSTEM',
                    link: '/support'
                });
            }

            // LƯU LỊCH SỬ VÀO DATABASE
            if (!report.replies) {
                report.replies = [];
            }
            report.replies.push({ content: replyContent });

            // Đánh dấu báo cáo đã xem
            report.isRead = true;
            await report.save();

            return NextResponse.json({
                success: true,
                reply: { content: replyContent, createdAt: new Date().toISOString() },
                message: targetUserId
                    ? 'Đã gửi phản hồi và gửi thông báo thành công tới người dùng!'
                    : 'Đã ghi nhận phản hồi (Người dùng không có tài khoản trên hệ thống).'
            });
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error("REPORT PATCH ERROR:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if ((session?.user as { role?: string })?.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (action === 'delete_all') {
            await Report.deleteMany({});
            return NextResponse.json({ success: true, message: 'Đã xóa tất cả báo cáo.' });
        }

        if (id) {
            await Report.findByIdAndDelete(id);
            return NextResponse.json({ success: true, message: 'Đã xóa báo cáo.' });
        }

        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}