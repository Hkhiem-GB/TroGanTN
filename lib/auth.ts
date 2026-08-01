// lib/auth.ts
import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Notification from "@/models/Notification";

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

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectToDatabase();
                    const existingUser = await User.findOne({ email: user.email });

                    // Nếu CHƯA CÓ tài khoản => Lần đầu đăng nhập
                    if (!existingUser) {
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
                session.user.id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};