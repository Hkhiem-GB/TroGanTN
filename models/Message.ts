import mongoose, { Schema, models, Document } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    text?: string;
    imageUrl?: string;
    isRead: boolean;
    createdAt: Date;
}

const messageSchema = new Schema(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },

        // ID của người gửi tin nhắn (Khách hoặc Chủ trọ)
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        // Nội dung tin nhắn chữ (Có thể rỗng nếu chỉ gửi ảnh)
        text: { type: String, default: '' },

        // Link ảnh (Sẽ lưu URL từ Cloudinary)
        imageUrl: { type: String, default: '' },

        // Đánh dấu người nhận đã đọc hay chưa (hiển thị chấm đỏ)
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const Message = models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default Message;