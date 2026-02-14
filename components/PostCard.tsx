import React from 'react';
import { Post, CategoryType } from '../types';
import { CATEGORY_CONFIG } from '../constants';

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
  onMerchantClick: (merchantId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, onMerchantClick }) => {
  const timeAgo = (date: number) => {
    const seconds = Math.floor((Date.now() - date) / 1000);
    if (seconds < 60) return '刚刚';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  const handleMerchantClick = (e: React.MouseEvent) => {
    if (post.merchantId) {
      e.stopPropagation();
      onMerchantClick(post.merchantId);
    }
  };

  return (
    <div 
      onClick={() => onClick(post)}
      className={`bg-white p-4 mb-2 shadow-sm border-b border-gray-100 active:bg-gray-50 transition-colors cursor-pointer ${post.isSticky ? 'bg-yellow-50/30' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
            {post.isSticky && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded">置顶</span>
            )}
            <h3 className="text-base font-semibold text-gray-800 line-clamp-1">{post.title}</h3>
        </div>
        <span className="text-red-500 font-bold text-sm whitespace-nowrap">{post.price}</span>
      </div>

      <div className="flex gap-3 mb-3">
        {post.images.length > 0 && (
          <img 
            src={post.images[0]} 
            alt={post.title} 
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-200"
          />
        )}
        <div className="flex flex-col justify-between flex-grow h-24">
            <div className="flex flex-wrap gap-1 content-start">
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{CATEGORY_CONFIG[post.category].label}</span>
                {post.attributes.slice(0, 2).map((attr, idx) => (
                    <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {attr.value}
                    </span>
                ))}
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-1">{post.description}</p>
            
            <div className="flex justify-between items-end mt-1">
                <div 
                    className="flex items-center gap-1.5" 
                    onClick={handleMerchantClick}
                >
                    <img src={post.avatarUrl} className="w-4 h-4 rounded-full" alt="avatar" />
                    <span className={`text-xs ${post.merchantId ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {post.authorName}
                        {post.merchantId && <i className="fa-solid fa-circle-check ml-1 text-[10px]"></i>}
                    </span>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>{post.distance}</span>
                    <span>•</span>
                    <span>{timeAgo(post.publishTime)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;