import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    callbacks: {
        // Hàm này chạy ngay sau khi Google trả về thông tin user
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectToDatabase();

                    // Kiểm tra xem email này đã tồn tại trong MongoDB chưa
                    const existingUser = await User.findOne({ email: user.email });

                    // Nếu chưa có, tạo tài khoản mới mặc định là USER (người tìm trọ)
                    if (!existingUser) {
                        await User.create({
                            name: user.name,
                            email: user.email,
                            avatar: user.image,
                            role: 'USER',
                        });
                    }
                    return true; // Cho phép đăng nhập
                } catch (error) {
                    console.error("Lỗi khi lưu user vào DB:", error);
                    return false; // Chặn đăng nhập nếu có lỗi
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            // Khi vừa đăng nhập, lấy role từ MongoDB nhét vào token
            if (user) {
                await connectToDatabase();
                const dbUser = await User.findOne({ email: user.email }).lean();
                if (dbUser) token.role = dbUser.role;
            }
            // Khi user nâng cấp thành công ở trang Profile, cập nhật lại token
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            // Truyền role từ token ra ngoài session để Header dùng được
            if (session.user) {
                session.user.role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };