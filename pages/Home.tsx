import React, { useState, useMemo } from 'react';
import { CATEGORY_CONFIG, MOCK_BANNERS } from '../constants';
import { CategoryType, Post, BannerAd } from '../types';
import PostCard from '../components/PostCard';

interface HomeProps {
    currentCity: string;
    posts: Post[];
    announcement: string;
    onCityClick: () => void;
    onPostClick: (post: Post) => void;
    onMerchantClick: (id: string) => void;
    onBannerClick: (banner: BannerAd) => void;
    onConsultClick: () => void;
}

type TabType = 'RECOMMENDED' | 'NEARBY' | 'NEWEST';

const Home: React.FC<HomeProps> = ({ 
    currentCity, 
    posts, 
    announcement,
    onCityClick, 
    onPostClick, 
    onMerchantClick, 
    onBannerClick,
    onConsultClick 
}) => {
    const [activeCategory, setActiveCategory] = useState<CategoryType | 'ALL'>('ALL');
    const [activeTab, setActiveTab] = useState<TabType>('RECOMMENDED');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPosts = useMemo(() => {
        // 1. Filter by Category and Search Term
        let res = posts.filter(p => {
            const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
            const matchesSearch = !searchTerm || 
                                  p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        // 2. Sort based on Active Tab
        if (activeTab === 'NEWEST') {
            res = [...res].sort((a, b) => b.publishTime - a.publishTime);
        } else if (activeTab === 'NEARBY') {
            // Helper to parse distance strings like "0.5km" to 0.5
            // If distance is missing, treat as far away (999km)
            const getDist = (s?: string) => {
                if (!s) return 9999;
                return parseFloat(s.replace(/[^0-9.]/g, ''));
            };
            res = [...res].sort((a, b) => getDist(a.distance) - getDist(b.distance));
        } else if (activeTab === 'RECOMMENDED') {
            // Recommended: Sticky posts first, then Newest
            res = [...res].sort((a, b) => {
                if (a.isSticky !== b.isSticky) {
                    return a.isSticky ? -1 : 1;
                }
                return b.publishTime - a.publishTime;
            });
        }

        return res;
    }, [posts, activeCategory, searchTerm, activeTab]);

    return (
        <div className="pb-20 relative min-h-screen">
            {/* Header / Search */}
            <div className="bg-primary px-4 pt-12 pb-4 sticky top-0 z-40 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                    <button onClick={onCityClick} className="flex items-center text-white text-sm font-medium active:opacity-80">
                        <i className="fa-solid fa-location-dot mr-1"></i>
                        <span className="max-w-[100px] truncate">{currentCity}</span>
                        <i className="fa-solid fa-chevron-down text-xs ml-1"></i>
                    </button>
                    <div className="flex-1 text-white text-right text-xs opacity-90">
                        多云 24°C
                    </div>
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="搜索租房、招聘、服务..." 
                        className="w-full h-10 pl-9 pr-4 rounded-full text-sm outline-none text-gray-700 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-sm"></i>
                </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-5 gap-y-4 gap-x-2 p-4 bg-white mb-2">
                {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map((cat) => (
                    <div 
                        key={cat} 
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => setActiveCategory(activeCategory === cat ? 'ALL' : cat)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-active:scale-95 ${activeCategory === cat ? 'ring-2 ring-offset-2 ring-primary' : ''} ${CATEGORY_CONFIG[cat].color}`}>
                            <i className={`fa-solid ${CATEGORY_CONFIG[cat].icon} text-lg`}></i>
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium">{CATEGORY_CONFIG[cat].label}</span>
                    </div>
                ))}
            </div>

            {/* Announcement / Marquee Bar */}
            {announcement && (
                <div className="bg-orange-50 text-orange-600 px-4 py-2 flex items-center gap-2 mb-2 border-y border-orange-100 overflow-hidden">
                    <i className="fa-solid fa-volume-high text-sm flex-shrink-0 animate-pulse"></i>
                    <div className="flex-1 overflow-hidden relative h-5">
                        <div className="absolute whitespace-nowrap animate-marquee text-xs font-medium leading-5">
                            {announcement}
                        </div>
                    </div>
                </div>
            )}

            {/* Banners (Clickable & Scrollable) */}
            {activeCategory === 'ALL' && (
                <div className="px-4 mb-4 overflow-x-auto no-scrollbar flex gap-3 snap-x snap-mandatory">
                    {MOCK_BANNERS.map(banner => (
                        <div 
                            key={banner.id} 
                            onClick={() => onBannerClick(banner)}
                            className="min-w-[85%] snap-center relative rounded-xl overflow-hidden shadow-sm h-32 cursor-pointer active:opacity-90 transition-opacity"
                        >
                            <img src={banner.imageUrl} className="w-full h-full object-cover pointer-events-none" alt={banner.title} />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pointer-events-none">
                                <span className="text-white font-medium text-sm flex items-center justify-between">
                                    {banner.title}
                                    <i className="fa-solid fa-circle-chevron-right text-xs opacity-80"></i>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sticky/Tabs Header for Feed */}
            <div className="sticky top-[108px] bg-white z-30 border-b border-gray-100 flex px-4 gap-6 text-sm font-medium h-10 items-center">
                <button 
                    onClick={() => setActiveTab('RECOMMENDED')}
                    className={`h-full border-b-2 transition-colors ${activeTab === 'RECOMMENDED' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400'}`}
                >
                    推荐
                </button>
                <button 
                    onClick={() => setActiveTab('NEARBY')}
                    className={`h-full border-b-2 transition-colors ${activeTab === 'NEARBY' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400'}`}
                >
                    附近
                </button>
                <button 
                    onClick={() => setActiveTab('NEWEST')}
                    className={`h-full border-b-2 transition-colors ${activeTab === 'NEWEST' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400'}`}
                >
                    最新
                </button>
            </div>

            {/* Feed */}
            <div className="min-h-[300px] pt-2">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            onClick={onPostClick} 
                            onMerchantClick={onMerchantClick}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <i className="fa-regular fa-folder-open text-4xl mb-2"></i>
                        <p>暂无内容</p>
                        {(activeCategory !== 'ALL' || searchTerm) && (
                            <button 
                                onClick={() => { setActiveCategory('ALL'); setSearchTerm(''); }}
                                className="mt-4 text-xs text-primary border border-primary px-3 py-1 rounded-full"
                            >
                                清除筛选
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            <div className="text-center py-4 text-xs text-gray-400">
                已经到底了
            </div>

            {/* Floating Consult Button */}
            <button 
                onClick={onConsultClick}
                className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white z-50 animate-bounce active:scale-95 transition-transform"
            >
                <i className="fa-solid fa-headset text-2xl"></i>
                <span className="absolute -bottom-6 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-80">咨询</span>
            </button>
        </div>
    );
};

export default Home;