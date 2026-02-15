import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WithdrawalRequest, WalletTransaction, Post, SysCategory, User } from '../types';
import { api, validateFile, validateFileContent } from '../services/supabase';

interface AdminDashboardProps {
    user?: User; // Add user prop for permission check
    supportChats: Record<string, ChatMessage[]>; // Key: userId
    onReply: (userId: string, content: string) => void;
    onBack: () => void;
    announcement: string;
    onUpdateAnnouncement: (text: string) => void;
    onShowToast: (msg: string, type?: 'sms' | 'info') => void;
    
    // Content Management
    posts?: Post[];
    onDeletePost?: (id: string) => void;
    onEditPost?: (post: Post) => void;

    // Category Management
    categories?: Record<string, SysCategory>;
    onUpdateCategory?: (category: SysCategory) => void;
    onDeleteCategory?: (key: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    user,
    supportChats, 
    onReply, 
    onBack,
    announcement,
    onUpdateAnnouncement,
    onShowToast,
    posts = [],
    onDeletePost = (_: string) => {},
    onEditPost = (_: Post) => {},
    categories = {},
    onUpdateCategory = (_: SysCategory) => {},
    onDeleteCategory = (_: string) => {}
}) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [replyInput, setReplyInput] = useState('');
    const [activeTab, setActiveTab] = useState<'CHATS' | 'WALLET' | 'CONTENT' | 'CATEGORIES' | 'SETTINGS'>('CHATS');

    // --- Content Mgmt State ---
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    // --- Category Mgmt State ---
    const [editingCategory, setEditingCategory] = useState<SysCategory | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    // --- Settings State ---
    const [announcementInput, setAnnouncementInput] = useState(announcement);
    
    // LLM Settings
    const [llmConfig, setLlmConfig] = useState({
        apiKey: '',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2000
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [isLoadingLLMConfig, setIsLoadingLLMConfig] = useState(true);

    // Load LLM Config from system on mount
    useEffect(() => {
        const loadLLMConfig = async () => {
            setIsLoadingLLMConfig(true);
            try {
                const apiKey = await api.getSystemConfig('llm_api_key');
                const model = await api.getSystemConfig('llm_model');
                const temperature = await api.getSystemConfig('llm_temperature');
                const maxTokens = await api.getSystemConfig('llm_max_tokens');
                
                setLlmConfig({
                    apiKey: apiKey || '',
                    model: model || 'deepseek-chat',
                    temperature: temperature ? parseFloat(temperature) : 0.7,
                    maxTokens: maxTokens ? parseInt(maxTokens) : 2000
                });
            } catch (error) {
                console.error('Failed to load LLM config:', error);
            } finally {
                setIsLoadingLLMConfig(false);
            }
        };
        
        if (activeTab === 'SETTINGS') {
            loadLLMConfig();
        }
    }, [activeTab]);

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
    
    // Action loading state
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when chat updates
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [supportChats, selectedUserId]);

    const loadWalletData = async () => {
        setIsLoadingWallet(true);
        try {
            // Load QR
            const url = await api.getSystemConfig('recharge_qr');
            if (url) setRechargeQrUrl(url);

            // Load Withdrawals
            const withdrawalList = await api.getWithdrawals();
            setWithdrawals(withdrawalList);

            // Load Pending Recharges & Payments
            const rechargeList = await api.getPendingRecharges();
            setPendingRecharges(rechargeList);
        } catch (e) {
            console.error("Failed to load wallet data", e);
            onShowToast('数据加载失败，请检查网络或数据库连接', 'info');
        } finally {
            setIsLoadingWallet(false);
        }
    };

    // Load Wallet Data when tab changes
    useEffect(() => {
        if (activeTab === 'WALLET') {
            loadWalletData();
        }
    }, [activeTab]);

    // Filter and Sort Chats
    // 1. Exclude 'system' user (used for config storage)
    // 2. Sort by latest message timestamp
    const activeUserIds = Object.keys(supportChats)
        .filter(id => id !== 'system' && !id.startsWith('config_'))
        .sort((a, b) => {
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

    const handleSaveLLM = async () => {
        try {
            // Save to system config (shared across all users)
            await api.saveSystemConfig('llm_api_key', llmConfig.apiKey);
            await api.saveSystemConfig('llm_model', llmConfig.model);
            await api.saveSystemConfig('llm_temperature', llmConfig.temperature.toString());
            await api.saveSystemConfig('llm_max_tokens', llmConfig.maxTokens.toString());
            
            // Also save to localStorage as cache for faster loading
            localStorage.setItem('cityinfo_llm_config', JSON.stringify(llmConfig));
            
            // Trigger storage event for other tabs/components
            window.dispatchEvent(new Event('storage'));
            
            onShowToast('AI 模型参数配置已保存（全局生效）');
        } catch (error: any) {
            console.error('Failed to save LLM config:', error);
            onShowToast(`保存失败：${error.message || '请稍后重试'}`, 'info');
        }
    };

    const handleSwitchChange = (key: keyof typeof platformSettings) => {
        setPlatformSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Check admin permission first
        if (!user?.isAdmin) {
            onShowToast('权限不足：只有管理员可以上传充值二维码', 'info');
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        // Validate file before upload
        const validation = validateFile(file);
        if (!validation.valid) {
            onShowToast(validation.error || '文件验证失败', 'info');
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        // Validate file content (check magic bytes)
        const contentValidation = await validateFileContent(file);
        if (!contentValidation.valid) {
            onShowToast(contentValidation.error || '文件内容验证失败', 'info');
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        // Check image dimensions (warn if > 2000x2000 but allow upload)
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = async () => {
            URL.revokeObjectURL(objectUrl);
            if (img.width > 2000 || img.height > 2000) {
                const proceed = confirm(`图片尺寸较大 (${img.width}x${img.height})，建议使用小于 2000x2000 的图片以获得更好的加载速度。\n\n是否继续上传？`);
                if (!proceed) {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                    return;
                }
            }
            
            // Proceed with upload
            await performUpload(file);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            onShowToast('无法读取图片文件', 'info');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        img.src = objectUrl;
    };
    
    const performUpload = async (file: File) => {
        const previousUrl = rechargeQrUrl; // Save for rollback
        setIsUploadingQr(true);
        
        try {
            const url = await api.uploadImage(file);
            setRechargeQrUrl(url);
            await api.saveSystemConfig('recharge_qr', url);
            onShowToast('充值二维码更新成功');
        } catch (error: any) {
            console.error('QR upload failed:', error);
            
            // Rollback UI state on failure
            setRechargeQrUrl(previousUrl);
            
            // Provide specific error messages
            if (error.message?.includes('violates row-level security') || error.message?.includes('权限')) {
                onShowToast('上传失败：权限不足。请联系管理员配置 Storage 权限。', 'info');
            } else if (error.message?.includes('network') || error.message?.includes('网络')) {
                onShowToast('上传失败：网络连接错误，请检查网络后重试', 'info');
            } else if (error.message?.includes('文件格式') || error.message?.includes('文件过大')) {
                onShowToast(`上传失败：${error.message}`, 'info');
            } else {
                onShowToast(`上传失败：${error.message || '未知错误'}`, 'info');
            }
        } finally {
            setIsUploadingQr(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Update Withdrawal Status
    const handleUpdateWithdrawalStatus = async (id: string, status: 'COMPLETED' | 'REJECTED') => {
        if (processingId) return;
        
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
         
         setProcessingId(id);
         try {
             await api.reviewRecharge(id, status);

             // UI Update (Remove from pending list)
             setPendingRecharges(prev => prev.filter(item => item.id !== id));

             if (status === 'SUCCESS') {
                 onShowToast('✅ 资金已确认收款', 'info');
             } else {
                 onShowToast('🚫 申请已驳回', 'info');
             }
         } catch (e) {
             console.error(e);
             onShowToast('⚠️ 操作失败，请重试', 'info');
         } finally {
             setProcessingId(null);
         }
    };

    const handleSavePostEdit = () => {
        if (!editingPost) return;
        onEditPost(editingPost);
        setEditingPost(null);
    };

    const handleSaveCategory = () => {
        if (!editingCategory) return;
        if (!editingCategory.key || !editingCategory.label) {
            alert('标识符(Key)和名称(Label)不能为空');
            return;
        }
        onUpdateCategory(editingCategory);
        setEditingCategory(null);
        setIsAddingCategory(false);
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleString('zh-CN', { 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getMaskedApiKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '********';
        return `${key.substring(0, 3)}...${'*'.repeat(8)}...${key.substring(key.length - 4)}`;
    };

    const getMessagePreview = (content: string) => {
        if (content.startsWith('data:image') || content.startsWith('http')) {
            return '[图片]';
        }
        return content;
    };

    // Vital fix: Ensure key exists for every category in list. 
    // Fallback to object key if data is malformed or from older config.
    const categoryList = Object.entries(categories).map(([k, v]) => ({
        ...(v as SysCategory),
        key: (v as SysCategory).key || k
    })).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));

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
                <div className="flex border-b border-gray-200 bg-white sticky top-[60px] z-10 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'CHATS', label: '咨询', icon: 'fa-comments' },
                        { id: 'CONTENT', label: '内容', icon: 'fa-layer-group' },
                        { id: 'CATEGORIES', label: '分类', icon: 'fa-table-cells-large' },
                        { id: 'WALLET', label: '财务', icon: 'fa-wallet' },
                        { id: 'SETTINGS', label: '系统', icon: 'fa-sliders' },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <i className={`fa-solid ${tab.icon} mr-2`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Content Tab */}
                {activeTab === 'CONTENT' && (
                    <div className="p-4 space-y-3 pb-20">
                        {posts.length === 0 ? (
                            <div className="text-center text-gray-400 mt-20">暂无内容发布</div>
                        ) : (
                            posts.map(post => (
                                <div key={post.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {post.images.length > 0 ? (
                                            <img src={post.images[0]} className="w-full h-full object-cover" alt={post.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <i className="fa-solid fa-image"></i>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{post.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">{post.category}</span>
                                                {post.isSticky && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-500 rounded">置顶</span>}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex gap-2">
                                                <span>{post.authorName}</span>
                                                <span>•</span>
                                                <span>{new Date(post.publishTime).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-red-500 font-bold text-sm">{post.price}</span>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setEditingPost(post)}
                                                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                                >
                                                    <i className="fa-solid fa-pen text-xs"></i>
                                                </button>
                                                <button 
                                                    onClick={() => onDeletePost(post.id)}
                                                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                                                >
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'CATEGORIES' && (
                    <div className="p-4 space-y-3 pb-20">
                        <button 
                            onClick={() => {
                                setIsAddingCategory(true);
                                setEditingCategory({ key: '', label: '', icon: 'fa-circle-question', color: 'bg-gray-100 text-gray-600', sort_order: 99 });
                            }}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-500 hover:text-blue-500 transition-colors mb-2 flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-plus"></i> 添加新分类
                        </button>

                        {categoryList.map(cat => (
                            <div key={cat.key} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color}`}>
                                        <i className={`fa-solid ${cat.icon}`}></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">{cat.label}</h3>
                                        <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                                            <span>Key: {cat.key}</span>
                                            <span>排序: {cat.sort_order}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            setIsAddingCategory(false);
                                            // Ensure key is passed even if missing in raw data
                                            setEditingCategory({...cat, key: cat.key || ''}); 
                                        }}
                                        className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-pen text-xs"></i>
                                    </button>
                                    <button 
                                        onClick={() => onDeleteCategory(cat.key)}
                                        className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 hover:bg-red-100 hover:text-red-600 flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-trash text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Post Modal */}
                {editingPost && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">编辑商品</h3>
                                <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                            
                            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">标题</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                        value={editingPost.title}
                                        onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">分类</label>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                        value={editingPost.category}
                                        onChange={(e) => setEditingPost({...editingPost, category: e.target.value as any})}
                                    >
                                        {categoryList.map((cat) => (
                                            <option key={cat.key} value={cat.key}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">价格</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                            value={editingPost.price}
                                            onChange={(e) => setEditingPost({...editingPost, price: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">位置</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                            value={editingPost.location}
                                            onChange={(e) => setEditingPost({...editingPost, location: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">联系电话</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                        value={editingPost.contactPhone}
                                        onChange={(e) => setEditingPost({...editingPost, contactPhone: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">描述</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 resize-none"
                                        value={editingPost.description}
                                        onChange={(e) => setEditingPost({...editingPost, description: e.target.value})}
                                    />
                                </div>

                                <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                    <input 
                                        type="checkbox" 
                                        id="editSticky"
                                        checked={editingPost.isSticky}
                                        onChange={(e) => setEditingPost({...editingPost, isSticky: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="editSticky" className="text-sm font-medium text-yellow-800">
                                        置顶推广 (Boost)
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 flex gap-3">
                                <button 
                                    onClick={() => setEditingPost(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={handleSavePostEdit}
                                    className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-md"
                                >
                                    保存修改
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Category Modal */}
                {editingCategory && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">{isAddingCategory ? '添加分类' : '编辑分类'}</h3>
                                <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                            
                            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="flex justify-center mb-4">
                                     <div className={`w-16 h-16 rounded-full flex items-center justify-center ${editingCategory.color} text-2xl`}>
                                        <i className={`fa-solid ${editingCategory.icon}`}></i>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">标识符 (Key)</label>
                                        <input 
                                            type="text" 
                                            className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none ${isAddingCategory ? 'focus:border-blue-500' : 'opacity-60 cursor-not-allowed bg-gray-100'}`}
                                            value={editingCategory.key || ''} 
                                            onChange={(e) => setEditingCategory({...editingCategory, key: e.target.value.toUpperCase()})}
                                            readOnly={!isAddingCategory}
                                            placeholder="如: HOUSING"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">显示名称</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                            value={editingCategory.label}
                                            onChange={(e) => setEditingCategory({...editingCategory, label: e.target.value})}
                                            placeholder="如: 房屋租赁"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">图标 (FontAwesome Class)</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                        value={editingCategory.icon}
                                        onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                                        placeholder="如: fa-home"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">颜色样式 (Tailwind)</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 mb-2"
                                        value={editingCategory.color}
                                        onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})}
                                        placeholder="如: bg-blue-100 text-blue-600"
                                    />
                                    <div className="flex gap-2">
                                        {[
                                            'bg-blue-100 text-blue-600',
                                            'bg-orange-100 text-orange-600',
                                            'bg-green-100 text-green-600',
                                            'bg-purple-100 text-purple-600',
                                            'bg-red-100 text-red-600',
                                            'bg-yellow-100 text-yellow-600'
                                        ].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setEditingCategory({...editingCategory, color: c})}
                                                className={`w-6 h-6 rounded-full border border-black/10 ${c.split(' ')[0]}`}
                                            ></button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">排序权重 (越小越靠前)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                        value={editingCategory.sort_order}
                                        onChange={(e) => setEditingCategory({...editingCategory, sort_order: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 flex gap-3">
                                <button 
                                    onClick={() => setEditingCategory(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={handleSaveCategory}
                                    disabled={!editingCategory?.key || !editingCategory?.label}
                                    className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm shadow-md transition-all ${(!editingCategory?.key || !editingCategory?.label) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Chat List Tab */}
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
                                const lastIsAdmin = lastMsg.role === 'admin' || lastMsg.role === 'assistant';
                                // Generate a deterministic avatar color based on userId length
                                const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600'];
                                const avatarColor = colors[userId.length % colors.length];

                                return (
                                    <div 
                                        key={userId}
                                        onClick={() => setSelectedUserId(userId)}
                                        className="bg-white p-4 rounded-xl shadow-sm mb-3 cursor-pointer active:bg-blue-50 transition-all border border-gray-100 hover:shadow-md flex items-center gap-3"
                                    >
                                        <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                                            {userId.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-bold text-gray-800 text-sm truncate flex items-center gap-2">
                                                    用户 {userId.substring(0, 6)}...
                                                    {!lastIsAdmin && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                </h3>
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {formatTime(lastMsg.timestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                {lastIsAdmin && <i className="fa-solid fa-reply text-gray-400 mr-1 text-xs"></i>}
                                                <p className={`truncate ${lastIsAdmin ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                                                    {getMessagePreview(lastMsg.content)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'WALLET' && (
                    <div className="p-4 space-y-6">
                        {/* Refresh Button - NEW */}
                        <div className="flex justify-end -mt-2">
                            <button 
                                onClick={loadWalletData}
                                disabled={isLoadingWallet}
                                className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                <i className={`fa-solid fa-rotate ${isLoadingWallet ? 'fa-spin' : ''}`}></i>
                                刷新数据
                            </button>
                        </div>

                        {/* 1. Recharge/Payment Audit */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-file-invoice-dollar mr-2 text-green-500"></i>待审核资金 (充值/支付)</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pendingRecharges.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">暂无待审核记录</div>
                                ) : (
                                    pendingRecharges.map(tx => (
                                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                                             <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800">¥{tx.amount.toFixed(2)}</span>
                                                    {tx.type === 'ORDER_PAYMENT' ? (
                                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">订单支付</span>
                                                    ) : (
                                                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">余额充值</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">{formatTime(tx.timestamp)}</span>
                                             </div>
                                             <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                                                 <span className="truncate max-w-[200px]">{tx.title}</span>
                                                 <span className="text-xs text-gray-400 font-mono">ID: {tx.userId}</span>
                                             </div>
                                             <div className="flex gap-2 justify-end">
                                                 <button 
                                                    disabled={processingId === tx.id}
                                                    onClick={() => handleReviewRecharge(tx.id, 'FAILED')}
                                                    className={`px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-50 transition-colors ${processingId === tx.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                 >
                                                    {processingId === tx.id ? '提交中...' : '驳回'}
                                                 </button>
                                                 <button 
                                                    disabled={processingId === tx.id}
                                                    onClick={() => handleReviewRecharge(tx.id, 'SUCCESS')}
                                                    className={`px-3 py-1.5 bg-green-500 text-white text-xs rounded shadow hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1 ${processingId === tx.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                 >
                                                    {processingId === tx.id ? (
                                                        <><i className="fa-solid fa-spinner fa-spin"></i> 处理中</>
                                                    ) : (
                                                        '确认收款'
                                                    )}
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
                                                        className={`px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-50 ${processingId === req.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {processingId === req.id ? '处理中...' : '驳回'}
                                                    </button>
                                                    <button 
                                                        disabled={processingId === req.id}
                                                        className={`px-3 py-1.5 bg-green-500 text-white text-xs rounded font-medium shadow hover:bg-green-600 disabled:opacity-50 flex items-center gap-1 ${processingId === req.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        onClick={() => handleUpdateWithdrawalStatus(req.id, 'COMPLETED')}
                                                    >
                                                        {processingId === req.id ? (
                                                            <><i className="fa-solid fa-spinner fa-spin"></i> 处理中</>
                                                        ) : '标记为已打款'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 3. Recharge QR Setting */}
                        {/* 3. Recharge QR Code Settings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                             <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-qrcode mr-2 text-blue-500"></i>充值收款码设置</h3>
                            </div>
                            <div className="p-4">
                                <div className="flex gap-4 items-start">
                                    {/* QR Code Preview */}
                                    <div className="flex-shrink-0">
                                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border-2 border-gray-200 overflow-hidden relative group">
                                            {rechargeQrUrl ? (
                                                <>
                                                    <img 
                                                        src={rechargeQrUrl} 
                                                        alt="收款二维码" 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://dummyimage.com/300x300/eee/aaa&text=QR+Error';
                                                        }}
                                                    />
                                                    {/* Hover overlay */}
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs">点击预览</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-2">
                                                    <i className="fa-solid fa-qrcode text-3xl mb-1"></i>
                                                    <p className="text-xs">未设置</p>
                                                </div>
                                            )}
                                            {isUploadingQr && (
                                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                                    <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                                                    <span className="text-xs">上传中...</span>
                                                </div>
                                            )}
                                        </div>
                                        {rechargeQrUrl && (
                                            <p className="text-xs text-green-600 mt-2 text-center">
                                                <i className="fa-solid fa-check-circle mr-1"></i>已配置
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Upload Controls */}
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 mb-2 font-medium">收款码说明</p>
                                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                            上传您的微信/支付宝收款码，用户充值时将显示此图片。<br/>
                                            支持格式：JPG、PNG、GIF、WebP<br/>
                                            文件大小：不超过 5MB<br/>
                                            建议尺寸：500x500 至 2000x2000 像素
                                        </p>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/jpeg,image/png,image/gif,image/webp" 
                                            onChange={handleQrUpload} 
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingQr}
                                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium shadow transition-all ${isUploadingQr ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
                                            >
                                                <i className={`fa-solid ${isUploadingQr ? 'fa-spinner fa-spin' : rechargeQrUrl ? 'fa-rotate' : 'fa-upload'} mr-2`}></i>
                                                {isUploadingQr ? '上传中...' : rechargeQrUrl ? '更换二维码' : '上传二维码'}
                                            </button>
                                            {rechargeQrUrl && !isUploadingQr && (
                                                <button 
                                                    onClick={() => window.open(rechargeQrUrl, '_blank')}
                                                    className="px-4 py-2.5 rounded-lg text-sm font-medium border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <i className="fa-solid fa-external-link mr-1"></i>
                                                    查看大图
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'SETTINGS' && (
                    <div className="p-4 space-y-6 pb-20">
                        {/* 1. Announcement */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <h3 className="font-bold text-gray-800 mb-3 text-sm">
                                <i className="fa-solid fa-bullhorn text-orange-500 mr-2"></i>
                                首页公告设置
                            </h3>
                            <textarea 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none mb-3"
                                rows={3}
                                value={announcementInput}
                                onChange={(e) => setAnnouncementInput(e.target.value)}
                                placeholder="输入滚动公告内容..."
                            ></textarea>
                            <button 
                                onClick={handleSaveAnnouncement}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                更新公告
                            </button>
                        </div>

                        {/* 2. LLM Config */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center justify-between">
                                <span><i className="fa-solid fa-robot text-purple-500 mr-2"></i>AI 模型参数 (DeepSeek) - 全局配置</span>
                                <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                                    {isLoadingLLMConfig ? '加载中...' : '已就绪'}
                                </span>
                            </h3>
                            
                            {isLoadingLLMConfig ? (
                                <div className="flex items-center justify-center py-8">
                                    <i className="fa-solid fa-spinner fa-spin text-2xl text-gray-400"></i>
                                </div>
                            ) : (
                            <div className="space-y-3">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3">
                                    <p className="text-xs text-blue-700">
                                        <i className="fa-solid fa-info-circle mr-1"></i>
                                        配置后所有用户都可使用AI功能，无需单独配置
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type={showApiKey ? "text" : "password"} 
                                            autoComplete="new-password"
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none font-mono"
                                            value={llmConfig.apiKey}
                                            placeholder="sk-..."
                                            onChange={(e) => setLlmConfig({...llmConfig, apiKey: e.target.value})}
                                        />
                                        <button 
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                                        >
                                            <i className={`fa-solid ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Model Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                                            value={llmConfig.model}
                                            onChange={(e) => setLlmConfig({...llmConfig, model: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Max Tokens</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                                            value={llmConfig.maxTokens}
                                            onChange={(e) => setLlmConfig({...llmConfig, maxTokens: parseInt(e.target.value) || 2000})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Temperature ({llmConfig.temperature})</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="2" 
                                        step="0.1"
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        value={llmConfig.temperature}
                                        onChange={(e) => setLlmConfig({...llmConfig, temperature: parseFloat(e.target.value)})}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>精确 (0.0)</span>
                                        <span>创意 (2.0)</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveLLM}
                                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm mt-2"
                                >
                                    保存配置（全局生效）
                                </button>
                            </div>
                            )}
                        </div>

                        {/* 3. Platform Switches */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <h3 className="font-bold text-gray-800 mb-4 text-sm">
                                <i className="fa-solid fa-toggle-on text-blue-500 mr-2"></i>
                                平台功能开关
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(platformSettings).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">
                                                {key === 'allowRegistration' && '开放用户注册'}
                                                {key === 'maintenanceMode' && '系统维护模式'}
                                                {key === 'autoAudit' && '内容自动审核'}
                                                {key === 'enableAds' && '显示商业广告'}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {key === 'allowRegistration' && '关闭后新用户无法注册'}
                                                {key === 'maintenanceMode' && '仅管理员可访问'}
                                                {key === 'autoAudit' && '使用 AI 预审发布内容'}
                                                {key === 'enableAds' && '首页及详情页展示 Banner'}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSwitchChange(key as any)}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${val ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${val ? 'translate-x-6' : 'translate-x-0'}`}></div>
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
                                {getMessagePreview(msg.content) === '[图片]' ? (
                                    <img src={msg.content} alt="user upload" className="rounded-lg max-w-full" />
                                ) : (
                                    msg.content
                                )}
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