import mongoose, { Schema, models, Document } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema(
    {
        // Mảng chứa ID của những người trong cuộc hội thoại (User & Chủ trọ)
        participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],

        // Dùng để sắp xếp danh sách chat (ai vừa nhắn thì nhảy lên đầu)
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Conversation = models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;