// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import nodemailer from 'nodemailer';

// Cấu hình Transporter cho Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Hàm hỗ trợ gửi email
async function sendEmailNotification(to: string, subject: string, html: string) {
    try {
        await transporter.sendMail({
            from: `"Quản trị viên" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Đã gửi email thông báo tới: ${to}`);
    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as { role?: string })?.role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || 'desc';
        const role = searchParams.get('role') || '';
        const status = searchParams.get('status') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'landlordData.phoneNumber': { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (status === 'ACTIVE') {
            query['landlordData.isSubscriptionActive'] = true;
        } else if (status === 'EXPIRED') {
            query['landlordData.isSubscriptionActive'] = false;
            query['landlordData.subscriptionValidUntil'] = { $ne: null };
        } else if (status === 'NONE') {
            query.role = 'USER';
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sortQuery: any = {};
        if (sort === 'az') sortQuery = { role: 1, name: 1 };
        else if (sort === 'za') sortQuery = { role: 1, name: -1 };
        else sortQuery = { role: 1, createdAt: -1 };

        const skip = (page - 1) * limit;
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .select('-password')
            .lean();

        const formattedUsers = users.map(user => {
            let planStatus = 'NONE';
            if (user.role === 'ADMIN') planStatus = 'ADMIN';
            else if (user.landlordData?.isSubscriptionActive) planStatus = 'ACTIVE';
            else if (user.landlordData?.subscriptionValidUntil) planStatus = 'EXPIRED';

            return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                phone: user.landlordData?.phoneNumber || '',
                role: user.role,
                avatar: user.avatar || '',
                planStatus,
                isLocked: user.isLocked || false, // Thêm trạng thái khóa nếu frontend cần
                registerDate: user.createdAt,
                expireDate: user.landlordData?.subscriptionValidUntil || null
            };
        });

        return NextResponse.json({ success: true, data: formattedUsers, total });
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as { role?: string })?.role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        await connectToDatabase();
        const { userId, action } = await req.json();

        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

        if (user.role === 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Không thể tác động lên Quản trị viên khác.' }, { status: 403 });
        }

        // Xóa tài khoản
        if (action === 'kick') {
            const userEmail = user.email;
            const userName = user.name;

            await User.findByIdAndDelete(userId);

            await sendEmailNotification(
                userEmail,
                'Thông báo: Tài khoản của bạn đã bị xóa',
                `<p>Xin chào ${userName},</p>
                 <p>Tài khoản của bạn trên hệ thống đã bị xóa bởi Quản trị viên.</p>
                 <p>Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ.</p>`
            );

            return NextResponse.json({ success: true, message: 'Đã xóa tài khoản thành công.' });
        }

        // Khóa tài khoản
        if (action === 'lock') {
            // Lưu ý: Đảm bảo model User của bạn có trường isLocked: { type: Boolean, default: false }
            await User.findByIdAndUpdate(userId, { isLocked: true });

            await sendEmailNotification(
                user.email,
                'Thông báo: Tài khoản của bạn đã bị khóa',
                `<p>Xin chào ${user.name},</p>
                 <p>Tài khoản của bạn trên hệ thống đã bị tạm khóa bởi Quản trị viên do vi phạm điều khoản hoặc có dấu hiệu bất thường.</p>
                 <p>Bạn sẽ không thể đăng nhập trong thời gian này. Vui lòng liên hệ với bộ phận hỗ trợ để biết thêm chi tiết và giải quyết.</p>`
            );

            return NextResponse.json({ success: true, message: 'Đã khóa tài khoản thành công.' });
        }

        // Mở khóa tài khoản
        if (action === 'unlock') {
            await User.findByIdAndUpdate(userId, { isLocked: false });

            await sendEmailNotification(
                user.email,
                'Thông báo: Tài khoản của bạn đã được mở khóa',
                `<p>Xin chào ${user.name},</p>
                 <p>Tài khoản của bạn đã được Quản trị viên mở khóa. Hiện tại bạn có thể đăng nhập và sử dụng dịch vụ bình thường.</p>
                 <p>Cảm ơn bạn đã đồng hành cùng chúng tôi.</p>`
            );
            return NextResponse.json({ success: true, message: 'Đã mở khóa tài khoản thành công.' });
        }

        // Gỡ gói chủ trọ
        if (action === 'remove_plan') {
            if (user.role !== 'LANDLORD') {
                return NextResponse.json({ success: false, message: 'Tài khoản này không phải là Chủ trọ.' }, { status: 400 });
            }

            await User.findByIdAndUpdate(userId, {
                role: 'USER',
                'landlordData.isSubscriptionActive': false,
                'landlordData.subscriptionValidUntil': null
            });

            await sendEmailNotification(
                user.email,
                'Thông báo: Hủy gói Chủ trọ',
                `<p>Xin chào ${user.name},</p>
                 <p>Gói Chủ trọ của bạn đã bị hủy bởi Quản trị viên.</p>
                 <p>Tài khoản của bạn đã được chuyển về trạng thái Người dùng thường. Bạn sẽ không thể tiếp tục đăng hoặc quản lý các bài đăng phòng trọ.</p>`
            );

            return NextResponse.json({ success: true, message: 'Đã xóa gói Chủ trọ thành công.' });
        }

        return NextResponse.json({ success: false, message: 'Hành động không hợp lệ.' }, { status: 400 });
    } catch (error) {
        console.error("PATCH USER ERROR:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}