// src/models/Room.ts
import mongoose, { Schema, models } from 'mongoose';

const roomSchema = new Schema(
    {
        landlordId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        themeImage: { type: String, required: true },
        galleryImages: [{ type: String }],

        pricePerMonth: { type: Number, required: true },
        depositAmount: { type: Number, required: true },
        capacity: { type: Number, required: true },
        area: { type: Number, required: true },

        address: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true } // [Kinh độ, Vĩ độ]
        },

        amenities: [{ type: String }],
        rules: [{ type: String }],

        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['AVAILABLE', 'BOOKED', 'MAINTENANCE'],
            default: 'AVAILABLE'
        }
    },
    { timestamps: true }
);

// Tạo chỉ mục không gian (Geospatial Index) để phục vụ chức năng Radar
roomSchema.index({ location: '2dsphere' });

const Room = models.Room || mongoose.model('Room', roomSchema);

export default Room;