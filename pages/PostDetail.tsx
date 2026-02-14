import React, { useState } from 'react';
import { Post, CategoryType, SysCategory } from '../types';
import { CATEGORY_CONFIG, MOCK_MERCHANTS } from '../constants';
import MapViewer from '../components/MapViewer';

interface PostDetailProps {
    post: Post;
    onBack: () => void;
    onMerchantClick: (id: string) => void;
    onShowToast: (msg: string) => void;
    categoryConfig?: Record<string, SysCategory>;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack, onMerchantClick, onShowToast, categoryConfig }) => {
    const [showMap, setShowMap] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const isMerchant = !!post.merchantId;
    
    // Check if valid coordinates exist
    const hasLocation = typeof post.lat === 'number' && typeof post.lng === 'number';

    const handleToggleFavorite = () => {
        setIsFavorited(!isFavorited);
        onShowToast(isFavorited ? '已取消收藏' : '收藏成功');
    };

    // Determine label: try dynamic config, fall back to constant, fall back to key
    const categoryLabel = categoryConfig?.[post.category]?.label || CATEGORY_CONFIG[post.category]?.label || post.category;

    return (
        <div className="bg-white min-h-screen pb-20 relative">
            {/* Map Modal */}
            {showMap && hasLocation && (
                <MapViewer 
                    lat={post.lat!} 
                    lng={post.lng!} 
                    title={post.location} 
                    onClose={() => setShowMap(false)} 
                />
            )}

            {/* Header */}
            <div className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md flex items-center px-4 justify-between z-50 border-b border-gray-100">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <span className="font-semibold text-gray-800">详情</span>
                <button className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
                    <i className="fa-solid fa-share-nodes text-gray-700"></i>
                </button>
            </div>

            <div className="pt-14">
                {/* Images */}
                {post.images.length > 0 ? (
                    <div className="h-64 bg-gray-100 w-full overflow-hidden relative">
                         <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                         <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            1/{post.images.length}
                         </div>
                    </div>
                ) : (
                    <div className="h-20 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                        暂无图片
                    </div>
                )}

                {/* Main Info */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-xl font-bold text-gray-900 leading-snug flex-1 mr-2">{post.title}</h1>
                        <div className="text-right">
                             <p className="text-xl font-bold text-danger">{post.price}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{categoryLabel}</span>
                        <span>{post.viewCount} 次浏览</span>
                        <span>•</span>
                        <span>发布于 {new Date(post.publishTime).toLocaleDateString()}</span>
                    </div>

                    {/* Attributes Grid (EAV Model display) */}
                    <div className="bg-surface rounded-lg p-3 grid grid-cols-2 gap-3 mb-4">
                        {post.attributes.map((attr, idx) => (
                            <div key={idx} className="flex flex-col">
                                <span className="text-xs text-gray-500">{attr.label}</span>
                                <span className="text-sm font-medium text-gray-800">{attr.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">描述</h3>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {post.description}
                        </p>
                    </div>

                    {/* Location Placeholder */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">位置</h3>
                        <div 
                            className={`h-32 rounded-lg flex items-center justify-center flex-col border transition-colors relative overflow-hidden group ${
                                hasLocation 
                                ? 'bg-blue-50 text-blue-400 border-blue-100 cursor-pointer hover:bg-blue-100' 
                                : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}
                            onClick={() => {
                                if (hasLocation) {
                                    setShowMap(true);
                                } else {
                                    onShowToast('该发布未包含具体的地图坐标信息');
                                }
                            }}
                        >
                            {/* Map Pattern Overlay */}
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            
                            <i className={`fa-solid ${hasLocation ? 'fa-map-location-dot' : 'fa-location-dot'} text-3xl mb-2 relative z-10 ${hasLocation ? 'group-hover:scale-110 transition-transform' : ''}`}></i>
                            <span className="text-sm font-medium relative z-10">{post.location} {post.distance ? `(${post.distance})` : ''}</span>
                            
                            {hasLocation ? (
                                <span className="text-xs mt-1 bg-white/50 px-2 py-0.5 rounded text-blue-500 relative z-10">
                                    <i className="fa-solid fa-magnifying-glass-location mr-1"></i>
                                    点击查看地图
                                </span>
                            ) : (
                                <span className="text-xs mt-1 bg-gray-200/50 px-2 py-0.5 rounded text-gray-500 relative z-10">
                                    暂无地图信息
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Author/Merchant Card */}
                    <div className="border-t border-gray-100 pt-4">
                        <div 
                            className="flex items-center justify-between p-3 rounded-lg active:bg-gray-50 transition-colors"
                            onClick={() => isMerchant && onMerchantClick(post.merchantId!)}
                        >
                            <div className="flex items-center gap-3">
                                <img src={post.avatarUrl} className="w-12 h-12 rounded-full border border-gray-100" alt="avatar" />
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-gray-900">{post.authorName}</span>
                                        {isMerchant && <i className="fa-solid fa-circle-check text-blue-500 text-xs"></i>}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {isMerchant ? '认证商户' : '个人用户'}
                                    </span>
                                </div>
                            </div>
                            {isMerchant && (
                                <button className="text-sm text-primary font-medium">进店</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 flex gap-3 z-50 safe-area-bottom">
                <button 
                    onClick={handleToggleFavorite}
                    className={`flex-1 flex flex-col items-center justify-center transition-colors active:scale-95 ${isFavorited ? 'text-primary' : 'text-gray-500 active:text-gray-800'}`}
                >
                    <i className={`${isFavorited ? 'fa-solid' : 'fa-regular'} fa-star text-lg`}></i>
                    <span className="text-[10px]">{isFavorited ? '已收藏' : '收藏'}</span>
                </button>
                 {/* Use anchor tag with tel: scheme for better mobile experience */}
                 <a 
                    href={`tel:${post.contactPhone}`}
                    className="flex-[4] bg-primary text-white font-semibold rounded-full py-2 shadow-lg active:bg-blue-600 flex items-center justify-center gap-2"
                 >
                    <i className="fa-solid fa-phone"></i>
                    拨打电话 {post.contactPhone}
                </a>
            </div>
        </div>
    );
};

export default PostDetail;