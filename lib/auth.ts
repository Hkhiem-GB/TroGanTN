// lib/auth.ts
import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Notification from "@/models/Notification";
import nodemailer from "nodemailer";

declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            role?: string;
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: string;
    }
}

// Cấu hình Transporter cho Nodemailer
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })
    : null;

// Hàm hỗ trợ gửi email chào mừng
async function sendWelcomeEmail(to: string, name: string) {
    if (!transporter) return;

    try {
        await transporter.sendMail({
            from: `"TroGanTN" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Chào mừng bạn đến với TroGanTN! 🎉',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #ea580c;">Xin chào ${name}! 👋</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản và gia nhập cộng đồng <strong>TroGanTN</strong>.</p>
                    <p>Chúng tôi hy vọng nền tảng này sẽ giúp bạn dễ dàng tìm kiếm được căn phòng trọ ưng ý hoặc kết nối được với những khách thuê tuyệt vời.</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">💡 Bạn có biết?</p>
                        <p style="margin: 10px 0 0 0;">Bạn có thể nâng cấp lên gói <strong>Chủ trọ</strong> để tự do đăng tải thông tin phòng trọ của mình tiếp cận đến hàng ngàn sinh viên!</p>
                    </div>
                    <p>Nếu gặp bất kỳ khó khăn nào trong quá trình sử dụng, đừng ngần ngại liên hệ với chúng tôi qua mục Hỗ trợ nhé.</p>
                    <br/>
                    <p>Chúc bạn một ngày tốt lành,</p>
                    <p><strong>Ban quản trị TroGanTN</strong></p>
                </div>
            `,
        });
        console.log(`Đã gửi email chào mừng tới: ${to}`);
    } catch (error) {
        console.error("Lỗi khi gửi email chào mừng:", error);
    }
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
    providers: googleClientId && googleClientSecret ? [
        GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
        }),
    ] : [],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectToDatabase();
                    // Lưu ý: Đảm bảo đã cập nhật isLocked vào model User
                    const existingUser = await User.findOne({ email: user.email });

                    if (existingUser) {
                        // BỔ SUNG: Kiểm tra xem tài khoản có bị khóa không
                        if (existingUser.isLocked) {
                            console.log(`🔒 Chặn đăng nhập: Tài khoản ${user.email} đang bị khóa.`);
                            return '/?error=AccountLocked';
                        }
                    } else {
                        // Nếu CHƯA CÓ tài khoản => Lần đầu đăng nhập
                        const newUser = await User.create({
                            name: user.name,
                            email: user.email,
                            avatar: user.image,
                            role: 'USER',
                        });

                        // TỰ ĐỘNG TẠO THÔNG BÁO CHÀO MỪNG
                        await Notification.create({
                            userId: newUser._id,
                            title: 'Chào mừng đến với TroGanTN! 🎉',
                            content: 'Cảm ơn bạn đã tham gia cộng đồng. Hãy bắt đầu tìm kiếm phòng trọ ưng ý ngay hôm nay nhé!',
                            type: 'SYSTEM',
                            link: '/' // Chuyển về trang chủ khi click
                        });

                        // TỰ ĐỘNG GỬI EMAIL CHÀO MỪNG
                        if (newUser.email && newUser.name) {
                            // Không dùng await ở đây để không làm chậm quá trình đăng nhập của user
                            sendWelcomeEmail(newUser.email, newUser.name).catch(console.error);
                        }
                    }
                    return true;
                } catch (error) {
                    console.error("Lỗi khi lưu user vào DB:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                await connectToDatabase();
                // Dùng lean() để tối ưu tốc độ đọc từ MongoDB
                const dbUser = await User.findOne({ email: user.email }).lean();

                if (dbUser) {
                    token.role = dbUser.role as string;
                    // 2. GẮN MONGODB _ID VÀO TOKEN (Chuyển sang string)
                    token.id = dbUser._id.toString();
                }
            }
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                // 3. ĐẨY ID TỪ TOKEN RA SESSION ĐỂ FRONTEND SỬ DỤNG ĐƯỢC
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || 'development-secret',
};