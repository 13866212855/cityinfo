import React from 'react';
import { Merchant, Post, ServiceItem } from '../types';
import { MOCK_MERCHANTS, MOCK_SERVICES } from '../constants';
import PostCard from '../components/PostCard';

interface MerchantShopProps {
    merchantId: string;
    posts: Post[];
    onBack: () => void;
    onPostClick: (post: Post) => void;
}

const MerchantShop: React.FC<MerchantShopProps> = ({ merchantId, posts, onBack, onPostClick }) => {
    const merchant = MOCK_MERCHANTS[merchantId];
    const merchantServices = MOCK_SERVICES.filter(s => s.merchantId === merchantId);
    const merchantPosts = posts.filter(p => p.merchantId === merchantId);
    
    if (!merchant) return <div>未找到商户</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
             {/* Header Image */}
             <div className="h-40 w-full relative bg-gray-800">
                <img src={merchant.bannerUrl} className="w-full h-full object-cover opacity-70" alt="banner" />
                <button 
                    onClick={onBack}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center z-10"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
             </div>

             {/* Profile Card */}
             <div className="px-4 -mt-12 relative z-10 mb-4">
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex justify-between items-start">
                        <img src={merchant.logoUrl} className="w-16 h-16 rounded-lg border-2 border-white shadow-md -mt-10 bg-white" alt="logo" />
                        <button className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
                            + 关注
                        </button>
                    </div>
                    <div className="mt-2">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1">
                            {merchant.name}
                            {merchant.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-sm"></i>}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1 text-orange-500">
                                <i className="fa-solid fa-star"></i> {merchant.rating}
                            </span>
                            <span>{merchant.followers} 粉丝</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{merchant.description}</p>
                        
                        <div className="mt-3 flex gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                <i className="fa-solid fa-location-dot"></i>
                                {merchant.address}
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Services Section (Merchant Context specific) */}
             {merchantServices.length > 0 && (
                 <div className="mb-4 bg-white py-4">
                     <div className="px-4 flex justify-between items-center mb-3">
                        <h2 className="font-bold text-gray-900">精选服务</h2>
                        <span className="text-xs text-gray-400">查看全部</span>
                     </div>
                     <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar pb-2">
                        {merchantServices.map(service => (
                            <div key={service.id} className="min-w-[140px] border border-gray-100 rounded-lg p-2">
                                <img src={service.imageUrl} className="w-full h-24 object-cover rounded mb-2 bg-gray-100" alt={service.title} />
                                <h3 className="text-sm font-medium line-clamp-1">{service.title}</h3>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-danger font-bold text-sm">¥{service.price}</span>
                                    <span className="text-[10px] text-gray-400">已售 {service.salesCount}</span>
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
             )}

             {/* Posts Feed */}
             <div className="bg-white py-4 min-h-[200px]">
                <div className="px-4 mb-3">
                    <h2 className="font-bold text-gray-900">最新发布</h2>
                </div>
                {merchantPosts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        onClick={onPostClick}
                        onMerchantClick={() => {}} // No-op since we are already here
                    />
                ))}
                {merchantPosts.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">暂无发布</div>
                )}
             </div>
        </div>
    );
};

export default MerchantShop;