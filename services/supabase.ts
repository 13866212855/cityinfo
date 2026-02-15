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

// File validation result interface
interface FileValidationResult {
    valid: boolean;
    error?: string;
}

// Validate file for upload (format and size)
export const validateFile = (file: File): FileValidationResult => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: '不支持的文件格式，请选择 JPG、PNG、GIF 或 WebP 图片' 
        };
    }
    
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { 
            valid: false, 
            error: '文件过大，请选择小于 5MB 的图片' 
        };
    }
    
    // File content validation will be done asynchronously in the upload handler
    // by checking the actual image loading (already implemented in AdminDashboard)
    
    return { valid: true };
}

// Helper function to validate file content by checking magic bytes
export const validateFileContent = async (file: File): Promise<FileValidationResult> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const arr = new Uint8Array(e.target?.result as ArrayBuffer);
            
            // Check magic bytes for common image formats
            // JPEG: FF D8 FF
            // PNG: 89 50 4E 47
            // GIF: 47 49 46 38
            // WebP: 52 49 46 46 (RIFF) followed by WEBP at offset 8
            
            if (arr.length < 4) {
                resolve({ valid: false, error: '文件内容无效' });
                return;
            }
            
            // JPEG
            if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
                resolve({ valid: true });
                return;
            }
            
            // PNG
            if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
                resolve({ valid: true });
                return;
            }
            
            // GIF
            if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
                resolve({ valid: true });
                return;
            }
            
            // WebP
            if (arr.length >= 12 && 
                arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 &&
                arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
                resolve({ valid: true });
                return;
            }
            
            resolve({ valid: false, error: '文件内容与声明的格式不符，可能不是有效的图片文件' });
        };
        
        reader.onerror = () => {
            resolve({ valid: false, error: '无法读取文件内容' });
        };
        
        // Read first 12 bytes to check magic bytes
        reader.readAsArrayBuffer(file.slice(0, 12));
    });
};

// Helper function to validate image URL safety
export const validateImageUrl = (url: string | null): boolean => {
    if (!url) return true; // null/empty is valid (no config)
    
    // Allow data URLs (Base64 images in Mock mode)
    if (url.startsWith('data:image/')) {
        return true;
    }
    
    // Allow Supabase Storage URLs
    // Common patterns: https://*.supabase.co/storage/v1/object/public/*
    if (url.includes('.supabase.co/storage/')) {
        return true;
    }
    
    // Reject all other URLs for security
    return false;
};

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
        if (isMockMode) {
            try {
                // Try localStorage first
                const local = localStorage.getItem(`sys_config_${key}`);
                if (local) {
                    // Strip quotes if stored as JSON string "http://..."
                    const value = local.replace(/^"|"$/g, '');
                    
                    // Validate URL safety for image URLs
                    if (key === 'recharge_qr' && !validateImageUrl(value)) {
                        console.warn('Invalid or unsafe URL detected, returning null');
                        return null;
                    }
                    
                    return value;
                }
                
                // Fallback to memory storage
                if ((window as any).__memoryStorage) {
                    const memValue = (window as any).__memoryStorage[`sys_config_${key}`];
                    if (memValue) {
                        const value = memValue.replace(/^"|"$/g, '');
                        
                        // Validate URL safety for image URLs
                        if (key === 'recharge_qr' && !validateImageUrl(value)) {
                            console.warn('Invalid or unsafe URL detected, returning null');
                            return null;
                        }
                        
                        return value;
                    }
                }
                
                return null;
            } catch (error) {
                console.error('Failed to load config from storage:', error);
                return null;
            }
        }
        
        try {
            const { data, error } = await supabase!.from('sys_config').select('value').eq('key', key).single();
            
            if (error) {
                // Silent failure - return null if config doesn't exist
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('Failed to load system config:', error);
                return null;
            }
            
            if (data?.value) {
                let val = data.value;
                // If the value is not a string (e.g. number, boolean, or object), convert to string
                if (typeof val !== 'string') {
                    val = JSON.stringify(val);
                }
                // Strip quotes if they exist (e.g. "http://...")
                const value = val.replace(/^"|"$/g, '');
                
                // Validate URL safety for image URLs
                if (key === 'recharge_qr' && !validateImageUrl(value)) {
                    console.warn('Invalid or unsafe URL detected, returning null');
                    return null;
                }
                
                return value;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to load system config:', error);
            return null;
        }
    },

    saveSystemConfig: async (key: string, value: string) => {
        if (isMockMode) {
            // Try to save to localStorage with fallback to memory storage
            try {
                localStorage.setItem(`sys_config_${key}`, JSON.stringify(value));
            } catch (error) {
                console.warn('localStorage not available, using memory storage:', error);
                // Fallback to memory storage (session-only)
                if (!(window as any).__memoryStorage) {
                    (window as any).__memoryStorage = {};
                }
                (window as any).__memoryStorage[`sys_config_${key}`] = JSON.stringify(value);
            }
            return;
        }
        
        // Use UPSERT to ensure it's a valid JSON value for the JSONB column
        try {
            const { error } = await supabase!.from('sys_config').upsert({ 
                key, 
                value: JSON.stringify(value) 
            });
            
            if (error) {
                throw error;
            }
        } catch (error: any) {
            console.error('Failed to save system config:', error);
            // Provide specific error messages
            if (error.message?.includes('permission')) {
                throw new Error('配置保存失败：权限不足');
            } else if (error.message?.includes('network')) {
                throw new Error('配置保存失败：网络连接错误，请检查网络后重试');
            } else {
                throw new Error(`配置保存失败：${error.message || '请稍后重试'}`);
            }
        }
    },

    uploadImage: async (file: File): Promise<string> => {
        // Validate file before upload
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        if (isMockMode) {
            await delay(1000);
            // Convert to Base64 to persist across reloads (Blob URLs are temporary)
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        }
        
        // Generate unique filename with timestamp
        const fileExt = file.name.split('.').pop();
        const fileName = `recharge_qr_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to 'qr-codes' bucket (or fallback to 'pic' if qr-codes doesn't exist)
        let bucketName = 'qr-codes';
        let uploadError = null;
        
        // Try qr-codes bucket first
        const uploadResult = await supabase!.storage
            .from(bucketName)
            .upload(filePath, file);
        
        uploadError = uploadResult.error;
        
        // If qr-codes bucket doesn't exist, fallback to 'pic' bucket
        if (uploadError && uploadError.message?.includes('not found')) {
            console.warn('qr-codes bucket not found, falling back to pic bucket');
            bucketName = 'pic';
            const fallbackResult = await supabase!.storage
                .from(bucketName)
                .upload(filePath, file);
            uploadError = fallbackResult.error;
        }

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase!.storage.from(bucketName).getPublicUrl(filePath);
        return data.publicUrl;
    }
};