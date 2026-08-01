// src/models/User.ts
import mongoose, { Schema, models } from 'mongoose';
import { UserRole } from '@/types'; // Import enum từ file types/index.ts

const userSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        avatar: { type: String },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER
        },
        landlordData: {
            phoneNumber: { type: String },
            isSubscriptionActive: { type: Boolean, default: false },
            subscriptionValidUntil: { type: Date },
            qrCodePaymentUrl: { type: String },
            bankId: { type: String }, // Mã ngân hàng (VD: MB, VCB, TCB...)
            bankAccountNumber: { type: String }, // Số tài khoản
            bankAccountName: { type: String }, // Tên chủ tài khoản
        }
    },
    { timestamps: true }
);

// Tránh lỗi biên dịch lại model trong Next.js
const User = models.User || mongoose.model('User', userSchema);

export default User;