"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
    Users, Crown, ShieldAlert, AlertTriangle, Search,
    MoreVertical, Trash2, XCircle, Info, ChevronLeft,
    ChevronRight, LayoutDashboard, MessageSquare, Filter,
    ArrowDownAZ, ArrowUpZA, Clock, ChevronDown, User, Send, Check, X, ZoomIn
} from 'lucide-react';
import { notify } from '@/utils/toast';

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar: string;
    planStatus: string;
    registerDate: string;
    expireDate: string | null;
}

export interface ReportItem {
    _id: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    content: string;
    images: string[];
    isRead: boolean;
    createdAt: string;
    userId: string | null;
    replies?: { content: string; createdAt: string }[];
}

export default function AdminDashboardPage() {
    const { data: session } = useSession();

    // ==========================================
    // STATES QUẢN LÝ USER
    // ==========================================
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const [openFilter, setOpenFilter] = useState<string | null>(null);

    // Thêm State quản lý Custom Modal cho User (Kick/Remove)
    const [userActionConfirm, setUserActionConfirm] = useState<{ userId: string, action: 'kick' | 'remove_plan' } | null>(null);

    const actionMenuRef = useRef<HTMLTableSectionElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionId(null);
            }
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
                setOpenFilter(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                search: debouncedSearch,
                sort: sortOrder,
                role: roleFilter,
                status: statusFilter,
                page: page.toString(),
                limit: itemsPerPage.toString()
            });

            const res = await fetch(`/api/admin/users?${query.toString()}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
                setTotalUsers(data.total);
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if ((session?.user as { role?: string })?.role === 'ADMIN') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchUsers();
        }
    }, [debouncedSearch, sortOrder, roleFilter, statusFilter, page, itemsPerPage, session]);

    // Hàm thực thi hành động User (Sau khi confirm qua Modal)
    const confirmAdminAction = async () => {
        if (!userActionConfirm) return;
        const { userId, action } = userActionConfirm;
        const toastId = notify.loading('Đang xử lý...');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            });
            const data = await res.json();

            if (data.success) {
                notify.success(data.message, toastId);
                setOpenActionId(null);
                setUserActionConfirm(null);
                fetchUsers();
            } else {
                notify.error(data.message || 'Có lỗi xảy ra', toastId);
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    // ==========================================
    // STATES QUẢN LÝ REPORT
    // ==========================================
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [reportToDelete, setReportToDelete] = useState<{ id: string | 'all', type: 'single' | 'all' } | null>(null);

    const fetchReports = async () => {
        setIsLoadingReports(true);
        try {
            const res = await fetch(`/api/report`);
            const data = await res.json();
            if (data.success) setReports(data.data);
        } catch (error) {
            console.error("Lỗi tải báo cáo", error);
        } finally {
            setIsLoadingReports(false);
        }
    };

    useEffect(() => {
        if ((session?.user as { role?: string })?.role === 'ADMIN' && activeTab === 'reports') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchReports();
        }
    }, [session, activeTab]);

    const handleReadReport = async (report: ReportItem) => {
        setSelectedReport(report);
        if (!report.isRead) {
            setReports(prev => prev.map(r => r._id === report._id ? { ...r, isRead: true } : r));
            fetch('/api/report', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId: report._id, action: 'mark_read' })
            });
        }
    };

    const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setReportToDelete({ id, type: 'single' });
    };

    const handleDeleteAllReports = async () => {
        setReportToDelete({ id: 'all', type: 'all' });
    };

    const confirmDeleteReport = async () => {
        if (!reportToDelete) return;
        try {
            const url = reportToDelete.type === 'all'
                ? `/api/report?action=delete_all`
                : `/api/report?id=${reportToDelete.id}`;

            const res = await fetch(url, { method: 'DELETE' });
            if ((await res.json()).success) {
                notify.success(reportToDelete.type === 'all' ? "Đã dọn dẹp hòm thư" : "Đã xóa báo cáo");
                setReportToDelete(null);
                fetchReports();
            }
        } catch (error) {
            notify.error("Lỗi xóa báo cáo");
        }
    };

    const handleSendReply = async () => {
        if (!replyContent.trim() || !selectedReport) {
            notify.error("Vui lòng nhập nội dung phản hồi");
            return;
        }

        const toastId = notify.loading("Đang gửi phản hồi...");
        try {
            const res = await fetch('/api/report', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: selectedReport._id,
                    replyContent,
                    action: 'reply'
                })
            });

            const data = await res.json();
            if (data.success) {
                notify.success(data.message, toastId);
                if (data.reply) {
                    setSelectedReport(prev => prev ? {
                        ...prev,
                        replies: [...(prev.replies || []), data.reply]
                    } : null);
                }
                setReplyContent('');
                fetchReports();
            } else {
                notify.error(data.message || 'Lỗi gửi phản hồi', toastId);
            }
        } catch (error) {
            notify.error('Lỗi kết nối mạng', toastId);
        }
    };

    // ==========================================
    // HELPERS
    // ==========================================
    const renderRoleBadge = (role: string) => {
        if (role === 'ADMIN') return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold border border-red-100"><ShieldAlert className="w-3 h-3"/> ADMIN</span>;
        if (role === 'LANDLORD') return <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-md text-xs font-bold border border-yellow-100"><Crown className="w-3 h-3"/> CHỦ TRỌ</span>;
        return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold"><Users className="w-3 h-3"/> SINH VIÊN</span>;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTimeGmail = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">

            {/* SIDEBAR ADMIN */}
            <div className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0 min-h-screen p-4 sticky top-0">
                <div className="flex items-center gap-2 mb-8 px-2 mt-4">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Admin Control</h2>
                </div>
                <nav className="space-y-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <LayoutDashboard className="w-5 h-5" /> Thống kê & Users
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <MessageSquare className="w-5 h-5" /> Báo cáo / Hỗ trợ
                    </button>
                </nav>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 p-6 lg:p-10 w-full overflow-hidden">

                {/* TAB: DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan hệ thống</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
                                <div><p className="text-sm font-medium text-gray-500 mb-1">Tổng tài khoản</p><h3 className="text-3xl font-bold text-gray-900">{totalUsers}</h3></div>
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users className="w-6 h-6" /></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
                                <div><p className="text-sm font-medium text-gray-500 mb-1">Đối tác Chủ trọ</p><h3 className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'LANDLORD').length}</h3></div>
                                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center"><Crown className="w-6 h-6" /></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                                <div><p className="text-sm font-medium text-gray-500 mb-1">Gói sắp hết / Hết hạn</p><h3 className="text-3xl font-bold text-red-600">{users.filter(u => u.planStatus === 'EXPIRED').length}</h3></div>
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible relative z-10">
                            {/* Toolbar Bảng & Lọc */}
                            <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-50/50 rounded-t-2xl">
                                <h3 className="font-bold text-gray-900 whitespace-nowrap">Danh sách Người dùng</h3>
                                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto" ref={toolbarRef}>
                                    <div className="relative flex-1 sm:w-64 min-w-[200px]">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm tên, email, sđt..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white" />
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setOpenFilter(openFilter === 'sort' ? null : 'sort')} className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${openFilter === 'sort' ? 'border-primary text-primary' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}><Filter className="w-4 h-4" /> Lọc A-Z</button>
                                        {openFilter === 'sort' && (
                                            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button onClick={() => { setSortOrder('az'); setOpenFilter(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 ${sortOrder === 'az' ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'}`}><ArrowDownAZ className="w-4 h-4"/> Từ A đến Z</button>
                                                <button onClick={() => { setSortOrder('za'); setOpenFilter(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 ${sortOrder === 'za' ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'}`}><ArrowUpZA className="w-4 h-4"/> Từ Z đến A</button>
                                                <button onClick={() => { setSortOrder('desc'); setOpenFilter(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 ${sortOrder === 'desc' ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'}`}><Clock className="w-4 h-4"/> Mới nhất</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setOpenFilter(openFilter === 'role' ? null : 'role')} className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${openFilter === 'role' ? 'border-primary text-primary' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{roleFilter ? (roleFilter === 'ADMIN' ? 'Admin' : roleFilter === 'LANDLORD' ? 'Chủ trọ' : 'Sinh viên') : 'Chức vụ'}<ChevronDown className="w-4 h-4 text-gray-400" /></button>
                                        {openFilter === 'role' && (
                                            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button onClick={() => { setRoleFilter(''); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary/5">Tất cả chức vụ</button>
                                                <button onClick={() => { setRoleFilter('ADMIN'); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Admin</button>
                                                <button onClick={() => { setRoleFilter('LANDLORD'); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 font-medium">Chủ trọ</button>
                                                <button onClick={() => { setRoleFilter('USER'); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 font-medium">Sinh viên</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')} className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${openFilter === 'status' ? 'border-primary text-primary' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{statusFilter ? (statusFilter === 'ACTIVE' ? 'Đã thanh toán' : statusFilter === 'EXPIRED' ? 'Chưa gia hạn' : 'Không có gói') : 'Trạng thái gói'}<ChevronDown className="w-4 h-4 text-gray-400" /></button>
                                        {openFilter === 'status' && (
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button onClick={() => { setStatusFilter(''); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary/5">Tất cả trạng thái</button>
                                                <button onClick={() => { setStatusFilter('ACTIVE'); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-medium">Đã thanh toán</button>
                                                <button onClick={() => { setStatusFilter('EXPIRED'); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Chưa gia hạn</button>
                                                <button onClick={() => { setStatusFilter('NONE'); setOpenFilter(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 font-medium">Không có gói</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setOpenFilter(openFilter === 'limit' ? null : 'limit')} className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-colors ${openFilter === 'limit' ? 'border-primary text-primary' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{itemsPerPage} / trang<ChevronDown className="w-4 h-4 text-gray-400" /></button>
                                        {openFilter === 'limit' && (
                                            <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {[50, 100, 200].map(num => (
                                                    <button key={num} onClick={() => { setItemsPerPage(num); setPage(1); setOpenFilter(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-primary/5 ${itemsPerPage === num ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'}`}>{num}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[300px]">
                                {isLoading ? (
                                    <table className="w-full text-left text-sm whitespace-nowrap relative">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                        <tr><th className="px-5 py-4 w-16 text-center">STT</th><th className="px-5 py-4">Người dùng</th><th className="px-5 py-4">Liên hệ</th><th className="px-5 py-4 text-center">Chức vụ</th><th className="px-5 py-4 text-center">Trạng thái gói</th><th className="px-5 py-4 text-center w-24">Hành động</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                        {[...Array(5)].map((_, index) => (
                                            <tr key={index} className="animate-pulse bg-white">
                                                <td className="px-5 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto"></div></td>
                                                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-3 bg-gray-200 rounded w-24"></div></div></div></td>
                                                <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-5 py-4 text-center"><div className="h-6 bg-gray-200 rounded-md w-20 mx-auto"></div></td>
                                                <td className="px-5 py-4 text-center"><div className="h-6 bg-gray-200 rounded-md w-24 mx-auto"></div></td>
                                                <td className="px-5 py-4 text-center"><div className="h-8 bg-gray-200 rounded-lg w-16 mx-auto"></div></td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">Không tìm thấy người dùng nào.</div>
                                ) : (
                                    <table className="w-full text-left text-sm whitespace-nowrap relative">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                        <tr><th className="px-5 py-4 w-16 text-center">STT</th><th className="px-5 py-4">Người dùng</th><th className="px-5 py-4">Liên hệ</th><th className="px-5 py-4 text-center">Chức vụ</th><th className="px-5 py-4 text-center">Trạng thái gói</th><th className="px-5 py-4 text-center w-24">Hành động</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100" ref={actionMenuRef}>
                                        {users.map((user, index) => (
                                            <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-5 py-4 text-center text-gray-500">{(page - 1) * itemsPerPage + index + 1}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 ${user.role === 'ADMIN' ? 'ring-2 ring-red-500' : user.role === 'LANDLORD' ? 'ring-2 ring-yellow-400' : ''}`}>
                                                            {user.avatar ? <img src={user.avatar} alt="avt" className="w-full h-full rounded-full object-cover"/> : <User className="w-5 h-5 text-gray-400" />}
                                                            {user.role === 'ADMIN' && <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5"><ShieldAlert className="w-2.5 h-2.5 text-white"/></div>}
                                                            {user.role === 'LANDLORD' && <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5"><Crown className="w-2.5 h-2.5 text-white"/></div>}
                                                        </div>
                                                        <div><div className={`font-bold ${user.role === 'ADMIN' ? 'text-red-700' : 'text-gray-900'}`}>{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-gray-600 font-medium">{user.phone || 'Chưa cập nhật'}</td>
                                                <td className="px-5 py-4 text-center">{renderRoleBadge(user.role)}</td>
                                                <td className="px-5 py-4 text-center">
                                                    {user.role === 'ADMIN' ? <span className="text-gray-400 text-xs">Không áp dụng</span> : user.planStatus === 'ACTIVE' ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">Đã thanh toán</span> : user.planStatus === 'EXPIRED' ? <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-medium">Chưa gia hạn</span> : <span className="text-gray-400 text-xs">-</span>}
                                                </td>
                                                <td className="px-5 py-4 text-center relative">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setSelectedUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chi tiết"><Info className="w-5 h-5" /></button>
                                                        {user.role !== 'ADMIN' && (
                                                            <div className="relative">
                                                                <button onClick={() => setOpenActionId(openActionId === user.id ? null : user.id)} className={`p-1.5 rounded-lg transition-colors ${openActionId === user.id ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}><MoreVertical className="w-5 h-5" /></button>
                                                                {openActionId === user.id && (
                                                                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                                                        <button onClick={() => setUserActionConfirm({ userId: user.id, action: 'kick' })} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"><Trash2 className="w-4 h-4"/> Kick tài khoản</button>
                                                                        {user.role === 'LANDLORD' && (
                                                                            <button onClick={() => setUserActionConfirm({ userId: user.id, action: 'remove_plan' })} className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 font-medium"><XCircle className="w-4 h-4"/> Xóa gói Chủ trọ</button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white rounded-b-2xl">
                                <div>
                                    Tổng cộng: <span className="font-bold text-gray-900">{totalUsers}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button disabled={page === 1 || totalUsers === 0} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                    <button className="p-1.5 rounded-lg border border-primary text-primary hover:bg-primary/5 font-bold px-3 bg-primary/5">{page}</button>
                                    <button disabled={page * itemsPerPage >= totalUsers} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: BÁO CÁO (INBOX) */}
                {activeTab === 'reports' && (
                    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Hòm thư Báo cáo</h1>
                            {reports.length > 0 && (
                                <button onClick={handleDeleteAllReports} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm border border-red-200">
                                    <Trash2 className="w-4 h-4" /> Xóa tất cả
                                </button>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                            {isLoadingReports ? (
                                <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                            ) : reports.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <Check className="w-16 h-16 mb-4 text-green-400 bg-green-50 p-3 rounded-full" />
                                    <p className="text-lg font-medium text-gray-600">Hòm thư trống</p>
                                    <p className="text-sm">Chưa có báo cáo nào cần xử lý.</p>
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1">
                                    {reports.map((report) => (
                                        <div key={report._id} onClick={() => handleReadReport(report)} className={`group flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-pointer transition-colors hover:shadow-md hover:-translate-y-0.5 relative bg-white ${report.isRead ? 'opacity-70' : 'bg-primary/5 border-l-4 border-l-primary'}`}>
                                            <div className="flex items-center gap-6 min-w-0 flex-1">
                                                <div className={`w-48 truncate flex-shrink-0 ${report.isRead ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>{report.senderName}</div>
                                                <div className="flex-1 min-w-0 truncate text-sm"><span className={report.isRead ? 'text-gray-700' : 'text-gray-900 font-bold'}>{report.subject}</span><span className="text-gray-400 mx-2">-</span><span className="text-gray-500">{report.content}</span></div>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                                <div className={`text-xs ${report.isRead ? 'text-gray-400' : 'text-primary font-bold'}`}>{formatTimeGmail(report.createdAt)}</div>
                                                <button onClick={(e) => handleDeleteReport(e, report._id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all" title="Xóa báo cáo này"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT USER */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="text-center mb-6">
                            <div className={`mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 relative ${selectedUser.role === 'ADMIN' ? 'ring-4 ring-red-500 p-1' : selectedUser.role === 'LANDLORD' ? 'ring-4 ring-yellow-400 p-1' : ''}`}>
                                {selectedUser.avatar ? <img src={selectedUser.avatar} alt="avt" className="w-full h-full rounded-full object-cover"/> : <User className="w-10 h-10 text-gray-400" />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                            <p className="text-gray-500 text-sm mt-1">{selectedUser.email}</p>
                            <div className="mt-2">{renderRoleBadge(selectedUser.role)}</div>
                        </div>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm">
                            <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Số điện thoại:</span><span className="font-medium">{selectedUser.phone || 'Chưa cập nhật'}</span></div>
                            <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Trạng thái gói:</span>{selectedUser.planStatus === 'ACTIVE' ? <span className="font-bold text-green-600">Đã thanh toán</span> : selectedUser.planStatus === 'EXPIRED' ? <span className="font-bold text-red-600">Chưa gia hạn</span> : <span>-</span>}</div>
                            <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Đăng ký ngày:</span><span className="font-medium">{formatDate(selectedUser.registerDate)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Hết hạn ngày:</span><span className="font-medium text-primary">{formatDate(selectedUser.expireDate)}</span></div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="w-full mt-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Đóng</button>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT BÁO CÁO */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedReport(null); }}>
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">

                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-3xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedReport.subject}</h3>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">{selectedReport.senderName}</span>
                                    &lt;{selectedReport.senderEmail}&gt;
                                    <span className="text-gray-400">•</span>
                                    <span>{formatTimeGmail(selectedReport.createdAt)}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {/* FIX ĐÂY NÀY: Gom chung nội dung và lịch sử phản hồi vào vùng cuộn được */}
                        <div className="p-6 overflow-y-auto flex-1 text-gray-700 leading-relaxed text-sm">
                            <div className="whitespace-pre-wrap">{selectedReport.content}</div>

                            {selectedReport.images && selectedReport.images.length > 0 && (
                                <div className="mt-6 border-t border-gray-100 pt-6">
                                    <p className="text-sm font-bold text-gray-900 mb-4">Hình ảnh đính kèm ({selectedReport.images.length})</p>
                                    <div className="flex flex-wrap gap-4">
                                        {selectedReport.images.map((img, idx) => (
                                            <div key={idx} onClick={() => setPreviewImage(img)} className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200 hover:border-primary transition-all cursor-pointer relative group">
                                                <img src={img} alt="đính kèm" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><ZoomIn className="w-6 h-6" /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedReport.replies && selectedReport.replies.length > 0 && (
                                <div className="mt-8 border-t border-gray-100 pt-6">
                                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Send className="w-4 h-4 text-primary" /> Lịch sử phản hồi ({selectedReport.replies.length})
                                    </h4>
                                    <div className="space-y-4">
                                        {selectedReport.replies.map((reply, idx) => (
                                            <div key={idx} className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl ml-4 sm:ml-8 relative">
                                                <div className="absolute -left-[21px] sm:-left-[37px] top-4 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                                {idx !== selectedReport.replies!.length - 1 && <div className="absolute -left-[16px] sm:-left-[32px] top-7 bottom-[-24px] w-0.5 bg-blue-100"></div>}
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-blue-800 text-sm">Ban Quản Trị</span>
                                                    <span className="text-xs text-blue-500/70 font-medium">{formatTimeGmail(reply.createdAt)}</span>
                                                </div>
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                            <div className="relative">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Nhập phản hồi tới ${selectedReport.senderEmail}...`}
                                    className="w-full pl-4 pr-16 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm min-h-[100px] resize-y"
                                ></textarea>
                                <button onClick={handleSendReply} className="absolute bottom-3 right-3 p-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-sm transition-colors" title="Gửi phản hồi"><Send className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHÓNG TO ẢNH */}
            {previewImage && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
                        <img src={previewImage} alt="Ảnh phóng to" className="w-full h-full object-contain max-h-[85vh] rounded-2xl shadow-2xl" />
                        <button onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/90 transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN XÓA REPORT Ở ADMIN */}
            {reportToDelete && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setReportToDelete(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 text-center" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                        <p className="text-gray-500 text-sm mb-6">{reportToDelete.type === 'all' ? "Bạn có chắc chắn muốn xóa TẤT CẢ báo cáo trong hòm thư không? Hành động này không thể hoàn tác." : "Bạn có chắc chắn muốn xóa báo cáo này không? Hành động này không thể hoàn tác."}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setReportToDelete(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                            <button onClick={confirmDeleteReport} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-sm transition-colors">Xóa ngay</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN HÀNH ĐỘNG USER (KICK / REMOVE PLAN) */}
            {userActionConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setUserActionConfirm(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 text-center" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Cảnh báo hệ thống</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {userActionConfirm.action === 'kick'
                                ? "Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này khỏi hệ thống? Hành động này không thể hoàn tác."
                                : "Xác nhận thu hồi gói đăng ký Chủ trọ của tài khoản này?"}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setUserActionConfirm(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                            <button onClick={confirmAdminAction} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-sm transition-colors">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}