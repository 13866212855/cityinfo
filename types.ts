
// Domain: Info Context
export enum CategoryType {
    HOUSING = 'HOUSING',
    JOBS = 'JOBS',
    SECOND_HAND = 'SECOND_HAND',
    SERVICES = 'SERVICES',
    CARPOOL = 'CARPOOL',
    PETS = 'PETS',
    DATING = 'DATING',
    BUSINESS = 'BUSINESS',
    EDUCATION = 'EDUCATION',
    AGRICULTURE = 'AGRICULTURE'
}

// New Interface for DB Categories
export interface SysCategory {
    key: string; // matches CategoryType
    label: string;
    icon: string;
    color: string;
    sort_order?: number;
}

export interface PostAttribute {
    key: string;
    label: string;
    value: string | number;
}

export interface Post {
    id: string;
    title: string;
    description: string;
    category: CategoryType;
    price?: string; // Display string for price/salary
    images: string[];
    tags: string[];
    location: string;
    distance?: string; // Calculated distance
    contactPhone: string;
    publishTime: number;
    viewCount: number;
    isSticky: boolean; // Marketing Context injection
    attributes: PostAttribute[]; // Dynamic attributes based on category
    merchantId?: string; // Link to Merchant Context
    authorName: string;
    avatarUrl: string;
    // Map Coordinates
    lat?: number;
    lng?: number;
}

// Domain: Merchant Context
export interface Merchant {
    id: string;
    name: string;
    logoUrl: string;
    bannerUrl: string;
    description: string;
    address: string;
    rating: number; // 0-5
    isVerified: boolean;
    followers: number;
    phone: string;
}

export interface ServiceItem {
    id: string;
    merchantId: string;
    title: string;
    price: number;
    imageUrl: string;
    salesCount: number;
}

// Domain: Marketing Context
export interface BannerAd {
    id: string;
    imageUrl: string;
    linkUrl: string;
    title: string;
}

// Domain: Message Context
export interface ChatSession {
    id: string;
    targetName: string;
    avatarUrl: string;
    lastMessage: string;
    lastTime: number;
    unreadCount: number;
    isAI?: boolean; // Mark for AI Assistant
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'admin'; // Added 'admin'
    content: string;
    timestamp: number;
}

// Domain: Wallet Context
export interface WithdrawalRequest {
    id: string;
    userId: string;
    userNickname: string;
    amount: number;
    method: 'WECHAT' | 'ALIPAY' | 'BANK';
    account: string;
    realName?: string;
    bankName?: string;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    timestamp: number;
}

export interface WalletTransaction {
    id: string;
    userId: string;
    type: 'RECHARGE' | 'WITHDRAW' | 'INCOME' | 'EXPENSE' | 'ORDER_PAYMENT'; // Added ORDER_PAYMENT
    title: string;
    amount: number; // Positive or Negative
    balanceAfter: number; // Balance after transaction
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    timestamp: number;
}

// Domain: User/Member Context
export interface User {
    id: string;
    phone: string;
    nickname: string;
    avatarUrl: string;
    isVerified: boolean;
    registerTime: number;
    isAdmin?: boolean; // New field for Admin
    // Extended Profile Fields
    realName?: string;
    qq?: string;
    wechat?: string;
    address?: string;
    balance?: number; // Added balance to user profile for persistence
}

// Application State Types
export type ViewState = 
    | 'HOME' 
    | 'EXPLORE' 
    | 'PUBLISH' 
    | 'MESSAGES' 
    | 'PROFILE' 
    | 'POST_DETAIL' 
    | 'MERCHANT_DETAIL' 
    | 'CITY_SELECT' 
    | 'LOGIN' 
    | 'AI_CHAT'
    | 'EDIT_PROFILE' // New View
    // New Profile Sub-views
    | 'MY_POSTS'
    | 'MY_ORDERS'
    | 'WALLET'
    | 'MERCHANT_ENTRY'
    | 'ABOUT'
    | 'MY_COLLECTIONS' // New
    | 'MY_HISTORY'     // New
    // New Admin/Support Views
    | 'SUPPORT_CHAT'
    | 'ADMIN_DASHBOARD'
    | 'CHAT_DETAIL'; // New generic chat view
