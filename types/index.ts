// src/types/index.ts

// 1. Định nghĩa các Role trong hệ thống
export enum UserRole {
    USER = 'USER',         // Người tìm trọ bình thường
    LANDLORD = 'LANDLORD', // Chủ trọ (Cần trả phí để đăng bài)
    ADMIN = 'ADMIN'        // Quản trị viên hệ thống
}

// 2. Định nghĩa Tài khoản Người dùng
export interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    role: UserRole;

    // Dữ liệu dành riêng cho chủ trọ
    landlordData?: {
        phoneNumber: string;
        isSubscriptionActive: boolean; // Trạng thái gói cước 59k
        subscriptionValidUntil: Date;  // Ngày hết hạn gói cước
        qrCodePaymentUrl?: string;     // Mã QR ngân hàng mặc định để nhận tiền cọc
    };
    createdAt: Date;
    updatedAt: Date;
}

// 3. Định nghĩa Phòng Trọ
export interface IRoom {
    _id: string;
    landlordId: string; // Tham chiếu đến _id của Chủ trọ
    title: string;      // VD: "Phòng trọ khép kín ngõ 3 Z115"
    themeImage: string; // Ảnh bìa chính
    galleryImages: string[]; // Danh sách ảnh chi tiết để trượt

    // Thông tin chi tiết
    pricePerMonth: number;
    depositAmount: number; // Tiền cọc yêu cầu
    capacity: number;      // Số người ở tối đa
    area: number;          // Kích thước (m2)

    // Vị trí (Phục vụ cho chức năng radar tìm quanh đây 2km)
    address: string;
    location: {
        type: 'Point';
        coordinates: [number, number]; // [Kinh độ, Vĩ độ]
    };

    // Các tiện ích & nội quy
    amenities: string[]; // VD: ['Điều hòa', 'Nóng lạnh', 'Wifi']
    rules: string[];     // VD: ['Đóng cửa 23h', 'Không nuôi thú cưng']

    // Đánh giá & Trạng thái
    rating: number;      // Trung bình số sao (VD: 4.5)
    reviewCount: number; // Số lượt đánh giá
    status: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';

    createdAt: Date;
}

// 4. Định nghĩa Luồng Đặt Phòng (Booking)
export interface IBooking {
    _id: string;
    roomId: string;
    userId: string;       // Người đặt
    landlordId: string;   // Chủ phòng

    customerName: string;
    customerPhone: string;
    expectedOccupants: number;
    promoCode?: string;

    depositAmount: number;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED'; // Chờ quét QR / Đã thanh toán / Thất bại
    bookingStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

    expiresAt: Date; // Thời gian hết hạn quét QR (15 phút)
    createdAt: Date;
}