import { Search } from 'lucide-react';

export default function HeroBanner() {
    return (
        <div className="bg-primary/5 py-12 md:py-20 relative">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                    Tìm trọ sinh viên <span className="text-primary">Đại học Thái Nguyên</span>
                </h1>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Dễ dàng tìm kiếm chỗ ở ưng ý, gần trường, an ninh tốt và giá cả minh bạch chỉ với vài cú click chuột.
                </p>

                {/* Bộ lọc trung tâm */}
                <div className="max-w-4xl mx-auto bg-white p-2 rounded-full shadow-lg flex flex-col md:flex-row items-center gap-2">
                    <div className="flex-1 w-full flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-100 py-2">
                        <input
                            type="text"
                            placeholder="Nhập tên trường, khu vực..."
                            className="w-full focus:outline-none text-gray-700"
                        />
                    </div>
                    <div className="flex-1 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
                        <select className="w-full focus:outline-none text-gray-600 bg-transparent cursor-pointer">
                            <option value="">Tất cả khoảng giá</option>
                            <option value="under-1m">Dưới 1 triệu</option>
                            <option value="1m-2m">1 triệu - 2 triệu</option>
                            <option value="over-2m">Trên 2 triệu</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full px-4 py-2">
                        <select className="w-full focus:outline-none text-gray-600 bg-transparent cursor-pointer">
                            <option value="desc">Giá từ cao đến thấp</option>
                            <option value="asc">Giá từ thấp đến cao</option>
                            <option value="rating">Đánh giá cao nhất</option>
                        </select>
                    </div>
                    <button className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 font-medium mt-2 md:mt-0">
                        <Search className="w-5 h-5" />
                        Tìm kiếm
                    </button>
                </div>
            </div>
        </div>
    );
}