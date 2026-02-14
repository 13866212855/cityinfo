import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Post, User, ChatMessage, BannerAd, ChatSession, SysCategory, Merchant, ServiceItem } from './types';
import { MOCK_POSTS, CATEGORY_CONFIG, MOCK_BANNERS, MOCK_MERCHANTS, MOCK_SERVICES } from './constants';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Publish from './pages/Publish';
import MerchantShop from './pages/MerchantShop';
import CitySelect from './pages/CitySelect';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import AIChat from './pages/AIChat';
import Notification from './components/Notification';
import SupportChat from './pages/SupportChat';
import AdminDashboard from './pages/AdminDashboard';
import { MyPosts, MyOrders, Wallet, MerchantEntry, AboutUs, MyCollections, MyHistory } from './pages/ProfileSubviews';
import { generateSupportReply } from './services/deepseek';
import { api } from './services/supabase';

const App: React.FC = () => {
    // Navigation State
    const [currentView, setCurrentView] = useState<ViewState>('HOME');
    
    // Global Data State
    const [currentCity, setCurrentCity] = useState('北京');
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    
    // Dynamic System Config
    const [categories, setCategories] = useState<Record<string, SysCategory>>(CATEGORY_CONFIG as any);
    const [banners, setBanners] = useState<BannerAd[]>(MOCK_BANNERS);
    const [merchants, setMerchants] = useState<Record<string, Merchant>>(MOCK_MERCHANTS);
    const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
    
    // System Config State (Announcement)
    const [announcement, setAnnouncement] = useState('🔥 暑期大促开启！租房免中介费，家政服务8折起！千万补贴等你来拿！');
    
    // Authentication State
    const [user, setUser] = useState<User | null>(null);

    // View Data State (acting as a simple router history params)
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{msg: string, type: 'sms'|'info'}>({msg: '', type: 'info'});
    const [showNotification, setShowNotification] = useState(false);

    // Support Chat State (Global) - Key: userId
    const [supportChats, setSupportChats] = useState<Record<string, ChatMessage[]>>({});

    // Direct Chats State (Mocking persistence for generic chats like Merchants/HR)
    const [directChats, setDirectChats] = useState<Record<string, ChatMessage[]>>({});

    const supportChatsRef = useRef(supportChats);
    useEffect(() => {
        supportChatsRef.current = supportChats;
    }, [supportChats]);

    // Auto Location Effect
    useEffect(() => {
        // Try to locate user on mount
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh-CN`
                        );
                        if (res.ok) {
                            const data = await res.json();
                            const addr = data.address;
                            if (addr) {
                                let detectedCity = addr.city || addr.municipality || addr.town || addr.county;
                                if (detectedCity) {
                                    detectedCity = detectedCity.replace(/市$/, '');
                                    setCurrentCity(detectedCity);
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Auto-location error:', error);
                    }
                },
                (error) => {
                    console.debug('Location permission denied or timeout:', error.message);
                },
                { timeout: 5000, maximumAge: 600000 }
            );
        }
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            // 1. Fetch System Configuration
            const [fetchedCats, fetchedBanners, fetchedMerchants, fetchedServices] = await Promise.all([
                api.getSystemCategories(),
                api.getSystemBanners(),
                api.getAllMerchants(),
                api.getAllServices()
            ]);
            
            setCategories(fetchedCats);
            setBanners(fetchedBanners);
            setMerchants(fetchedMerchants);
            setServices(fetchedServices);

            // 2. Load Posts
            try {
                const loadedPosts = await api.getPosts();
                if (loadedPosts && loadedPosts.length > 0) {
                    setPosts(loadedPosts);
                }
            } catch (e) {
                console.warn("Failed to refresh posts, keeping mocks");
            }

            // 3. Load Messages
            const allMessages = await api.getMessages();
            const groupedChats: Record<string, ChatMessage[]> = {};
            
            allMessages.forEach(row => {
                const msg: ChatMessage = {
                    id: row.id,
                    role: row.role as any,
                    content: row.content,
                    timestamp: row.timestamp
                };
                if (!groupedChats[row.user_id]) {
                    groupedChats[row.user_id] = [];
                }
                groupedChats[row.user_id].push(msg);
            });
            setSupportChats(groupedChats);
            
            // Try recover user from local storage
            const savedUser = localStorage.getItem('cityinfo_user');
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch(e) {}
            }
        };
        loadData();
    }, []);

    const showToast = (msg: string, type: 'sms' | 'info' = 'info') => {
        setNotification({ msg, type });
        setShowNotification(true);
    };

    // --- Handlers ---
    const handlePostClick = (post: Post) => {
        setSelectedPost(post);
        setCurrentView('POST_DETAIL');
    };

    const handleMerchantClick = (id: string) => {
        setSelectedMerchantId(id);
        setCurrentView('MERCHANT_DETAIL');
    };
    
    const handleBannerClick = (banner: BannerAd) => {
        if (banner.title.includes('家政')) {
            handleMerchantClick('m1');
            showToast('正在前往金牌保洁店铺', 'info');
        } else if (banner.title.includes('租房')) {
             const housingPost = posts.find(p => p.category === 'HOUSING');
             if (housingPost) {
                 handlePostClick(housingPost);
                 showToast('查看精选房源', 'info');
             }
        } else {
            showToast(`点击了广告: ${banner.title}`, 'info');
        }
    };

    const handlePublish = (newPost: Post) => {
        // Optimistic update
        setPosts(prev => [newPost, ...prev]);
        // Persist to Supabase
        api.createPost(newPost);
        showToast('发布成功！', 'info');
    };

    // --- Admin Post Handlers ---
    const handleDeletePost = async (postId: string) => {
        if (window.confirm("确定要删除这条发布吗？此操作不可恢复。")) {
            setPosts(prev => prev.filter(p => p.id !== postId));
            await api.deletePost(postId);
            showToast('帖子已删除');
        }
    };

    const handleEditPost = async (updatedPost: Post) => {
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        await api.updatePost(updatedPost);
        showToast('帖子已更新');
    };

    // --- Admin Category Handlers ---
    const handleUpdateCategory = async (cat: SysCategory) => {
        // 1. Optimistic Update Local State
        setCategories(prev => ({
            ...prev,
            [cat.key]: cat
        }));
        
        // 2. Persist to DB
        await api.upsertCategory(cat);
        showToast('分类已更新', 'info');
    };

    const handleDeleteCategory = async (key: string) => {
         if (window.confirm(`确定要删除分类 "${categories[key]?.label}" 吗？此操作不可恢复。`)) {
            // 1. Optimistic Update Local State
            const newCats = { ...categories };
            delete newCats[key];
            setCategories(newCats);

            // 2. Persist to DB
            await api.deleteCategory(key);
            showToast('分类已删除', 'info');
         }
    };

    const handleCitySelect = (city: string) => {
        setCurrentCity(city);
        setCurrentView('HOME');
    };

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        localStorage.setItem('cityinfo_user', JSON.stringify(loggedInUser));
        setCurrentView('PROFILE');
        showToast(loggedInUser.isAdmin ? `管理员登录` : `欢迎回来，${loggedInUser.nickname}`, 'info');
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('cityinfo_user');
        setCurrentView('HOME');
    };
    
    const handleUpdateProfile = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('cityinfo_user', JSON.stringify(updatedUser));
        api.updateUser(updatedUser);
        showToast('个人信息保存成功', 'info');
        setCurrentView('PROFILE');
    };

    const handleChatClick = (chat: ChatSession) => {
        setSelectedChat(chat);
        // Initialize mock history if empty
        setDirectChats(prev => {
            if (!prev[chat.id]) {
                return {
                    ...prev,
                    [chat.id]: [
                        {
                            id: 'msg_init_' + chat.id,
                            role: 'assistant',
                            content: chat.lastMessage,
                            timestamp: chat.lastTime
                        }
                    ]
                };
            }
            return prev;
        });
        setCurrentView('CHAT_DETAIL');
    };

    // --- Chat Logic ---
    const handleUserSendSupportMessage = (content: string) => {
        if (!user) return;
        const currentUserId = user.id;
        const msg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: Date.now()
        };
        
        // Optimistic update
        setSupportChats(prev => ({
            ...prev,
            [currentUserId]: [...(prev[currentUserId] || []), msg]
        }));
        
        // Persist
        api.saveMessage(msg, currentUserId);

        // Support Auto-reply
        setTimeout(async () => {
            const currentChats = supportChatsRef.current;
            const userHistory = currentChats[currentUserId] || [];
            const lastMsg = userHistory[userHistory.length - 1];

            if (lastMsg && lastMsg.role === 'user') {
                try {
                    const contextHistory = userHistory.slice(-10);
                    const aiReply = await generateSupportReply(contextHistory, posts, merchants);
                    
                    const replyMsg: ChatMessage = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: aiReply,
                        timestamp: Date.now()
                    };

                    setSupportChats(prev => ({
                        ...prev,
                        [currentUserId]: [...(prev[currentUserId] || []), replyMsg]
                    }));
                    
                    // Persist Reply
                    api.saveMessage(replyMsg, currentUserId);

                } catch (e) {
                    console.error("Auto-reply failed", e);
                }
            }
        }, 10000);
    };

    const handleUserSendDirectMessage = (content: string) => {
        if (!selectedChat) return;
        const chatId = selectedChat.id;
        
        const msg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: Date.now()
        };

        setDirectChats(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), msg]
        }));

        // Simple mock auto-reply for direct chats
        setTimeout(() => {
            setDirectChats(prev => ({
                ...prev,
                [chatId]: [...(prev[chatId] || []), {
                    id: 'r_' + Date.now(),
                    role: 'assistant',
                    content: '收到您的消息，稍后回复您。',
                    timestamp: Date.now()
                }]
            }));
        }, 2000);
    };

    const handleAdminReply = (targetUserId: string, content: string) => {
        const msg: ChatMessage = {
            id: Date.now().toString(),
            role: 'admin',
            content: content,
            timestamp: Date.now()
        };
        
        setSupportChats(prev => ({
            ...prev,
            [targetUserId]: [...(prev[targetUserId] || []), msg]
        }));
        
        // Persist
        api.saveMessage(msg, targetUserId);
        
        showToast('回复已发送');
    };

    // Calculate Chat Sessions for Messages Page
    const getChatSessions = (): ChatSession[] => {
        const sessions: ChatSession[] = [];
        
        // 1. Add Support Chat (if exists)
        if (user && supportChats[user.id]) {
            const history = supportChats[user.id];
            const lastMsg = history[history.length - 1];
            sessions.push({
                id: 'support_chat',
                targetName: '人工客服',
                avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
                lastMessage: lastMsg.content,
                lastTime: lastMsg.timestamp,
                unreadCount: history.filter(m => m.role === 'admin' && m.timestamp > Date.now() - 3600000).length // Fake unread
            });
        }

        // 2. Add Direct Chats (Mocked/Local)
        // In a real app, you would iterate directChats and format them
        // For demo, we add static ones if they exist in state
        Object.keys(directChats).forEach(chatId => {
            const history = directChats[chatId];
            const lastMsg = history[history.length - 1];
            // Try to find target name from Merchants mock or fallback
            const targetMerchant = merchants[chatId] || MOCK_MERCHANTS[chatId]; 
            const targetName = targetMerchant ? targetMerchant.name : 'Unknown User';
            const avatar = targetMerchant ? targetMerchant.logoUrl : 'https://ui-avatars.com/api/?name=User&background=random';

            sessions.push({
                id: chatId,
                targetName: targetName,
                avatarUrl: avatar,
                lastMessage: lastMsg.content,
                lastTime: lastMsg.timestamp,
                unreadCount: 0
            });
        });

        // 3. Add default mocks if empty (for demo experience)
        if (sessions.length === 0) {
             sessions.push({
                id: 'demo_c1',
                targetName: '安居置业',
                avatarUrl: 'https://picsum.photos/100/100?random=12',
                lastMessage: '您好，这套房子还在吗？什么时候方便看房？',
                lastTime: Date.now() - 1000 * 60 * 5,
                unreadCount: 2
            });
        }

        return sessions.sort((a,b) => b.lastTime - a.lastTime);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'HOME':
                return (
                    <Home 
                        currentCity={currentCity}
                        posts={posts}
                        announcement={announcement} 
                        onPostClick={handlePostClick} 
                        onMerchantClick={handleMerchantClick} 
                        onBannerClick={handleBannerClick}
                        onCityClick={() => setCurrentView('CITY_SELECT')}
                        onConsultClick={() => setCurrentView('SUPPORT_CHAT')}
                        // Pass Dynamic Configs
                        categories={categories}
                        banners={banners}
                    />
                );
            case 'EXPLORE':
                return <Explore onShowToast={showToast} />;
            case 'MESSAGES':
                return (
                    <Messages 
                        onOpenAI={() => setCurrentView('AI_CHAT')} 
                        onChatClick={handleChatClick}
                        sessions={getChatSessions()}
                    />
                );
            case 'PROFILE':
                return (
                    <Profile 
                        user={user} 
                        onNavigateToLogin={() => setCurrentView('LOGIN')}
                        onLogout={handleLogout}
                        onNavigate={setCurrentView}
                    />
                );
            case 'EDIT_PROFILE':
                return user ? (
                    <EditProfile 
                        user={user} 
                        onUpdate={handleUpdateProfile} 
                        onBack={() => setCurrentView('PROFILE')} 
                    />
                ) : <Profile user={user} onNavigateToLogin={() => setCurrentView('LOGIN')} onLogout={handleLogout} onNavigate={setCurrentView} />;
            case 'PUBLISH':
                return <Publish 
                    onBack={() => setCurrentView('HOME')} 
                    onPublish={handlePublish}
                    categoryConfig={categories}
                />;
            case 'POST_DETAIL':
                return selectedPost ? (
                    <PostDetail 
                        post={selectedPost} 
                        onBack={() => setCurrentView('HOME')} 
                        onMerchantClick={handleMerchantClick}
                        onShowToast={(msg) => showToast(msg, 'info')}
                        // Pass Config to allow looking up category label
                        categoryConfig={categories}
                    />
                ) : <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} categories={categories} banners={banners} />;
            case 'MERCHANT_DETAIL':
                return selectedMerchantId ? (
                    <MerchantShop 
                        merchantId={selectedMerchantId} 
                        posts={posts}
                        onBack={() => setCurrentView('HOME')}
                        onPostClick={handlePostClick}
                        categoryConfig={categories}
                        merchantsData={merchants}
                        servicesData={services}
                    />
                ) : <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} categories={categories} banners={banners} />;
            case 'CITY_SELECT':
                return (
                    <CitySelect 
                        currentCity={currentCity}
                        onSelect={handleCitySelect}
                        onBack={() => setCurrentView('HOME')}
                    />
                );
            case 'LOGIN':
                return (
                    <Login 
                        onLogin={handleLogin} 
                        onBack={() => setCurrentView('PROFILE')}
                        onShowNotification={showToast}
                    />
                );
            case 'AI_CHAT':
                return <AIChat onBack={() => setCurrentView('MESSAGES')} />;
            
            // --- Chat Views ---
            case 'SUPPORT_CHAT':
                return (
                    <SupportChat 
                        user={user}
                        targetName="人工客服"
                        chatHistory={user ? (supportChats[user.id] || []) : []}
                        onSendMessage={handleUserSendSupportMessage}
                        onBack={() => setCurrentView('HOME')}
                        onLoginReq={() => {
                            showToast('请先登录', 'info');
                            setCurrentView('LOGIN');
                        }}
                    />
                );
            case 'CHAT_DETAIL':
                return selectedChat ? (
                    <SupportChat 
                        user={user}
                        targetName={selectedChat.targetName}
                        chatHistory={selectedChat.id === 'support_chat' && user ? (supportChats[user.id] || []) : (directChats[selectedChat.id] || [])}
                        onSendMessage={selectedChat.id === 'support_chat' ? handleUserSendSupportMessage : handleUserSendDirectMessage}
                        onBack={() => setCurrentView('MESSAGES')}
                        onLoginReq={() => {
                            showToast('请先登录', 'info');
                            setCurrentView('LOGIN');
                        }}
                    />
                ) : <Messages onOpenAI={() => setCurrentView('AI_CHAT')} onChatClick={handleChatClick} sessions={getChatSessions()} />;
                
            case 'ADMIN_DASHBOARD':
                return user?.isAdmin ? (
                    <AdminDashboard 
                        supportChats={supportChats}
                        onReply={handleAdminReply}
                        onBack={() => setCurrentView('PROFILE')}
                        announcement={announcement}
                        onUpdateAnnouncement={setAnnouncement}
                        onShowToast={showToast}
                        // Pass Post Management Props
                        posts={posts}
                        onDeletePost={handleDeletePost}
                        onEditPost={handleEditPost}
                        // Pass Category Management Props
                        categories={categories}
                        onUpdateCategory={handleUpdateCategory}
                        onDeleteCategory={handleDeleteCategory}
                    />
                ) : <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} categories={categories} banners={banners} />;

            // --- Profile Sub-pages ---
            case 'MY_POSTS':
                return <MyPosts 
                    posts={posts} 
                    user={user} 
                    onBack={() => setCurrentView('PROFILE')} 
                    onPostClick={handlePostClick} 
                    onPublish={() => setCurrentView('PUBLISH')}
                    categoryConfig={categories}
                />;
            case 'MY_COLLECTIONS':
                return <MyCollections posts={posts} onBack={() => setCurrentView('PROFILE')} onPostClick={handlePostClick} categoryConfig={categories} />;
            case 'MY_HISTORY':
                return <MyHistory posts={posts} onBack={() => setCurrentView('PROFILE')} onPostClick={handlePostClick} categoryConfig={categories} />;
            case 'MY_ORDERS':
                return <MyOrders onBack={() => setCurrentView('PROFILE')} onShowToast={showToast} />;
            case 'WALLET':
                return <Wallet onBack={() => setCurrentView('PROFILE')} />;
            case 'MERCHANT_ENTRY':
                return <MerchantEntry onBack={() => setCurrentView('PROFILE')} onShowToast={(msg) => showToast(msg, 'info')} />;
            case 'ABOUT':
                return <AboutUs onBack={() => setCurrentView('PROFILE')} />;
                
            default:
                return <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} categories={categories} banners={banners} />;
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
            <Notification 
                message={notification.msg} 
                visible={showNotification} 
                onClose={() => setShowNotification(false)}
                type={notification.type}
            />
            
            {renderContent()}
            
            {/* Show Nav Bar only on main tabs */}
            {['HOME', 'EXPLORE', 'MESSAGES', 'PROFILE'].includes(currentView) && (
                <NavBar currentView={currentView} onChange={setCurrentView} />
            )}
        </div>
    );
};

export default App;