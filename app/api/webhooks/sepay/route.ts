// src/app/api/webhooks/sepay/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import nodemailer from "nodemailer";

// Cấu hình Nodemailer (Dùng lại biến môi trường)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Hàm gửi Email xác nhận nâng cấp
async function sendUpgradeEmail(to: string, name: string, months: number) {
    try {
        await transporter.sendMail({
            from: `"TroGanTN" <${process.env.EMAIL_USER}>`,
            to,
            subject: '🎉 Nâng cấp Chủ trọ thành công!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #ea580c;">Chúc mừng ${name}! 👑</h2>
                    <p>Tài khoản của bạn đã được hệ thống ghi nhận thanh toán và nâng cấp lên gói <strong>Chủ trọ</strong> thành công.</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                        <p style="margin: 0; font-weight: bold;">Chi tiết gói đăng ký:</p>
                        <ul style="margin-top: 10px; margin-bottom: 0;">
                            <li>Thời hạn: <strong>${months} tháng</strong></li>
                            <li>Trạng thái: <strong>Đang hoạt động</strong></li>
                        </ul>
                    </div>
                    <p>Bây giờ bạn đã có thể truy cập vào trang Quản lý phòng trọ để đăng tải các căn phòng của mình đến hàng ngàn sinh viên!</p>
                    <br/>
                    <p>Trân trọng,</p>
                    <p><strong>Ban quản trị TroGanTN</strong></p>
                </div>
            `,
        });
        console.log(`📧 Đã gửi email xác nhận nâng cấp tới: ${to}`);
    } catch (error) {
        console.error("Lỗi khi gửi email nâng cấp:", error);
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        const expectedToken = process.env.SEPAY_WEBHOOK_TOKEN;

        // BẢO MẬT: Kiểm tra token linh hoạt (SePay có thể trả về Apikey hoặc Bearer tùy cấu hình Webhook)
        if (expectedToken && (!authHeader || !authHeader.includes(expectedToken))) {
            return NextResponse.json({ success: false, message: 'Sai Token bảo mật!' }, { status: 401 });
        }

        const body = await req.json();
        const { transferAmount, content, transferType } = body;

        // Kiểm tra nếu không phải giao dịch tiền vào (transferType !== 'in')
        if (transferType !== 'in' || !transferAmount || transferAmount <= 0) {
            return NextResponse.json({ success: true, message: 'Bỏ qua vì không phải tiền vào.' });
        }

        await connectToDatabase();

        //Quét cú pháp từ biến 'content'
        const upgradeMatch = content.match(/UPGRADE\s+([a-zA-Z0-9_.-]+)\s+(\d+)M/i);

        if (upgradeMatch) {
            const emailPrefix = upgradeMatch[1];
            const monthsToAdd = parseInt(upgradeMatch[2], 10);

            const user = await User.findOne({ email: new RegExp('^' + emailPrefix + '@', 'i') });

            if (user) {
                const currentValidUntil = user.landlordData?.subscriptionValidUntil;
                const baseDate = (currentValidUntil && currentValidUntil > new Date())
                    ? new Date(currentValidUntil)
                    : new Date();

                const newValidUntil = new Date(baseDate.setMonth(baseDate.getMonth() + monthsToAdd));
                const newRole = user.role === 'ADMIN' ? 'ADMIN' : 'LANDLORD';

                await User.findByIdAndUpdate(user._id, {
                    role: newRole,
                    'landlordData.isSubscriptionActive': true,
                    'landlordData.subscriptionValidUntil': newValidUntil
                });

                sendUpgradeEmail(user.email, user.name, monthsToAdd).catch(console.error);

                return NextResponse.json({ success: true, message: 'Đã nâng cấp Chủ trọ tự động!' });
            }
        }

        return NextResponse.json({ success: true, message: 'Giao dịch không khớp cú pháp hệ thống.' });

    } catch (error) {
        console.error('🔥 LỖI CRASH HỆ THỐNG SEPAY:', error);
        return NextResponse.json({ success: false, error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}