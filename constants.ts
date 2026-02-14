import { BannerAd, CategoryType, ChatSession, Merchant, Post, ServiceItem } from "./types";

export const POPULAR_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];

// Admin Contact Info (Single Source of Truth)
export const ADMIN_CONTACT = {
    phone: '138-0000-8888',
    wechat: 'cityinfo_admin',
    name: 'CityInfo管理员'
};

// Mock Hierarchical Data for Province -> City -> District -> Town
// In a real app, this would be fetched from an API
export const LOCATION_DATA: Record<string, any> = {
    "安徽省": {
        "阜阳市": {
            "颍上县": ["古城镇", "慎城镇", "红星镇", "谢桥镇", "南照镇"],
            "颍州区": ["清河街道", "文峰街道"],
            "太和县": ["城关镇", "旧县镇"]
        },
        "合肥市": {
            "蜀山区": ["三里庵街道", "五里墩街道"],
            "瑶海区": ["明光路街道", "胜利路街道"]
        }
    },
    "北京市": {
        "北京市": { // Beijing is a municipality
            "朝阳区": ["三里屯街道", "望京街道", "国贸"],
            "海淀区": ["中关村街道", "学院路街道"]
        }
    },
    "浙江省": {
        "杭州市": {
            "西湖区": ["北山街道", "西溪街道"],
            "余杭区": ["五常街道", "仓前街道"]
        }
    }
};

export const MOCK_BANNERS: BannerAd[] = [
    {
        id: '1',
        imageUrl: 'https://picsum.photos/800/400?random=1',
        linkUrl: '#',
        title: '暑期租房大促 - 免中介费'
    },
    {
        id: '2',
        imageUrl: 'https://picsum.photos/800/400?random=2',
        linkUrl: '#',
        title: '金牌保洁服务 - 低至8折'
    }
];

export const MOCK_MERCHANTS: Record<string, Merchant> = {
    'm1': {
        id: 'm1',
        name: '极速家政服务',
        logoUrl: 'https://picsum.photos/100/100?random=10',
        bannerUrl: 'https://picsum.photos/800/300?random=11',
        description: '专注家庭清洁与维修服务十年，好评如潮。',
        address: '科技园区创业路123号',
        rating: 4.8,
        isVerified: true,
        followers: 1205,
        phone: '010-5550123'
    },
    'm2': {
        id: 'm2',
        name: '安居置业',
        logoUrl: 'https://picsum.photos/100/100?random=12',
        bannerUrl: 'https://picsum.photos/800/300?random=13',
        description: '为您寻找城市中心的理想家园，真实房源保障。',
        address: '市中心广场大厦A座',
        rating: 4.5,
        isVerified: true,
        followers: 850,
        phone: '010-5550987'
    }
};

export const MOCK_SERVICES: ServiceItem[] = [
    {
        id: 's1',
        merchantId: 'm1',
        title: '2小时深度保洁',
        price: 89.99,
        imageUrl: 'https://picsum.photos/200/200?random=20',
        salesCount: 450
    },
    {
        id: 's2',
        merchantId: 'm1',
        title: '空调清洗基础套餐',
        price: 59.00,
        imageUrl: 'https://picsum.photos/200/200?random=21',
        salesCount: 120
    }
];

export const MOCK_POSTS: Post[] = [
    {
        id: 'p1',
        title: '地铁口精装两居室，朝南采光好',
        description: '宽敞的两居室，带朝南阳台。全新装修厨房。步行5分钟可达地铁站，周边生活便利。',
        category: CategoryType.HOUSING,
        price: '¥2,500/月',
        images: ['https://picsum.photos/400/300?random=30', 'https://picsum.photos/400/300?random=31'],
        tags: ['免中介费', '可养宠物'],
        location: '朝阳区 · 国贸',
        lat: 39.909,
        lng: 116.457,
        distance: '0.5km',
        contactPhone: '13800138000',
        publishTime: Date.now() - 3600000, // 1 hour ago
        viewCount: 342,
        isSticky: true,
        merchantId: 'm2',
        authorName: '安居置业',
        avatarUrl: 'https://picsum.photos/100/100?random=12',
        attributes: [
            { key: 'layout', label: '户型', value: '2室1厅' },
            { key: 'size', label: '面积', value: '85㎡' }
        ]
    },
    {
        id: 'p2',
        title: '急招高级Java后端开发工程师',
        description: '寻找经验丰富的后端工程师，熟悉Spring Boot/Cloud。支持远程办公。',
        category: CategoryType.JOBS,
        price: '20k - 35k',
        images: [],
        tags: ['远程办公', '全职', '五险一金'],
        location: '海淀区 · 软件园',
        lat: 40.046,
        lng: 116.299,
        distance: '5.2km',
        contactPhone: '13900139000',
        publishTime: Date.now() - 7200000,
        viewCount: 890,
        isSticky: false,
        authorName: 'HR莎莎',
        avatarUrl: 'https://picsum.photos/50/50?random=40',
        attributes: [
            { key: 'exp', label: '经验要求', value: '3-5年' },
            { key: 'edu', label: '学历要求', value: '本科' }
        ]
    },
    {
        id: 'p3',
        title: '山地车转让 - 9成新',
        description: '骑了不到6个月，因搬家忍痛转让。送头盔和车锁。',
        category: CategoryType.SECOND_HAND,
        price: '¥850',
        images: ['https://picsum.photos/400/300?random=33'],
        tags: ['急售', '可小刀'],
        location: '海淀区 · 大学城',
        lat: 39.991,
        lng: 116.333,
        distance: '2.1km',
        contactPhone: '13700137000',
        publishTime: Date.now() - 86400000, // 1 day ago
        viewCount: 56,
        isSticky: false,
        authorName: '学生小张',
        avatarUrl: 'https://picsum.photos/50/50?random=41',
        attributes: [
            { key: 'condition', label: '成色', value: '9成新' }
        ]
    }
];

export const MOCK_CHATS: ChatSession[] = [
    {
        id: 'c1',
        targetName: '安居置业',
        avatarUrl: 'https://picsum.photos/100/100?random=12',
        lastMessage: '您好，这套房子还在吗？什么时候方便看房？',
        lastTime: Date.now() - 1000 * 60 * 5,
        unreadCount: 2
    },
    {
        id: 'c2',
        targetName: '极速家政客服',
        avatarUrl: 'https://picsum.photos/100/100?random=10',
        lastMessage: '您的订单已确认，阿姨将在明天上午9点上门。',
        lastTime: Date.now() - 1000 * 60 * 60 * 2,
        unreadCount: 0
    },
    {
        id: 'c3',
        targetName: 'HR莎莎',
        avatarUrl: 'https://picsum.photos/50/50?random=40',
        lastMessage: '收到您的简历了，请问方便电话沟通吗？',
        lastTime: Date.now() - 1000 * 60 * 60 * 24,
        unreadCount: 0
    }
];

export const CATEGORY_CONFIG: Record<CategoryType, { label: string, icon: string, color: string }> = {
    [CategoryType.HOUSING]: { label: '房屋租赁', icon: 'fa-home', color: 'bg-blue-100 text-blue-600' },
    [CategoryType.JOBS]: { label: '求职招聘', icon: 'fa-briefcase', color: 'bg-orange-100 text-orange-600' },
    [CategoryType.SECOND_HAND]: { label: '二手闲置', icon: 'fa-tag', color: 'bg-green-100 text-green-600' },
    [CategoryType.SERVICES]: { label: '生活服务', icon: 'fa-tools', color: 'bg-purple-100 text-purple-600' },
    [CategoryType.CARPOOL]: { label: '顺风车', icon: 'fa-car', color: 'bg-indigo-100 text-indigo-600' },
    [CategoryType.PETS]: { label: '宠物生活', icon: 'fa-paw', color: 'bg-pink-100 text-pink-600' },
    [CategoryType.DATING]: { label: '同城交友', icon: 'fa-heart', color: 'bg-red-100 text-red-600' },
    [CategoryType.BUSINESS]: { label: '生意转让', icon: 'fa-shop-lock', color: 'bg-yellow-100 text-yellow-600' },
    [CategoryType.EDUCATION]: { label: '教育培训', icon: 'fa-graduation-cap', color: 'bg-teal-100 text-teal-600' },
    [CategoryType.AGRICULTURE]: { label: '农林牧渔', icon: 'fa-wheat-awn', color: 'bg-lime-100 text-lime-600' }
};