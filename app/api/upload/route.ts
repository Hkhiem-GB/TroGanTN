import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary lấy từ file .env
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        // Đọc dữ liệu form từ client gửi lên
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy file ảnh' }, { status: 400 });
        }

        // Chuyển đổi file vật lý sang định dạng Base64 để Cloudinary đọc được
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Upload trực tiếp lên Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(base64Image, {
            folder: 'trogantn_chat', // Cloudinary sẽ tự tạo thư mục tên này để lưu ảnh cho gọn
            resource_type: 'image'
        });

        // Trả về link ảnh thành công
        return NextResponse.json({
            success: true,
            imageUrl: uploadResponse.secure_url,
        });

    } catch (error) {
        console.error("Lỗi khi upload ảnh lên Cloudinary:", error);
        return NextResponse.json({ success: false, error: 'Lỗi server khi upload ảnh' }, { status: 500 });
    }
}