import { NextResponse } from 'next/server';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Notification from '@/models/Notification';
import { connectToDatabase } from "@/lib/mongoose";
import {pusherServer} from "@/lib/pusher";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import User from "@/models/User"

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        // 1. LẤY SENDER_ID TỪ SESSION (Bảo mật tuyệt đối và khắc phục lỗi thiếu ID)
        const session = await getServerSession(authOptions);
        const senderId = session?.user?.id;

        if (!senderId) {
            return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để gửi tin nhắn' }, { status: 401 });
        }

        const body = await req.json();
        // Không lấy senderId từ body nữa
        const { receiverId, text, imageUrl } = body;

        // Kiểm tra dữ liệu đầu vào
        if (!receiverId) {
            return NextResponse.json({ success: false, error: 'Thiếu thông tin người nhận' }, { status: 400 });
        }

        if (!text && !imageUrl) {
            return NextResponse.json({ success: false, error: 'Tin nhắn không được để trống' }, { status: 400 });
        }

        // 1. Tìm cuộc hội thoại giữa 2 người (dùng $all để tìm mảng chứa cả 2 ID)
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // 2. Nếu chưa từng chat, tạo cuộc hội thoại mới
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // 3. Tạo tin nhắn mới
        const newMessage = await Message.create({
            conversationId: conversation._id,
            senderId,
            text: text || '',
            imageUrl: imageUrl || '',
            isRead: false
        });

        // 4. Cập nhật thời gian tin nhắn cuối cùng để sắp xếp
        await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessageAt: new Date()
        });

        // 5. Tạo thông báo cho người nhận
        const newNotification = await Notification.create({
            userId: receiverId,
            senderId: senderId,
            title: 'Tin nhắn mới',
            content: text ? `Bạn có tin nhắn mới: "${text.substring(0, 20)}..."` : 'Bạn nhận được một hình ảnh mới',
            type: 'MESSAGE',
            link: `/chat/${conversation._id}`
        });

        const senderDetails = await User.findById(senderId).select('name avatar');
        const notificationPayload = {
            ...newNotification.toObject(),
            sender: senderDetails ? {
                _id: senderDetails._id.toString(),
                name: senderDetails.name,
                avatar: senderDetails.avatar
            } : null
        };

        // 6. Bắn Pusher Realtime
        await pusherServer.trigger(
            receiverId.toString(),
            'new-notification',
            notificationPayload
        );
        await pusherServer.trigger(receiverId.toString(), 'new-message', newMessage);

        return NextResponse.json({ success: true, data: newMessage });

    } catch (error: unknown) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        return NextResponse.json({ success: false, error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

// HÀM GET: LẤY LỊCH SỬ TIN NHẮN
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // 1. Xác thực người đang đăng nhập
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        if (!currentUserId) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        // 2. Lấy ID của người cần chat (receiverId) từ URL params
        const { searchParams } = new URL(req.url);
        const receiverId = searchParams.get('receiverId');

        if (!receiverId) {
            return NextResponse.json({ success: false, error: 'Thiếu thông tin người nhận' }, { status: 400 });
        }

        // 3. Tìm xem 2 người này có Conversation nào chưa
        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, receiverId] }
        });

        // Nếu chưa từng chat, trả về mảng rỗng
        if (!conversation) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 4. Lấy toàn bộ tin nhắn thuộc về Conversation này
        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 }) // Sắp xếp 1 (Tăng dần) để tin nhắn cũ nổi lên trên, mới ở dưới cùng
            .lean();

        return NextResponse.json({ success: true, data: messages });

    } catch (error: unknown) {
        console.error('Lỗi khi lấy lịch sử tin nhắn:', error);
        return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
    }
}