// src/utils/toast.ts
import toast from 'react-hot-toast';

// Tạo một object chứa tất cả các loại thông báo
export const notify = {
    success: (message: string, id?: string) => {
        return toast.success(message, {
            id,
            duration: 4000,
            style: {
                background: '#10B981', // Màu xanh success
                color: '#fff',
                fontWeight: '500',
            },
            iconTheme: { primary: '#fff', secondary: '#10B981' }
        });
    },

    error: (message: string, id?: string) => {
        return toast.error(message, {
            id,
            duration: 4000,
            style: {
                background: '#EF4444', // Màu đỏ error
                color: '#fff',
                fontWeight: '500',
            },
            iconTheme: { primary: '#fff', secondary: '#EF4444' }
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            style: {
                background: '#3B82F6', // Màu xanh dương loading
                color: '#fff',
                fontWeight: '500',
            },
            iconTheme: { primary: '#fff', secondary: '#3B82F6' }
        });
    },

    // Hàm dùng để tắt thông báo loading thủ công nếu cần
    dismiss: (id?: string) => {
        toast.dismiss(id);
    }
};