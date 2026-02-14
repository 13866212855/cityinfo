import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Post, User, ChatMessage, BannerAd, ChatSession } from './types';
import { MOCK_MERCHANTS, MOCK_POSTS } from './constants';
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
                        // Use OpenStreetMap Nominatim for free reverse geocoding
                        // Note: High volume usage requires an API Key or dedicated server, but fine for demo.
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh-CN`
                        );
                        if (res.ok) {
                            const data = await res.json();
                            const addr = data.address;
                            if (addr) {
                                // Priority: City -> Municipality (Beijing/Shanghai etc) -> Town -> County
                                let detectedCity = addr.city || addr.municipality || addr.town || addr.county;
                                
                                if (detectedCity) {
                                    // Remove '市' suffix for cleaner display (e.g. "北京市" -> "北京")
                                    detectedCity = detectedCity.replace(/市$/, '');
                                    setCurrentCity(detectedCity);
                                    // Optional: Show a toast? setShowNotification({msg: `已定位到: ${detectedCity}`, type: 'info'});
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Auto-location error:', error);
                    }
                },
                (error) => {
                    console.debug('Location permission denied or timeout:', error.message);
                    // Fallback remains '北京'
                },
                { timeout: 5000, maximumAge: 600000 } // Wait max 5s, use cached loc if < 10min old
            );
        }
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            // 1. Load Posts
            // Use local mocks first, then fetch updates
            // (setPosts(MOCK_POSTS) is already done in initial state)
            
            try {
                const loadedPosts = await api.getPosts();
                if (loadedPosts && loadedPosts.length > 0) {
                    setPosts(loadedPosts);
                }
            } catch (e) {
                console.warn("Failed to refresh posts, keeping mocks");
            }

            // 2. Load Messages (Simple sync for now)
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
                    const aiReply = await generateSupportReply(contextHistory, posts, MOCK_MERCHANTS);
                    
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
                    />
                );
            case 'EXPLORE':
                return <Explore onShowToast={showToast} />;
            case 'MESSAGES':
                return (
                    <Messages 
                        onOpenAI={() => setCurrentView('AI_CHAT')} 
                        onChatClick={handleChatClick}
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
                return <Publish onBack={() => setCurrentView('HOME')} onPublish={handlePublish} />;
            case 'POST_DETAIL':
                return selectedPost ? (
                    <PostDetail 
                        post={selectedPost} 
                        onBack={() => setCurrentView('HOME')} 
                        onMerchantClick={handleMerchantClick}
                        onShowToast={(msg) => showToast(msg, 'info')}
                    />
                ) : <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} />;
            case 'MERCHANT_DETAIL':
                return selectedMerchantId ? (
                    <MerchantShop 
                        merchantId={selectedMerchantId} 
                        posts={posts}
                        onBack={() => setCurrentView('HOME')}
                        onPostClick={handlePostClick}
                    />
                ) : <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} />;
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
                        chatHistory={directChats[selectedChat.id] || []}
                        onSendMessage={handleUserSendDirectMessage}
                        onBack={() => setCurrentView('MESSAGES')}
                        onLoginReq={() => {
                            showToast('请先登录', 'info');
                            setCurrentView('LOGIN');
                        }}
                    />
                ) : <Messages onOpenAI={() => setCurrentView('AI_CHAT')} onChatClick={handleChatClick} />;
                
            case 'ADMIN_DASHBOARD':
                return user?.isAdmin ? (
                    <AdminDashboard 
                        supportChats={supportChats}
                        onReply={handleAdminReply}
                        onBack={() => setCurrentView('PROFILE')}
                        announcement={announcement}
                        onUpdateAnnouncement={setAnnouncement}
                        onShowToast={showToast}
                    />
                ) : <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} />;

            // --- Profile Sub-pages ---
            case 'MY_POSTS':
                return <MyPosts 
                    posts={posts} 
                    user={user} 
                    onBack={() => setCurrentView('PROFILE')} 
                    onPostClick={handlePostClick} 
                    onPublish={() => setCurrentView('PUBLISH')}
                />;
            case 'MY_COLLECTIONS':
                return <MyCollections posts={posts} onBack={() => setCurrentView('PROFILE')} onPostClick={handlePostClick} />;
            case 'MY_HISTORY':
                return <MyHistory posts={posts} onBack={() => setCurrentView('PROFILE')} onPostClick={handlePostClick} />;
            case 'MY_ORDERS':
                return <MyOrders onBack={() => setCurrentView('PROFILE')} />;
            case 'WALLET':
                return <Wallet onBack={() => setCurrentView('PROFILE')} />;
            case 'MERCHANT_ENTRY':
                return <MerchantEntry onBack={() => setCurrentView('PROFILE')} onShowToast={(msg) => showToast(msg, 'info')} />;
            case 'ABOUT':
                return <AboutUs onBack={() => setCurrentView('PROFILE')} />;
                
            default:
                return <Home currentCity={currentCity} posts={posts} announcement={announcement} onPostClick={handlePostClick} onMerchantClick={handleMerchantClick} onBannerClick={handleBannerClick} onCityClick={() => setCurrentView('CITY_SELECT')} onConsultClick={() => setCurrentView('SUPPORT_CHAT')} />;
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