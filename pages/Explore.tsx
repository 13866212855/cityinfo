import React, { useState } from 'react';

interface ExploreProps {
    onShowToast?: (msg: string, type: 'sms' | 'info') => void;
}

const Explore: React.FC<ExploreProps> = ({ onShowToast }) => {
    const [signedUpIds, setSignedUpIds] = useState<number[]>([]);

    const TOPICS = [
        { id: 1, title: '#周末去哪儿玩', views: '2.3w' },
        { id: 2, title: '#二手好物交换', views: '1.1w' },
        { id: 3, title: '#本地美食探店', views: '8k' },
        { id: 4, title: '#求职避坑指南', views: '5k' }
    ];

    const EVENTS = [
        { id: 1, title: '城市夜跑俱乐部 - 第1期', time: '本周五晚 20:00 · 世纪公园', image: 'https://picsum.photos/200/200?random=51' },
        { id: 2, title: '城市夜跑俱乐部 - 第2期', time: '下周五晚 20:00 · 世纪公园', image: 'https://picsum.photos/200/200?random=52' }
    ];

    const handleSignup = (id: number, title: string) => {
        if (signedUpIds.includes(id)) return;
        
        // Optimistic update
        setSignedUpIds(prev => [...prev, id]);
        
        // Show feedback
        if (onShowToast) {
            onShowToast(`🎉 报名成功！已加入 ${title}`, 'info');
        } else {
            alert(`报名成功: ${title}`);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100">
                <h1 className="text-xl font-bold text-center">发现</h1>
            </div>

            {/* Topics */}
            <div className="p-4">
                <h2 className="font-bold text-gray-800 mb-3">热门话题</h2>
                <div className="flex flex-wrap gap-2">
                    {TOPICS.map(t => (
                        <div key={t.id} className="bg-white px-3 py-2 rounded-full border border-gray-100 shadow-sm text-sm text-gray-700">
                            <span className="text-primary font-bold mr-1">#</span>
                            {t.title.replace('#', '')}
                            <span className="text-xs text-gray-400 ml-2">{t.views}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="px-4 mb-4">
                 <h2 className="font-bold text-gray-800 mb-3">周边探索</h2>
                 <div className="w-full h-48 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-blue-400 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-transform">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <i className="fa-solid fa-map text-3xl mb-2 relative z-10 group-hover:scale-110 transition-transform"></i>
                    <span className="text-sm font-medium relative z-10">查看地图模式</span>
                 </div>
            </div>

            {/* Event List */}
            <div className="bg-white p-4">
                <h2 className="font-bold text-gray-800 mb-3">同城活动</h2>
                {EVENTS.map(event => (
                    <div key={event.id} className="flex gap-3 mb-4 last:mb-0 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                             <img src={event.image} className="w-full h-full object-cover rounded-lg" alt="event" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 line-clamp-1">{event.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(j => (
                                        <div key={j} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                                    ))}
                                    <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] text-gray-500 font-bold">+99</div>
                                </div>
                                <button 
                                    onClick={() => handleSignup(event.id, event.title)}
                                    disabled={signedUpIds.includes(event.id)}
                                    className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${
                                        signedUpIds.includes(event.id) 
                                        ? 'bg-gray-100 text-gray-400 cursor-default' 
                                        : 'bg-black text-white shadow-md active:scale-95 hover:bg-gray-800'
                                    }`}
                                >
                                    {signedUpIds.includes(event.id) ? '已报名' : '报名'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Explore;