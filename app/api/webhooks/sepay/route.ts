// src/app/api/webhooks/sepay/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        // 1. Kiểm tra bảo mật Token (SePay sẽ gửi chữ Apikey kèm Token)
        const authHeader = req.headers.get('Authorization');
        const expectedToken = process.env.SEPAY_WEBHOOK_TOKEN;

        if (expectedToken && authHeader !== `Apikey ${expectedToken}`) {
            return NextResponse.json({ success: false, message: 'Sai Token bảo mật!' }, { status: 401 });
        }

        const body = await req.json();
        const { amountIn, transactionContent } = body;

        // 2. Bỏ qua nếu không phải là giao dịch chuyển tiền VÀO
        if (!amountIn || amountIn <= 0) {
            return NextResponse.json({ success: true, message: 'Bỏ qua vì không phải tiền vào.' });
        }

        await connectToDatabase();

        // 3. XỬ LÝ NÂNG CẤP CHỦ TRỌ
        // Dùng Regex quét nội dung chuyển khoản để tìm: UPGRADE + [EMAIL] + [SỐ_THÁNG]M
        // Ví dụ: MBBANK IBFT NGUYEN VAN A CHUYEN TIEN UPGRADE BKKHIEM224 6M
        const upgradeMatch = transactionContent.match(/UPGRADE\s+([a-zA-Z0-9_.-]+)\s+(\d+)M/i);

        if (upgradeMatch) {
            const emailPrefix = upgradeMatch[1]; // Vd: bkkhiem224
            const monthsToAdd = parseInt(upgradeMatch[2], 10); // Vd: 6

            // Tìm user có email bắt đầu bằng emailPrefix (VD: bkkhiem224@gmail.com)
            const user = await User.findOne({ email: new RegExp('^' + emailPrefix + '@', 'i') });

            if (user) {
                const currentValidUntil = user.landlordData?.subscriptionValidUntil;
                const baseDate = (currentValidUntil && currentValidUntil > new Date())
                    ? new Date(currentValidUntil)
                    : new Date();

                const newValidUntil = new Date(baseDate.setMonth(baseDate.getMonth() + monthsToAdd));

                // TỰ ĐỘNG NÂNG CẤP TRONG DATABASE
                await User.findByIdAndUpdate(user._id, {
                    role: 'LANDLORD',
                    'landlordData.isSubscriptionActive': true,
                    'landlordData.subscriptionValidUntil': newValidUntil
                });

                console.log(`✅ [SEPAY] Nâng cấp tự động thành công: ${user.email} (+${monthsToAdd} tháng)`);
                return NextResponse.json({ success: true, message: 'Đã nâng cấp Chủ trọ tự động!' });
            }
        }

        // 4. (Sau này) Xử lý logic Đặt cọc phòng (DATCOC...) ở đây...

        return NextResponse.json({ success: true, message: 'Giao dịch không khớp cú pháp hệ thống.' });

    } catch (error) {
        console.error('❌ [SEPAY ERROR]:', error);
        return NextResponse.json({ success: false, error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}