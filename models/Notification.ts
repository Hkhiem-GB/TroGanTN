// src/models/Notification.ts
import mongoose, { Schema, models } from 'mongoose';

const notificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        type: {
            type: String,
            enum: ['SYSTEM', 'MESSAGE', 'PROMO', 'BOOKING'],
            default: 'SYSTEM'
        },
        link: { type: String } // Đường dẫn để chuyển hướng khi bấm vào thông báo
    },
    { timestamps: true }
);

const Notification = models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;