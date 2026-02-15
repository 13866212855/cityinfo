import React, { useState, useEffect } from 'react';
import { Post, User, SysCategory } from '../types';
import PostCard from '../components/PostCard';
import { api } from '../services/supabase';

interface SubViewProps {
    onBack: () => void;
    onShowToast?: (msg: string, type: 'sms' | 'info') => void;
}

interface PostViewProps extends SubViewProps {
    posts: Post[];
    user?: User | null;
    onPostClick: (post: Post) => void;
    onPublish?: () => void;
    categoryConfig?: Record<string, SysCategory>;
}

// --- Component: MyPosts ---
export const MyPosts: React.FC<PostViewProps> = ({ posts, user, onBack, onPostClick, onPublish, categoryConfig }) => {
    // Filter posts by user. In mock, we might filter by authorName matching user nickname or specific ID
    const myPosts = user ? posts.filter(p => p.authorName === user.nickname || (p as any).userId === user.id) : [];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">我的发布</h1>
                <button onClick={onPublish} className="text-primary text-sm font-medium">
                    <i className="fa-solid fa-plus mr-1"></i>发布
                </button>
            </div>
            
            <div className="py-2">
                {myPosts.length > 0 ? (
                    myPosts.map(post => (
                         <PostCard 
                            key={post.id} 
                            post={post} 
                            onClick={onPostClick}
                            onMerchantClick={() => {}}
                            categoryConfig={categoryConfig}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
                        <i className="fa-regular fa-folder-open text-4xl mb-4"></i>
                        <p>您还没有发布过任何内容</p>
                        <button onClick={onPublish} className="mt-4 bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-md">
                            去发布
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Component: MyOrders ---
export const MyOrders: React.FC<SubViewProps> = ({ onBack, onShowToast }) => {
    const tabs = ['全部', '待付款', '待服务', '已完成'];
    const [activeTab, setActiveTab] = useState('全部');

    // Mock Orders
    const orders = [
        { id: 'o1', title: '2小时深度保洁', price: 89.99, status: '待服务', image: 'https://picsum.photos/200/200?random=20', merchant: '极速家政服务' },
        { id: 'o2', title: '空调清洗基础套餐', price: 59.00, status: '已完成', image: 'https://picsum.photos/200/200?random=21', merchant: '极速家政服务' }
    ];

    const filtered = activeTab === '全部' ? orders : orders.filter(o => o.status === activeTab);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-white sticky top-0 z-10">
                <div className="p-4 border-b border-gray-100 flex items-center">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
                        <i className="fa-solid fa-arrow-left text-gray-700"></i>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">我的订单</h1>
                </div>
                <div className="flex border-b border-gray-100">
                    {tabs.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-3">
                {filtered.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-700">{order.merchant} <i className="fa-solid fa-chevron-right text-[10px] text-gray-400"></i></span>
                            <span className="text-xs text-primary">{order.status}</span>
                        </div>
                        <div className="flex gap-3 mb-3">
                            <img src={order.image} className="w-20 h-20 rounded-lg object-cover bg-gray-100" alt="order" />
                            <div className="flex-1 flex flex-col justify-between">
                                <h3 className="font-medium text-gray-900 line-clamp-2">{order.title}</h3>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400">共1件 </span>
                                    <span className="font-bold">¥{order.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                             <button className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600">联系商家</button>
                             <button className="px-3 py-1.5 border border-primary text-primary rounded-full text-xs font-medium">再来一单</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Component: Wallet ---
export const Wallet: React.FC<SubViewProps> = ({ onBack }) => {
    const [balance, setBalance] = useState(88.50);
    const [view, setView] = useState<'MAIN' | 'RECHARGE' | 'WITHDRAW'>('MAIN');
    
    // Recharge State
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeStep, setRechargeStep] = useState<'INPUT' | 'CONFIRM'>('INPUT');
    const [rechargeQr, setRechargeQr] = useState('');
    const [isLoadingQr, setIsLoadingQr] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const FALLBACK_QR = 'https://dummyimage.com/300x300/eee/aaa&text=QR+Code';

    useEffect(() => {
        const loadQr = async () => {
            setIsLoadingQr(true);
            try {
                const url = await api.getSystemConfig('recharge_qr');
                if (url) {
                    setRechargeQr(url);
                } else {
                    console.log('No QR code configured, using fallback');
                }
            } catch (error) {
                console.error('Failed to load QR code:', error);
                // Silent failure - will use fallback QR
            } finally {
                setIsLoadingQr(false);
            }
        };
        loadQr();
    }, []);

    const handleRechargeConfirm = async () => {
        if (!rechargeAmount) return;
        await api.createRecharge({
            userId: 'current_user',
            type: 'RECHARGE',
            title: '余额充值',
            amount: parseFloat(rechargeAmount),
        });
        alert('充值申请已提交，请等待管理员确认');
        setView('MAIN');
        setRechargeStep('INPUT');
        setRechargeAmount('');
    };

    if (view === 'RECHARGE') {
        return (
            <div className="bg-white min-h-screen flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center">
                    <button onClick={() => { setView('MAIN'); setRechargeStep('INPUT'); }} className="w-8 h-8 flex items-center justify-center -ml-2">
                        <i className="fa-solid fa-arrow-left text-gray-700"></i>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">余额充值</h1>
                </div>
                
                <div className="p-6 flex-1">
                    {rechargeStep === 'INPUT' ? (
                        <div className="animate-in fade-in duration-300">
                             <p className="text-sm text-gray-500 mb-4">请输入充值金额</p>
                             <div className="text-3xl font-bold flex items-center border-b border-gray-200 py-2 mb-8">
                                 <span className="mr-2">¥</span>
                                 <input 
                                    type="number" 
                                    className="w-full outline-none" 
                                    placeholder="0.00"
                                    value={rechargeAmount}
                                    onChange={(e) => setRechargeAmount(e.target.value)}
                                    autoFocus
                                />
                             </div>
                             
                             <div className="grid grid-cols-3 gap-3 mb-8">
                                {[10, 50, 100, 200, 500, 1000].map(amt => (
                                    <button 
                                        key={amt}
                                        onClick={() => setRechargeAmount(amt.toString())}
                                        className={`py-3 rounded-lg border ${rechargeAmount === amt.toString() ? 'border-primary text-primary bg-blue-50' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        {amt}元
                                    </button>
                                ))}
                             </div>

                             <button 
                                onClick={() => rechargeAmount && setRechargeStep('CONFIRM')}
                                disabled={!rechargeAmount}
                                className={`w-full py-3.5 rounded-full font-bold text-white shadow-lg ${!rechargeAmount ? 'bg-blue-300' : 'bg-primary'}`}
                             >
                                下一步
                             </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-right duration-300">
                            <p className="text-gray-500 text-sm mb-4">请扫描下方二维码支付 <span className="font-bold text-gray-900">¥{parseFloat(rechargeAmount).toFixed(2)}</span></p>
                            
                            {/* QR Code Display with Loading State */}
                            <div 
                                className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-4 relative cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => !isLoadingQr && setShowQrModal(true)}
                            >
                                {isLoadingQr ? (
                                    // Loading skeleton
                                    <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-100 animate-pulse">
                                        <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
                                        <span className="text-xs text-gray-500">加载中...</span>
                                    </div>
                                ) : (
                                    <>
                                        <img 
                                            src={rechargeQr || FALLBACK_QR} 
                                            alt="收款二维码" 
                                            className="w-48 h-48 object-contain"
                                            onError={(e) => {
                                                console.warn('QR image failed to load, using fallback');
                                                // Fallback to default QR if image load fails
                                                e.currentTarget.src = FALLBACK_QR;
                                                e.currentTarget.onerror = null; // Prevent infinite loop
                                            }}
                                        />
                                        {/* Click hint overlay */}
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 hover:opacity-100 text-white text-xs bg-black/70 px-2 py-1 rounded">
                                                点击放大
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* QR Code Modal */}
                            {showQrModal && (
                                <div 
                                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                                    onClick={() => setShowQrModal(false)}
                                >
                                    <div className="relative max-w-md w-full">
                                        <button 
                                            onClick={() => setShowQrModal(false)}
                                            className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                                        >
                                            <i className="fa-solid fa-xmark text-xl"></i>
                                        </button>
                                        <div className="bg-white p-4 rounded-2xl shadow-2xl">
                                            <img 
                                                src={rechargeQr || FALLBACK_QR} 
                                                alt="收款二维码" 
                                                className="w-full h-auto object-contain"
                                                onClick={(e) => e.stopPropagation()}
                                                onError={(e) => {
                                                    e.currentTarget.src = FALLBACK_QR;
                                                    e.currentTarget.onerror = null;
                                                }}
                                            />
                                            <p className="text-center text-sm text-gray-600 mt-3">
                                                长按图片保存二维码
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {!rechargeQr && !isLoadingQr && (
                                <p className="text-xs text-orange-500 mb-2">
                                    <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                                    管理员尚未配置收款码
                                </p>
                            )}
                            
                            <p className="text-xs text-gray-400 mb-6 flex items-center gap-2">
                                <i className="fa-brands fa-weixin text-green-500"></i>
                                <i className="fa-brands fa-alipay text-blue-500"></i>
                                支持微信 / 支付宝
                            </p>

                            <button 
                                onClick={handleRechargeConfirm}
                                className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-green-600 active:scale-95 transition-all"
                            >
                                我已完成支付
                            </button>
                            <button 
                                onClick={() => setRechargeStep('INPUT')}
                                className="mt-4 text-sm text-blue-500 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                返回修改金额
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
             <div className="bg-primary text-white p-6 pb-12 relative overflow-hidden">
                <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="mt-8 text-center">
                    <p className="text-white/80 text-sm mb-1">当前余额 (元)</p>
                    <h1 className="text-4xl font-bold">{balance.toFixed(2)}</h1>
                </div>
                
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
             </div>

             <div className="px-4 -mt-6">
                 <div className="bg-white rounded-xl shadow-lg p-6 flex justify-around items-center">
                     <button 
                        onClick={() => setView('RECHARGE')}
                        className="flex flex-col items-center gap-2 active:opacity-60"
                     >
                         <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">
                            <i className="fa-solid fa-arrow-up"></i>
                         </div>
                         <span className="text-sm font-medium text-gray-800">充值</span>
                     </button>
                     <div className="w-px h-10 bg-gray-100"></div>
                     <button className="flex flex-col items-center gap-2 active:opacity-60">
                         <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                            <i className="fa-solid fa-arrow-down"></i>
                         </div>
                         <span className="text-sm font-medium text-gray-800">提现</span>
                     </button>
                 </div>
             </div>

             <div className="p-4 mt-2">
                 <h3 className="font-bold text-gray-800 mb-3">账单明细</h3>
                 <div className="bg-white rounded-xl p-4 shadow-sm text-center text-gray-400 text-sm py-10">
                     暂无交易记录
                 </div>
             </div>
        </div>
    );
};

// --- Component: MerchantEntry ---
export const MerchantEntry: React.FC<SubViewProps> = ({ onBack }) => {
    return (
        <div className="bg-white min-h-screen pb-safe">
            <div className="relative h-64 bg-gray-900 overflow-hidden">
                <img src="https://picsum.photos/800/600?random=99" className="w-full h-full object-cover opacity-60" alt="merchant bg" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                    <h1 className="text-3xl font-bold text-white mb-2">商家入驻</h1>
                    <p className="text-white/80">加入我们，连接全城千万用户，轻松拓展生意。</p>
                </div>
            </div>
            
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">入驻流程</h2>
                <div className="space-y-6 relative">
                    <div className="absolute top-2 left-4 bottom-2 w-0.5 bg-gray-100 -z-10"></div>
                    
                    {[
                        { title: '提交资料', desc: '填写店铺基本信息与经营资质' },
                        { title: '平台审核', desc: '工作日 24 小时内快速审核' },
                        { title: '签约上线', desc: '确认合作协议，店铺正式展示' }
                    ].map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md border-4 border-white">
                                {idx + 1}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{step.title}</h3>
                                <p className="text-sm text-gray-500">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10">
                    <button className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all">
                        立即申请入驻
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">如有疑问，请联系客服</p>
                </div>
            </div>
        </div>
    );
};

// --- Component: AboutUs ---
export const AboutUs: React.FC<SubViewProps> = ({ onBack }) => {
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">关于我们</h1>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center">
                <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white text-5xl shadow-xl mb-6 transform rotate-3">
                    <i className="fa-solid fa-city"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">CityInfo</h2>
                <p className="text-gray-500 mb-10">v1.2.0 (Build 2024)</p>
                
                <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                        <span className="text-gray-700">用户协议</span>
                        <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                        <span className="text-gray-700">隐私政策</span>
                        <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-gray-700">去评分</span>
                        <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                </div>
            </div>
            <div className="p-6 text-center text-xs text-gray-300">
                Copyright © 2024 CityInfo Team. All Rights Reserved.
            </div>
        </div>
    );
};

// --- Component: MyCollections ---
export const MyCollections: React.FC<PostViewProps> = ({ posts, onBack, onPostClick, categoryConfig }) => {
    // Mock: just take first 3 posts
    const collection = posts.slice(0, 3);
    
    return (
         <div className="bg-gray-50 min-h-screen">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">我的收藏</h1>
            </div>
            <div className="py-2">
                {collection.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        onClick={onPostClick}
                        onMerchantClick={() => {}}
                        categoryConfig={categoryConfig}
                    />
                ))}
            </div>
         </div>
    );
};

// --- Component: MyHistory ---
export const MyHistory: React.FC<PostViewProps> = ({ posts, onBack, onPostClick, categoryConfig }) => {
    // Mock: take random posts
    const history = posts.slice(0, 5);
    
    return (
         <div className="bg-gray-50 min-h-screen">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">浏览历史</h1>
                <button className="text-gray-400 text-sm">清空</button>
            </div>
            <div className="py-2">
                {history.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        onClick={onPostClick}
                        onMerchantClick={() => {}}
                        categoryConfig={categoryConfig}
                    />
                ))}
            </div>
         </div>
    );
};