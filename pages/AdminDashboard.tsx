import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WithdrawalRequest, WalletTransaction } from '../types';
import { getLLMConfig } from '../services/deepseek';
import { api } from '../services/supabase';

interface AdminDashboardProps {
    supportChats: Record<string, ChatMessage[]>; // Key: userId
    onReply: (userId: string, content: string) => void;
    onBack: () => void;
    announcement: string;
    onUpdateAnnouncement: (text: string) => void;
    onShowToast: (msg: string, type?: 'sms' | 'info') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    supportChats, 
    onReply, 
    onBack,
    announcement,
    onUpdateAnnouncement,
    onShowToast
}) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [replyInput, setReplyInput] = useState('');
    const [activeTab, setActiveTab] = useState<'CHATS' | 'WALLET' | 'SETTINGS'>('CHATS');

    // --- Settings State ---
    const [announcementInput, setAnnouncementInput] = useState(announcement);
    
    // LLM Settings
    const [llmConfig, setLlmConfig] = useState(getLLMConfig());
    const [showApiKey, setShowApiKey] = useState(false);

    // Platform Switches (Mock)
    const [platformSettings, setPlatformSettings] = useState({
        allowRegistration: true,
        maintenanceMode: false,
        autoAudit: true,
        enableAds: true
    });

    // --- Wallet State ---
    const [rechargeQrUrl, setRechargeQrUrl] = useState('');
    const [isUploadingQr, setIsUploadingQr] = useState(false);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [pendingRecharges, setPendingRecharges] = useState<WalletTransaction[]>([]); 
    
    // Action loading state to prevent double clicks and show feedback
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when chat updates
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [supportChats, selectedUserId]);

    // Load Wallet Data when tab changes
    useEffect(() => {
        if (activeTab === 'WALLET') {
            const loadWalletData = async () => {
                // Load QR
                const url = await api.getSystemConfig('recharge_qr');
                if (url) setRechargeQrUrl(url);

                // Load Withdrawals
                const withdrawalList = await api.getWithdrawals();
                setWithdrawals(withdrawalList);

                // Load Pending Recharges
                const rechargeList = await api.getPendingRecharges();
                setPendingRecharges(rechargeList);
            };
            loadWalletData();
        }
    }, [activeTab]);

    const activeUserIds = Object.keys(supportChats).sort((a, b) => {
        const lastA = supportChats[a][supportChats[a].length - 1]?.timestamp || 0;
        const lastB = supportChats[b][supportChats[b].length - 1]?.timestamp || 0;
        return lastB - lastA;
    });

    const handleSendReply = () => {
        if (!selectedUserId || !replyInput.trim()) return;
        onReply(selectedUserId, replyInput);
        setReplyInput('');
    };

    const handleSaveAnnouncement = () => {
        onUpdateAnnouncement(announcementInput);
        onShowToast('首页公告已更新');
    };

    const handleSaveLLM = () => {
        localStorage.setItem('cityinfo_llm_config', JSON.stringify(llmConfig));
        onShowToast('AI 模型参数配置已保存');
    };

    const handleSwitchChange = (key: keyof typeof platformSettings) => {
        setPlatformSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploadingQr(true);
        try {
            const url = await api.uploadImage(file);
            setRechargeQrUrl(url);
            await api.saveSystemConfig('recharge_qr', url);
            onShowToast('充值二维码更新成功');
        } catch (error: any) {
            console.error(error);
            if (error.message?.includes('violates row-level security')) {
                alert('【上传失败】Supabase 权限不足。\n请到 Supabase Dashboard -> Storage -> pic -> Configuration -> Policies，开启 Public Insert 权限。');
            } else {
                alert(`上传失败: ${error.message}`);
            }
        } finally {
            setIsUploadingQr(false);
        }
    };

    // Update Withdrawal Status
    const handleUpdateWithdrawalStatus = async (id: string, status: 'COMPLETED' | 'REJECTED') => {
        if (processingId) return;
        const confirmMsg = status === 'COMPLETED' ? '确认标记为已打款？' : '确认驳回此申请？';
        if (!window.confirm(confirmMsg)) return;

        setProcessingId(id);
        try {
            await api.updateWithdrawalStatus(id, status);
            
            // UI Update
            setWithdrawals(prev => prev.map(item => 
                item.id === id ? { ...item, status: status } : item
            ));

            if (status === 'COMPLETED') {
                onShowToast('✅ 已标记为打款成功', 'info');
            } else {
                onShowToast('🚫 提现申请已驳回', 'info');
            }
        } catch (e) {
            onShowToast('⚠️ 操作失败，请重试', 'info');
        } finally {
            setProcessingId(null);
        }
    };

    // Review Recharge (New)
    const handleReviewRecharge = async (id: string, status: 'SUCCESS' | 'FAILED') => {
         if (processingId) return;
         const confirmMsg = status === 'SUCCESS' ? '确认已收到款项并允许充值？' : '确认未收到款项并驳回充值？';
         if (!window.confirm(confirmMsg)) return;

         setProcessingId(id);
         try {
             await api.reviewRecharge(id, status);

             // UI Update (Remove from pending list)
             setPendingRecharges(prev => prev.filter(item => item.id !== id));

             if (status === 'SUCCESS') {
                 onShowToast('✅ 充值审核通过，资金已入账', 'info');
             } else {
                 onShowToast('🚫 充值申请已驳回', 'info');
             }
         } catch (e) {
             onShowToast('⚠️ 操作失败，请重试', 'info');
         } finally {
             setProcessingId(null);
         }
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleString('zh-CN', { 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Helper to mask API key securely
    const getMaskedApiKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '********';
        return `${key.substring(0, 3)}...${'*'.repeat(8)}...${key.substring(key.length - 4)}`;
    };

    // --- List View & Settings View ---
    if (!selectedUserId) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="bg-gray-900 text-white p-4 flex items-center sticky top-0 z-20 justify-between shadow-md">
                    <div className="flex items-center">
                        <button onClick={onBack} className="mr-4 hover:bg-white/20 p-2 rounded-full transition-colors"><i className="fa-solid fa-arrow-left"></i></button>
                        <h1 className="font-bold text-lg">管理员控制台</h1>
                    </div>
                    <div className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">ADMIN</div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex border-b border-gray-200 bg-white sticky top-[60px] z-10 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('CHATS')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'CHATS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <i className="fa-solid fa-comments mr-2"></i>
                        咨询
                    </button>
                    <button 
                        onClick={() => setActiveTab('WALLET')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'WALLET' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <i className="fa-solid fa-wallet mr-2"></i>
                        财务
                    </button>
                    <button 
                        onClick={() => setActiveTab('SETTINGS')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'SETTINGS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <i className="fa-solid fa-sliders mr-2"></i>
                        系统
                    </button>
                </div>
                
                {activeTab === 'CHATS' && (
                    <div className="p-4">
                        {activeUserIds.length === 0 ? (
                            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
                                <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                                <p>暂无用户咨询</p>
                            </div>
                        ) : (
                            activeUserIds.map(userId => {
                                const msgs = supportChats[userId];
                                const lastMsg = msgs[msgs.length - 1];
                                return (
                                    <div 
                                        key={userId}
                                        onClick={() => setSelectedUserId(userId)}
                                        className="bg-white p-4 rounded-xl shadow-sm mb-3 cursor-pointer active:bg-blue-50 transition-colors border border-gray-100 hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {userId.substring(0, 2).toUpperCase()}
                                                </div>
                                                <h3 className="font-bold text-gray-800">{userId}</h3>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {formatTime(lastMsg.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate pl-10">
                                            {lastMsg.role === 'admin' ? <span className="text-blue-500 font-bold mr-1">[已回复]</span> : ''}
                                            {lastMsg.content}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'WALLET' && (
                    <div className="p-4 space-y-6">
                        {/* 1. Recharge Audit (New) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-file-invoice-dollar mr-2 text-green-500"></i>待审核充值</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pendingRecharges.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">暂无待审核充值</div>
                                ) : (
                                    pendingRecharges.map(tx => (
                                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                                             <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-800">¥{tx.amount}</span>
                                                <span className="text-xs text-gray-400">{formatTime(tx.timestamp)}</span>
                                             </div>
                                             <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                                                 <span>用户 ID: {tx.userId}</span>
                                             </div>
                                             <div className="flex gap-2 justify-end">
                                                 <button 
                                                    disabled={processingId === tx.id}
                                                    onClick={() => handleReviewRecharge(tx.id, 'FAILED')}
                                                    className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-50"
                                                 >
                                                    {processingId === tx.id ? '处理中...' : '驳回'}
                                                 </button>
                                                 <button 
                                                    disabled={processingId === tx.id}
                                                    onClick={() => handleReviewRecharge(tx.id, 'SUCCESS')}
                                                    className="px-3 py-1.5 bg-green-500 text-white text-xs rounded shadow hover:bg-green-600 disabled:opacity-50"
                                                 >
                                                    {processingId === tx.id ? '处理中...' : '确认收款'}
                                                 </button>
                                             </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 2. Withdrawal Requests */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-money-bill-transfer mr-2 text-orange-500"></i>提现申请</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {withdrawals.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">暂无提现申请</div>
                                ) : (
                                    withdrawals.map(req => (
                                        <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-bold text-gray-800 mr-2">¥{req.amount}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : req.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {req.status === 'PENDING' ? '待处理' : req.status === 'COMPLETED' ? '已完成' : '已驳回'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400">{formatTime(req.timestamp)}</span>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                                                <div className="flex justify-between">
                                                    <span>用户:</span>
                                                    <span className="font-medium">{req.userNickname} (ID: {req.userId})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>方式:</span>
                                                    <span className="font-medium">
                                                        {req.method === 'WECHAT' ? '微信' : req.method === 'ALIPAY' ? '支付宝' : '银行卡'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>账号:</span>
                                                    <span className="font-medium select-all">{req.account}</span>
                                                </div>
                                                {req.realName && (
                                                    <div className="flex justify-between">
                                                        <span>姓名:</span>
                                                        <span className="font-medium select-all">{req.realName}</span>
                                                    </div>
                                                )}
                                                {req.bankName && (
                                                    <div className="flex justify-between">
                                                        <span>开户行:</span>
                                                        <span className="font-medium">{req.bankName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {req.status === 'PENDING' && (
                                                <div className="mt-3 flex justify-end gap-2">
                                                    <button 
                                                        disabled={processingId === req.id}
                                                        onClick={() => handleUpdateWithdrawalStatus(req.id, 'REJECTED')}
                                                        className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        {processingId === req.id ? '...' : '驳回'}
                                                    </button>
                                                    <button 
                                                        disabled={processingId === req.id}
                                                        className="px-3 py-1.5 bg-green-500 text-white text-xs rounded font-medium shadow hover:bg-green-600 disabled:opacity-50"
                                                        onClick={() => handleUpdateWithdrawalStatus(req.id, 'COMPLETED')}
                                                    >
                                                        {processingId === req.id ? '处理中...' : '标记为已打款'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 3. Recharge QR Setting */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                             <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-qrcode mr-2 text-blue-500"></i>充值收款码设置</h3>
                            </div>
                            <div className="p-4 flex gap-4 items-center">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden relative">
                                    {rechargeQrUrl ? (
                                        <img src={rechargeQrUrl} alt="QR" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs">未设置</span>
                                    )}
                                    {isUploadingQr && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white"><i className="fa-solid fa-spinner fa-spin"></i></div>}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-2">上传您的微信/支付宝收款码，用户充值时将显示此图片。</p>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleQrUpload} />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingQr}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        {rechargeQrUrl ? '更换二维码' : '上传二维码'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SETTINGS' && (
                    <div className="p-4 space-y-6 pb-20">
                        {/* 1. Announcement Config */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-bullhorn mr-2 text-orange-500"></i>首页公告</h3>
                            </div>
                            <div className="p-4">
                                <textarea 
                                    className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none border border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                                    rows={3}
                                    value={announcementInput}
                                    onChange={(e) => setAnnouncementInput(e.target.value)}
                                    placeholder="请输入首页顶部滚动的公告内容..."
                                ></textarea>
                                <button 
                                    onClick={handleSaveAnnouncement}
                                    className="mt-3 w-full bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
                                >
                                    更新公告
                                </button>
                            </div>
                        </div>

                        {/* 2. AI Model Config */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-robot mr-2 text-blue-500"></i>AI 模型配置 (DeepSeek)</h3>
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Pro</span>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">API Key</label>
                                    <div className="relative group">
                                        <input 
                                            type={showApiKey ? "text" : "password"} 
                                            className={`w-full bg-gray-50 p-2.5 rounded-lg text-sm outline-none border border-gray-200 focus:border-blue-500 ${showApiKey ? 'text-gray-500 select-none' : ''}`}
                                            value={showApiKey ? getMaskedApiKey(llmConfig.apiKey) : llmConfig.apiKey}
                                            onChange={(e) => {
                                                // Prevent editing the mask directly. User must switch to hidden mode to edit.
                                                if (!showApiKey) {
                                                    setLlmConfig({...llmConfig, apiKey: e.target.value});
                                                }
                                            }}
                                            placeholder="sk-..."
                                            readOnly={showApiKey} // Read-only when masking to prevent corruption
                                            autoComplete="off"
                                            onCopy={(e) => { e.preventDefault(); onShowToast('为保障安全，API Key 禁止复制', 'info'); }}
                                            onCut={(e) => { e.preventDefault(); }}
                                        />
                                        <button 
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            title={showApiKey ? "隐藏 (切换至编辑模式)" : "查看掩码"}
                                        >
                                            <i className={`fa-solid ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                    {showApiKey && <p className="text-[10px] text-orange-500 mt-1">* 安全模式：仅显示首尾字符，禁止复制。如需修改请点击眼睛图标关闭预览。</p>}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Model Name</label>
                                        <select 
                                            className="w-full bg-gray-50 p-2.5 rounded-lg text-sm outline-none border border-gray-200"
                                            value={llmConfig.model}
                                            onChange={(e) => setLlmConfig({...llmConfig, model: e.target.value})}
                                        >
                                            <option value="deepseek-chat">deepseek-chat</option>
                                            <option value="deepseek-coder">deepseek-coder</option>
                                            <option value="deepseek-reasoner">deepseek-reasoner</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Max Tokens</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-50 p-2.5 rounded-lg text-sm outline-none border border-gray-200"
                                            value={llmConfig.maxTokens}
                                            onChange={(e) => setLlmConfig({...llmConfig, maxTokens: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-gray-500">Temperature (创意度)</label>
                                        <span className="text-xs font-mono text-blue-600">{llmConfig.temperature}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1.5" 
                                        step="0.1"
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        value={llmConfig.temperature}
                                        onChange={(e) => setLlmConfig({...llmConfig, temperature: parseFloat(e.target.value)})}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>严谨 (0.0)</span>
                                        <span>平衡 (0.7)</span>
                                        <span>发散 (1.5)</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveLLM}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200"
                                >
                                    保存 AI 配置
                                </button>
                            </div>
                        </div>

                        {/* 3. Platform Switches */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-toggle-on mr-2 text-purple-500"></i>平台功能开关</h3>
                            </div>
                            <div className="p-4 space-y-0 divide-y divide-gray-50">
                                {Object.entries(platformSettings).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between py-3">
                                        <span className="text-sm text-gray-700 font-medium">
                                            {key === 'allowRegistration' && '开放新用户注册'}
                                            {key === 'maintenanceMode' && '系统维护模式'}
                                            {key === 'autoAudit' && '内容自动审核'}
                                            {key === 'enableAds' && '显示广告位'}
                                        </span>
                                        <button 
                                            onClick={() => handleSwitchChange(key as keyof typeof platformSettings)}
                                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${val ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${val ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- Chat Detail View ---
    const messages = supportChats[selectedUserId] || [];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
             <div className="bg-gray-900 text-white p-4 flex items-center sticky top-0 z-10 shadow-lg">
                <button onClick={() => setSelectedUserId(null)} className="mr-4 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        正在回复: {selectedUserId}
                    </h1>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'} w-full`}>
                             <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
                                msg.role === 'admin' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                        <span className={`text-[10px] text-gray-400 mt-1 px-2 ${msg.role === 'admin' ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.timestamp)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-white p-3 border-t border-gray-200 safe-area-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                 <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <textarea 
                        className="flex-1 bg-transparent max-h-32 outline-none text-sm p-2 resize-none"
                        rows={1}
                        placeholder="输入回复内容..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                            }
                        }}
                    ></textarea>
                    <button 
                        onClick={handleSendReply}
                        disabled={!replyInput.trim()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            replyInput.trim() 
                            ? 'bg-blue-600 text-white shadow-md active:scale-90 hover:bg-blue-700' 
                            : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;