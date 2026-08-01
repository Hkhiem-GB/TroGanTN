import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingRadar from "@/components/common/FloatingRadar";
import GlobalChat from "@/components/common/GlobalChat";
import AuthProvider from "@/components/providers/AuthProvider";
import {Toaster} from "react-hot-toast";


const inter = Inter({ subsets: ["vietnamese"] });

export const metadata: Metadata = {
    title: "TroGanTN | Tìm trọ Thái Nguyên",
    description: "Nền tảng tìm kiếm trọ nhanh chóng cho sinh viên",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body className={`${inter.className} min-h-screen flex flex-col bg-white text-gray-900 relative pb-20 md:pb-0`}>
                <AuthProvider>
                    <Header />
                        <main className="flex-1">{children}</main>
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    duration: 3000,
                                    style: {
                                        background: '#fff',
                                        color: '#363636',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontWeight: '500',
                                    },
                                }}
                            />
                        <FloatingRadar />
                        <GlobalChat />
                    <Footer />
                </AuthProvider>
            </body>
        </html>
    );
}