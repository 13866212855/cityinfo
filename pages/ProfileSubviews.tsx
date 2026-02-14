import React, { useState, useEffect } from 'react';
import { Post, WithdrawalRequest, WalletTransaction, User } from '../types';
import PostCard from '../components/PostCard';
import { api } from '../services/supabase';

// Generic QR Placeholder (Base64)
const FALLBACK_QR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gQeFzc3S3Kj1wAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAB1klEQVR42u3SQQ0AAAgDMOZf2BDB2Rh0kC1h0t2z7wEOjFAYhMIgFAahMAiFQSgMQmEQCoNQGITCIBQGoTAIhUEoDEJhEAqDUBiEwiAUBqEwCIVBKAxCYRAKg1AYhMIgFAahMAiFQSgMQmEQCoNQGITCIBQGoTAIhUEoDEJhEAqDUBiEwiAUBqEwCIVBKAxCYRAKg1AYhMIgFAahMAiFQSgMQmEQCoNQGITCIBQGoTAIhUEoDEJhEAqDUBiEwiAUBqEwCIVBKAxCYRAKg1AYhMIgFAahMAiFQSgMQmEQCoNQGITCIBQGoTAIhUEoDEJhEAqDUHgAAAD//wMADKkC8y2zV5QAAAAASUVORK5CYII=";

// Shared Header Component
const SubPageHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
    <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
            <i className="fa-solid fa-arrow-left text-gray-700"></i>
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">{title}</h1>
    </div>
);

// --- 1. My Posts ---
interface MyPostsProps {
    posts: Post[];
    user: User | null;
    onBack: () => void;
    onPostClick: (post: Post) => void;
    onPublish: () => void;
}
export const MyPosts: React.FC<MyPostsProps> = ({ posts, user, onBack, onPostClick, onPublish }) => {
    // Filter posts by author name matching user nickname for demo purposes
    // In real app, match by user.id
    const myPosts = posts.filter(p => p.authorName === user?.nickname || p.authorName === '我');

    return (
        <div className="bg-gray-50 min-h-screen">
            <SubPageHeader title="我的发布" onBack={onBack} />
            <div className="py-2">
                {myPosts.length > 0 ? (
                    myPosts.map(post => (
                        <div key={post.id} className="relative group">
                            <PostCard post={post} onClick={onPostClick} onMerchantClick={() => {}} />
                            <div className="bg-white px-4 pb-3 flex justify-end border-b border-gray-100 mb-2">
                                <button className="text-xs px-3 py-1 border border-gray-300 rounded mr-2 hover:bg-gray-50">编辑</button>
                                <button className="text-xs px-3 py-1 border border-gray-300 rounded mr-2 hover:bg-gray-50">下架</button>
                                <button className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">删除</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-white text-3xl">
                             <i className="fa-solid fa-pen-nib"></i>
                        </div>
                        <p className="mb-4">您还没有发布过内容</p>
                        <button onClick={onPublish} className="text-primary text-sm font-bold border border-primary px-4 py-2 rounded-full active:bg-blue-50 transition-colors">去发布</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 1.1 My Collections (收藏) ---
interface MyCollectionsProps {
    posts: Post[];
    onBack: () => void;
    onPostClick: (post: Post) => void;
}
export const MyCollections: React.FC<MyCollectionsProps> = ({ posts, onBack, onPostClick }) => {
    // Mock: Simply show the first 2 posts as "Collected" for demonstration
    const collectedPosts = posts.slice(0, 2);

    return (
        <div className="bg-gray-50 min-h-screen">
            <SubPageHeader title="我的收藏" onBack={onBack} />
            <div className="py-2">
                {collectedPosts.length > 0 ? (
                    collectedPosts.map(post => (
                        <PostCard key={post.id} post={post} onClick={onPostClick} onMerchantClick={() => {}} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                         <i className="fa-regular fa-star text-4xl mb-4 text-gray-300"></i>
                        <p>暂无收藏内容</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 1.2 My History (浏览记录) ---
interface MyHistoryProps {
    posts: Post[];
    onBack: () => void;
    onPostClick: (post: Post) => void;
}
export const MyHistory: React.FC<MyHistoryProps> = ({ posts, onBack, onPostClick }) => {
    // Mock: Show all posts as history
    const historyPosts = posts;

    return (
        <div className="bg-gray-50 min-h-screen">
            <SubPageHeader title="浏览足迹" onBack={onBack} />
            <div className="p-4 flex flex-col gap-3">
                 <div className="text-xs text-gray-400 mb-1 flex justify-between items-center">
                    <span>最近7天</span>
                    <button className="text-gray-500"><i className="fa-solid fa-trash-can mr-1"></i>清空</button>
                 </div>
                {historyPosts.length > 0 ? (
                    historyPosts.map(post => (
                        <div key={post.id} onClick={() => onPostClick(post)} className="flex bg-white p-3 rounded-lg shadow-sm gap-3 cursor-pointer active:bg-gray-50">
                             {post.images.length > 0 ? (
                                <img src={post.images[0]} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                             ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-300">
                                    <i className="fa-solid fa-image"></i>
                                </div>
                             )}
                             <div className="flex-1 flex flex-col justify-between py-1">
                                 <div>
                                     <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{post.title}</h3>
                                     <p className="text-xs text-gray-500 mt-1 line-clamp-1">{post.description}</p>
                                 </div>
                                 <div className="flex justify-between items-center">
                                     <span className="text-red-500 text-sm font-bold">{post.price}</span>
                                     <span className="text-[10px] text-gray-400">浏览于 10分钟前</span>
                                 </div>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <i className="fa-solid fa-clock-rotate-left text-4xl mb-4 text-gray-300"></i>
                        <p>暂无浏览记录</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- 2. My Orders ---
export const MyOrders: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const orders = [
        { id: 1, title: '2小时深度保洁', price: 89.99, status: '服务中', image: 'https://picsum.photos/200/200?random=20' },
        { id: 2, title: '空调清洗基础套餐', price: 59.00, status: '已完成', image: 'https://picsum.photos/200/200?random=21' },
        { id: 3, title: '同城急送 (文件)', price: 12.00, status: '已取消', image: 'https://picsum.photos/200/200?random=22' },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <SubPageHeader title="我的订单" onBack={onBack} />
            
            {/* Tabs */}
            <div className="flex bg-white border-b border-gray-100">
                {['全部', '待付款', '服务中', '已完成'].map((tab, idx) => (
                    <div key={tab} className={`flex-1 text-center py-3 text-sm font-medium ${idx === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                        {tab}
                    </div>
                ))}
            </div>

            <div className="p-4 space-y-3">
                {orders.map(order => (
                    <div key={order.id} className="bg-white p-3 rounded-xl shadow-sm flex gap-3">
                        <img src={order.image} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{order.title}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${order.status === '服务中' ? 'bg-blue-50 text-blue-500' : order.status === '已完成' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-gray-900">¥{order.price.toFixed(2)}</span>
                                <div className="flex gap-2">
                                    <button className="text-xs border border-gray-200 px-2 py-1 rounded">联系</button>
                                    <button className={`text-xs px-3 py-1 rounded text-white ${order.status === '已完成' ? 'bg-primary' : 'bg-gray-400'}`}>
                                        {order.status === '已完成' ? '再来一单' : '查看详情'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 3. Wallet ---
export const Wallet: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Current User Data
    const currentUser = JSON.parse(localStorage.getItem('cityinfo_user') || '{}');
    const [balance, setBalance] = useState(currentUser.balance || 86.50);

    const [view, setView] = useState<'MAIN' | 'RECHARGE' | 'WITHDRAW'>('MAIN');
    const [filter, setFilter] = useState<'ALL' | 'RECHARGE' | 'WITHDRAW'>('ALL');
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    
    // Recharge State
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeStep, setRechargeStep] = useState(1);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isFallback, setIsFallback] = useState(false);

    // Withdraw State
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState<'WECHAT' | 'ALIPAY' | 'BANK'>('WECHAT');
    const [withdrawAccount, setWithdrawAccount] = useState('');
    const [withdrawName, setWithdrawName] = useState('');
    const [withdrawBank, setWithdrawBank] = useState('');
    
    // Loading State
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Transactions
    useEffect(() => {
        if (currentUser.id) {
            api.getWalletTransactions(currentUser.id).then(setTransactions);
        }
        // Mock data if empty for demo
        if (transactions.length === 0 && !currentUser.id) {
            setTransactions([
                { id: '1', userId: 'demo', type: 'INCOME', title: '发布退款', amount: 5.00, balanceAfter: 86.50, status: 'SUCCESS', timestamp: Date.now() - 86400000 },
                { id: '2', userId: 'demo', type: 'EXPENSE', title: '置顶推广消耗', amount: -2.99, balanceAfter: 81.50, status: 'SUCCESS', timestamp: Date.now() - 172800000 },
            ]);
        }
    }, [view, currentUser.id]);

    useEffect(() => {
        if (view === 'RECHARGE' && rechargeStep === 2) {
            // Load QR Code Config
            api.getSystemConfig('recharge_qr').then(url => {
                if (url) {
                    setQrCodeUrl(url);
                    setIsFallback(false);
                } else {
                    setQrCodeUrl(FALLBACK_QR);
                    setIsFallback(true);
                }
            }).catch(() => {
                setQrCodeUrl(FALLBACK_QR);
                setIsFallback(true);
            });
        }
    }, [view, rechargeStep]);

    const refreshData = async () => {
        if (currentUser.id) {
            const list = await api.getWalletTransactions(currentUser.id);
            setTransactions(list);
            
            // Sync user balance from DB
            try {
                const { data } = await api.supabase.from('users').select('balance').eq('id', currentUser.id).single();
                if (data) {
                    setBalance(data.balance);
                    // Update local storage
                    currentUser.balance = data.balance;
                    localStorage.setItem('cityinfo_user', JSON.stringify(currentUser));
                }
            } catch (e) {}
        }
    };

    const handleRechargeSubmit = () => {
        if (!rechargeAmount || Number(rechargeAmount) <= 0) return alert('请输入有效金额');
        setRechargeStep(2);
    };

    const handleRechargeDone = async () => {
        const amount = Number(rechargeAmount);
        
        setIsSubmitting(true);
        try {
            // Create a PENDING transaction
            // We do NOT add balance here. Admin must approve.
            const tx: WalletTransaction = {
                id: `rc_${Date.now()}`,
                userId: currentUser.id || 'unknown',
                type: 'RECHARGE',
                title: '余额充值',
                amount: amount,
                balanceAfter: balance, // Balance stays same for now
                status: 'PENDING',
                timestamp: Date.now()
            };

            await api.createTransaction(tx);
            
            // Add to global backup for Admin Demo (in case DB is local mode)
            const globalBackup = JSON.parse(localStorage.getItem('global_pending_recharges_backup') || '[]');
            globalBackup.push(tx);
            localStorage.setItem('global_pending_recharges_backup', JSON.stringify(globalBackup));

            alert(`✅ 已提交充值申请 ¥${amount}。\n\n为了保障资金安全，系统将在管理员审核通过后自动为您入账，请耐心等待。`);
            
            await refreshData();
            setView('MAIN');
            setRechargeStep(1);
            setRechargeAmount('');
        } catch (e: any) {
            alert('充值记录保存失败，请联系管理员');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawSubmit = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return alert('请输入有效提现金额');
        if (Number(withdrawAmount) > balance) return alert('余额不足');
        if (!withdrawAccount) return alert('请输入收款账号');
        if ((withdrawMethod === 'BANK' || withdrawMethod === 'ALIPAY') && !withdrawName) return alert('请输入真实姓名');

        const amount = Number(withdrawAmount);
        
        setIsSubmitting(true);
        try {
            // This will create a Withdrawal Request AND a Transaction Record
            await api.createWithdrawal({
                id: `w_${Date.now()}`,
                userId: currentUser.id || 'unknown',
                userNickname: currentUser.nickname || 'Guest',
                amount: amount,
                method: withdrawMethod,
                account: withdrawAccount,
                realName: withdrawName,
                bankName: withdrawBank,
                status: 'PENDING',
                timestamp: Date.now()
            }, balance);

            const newBalance = balance - amount;
            setBalance(newBalance);
            
            // Update local user
            const updatedUser = { ...currentUser, balance: newBalance };
            localStorage.setItem('cityinfo_user', JSON.stringify(updatedUser));
            
            alert('✅ 提现申请已提交，等待管理员审核');
            await refreshData();
            setView('MAIN');
            setWithdrawAmount('');
            setWithdrawAccount('');
            setWithdrawName('');
        } catch (e: any) {
            alert(`${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'ALL') return true;
        return t.type === filter;
    });

    // --- RECHARGE VIEW ---
    if (view === 'RECHARGE') {
        return (
            <div className="bg-white min-h-screen flex flex-col">
                <SubPageHeader title="余额充值" onBack={() => { setView('MAIN'); setRechargeStep(1); }} />
                
                {rechargeStep === 1 ? (
                    <div className="p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">充值金额 (元)</label>
                        <div className="relative mb-6">
                            <span className="absolute left-3 top-3 text-2xl font-bold text-gray-800">¥</span>
                            <input 
                                type="number" 
                                className="w-full bg-gray-50 pl-8 pr-4 py-3 rounded-xl text-2xl font-bold outline-none border border-gray-200 focus:border-blue-500"
                                placeholder="0.00"
                                value={rechargeAmount}
                                onChange={e => setRechargeAmount(e.target.value)}
                            />
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-3">快速选择金额</p>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[10, 50, 100, 200, 500, 1000].map(amt => (
                                <button 
                                    key={amt}
                                    onClick={() => setRechargeAmount(amt.toString())}
                                    className={`py-2 rounded-lg text-sm font-medium border active:scale-95 transition-all ${rechargeAmount === amt.toString() ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-600 bg-white'}`}
                                >
                                    {amt}元
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleRechargeSubmit}
                            className="w-full bg-blue-600 text-white py-3.5 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                        >
                            确定充值
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="p-6 flex flex-col items-center text-center">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">请扫码支付</h2>
                            <p className="text-gray-500 text-sm mb-6">支付金额 <span className="text-blue-600 font-bold text-xl">¥{rechargeAmount}</span></p>
                            
                            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-2xl mb-4 flex flex-col items-center">
                                {qrCodeUrl ? (
                                    <div className="relative">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="Payment QR" 
                                            className="w-64 h-64 object-contain rounded-lg bg-white select-none pointer-events-auto touch-auto"
                                            // Explicitly enable default touch callout for iOS (Copy/Share/Scan) 
                                            style={{ WebkitTouchCallout: 'default' }}
                                            onError={(e) => {
                                                console.warn("QR Image load failed, switching to fallback");
                                                (e.target as HTMLImageElement).src = FALLBACK_QR;
                                                setIsFallback(true);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-64 h-64 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                                        <i className="fa-solid fa-spinner fa-spin mr-1"></i> 加载中...
                                    </div>
                                )}
                            </div>

                            {/* Long Press Hint */}
                            <p className="text-xs text-blue-500 mb-4 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse font-medium">
                                <i className="fa-solid fa-fingerprint mr-1"></i>
                                长按上方图片可识别二维码 / 保存
                            </p>
                            
                            {isFallback && (
                                <p className="text-[10px] text-orange-500 mb-2 bg-orange-50 px-2 py-1 rounded">
                                    <i className="fa-solid fa-circle-exclamation mr-1"></i>
                                    当前显示演示二维码 (Admin配置读取失败)
                                </p>
                            )}
                            
                            <p className="text-xs text-gray-400 mb-6 max-w-[240px] leading-relaxed">
                                请使用微信/支付宝扫一扫完成支付<br/>
                                支付成功后请务必点击下方按钮
                            </p>

                            <button 
                                onClick={handleRechargeDone}
                                disabled={isSubmitting}
                                className="w-full bg-green-500 text-white py-3.5 rounded-full font-bold shadow-lg active:scale-95 transition-transform mb-4"
                            >
                                {isSubmitting ? '正在处理...' : '我已完成支付'}
                            </button>
                            
                            <button 
                                onClick={() => setRechargeStep(1)}
                                className="text-gray-500 text-sm py-2 px-4"
                            >
                                返回修改金额
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- WITHDRAW VIEW ---
    if (view === 'WITHDRAW') {
        return (
            <div className="bg-white min-h-screen flex flex-col">
                <SubPageHeader title="余额提现" onBack={() => setView('MAIN')} />
                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-3">提现方式</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => setWithdrawMethod('WECHAT')}
                                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${withdrawMethod === 'WECHAT' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 text-gray-500'}`}
                            >
                                <i className="fa-brands fa-weixin text-xl"></i>
                                <span className="text-xs font-medium">微信零钱</span>
                            </button>
                            <button 
                                onClick={() => setWithdrawMethod('ALIPAY')}
                                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${withdrawMethod === 'ALIPAY' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500'}`}
                            >
                                <i className="fa-brands fa-alipay text-xl"></i>
                                <span className="text-xs font-medium">支付宝</span>
                            </button>
                            <button 
                                onClick={() => setWithdrawMethod('BANK')}
                                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${withdrawMethod === 'BANK' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-500'}`}
                            >
                                <i className="fa-solid fa-credit-card text-xl"></i>
                                <span className="text-xs font-medium">银行卡</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                                {withdrawMethod === 'WECHAT' ? '微信号' : withdrawMethod === 'ALIPAY' ? '支付宝账号' : '银行卡号'}
                            </label>
                            <input 
                                type="text" 
                                className="w-full bg-gray-50 p-3 rounded-lg outline-none border border-gray-200 focus:border-blue-500"
                                placeholder={withdrawMethod === 'WECHAT' ? '请输入微信号' : '请输入账号'}
                                value={withdrawAccount}
                                onChange={e => setWithdrawAccount(e.target.value)}
                            />
                        </div>
                        
                        {(withdrawMethod === 'ALIPAY' || withdrawMethod === 'BANK') && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">真实姓名</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 p-3 rounded-lg outline-none border border-gray-200 focus:border-blue-500"
                                    placeholder="请输入账号对应的真实姓名"
                                    value={withdrawName}
                                    onChange={e => setWithdrawName(e.target.value)}
                                />
                            </div>
                        )}

                        {withdrawMethod === 'BANK' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">开户银行</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 p-3 rounded-lg outline-none border border-gray-200 focus:border-blue-500"
                                    placeholder="例如：中国工商银行"
                                    value={withdrawBank}
                                    onChange={e => setWithdrawBank(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">提现金额</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-lg font-bold text-gray-800">¥</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-50 pl-8 pr-4 py-3 rounded-lg font-bold outline-none border border-gray-200 focus:border-blue-500"
                                    placeholder="0.00"
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">当前可提现余额 ¥{balance.toFixed(2)}</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleWithdrawSubmit}
                        disabled={isSubmitting}
                        className={`w-full text-white py-3.5 rounded-full font-bold shadow-lg transition-all ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 active:scale-95'}`}
                    >
                        {isSubmitting ? (
                            <span><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>提交中...</span>
                        ) : '提交申请'}
                    </button>
                </div>
            </div>
        );
    }

    // --- MAIN WALLET VIEW ---
    return (
        <div className="bg-gray-50 min-h-screen">
            <SubPageHeader title="我的钱包" onBack={onBack} />
            
            <div className="p-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fa-solid fa-wallet text-9xl"></i>
                    </div>
                    <p className="text-sm opacity-80 mb-1 relative z-10">总资产 (元)</p>
                    <h2 className="text-4xl font-bold mb-6 relative z-10">{balance.toFixed(2)}</h2>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setView('RECHARGE')}
                                className="bg-white text-blue-600 font-bold px-6 py-2 rounded-full text-sm shadow-md active:opacity-90 transition-opacity"
                            >
                                充值
                            </button>
                            <button 
                                onClick={() => setView('WITHDRAW')}
                                className="bg-blue-700/50 text-white border border-white/20 px-6 py-2 rounded-full text-sm backdrop-blur-sm active:bg-blue-700/70 transition-colors"
                            >
                                提现
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-6 mb-4 px-2 border-b border-gray-200 text-sm font-medium">
                    <button 
                        onClick={() => setFilter('ALL')}
                        className={`pb-2 border-b-2 transition-colors ${filter === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
                    >
                        全部明细
                    </button>
                    <button 
                        onClick={() => setFilter('RECHARGE')}
                        className={`pb-2 border-b-2 transition-colors ${filter === 'RECHARGE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
                    >
                        充值记录
                    </button>
                    <button 
                        onClick={() => setFilter('WITHDRAW')}
                        className={`pb-2 border-b-2 transition-colors ${filter === 'WITHDRAW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
                    >
                        提现记录
                    </button>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-xl shadow-sm min-h-[300px]">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                                        tx.type === 'RECHARGE' || tx.type === 'INCOME' ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'
                                    }`}>
                                        <i className={`fa-solid ${
                                            tx.type === 'RECHARGE' ? 'fa-arrow-down' : 
                                            tx.type === 'WITHDRAW' ? 'fa-arrow-up' : 
                                            tx.type === 'INCOME' ? 'fa-plus' : 'fa-minus'
                                        }`}></i>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900">{tx.title}</p>
                                            {tx.status === 'PENDING' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">审核中</span>}
                                            {tx.status === 'FAILED' && <span className="text-[10px] bg-red-50 text-red-500 px-1 rounded">失败</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(tx.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            {tx.balanceAfter !== undefined && ` · 余额 ${tx.balanceAfter.toFixed(2)}`}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <i className="fa-solid fa-receipt text-3xl mb-2 opacity-30"></i>
                            <p className="text-xs">暂无交易记录</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 4. Merchant Entry Form ---
export const MerchantEntry: React.FC<{ onBack: () => void; onShowToast: (msg: string) => void }> = ({ onBack, onShowToast }) => {
    const [step, setStep] = useState(1);

    const handleSubmit = () => {
        onShowToast('申请已提交，请等待审核');
        setTimeout(onBack, 1000);
    };

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <SubPageHeader title="商家入驻" onBack={onBack} />
            
            <div className="p-6 flex-1 overflow-y-auto">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8 px-4">
                    <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-gray-300'}`}>
                        <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white mb-1">1</div>
                        <span className="text-xs">基本信息</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-100 mx-2"></div>
                    <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-gray-300'}`}>
                        <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white mb-1">2</div>
                        <span className="text-xs">资质认证</span>
                    </div>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">店铺名称</label>
                            <input type="text" className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-1 focus:ring-primary" placeholder="请输入店铺名称" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">主营类目</label>
                            <select className="w-full bg-gray-50 p-3 rounded-lg outline-none">
                                <option>请选择</option>
                                <option>房屋租赁</option>
                                <option>家政服务</option>
                                <option>教育培训</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">联系电话</label>
                            <input type="tel" className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-1 focus:ring-primary" placeholder="客户联系电话" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">店铺地址</label>
                            <input type="text" className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-1 focus:ring-primary" placeholder="线下门店地址（选填）" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                         <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-600">
                            请上传真实的营业执照和法人身份证信息，平台将严格保密。
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">营业执照</label>
                            <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                                <i className="fa-solid fa-camera text-2xl mb-2"></i>
                                <span>点击上传</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">法人身份证 (正面)</label>
                            <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                                <i className="fa-solid fa-id-card text-2xl mb-2"></i>
                                <span>点击上传</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 safe-area-bottom">
                {step === 1 ? (
                    <button onClick={() => setStep(2)} className="w-full bg-primary text-white font-bold py-3.5 rounded-full shadow-lg active:scale-95 transition-transform">
                        下一步
                    </button>
                ) : (
                    <button onClick={handleSubmit} className="w-full bg-primary text-white font-bold py-3.5 rounded-full shadow-lg active:scale-95 transition-transform">
                        提交申请
                    </button>
                )}
            </div>
        </div>
    );
};

// --- 5. About Us ---
export const AboutUs: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="bg-white min-h-screen">
        <SubPageHeader title="关于我们" onBack={onBack} />
        <div className="flex flex-col items-center pt-16 px-6 text-center">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-xl">
                <i className="fa-solid fa-city"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">CityInfo</h2>
            <p className="text-gray-400 text-sm mb-10">Version 1.2.0 (Build 2024)</p>

            <div className="w-full space-y-4 text-left">
                <p className="text-gray-600 leading-relaxed text-sm">
                    CityInfo 是一个致力于连接本地用户与商家的同城信息服务平台。我们提供真实、高效的租房、招聘、二手交易及生活服务信息。
                </p>
                <p className="text-gray-600 leading-relaxed text-sm">
                    我们的愿景是让城市生活更简单、更美好。通过技术赋能，让每一个个体和商家都能便捷地获取信息与服务。
                </p>
            </div>

            <div className="fixed bottom-10 text-xs text-gray-300">
                &copy; 2024 CityInfo Inc. All Rights Reserved.
            </div>
        </div>
    </div>
);