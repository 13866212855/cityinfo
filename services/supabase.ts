import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, User, ChatMessage, SysCategory, BannerAd, Merchant, ServiceItem, WithdrawalRequest, WalletTransaction } from '../types';
import { MOCK_POSTS, CATEGORY_CONFIG, MOCK_BANNERS, MOCK_MERCHANTS, MOCK_SERVICES, LOCATION_DATA, POPULAR_CITIES } from '../constants';

// --- Configuration ---
// Note: In production, these should be environment variables.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
// Enable Mock Mode if no credentials are found
const isMockMode = !supabaseUrl || !supabaseKey;

let supabase: SupabaseClient | null = null;

if (!isMockMode) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error("Supabase init failed:", e);
    }
}

// Helper to simulate delay in mock mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // --- System Data ---
    getSystemCategories: async (): Promise<Record<string, SysCategory>> => {
        if (isMockMode) {
            await delay(300);
            return CATEGORY_CONFIG as any;
        }
        const { data, error } = await supabase!.from('sys_categories').select('*');
        if (error || !data) return CATEGORY_CONFIG as any;
        
        const cats: Record<string, SysCategory> = {};
        data.forEach((row: any) => {
            cats[row.key] = row;
        });
        return cats;
    },

    getSystemBanners: async (): Promise<BannerAd[]> => {
        if (isMockMode) return MOCK_BANNERS;
        const { data } = await supabase!.from('sys_banners').select('*');
        return (data as BannerAd[]) || MOCK_BANNERS;
    },
    
    getAllMerchants: async (): Promise<Record<string, Merchant>> => {
        if (isMockMode) return MOCK_MERCHANTS;
        const { data } = await supabase!.from('merchants').select('*');
        if (!data) return MOCK_MERCHANTS;
        const res: Record<string, Merchant> = {};
        data.forEach((m: any) => res[m.id] = m);
        return res;
    },

    getAllServices: async (): Promise<ServiceItem[]> => {
        if (isMockMode) return MOCK_SERVICES;
        const { data } = await supabase!.from('merchant_services').select('*');
        return (data as ServiceItem[]) || MOCK_SERVICES;
    },

    // --- Posts ---
    getPosts: async (): Promise<Post[]> => {
        if (isMockMode) {
            await delay(500);
            // Try to read from local storage for persistence in demo
            const local = localStorage.getItem('cityinfo_posts');
            if (local) {
                try {
                    return JSON.parse(local);
                } catch(e) {
                    return MOCK_POSTS;
                }
            }
            return MOCK_POSTS;
        }
        const { data } = await supabase!.from('posts').select('*').order('publishTime', { ascending: false });
        return (data as any[])?.map(p => ({
            ...p,
            attributes: typeof p.attributes === 'string' ? JSON.parse(p.attributes) : p.attributes,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
            tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
        })) || [];
    },

    createPost: async (post: Post) => {
        if (isMockMode) {
            const current = await api.getPosts();
            const newPosts = [post, ...current];
            localStorage.setItem('cityinfo_posts', JSON.stringify(newPosts));
            return;
        }
        await supabase!.from('posts').insert({
            ...post,
            attributes: JSON.stringify(post.attributes),
            images: JSON.stringify(post.images),
            tags: JSON.stringify(post.tags)
        });
    },

    deletePost: async (id: string) => {
        if (isMockMode) {
            const current = await api.getPosts();
            const newPosts = current.filter(p => p.id !== id);
            localStorage.setItem('cityinfo_posts', JSON.stringify(newPosts));
            return;
        }
        await supabase!.from('posts').delete().eq('id', id);
    },

    updatePost: async (post: Post) => {
        if (isMockMode) {
             const current = await api.getPosts();
             const newPosts = current.map(p => p.id === post.id ? post : p);
             localStorage.setItem('cityinfo_posts', JSON.stringify(newPosts));
             return;
        }
        await supabase!.from('posts').update({
            ...post,
            attributes: JSON.stringify(post.attributes),
            images: JSON.stringify(post.images),
            tags: JSON.stringify(post.tags)
        }).eq('id', post.id);
    },

    // --- Messages ---
    getMessages: async (): Promise<any[]> => {
        if (isMockMode) {
            const local = localStorage.getItem('cityinfo_messages');
            return local ? JSON.parse(local) : [];
        }
        const { data } = await supabase!.from('messages').select('*').order('timestamp', { ascending: true });
        return data || [];
    },

    saveMessage: async (msg: ChatMessage, userId: string) => {
        if (isMockMode) {
            const msgs = await api.getMessages();
            // Store flattened structure similar to DB
            const dbMsg = {
                id: msg.id,
                user_id: userId,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            };
            msgs.push(dbMsg);
            localStorage.setItem('cityinfo_messages', JSON.stringify(msgs));
            return;
        }
        await supabase!.from('messages').insert({
            id: msg.id,
            user_id: userId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
        });
    },

    // --- User ---
    loginOrRegister: async (phone: string, newUser: User): Promise<User> => {
        if (isMockMode) {
            await delay(500);
            return newUser;
        }
        
        // Check if exists
        const { data } = await supabase!.from('users').select('*').eq('phone', phone).single();
        if (data) return data as User;

        // Register
        const { data: created, error } = await supabase!.from('users').insert(newUser).select().single();
        if (error) throw error;
        return created as User;
    },

    updateUser: async (user: User) => {
        if (isMockMode) return;
        await supabase!.from('users').update(user).eq('id', user.id);
    },

    // --- Config & Categories ---
    upsertCategory: async (cat: SysCategory) => {
        if (isMockMode) return;
        await supabase!.from('sys_categories').upsert(cat);
    },

    deleteCategory: async (key: string) => {
         if (isMockMode) return;
         await supabase!.from('sys_categories').delete().eq('key', key);
    },

    getGlobalConfig: async (key: string): Promise<any> => {
        if (isMockMode) {
            if (key === 'location_data') return LOCATION_DATA;
            if (key === 'popular_cities') return POPULAR_CITIES;
            return null;
        }
        const { data } = await supabase!.from('sys_config').select('value').eq('key', key).single();
        return data?.value || null;
    },

    // --- Wallet ---
    getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
        if (isMockMode) return [];
        const { data } = await supabase!.from('withdrawals').select('*').order('timestamp', { ascending: false });
        return data as WithdrawalRequest[] || [];
    },

    updateWithdrawalStatus: async (id: string, status: 'COMPLETED' | 'REJECTED') => {
        if (isMockMode) return;
        await supabase!.from('withdrawals').update({ status }).eq('id', id);
    },

    getPendingRecharges: async (): Promise<WalletTransaction[]> => {
        if (isMockMode) return [];
        const { data } = await supabase!.from('transactions').select('*').eq('status', 'PENDING');
        return data as WalletTransaction[] || [];
    },

    createRecharge: async (tx: Partial<WalletTransaction>) => {
        if (isMockMode) return;
        await supabase!.from('transactions').insert({
            ...tx,
            id: 'tx_' + Date.now(),
            status: 'PENDING',
            timestamp: Date.now()
        });
    },

    reviewRecharge: async (id: string, status: 'SUCCESS' | 'FAILED') => {
        if (isMockMode) return;
        await supabase!.from('transactions').update({ status }).eq('id', id);
    },

    // --- System Config (JSONB usually) ---
    getSystemConfig: async (key: string): Promise<string | null> => {
        // Fix for Mock Mode: Read from localStorage
        if (isMockMode) {
            const local = localStorage.getItem(`sys_config_${key}`);
            // Strip quotes if stored as JSON string "http://..."
            return local ? local.replace(/^"|"$/g, '') : null;
        }
        
        const { data } = await supabase!.from('sys_config').select('value').eq('key', key).single();
        
        if (data?.value) {
            let val = data.value;
            // If the value is not a string (e.g. number, boolean, or object), convert to string
            if (typeof val !== 'string') {
                val = JSON.stringify(val);
            }
            // Strip quotes if they exist (e.g. "http://...")
            return val.replace(/^"|"$/g, '');
        }
        return null;
    },

    saveSystemConfig: async (key: string, value: string) => {
        // Fix for Mock Mode: Save to localStorage
        if (isMockMode) {
            localStorage.setItem(`sys_config_${key}`, JSON.stringify(value));
            return;
        }
        
        // We use JSON.stringify to ensure it's a valid JSON value for the JSONB column
        // Throw error if failed (e.g. RLS) so UI knows
        const { error } = await supabase!.from('sys_config').upsert({ key, value: JSON.stringify(value) });
        if (error) {
            throw error;
        }
    },

    uploadImage: async (file: File): Promise<string> => {
        if (isMockMode) {
            await delay(1000);
            // Fix for Mock Mode: Convert to Base64 to persist across reloads (Blob URLs are temporary)
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase!.storage
            .from('pic') // Assuming bucket name 'pic'
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase!.storage.from('pic').getPublicUrl(filePath);
        return data.publicUrl;
    }
};