// src/models/Booking.ts
import mongoose, { Schema, models } from 'mongoose';

const bookingSchema = new Schema(
    {
        roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        landlordId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        customerName: { type: String, required: true },
        customerPhone: { type: String, required: true },
        expectedOccupants: { type: Number, required: true },
        promoCode: { type: String },

        depositAmount: { type: Number, required: true },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED'],
            default: 'PENDING'
        },
        bookingStatus: {
            type: String,
            enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
            default: 'ACTIVE'
        },
        expiresAt: { type: Date, required: true } // Lưu thời gian hết hạn 15 phút quét QR
    },
    { timestamps: true }
);

const Booking = models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;