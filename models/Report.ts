// /models/Report.ts
import mongoose, { Schema, models } from 'mongoose';

const reportSchema = new Schema(
    {
        senderName: { type: String, required: true },
        senderEmail: { type: String, required: true },
        subject: { type: String, required: true },
        content: { type: String, required: true },
        images: [{ type: String }],
        isRead: { type: Boolean, default: false }, // Trạng thái chưa xem (in đậm) / đã xem (in nhạt)
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
            replies: [{
                    content: { type: String, required: true },
                    createdAt: { type: Date, default: Date.now }
            }]
    },
    { timestamps: true }
);

const Report = models.Report || mongoose.model('Report', reportSchema);

export default Report;