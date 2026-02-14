import React from 'react';
import { User, ViewState } from '../types';

interface ProfileProps {
    user: User | null;
    onNavigateToLogin: () => void;
    onLogout: () => void;
    onNavigate: (view: ViewState) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onNavigateToLogin, onLogout, onNavigate }) => {
    
    const handleAuthAction = (action: () => void) => {
        if (!user) {
            onNavigateToLogin();
        } else {
            action();
        }
    };

    const handleLogout = () => {
        // Removed window.confirm to ensure responsiveness in all environments
        // Direct logout allows immediate feedback
        onLogout();
    };

    // Define menu items with explicit auth requirements
    const menuGroup1 = [
        { icon: 'fa-box-open', label: '我的发布', color: 'text-blue-500', action: () => onNavigate('MY_POSTS'), requiresAuth: true },
        { icon: 'fa-file-invoice', label: '我的订单', color: 'text-orange-500', action: () => onNavigate('MY_ORDERS'), requiresAuth: true },
        { icon: 'fa-wallet', label: '我的钱包', color: 'text-red-500', action: () => onNavigate('WALLET'), requiresAuth: true },
    ];

    const menuGroup2 = [
        { icon: 'fa-shop', label: '商家入驻', color: 'text-purple-500', action: () => onNavigate('MERCHANT_ENTRY'), requiresAuth: true },
        { icon: 'fa-headset', label: '联系管理员', color: 'text-green-500', action: () => onNavigate('SUPPORT_CHAT'), requiresAuth: false }, // Renamed to "Contact Admin"
        { icon: 'fa-robot', label: 'AI 助手', color: 'text-blue-400', action: () => onNavigate('AI_CHAT'), requiresAuth: false }, 
        { icon: 'fa-circle-info', label: '关于我们', color: 'text-gray-500', action: () => onNavigate('ABOUT'), requiresAuth: false },
    ];

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header / User Card */}
            <div className={`text-white pt-10 pb-16 px-6 relative rounded-b-[2.5rem] shadow-lg mb-12 ${user?.isAdmin ? 'bg-gray-800' : 'bg-primary'}`}>
                <div className="flex items-center gap-4">
                    <div 
                        className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => user ? onNavigate('EDIT_PROFILE') : onNavigateToLogin()}
                    >
                        {user ? (
                            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <i className="fa-solid fa-user text-3xl text-white/70"></i>
                        )}
                    </div>
                    <div className="flex-1">
                        {user ? (
                            <div className="cursor-pointer" onClick={() => onNavigate('EDIT_PROFILE')}>
                                <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
                                    {user.nickname}
                                    <i className="fa-solid fa-pen-to-square text-xs opacity-70"></i>
                                    {user.isAdmin && <span className="bg-red-500 text-[10px] px-1.5 rounded">ADMIN</span>}
                                    {user.isVerified && !user.isAdmin && (
                                        <span className="bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                            <i className="fa-solid fa-check mr-0.5"></i>已实名
                                        </span>
                                    )}
                                </h1>
                                <p className="text-white/70 text-sm font-mono">ID: {user.phone}</p>
                            </div>
                        ) : (
                            <div onClick={onNavigateToLogin} className="cursor-pointer">
                                <h1 className="text-xl font-bold mb-1">登录 / 注册</h1>
                                <p className="text-white/70 text-xs">登录解锁更多精彩内容</p>
                            </div>
                        )}
                    </div>
                    {user && (
                        <button className="text-white/80" onClick={() => onNavigate('EDIT_PROFILE')}>
                            <i className="fa-solid fa-qrcode text-xl"></i>
                        </button>
                    )}
                </div>

                {/* Stats Card - Floating */}
                <div className="absolute -bottom-10 left-4 right-4 bg-white rounded-xl shadow-md p-4 flex justify-around text-center text-gray-800">
                    <div onClick={() => handleAuthAction(() => onNavigate('MY_COLLECTIONS'))} className="active:opacity-50 transition-opacity cursor-pointer">
                        <span className="block font-bold text-lg">{user ? 12 : '-'}</span>
                        <span className="text-xs text-gray-400">收藏</span>
                    </div>
                    <div onClick={() => handleAuthAction(() => onNavigate('MY_HISTORY'))} className="active:opacity-50 transition-opacity cursor-pointer">
                        <span className="block font-bold text-lg">{user ? 5 : '-'}</span>
                        <span className="text-xs text-gray-400">浏览</span>
                    </div>
                    <div onClick={() => handleAuthAction(() => onNavigate('MY_POSTS'))} className="active:opacity-50 transition-opacity cursor-pointer">
                        <span className="block font-bold text-lg">{user ? 2 : '-'}</span>
                        <span className="text-xs text-gray-400">帖子</span>
                    </div>
                    <div onClick={() => handleAuthAction(() => onNavigate('WALLET'))} className="active:opacity-50 transition-opacity cursor-pointer">
                        <span className="block font-bold text-lg">{user ? 89 : '-'}</span>
                        <span className="text-xs text-gray-400">积分</span>
                    </div>
                </div>
            </div>

            {/* Menu List */}
            <div className="px-4 space-y-3">
                {user?.isAdmin && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-200">
                        <button 
                            onClick={() => onNavigate('ADMIN_DASHBOARD')}
                            className="w-full flex items-center justify-between p-4 bg-gray-900 text-white active:bg-gray-800"
                        >
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-gauge-high text-lg w-6 text-center text-yellow-400"></i>
                                <span className="text-sm font-bold">管理员后台 (Dashboard)</span>
                            </div>
                            <i className="fa-solid fa-chevron-right text-xs text-white/50"></i>
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                     {menuGroup1.map((item, idx) => (
                         <button 
                            key={idx} 
                            onClick={() => {
                                if (item.requiresAuth) {
                                    handleAuthAction(item.action);
                                } else {
                                    item.action();
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 last:border-0 transition-colors"
                        >
                             <div className="flex items-center gap-3">
                                <i className={`fa-solid ${item.icon} text-lg w-6 text-center ${item.color}`}></i>
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                             </div>
                             <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
                         </button>
                     ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                     {menuGroup2.map((item, idx) => (
                         <button 
                            key={idx} 
                            onClick={() => {
                                if (item.requiresAuth) {
                                    handleAuthAction(item.action);
                                } else {
                                    item.action();
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 last:border-0 transition-colors"
                        >
                             <div className="flex items-center gap-3">
                                <i className={`fa-solid ${item.icon} text-lg w-6 text-center ${item.color}`}></i>
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                             </div>
                             <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
                         </button>
                     ))}
                </div>

                {user && (
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-white rounded-xl shadow-sm p-3 text-center text-red-500 font-medium active:bg-red-50 transition-colors mt-6"
                    >
                        退出登录
                    </button>
                )}
            </div>
            
            <div className="mt-8 text-center text-[10px] text-gray-300">
                CityInfo v1.2.0 Build 2024
            </div>
        </div>
    );
};

export default Profile;